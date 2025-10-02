import Url from "../models/url.model.js";
import UrlAnalytic from "../models/urlAnalytic.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import mongoose from "mongoose";
import { shortCodeGenerator } from "../utils/shortCodeGenerator.js";

// Create a new shortened URL Anonymously
export const createRandomUrl = asyncHandler(async (req, res) => {
    console.log("ARRIVED HERE")
    let { originalUrl } = req.body;
    const ownerId = req.user?._id || null;
    console.log(ownerId)
    if (!originalUrl) {
        throw new ApiError(400, "Original URL is required");
    }
    originalUrl = originalUrl.trim();
    const pattern = /^(https?:\/\/)[\w.-]+(\.[\w\.-]+)+[/#?]?.*$/i;
    if (!pattern.test(originalUrl)) {
        throw new ApiError(400, "Invalid URL format");
    }
    const shortUrlCode = shortCodeGenerator(6);

    const urlObject = await Url.create({ originalUrl, shortUrlCode, createdBy: ownerId ? ownerId : null });


    res.status(201).json(new ApiResponse(201, "Short URL created successfully", {
        shortUrl: `${process.env.BASE_URL}/${urlObject.shortUrlCode}`,
        urlDetails: urlObject
    }));
});
// Create a new Custom Shortened URL 
export const createCustomUrl = asyncHandler(async (req, res) => {
    let { shortUrlCode, originalUrl, title } = req.body;
    const owner = req.user._id
    if (!shortUrlCode || !originalUrl) {
        throw new ApiError(400, "All Fields are required")
    }
    title = title ? title : shortUrlCode;
    shortUrlCode = shortUrlCode.toLowerCase();
    const regex = /[^a-zA-Z0-9_-]/;
    if (regex.test(shortUrlCode)) {
        throw new ApiError(400, "Only _ and - are allowed")
    }
    const existingCode = await Url.findOne({ shortUrlCode })
    if (existingCode) {
        throw new ApiError(401, "Name already taken, Choose another")
    }
    const urlObject = await Url.create({ shortUrlCode, originalUrl, title, createdBy: owner })
    res.status(201).json(new ApiResponse(201, {
        shortUrl: `${process.env.BASE_URL}/${urlObject.shortUrlCode}`,
        urlDetails: urlObject
    }, "Short URL created successfully",));
})
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
