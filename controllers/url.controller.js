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
    let { originalUrl} = req.body;
    // const ownerId = req.user._id||"";
    if(!originalUrl){
        throw new ApiError(400, "Original URL is required");
    }
    originalUrl = originalUrl.trim();
    const pattern = /^(https?:\/\/)[\w.-]+(\.[\w\.-]+)+[/#?]?.*$/i;
    if (!pattern.test(originalUrl)) {
        throw new ApiError(400, "Invalid URL format. URL must start with http:// or https://");
    }
    const shortUrlCode = shortCodeGenerator(6);
    const urlObject = await Url.create({ originalUrl, shortUrlCode });
    // if(ownerId){
    // const urlObject = await Url.create({ originalUrl, shortUrlCode,createdBy:ownerId });
    // }else{
    // }

    res.status(201).json(new ApiResponse(201, "Short URL created successfully", {
        shortUrl: `${process.env.BASE_URL}/${urlObject.shortUrlCode}`,
        urlDetails: urlObject
    }));
});