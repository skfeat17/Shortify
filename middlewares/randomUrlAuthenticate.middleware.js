// middlewares/authMiddleware.js
import jwt from "jsonwebtoken";
import { ApiError } from "../utils/ApiError.js";
import User from "../models/user.model.js";

export const randomUrlAuthenticate = async (req, res, next) => {
  try {
    const token =
      req.cookies?.accessToken ||
      req.header("Authorization")?.replace("Bearer ", "");

    // No token → just move forward without attaching user
    if (!token) {
      return next();
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

    // Attach user to request (without sensitive fields)
    req.user = await User.findById(decoded._id).select("-password -refreshToken");

    if (!req.user) {
      return next(new ApiError(401, "User no longer exists"));
    }

    return next();
  } catch (error) {
    // Any JWT error (expired, invalid, etc.) → move forward without user
    return next();
  }
};
