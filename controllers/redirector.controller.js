import Url from "../models/url.model.js";
import UrlAnalytic from "../models/urlAnalytic.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import path from "path";
import { fileURLToPath } from "url";

// get dirname since you're using ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const redirector = asyncHandler(async (req, res) => {
  const {
    ip,
    country,
    referrer,
    platform,
    device,
    browser,
  } = req.requestMeta;

  const shortUrlCode = req.params.shortCode;
  const url = await Url.findOne({ shortUrlCode });

  if (!url) {
    // serve public/404.html
    return res
      .status(404)
      .sendFile(path.join(__dirname, "../public/404.html"));
  }

  url.clicks += 1;
  await url.save({ validateBeforeSave: false });

  // Save analytics
  const data = await UrlAnalytic.create({
    url: url._id,
    ipAddress: ip,
    platform,
    country,
    referrer,
    device,
    browser,
  });
  console.log("Analytics saved:", data);

  // Redirect user to original URL
  res.redirect(url.originalUrl);
});
