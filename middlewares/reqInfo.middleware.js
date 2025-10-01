// middlewares/requestInfo.js
import { UAParser } from "ua-parser-js";

export const requestInfo = (req, res, next) => {
  // IP Address
  const ip =
    req.headers["x-forwarded-for"]?.split(",")[0] || req.socket.remoteAddress;

  // Country (works on Vercel / Cloudflare / proxies)
  const country =
    req.headers["x-vercel-ip-country"] || // Vercel
    req.headers["cf-ipcountry"] ||        // Cloudflare
    "Unknown";

  // Referrer
  const referrer = req.headers["referer"] || "Direct";

  // User-Agent parsing
  const userAgentString = req.headers["user-agent"] || "Unknown";
  const parser = new UAParser(userAgentString);
  const result = parser.getResult();

  const platform = result.os.name || "Unknown";
  const device = result.device.type || "Desktop"; // Desktop if no device type detected
  const browser = result.browser.name || "Unknown";

  // Attach metadata to request
  req.requestMeta = {
    ip,
    country,
    referrer,
    userAgent: userAgentString,
    platform,
    device,
    browser,
  };
  next();
};
