import Url from "../models/url.model.js";
import UrlAnalytic from "../models/urlAnalytic.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";

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
    return res
      .status(404)
      .send("<h1>404 Not Found</h1><h2>URL doesn’t exist</h2>");
  }
   url.clicks +=1;
   url.save({validateBeforeSave:false})

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
