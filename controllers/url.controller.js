import Url from "../models/url.model.js";
import UrlAnalytic from "../models/urlAnalytic.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import mongoose from "mongoose";
import { shortCodeGenerator } from "../utils/shortCodeGenerator.js";
import { getAllUrlAnalytics,getSpecificUrlAnalytics } from "../utils/trackUrl.js";
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
            {
                shortUrl: `${process.env.BASE_URL}/${urlObject.shortUrlCode}`,
                urlDetails: urlObject
            },   "Short URL created successfully"
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
    const id = req.user?._id;
    const urlTracedData = await getSpecificUrlAnalytics(id);
    return res.status(200).json(
      new ApiResponse(200,urlTracedData, "Fetched user URLs successfully")
    );
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
