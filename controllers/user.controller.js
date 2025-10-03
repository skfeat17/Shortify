import User from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";

export const getUser = asyncHandler(async (req, res) => {
    let { identifier } = req.params || req.body;    
    if (!identifier) {
        throw new ApiError(400, "Username or Email Required")
    }
    identifier = identifier.trim().toLowerCase();
    const user = await User.findOne({ $or: [{ email: identifier }, { username: identifier }] }).select("-password -refreshToken");
    if (!user) {
        throw new ApiError(401, "User Not Found")
    }
    res.status(200).json(new ApiResponse(200, user, "User retrieved successfully"))

});