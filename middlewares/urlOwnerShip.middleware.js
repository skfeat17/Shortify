import { ApiError } from "../utils/ApiError.js";
import Url from "../models/url.model.js"

export const urlAuthenticate = async (req, res, next) => {
    try {
        const ownerId = req.user._id;
        const urlId = req.params.id;
        if (!urlId) {
            return next(new ApiError(403, "Url Id not provided"))

        }
        const url = await Url.findById(urlId)
        if (!url) {
            return next(new ApiError(403, "Url doesnt exists"))
        }
        if (url.createdBy.toString() !== ownerId.toString()) {
            return next(new ApiError(409, "Changes Denied, Unauthorized user"));
        }
        next()
    } catch (error) {
        return next(new ApiError(401, error.message));
    }
}