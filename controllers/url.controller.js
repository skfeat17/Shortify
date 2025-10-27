import Url from "../models/url.model.js";
import UrlAnalytic from "../models/urlAnalytic.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import mongoose from "mongoose";
import { shortCodeGenerator } from "../utils/shortCodeGenerator.js";

function extractDomainName(url) {
  try {
    const hostname = new URL(url).hostname.replace(/^www\./, "");
    const parts = hostname.split(".");
    const main = parts.length > 2 ? parts[parts.length - 2] : parts[0];
    return main.charAt(0).toUpperCase() + main.slice(1);
  } catch (err) {
    return null;
  }
}

// Create a new Shortened URL (Random or Custom)
export const createShortUrl = asyncHandler(async (req, res) => {
    let { shortUrlCode, originalUrl, title } = req.body;
    const ownerId = req.user?._id || null;

    // Validation
    if (!originalUrl) {
        throw new ApiError(400, "Original URL is required");
    }

    originalUrl = originalUrl.trim();
    const urlPattern = /^(https?:\/\/)[\w.-]+(\.[\w\.-]+)+[/#?]?.*$/i;
    if (!urlPattern.test(originalUrl)) {
        throw new ApiError(400, "Invalid URL format");
    }

    // Set title automatically if not provided
    title = title ? title.trim() : extractDomainName(originalUrl);

    // If user provided custom short code
    if (shortUrlCode) {
        shortUrlCode = shortUrlCode.toLowerCase();

        const invalidChars = /[^a-zA-Z0-9_-]/;
        if (invalidChars.test(shortUrlCode)) {
            throw new ApiError(400, "Only letters, numbers, _ and - are allowed in custom short codes");
        }

        const existingCode = await Url.findOne({ shortUrlCode });
        if (existingCode) {
            throw new ApiError(409, "This short name is already taken. Please choose another");
        }
    } else {
        // Generate random short code if not provided
        shortUrlCode = shortCodeGenerator(6);
    }

    // Save to database
    const urlObject = await Url.create({
        title,
        originalUrl,
        shortUrlCode,
        createdBy: ownerId
    });

    // Respond
    res.status(201).json(
        new ApiResponse(
            201,
            "Short URL created successfully",
            {
                shortUrl: `${process.env.BASE_URL}/${urlObject.shortUrlCode}`,
                urlDetails: urlObject
            }
        )
    );
});

// Edit Short URL 
export const editShortUrl = asyncHandler(async (req, res) => {
    const id = req.params.id;
    let { shortUrlCode, originalUrl, title } = req.body;
    if (!shortUrlCode && !originalUrl && !title) {
        throw new ApiError(403, "Atleast one field is required")
    }
    if (shortUrlCode) {
        shortUrlCode = shortUrlCode.toLowerCase();
        const regex = /[^a-zA-Z0-9_-]/;
        if (regex.test(shortUrlCode)) {
            throw new ApiError(400, "Only _ and - are allowed")
        }
    }
    const updateData = {};
    if (shortUrlCode) updateData.shortUrlCode = shortUrlCode;
    if (originalUrl) updateData.originalUrl = originalUrl;
    if (title) updateData.title = title;
    const updatedUrlObj = await Url.findByIdAndUpdate(id, updateData, { new: true });
    res.status(201).json(new ApiResponse(201, {
        shortUrl: `${process.env.BASE_URL}/${updatedUrlObj.shortUrlCode}`,
        urlDetails: updatedUrlObj
    }, "Short URL Updated successfully",));
})
// Delete Short URL 
export const deleteShortUrl = asyncHandler(async(req,res)=>{
    const id = req.params.id
    await Url.findByIdAndDelete(id);
    res.status(200).json(new ApiResponse(200,{},"Url Deleted Successfully"))
})
//Track Url 
export const getUrlAnalytics = asyncHandler( async (req, res) => {
    let { shortUrlCode } = req.params; 
    const { period } = req.query;
    const url = await Url.findOne({shortUrlCode})
    if(!url){
        throw new ApiError(400, "Valid Url is required");
    }
    const id = url._id;


    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      throw new ApiError(400, "Valid Url ID required");
    }

    const filter = { url: new mongoose.Types.ObjectId(id) };

    // Date filter setup
    const now = new Date();
    let startDate, endDate;

    switch (period) {
      case "today":
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
        break;

      case "yesterday":
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
        endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;

      case "thisMonth":
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);
        break;

      case "lastMonth":
        startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        endDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;

      case "allTime":
      default:
        startDate = null;
        endDate = null;
        break;
    }

    if (startDate && endDate) {
      filter.createdAt = { $gte: startDate, $lt: endDate };
    }

    // Aggregation pipeline
    const analytics = await UrlAnalytic.aggregate([
      { $match: filter },
      {
        $group: {
          _id: null,
          totalClicks: { $sum: 1 },
          byBrowser: { $push: "$browser" },
          byDevice: { $push: "$device" },
          byCountry: { $push: "$country" },
        },
      },
    ]);

    let responseData = {
      totalClicks: 0,
      browsers: {},
      devices: {},
      countries: {},
    };

    if (analytics.length > 0) {
      const data = analytics[0];

      responseData.totalClicks = data.totalClicks;

      // count occurrences
      const countItems = (arr) =>
        arr.reduce((acc, item) => {
          acc[item || "Unknown"] = (acc[item || "Unknown"] || 0) + 1;
          return acc;
        }, {});

      responseData.browsers = countItems(data.byBrowser);
      responseData.devices = countItems(data.byDevice);
      responseData.countries = countItems(data.byCountry);
    }

    res
      .status(200)
      .json(new ApiResponse(200, responseData, "Analytics fetched successfully"));

});
//Get My Urls
export const getMyUrls = asyncHandler(async (req, res, next) => {
    // Ensure user is logged in
    const ownerId = req.user?._id;
    // Find all URLs created by this user
    const urls = await Url.find({ createdBy: ownerId }).sort({ createdAt: -1 }).select("title shortUrlCode originalUrl createdAt clicks");
    return res.status(200).json(
      new ApiResponse(200, {
        count: urls.length,
        urls
      }, "Fetched user URLs successfully")
    );
});