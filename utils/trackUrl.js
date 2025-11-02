import mongoose from "mongoose";
import Url from "../models/url.model.js";
import UrlAnalytic from "../models/urlAnalytic.model.js";

export async function getAllUrlAnalytics(userId) {
  try {
    // Step 1️⃣: Get all URL IDs created by this user
    const userUrls = await Url.find({ createdBy: userId }, { _id: 1 });
    const urlIds = userUrls.map(u => u._id);

    if (urlIds.length === 0) {
      return {
        total_links_shortened: 0,
        todayClicks: 0,
        yesterdayClicks: 0,
        totalClicks: 0,
        lastMonthClicks: 0,
        thisMonthClicks: 0,
        last30Days: {
          topCountries: [],
          topBrowsers: [],
          countByDate: []
        }
      };
    }

    // 🧩 Date references
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    const startOfToday = new Date(today.setHours(0, 0, 0, 0));
    const startOfYesterday = new Date(yesterday.setHours(0, 0, 0, 0));
    const endOfYesterday = new Date(startOfYesterday);
    endOfYesterday.setHours(23, 59, 59, 999);

    const startOfThisMonth = new Date();
    startOfThisMonth.setDate(1);
    startOfThisMonth.setHours(0, 0, 0, 0);

    const startOfLastMonth = new Date(startOfThisMonth);
    startOfLastMonth.setMonth(startOfLastMonth.getMonth() - 1);

    const endOfLastMonth = new Date(startOfThisMonth);
    endOfLastMonth.setMilliseconds(-1);

    const last30Days = new Date();
    last30Days.setDate(last30Days.getDate() - 30);

    // Step 2️⃣: Aggregate from UrlAnalytic
    const analytics = await UrlAnalytic.aggregate([
      {
        $match: {
          url: { $in: urlIds }
        }
      },
      {
        $facet: {
          // 🧮 Total clicks overall
          totalClicks: [{ $count: "count" }],

          // 📅 Clicks today
          todayClicks: [
            { $match: { createdAt: { $gte: startOfToday } } },
            { $count: "count" }
          ],

          // 📅 Clicks yesterday
          yesterdayClicks: [
            { $match: { createdAt: { $gte: startOfYesterday, $lte: endOfYesterday } } },
            { $count: "count" }
          ],

          // 📅 This month clicks
          thisMonthClicks: [
            { $match: { createdAt: { $gte: startOfThisMonth } } },
            { $count: "count" }
          ],

          // 📅 Last month clicks
          lastMonthClicks: [
            { $match: { createdAt: { $gte: startOfLastMonth, $lte: endOfLastMonth } } },
            { $count: "count" }
          ],

          // 🌎 Top countries in last 30 days
          topCountries: [
            { $match: { createdAt: { $gte: last30Days } } },
            { $group: { _id: "$country", clicks: { $sum: 1 } } },
            { $sort: { clicks: -1 } },
            { $project: { country: "$_id", clicks: 1, _id: 0 } }
          ],

          // 🧭 Top browsers in last 30 days
          topBrowsers: [
            { $match: { createdAt: { $gte: last30Days } } },
            { $group: { _id: "$browser", clicks: { $sum: 1 } } },
            { $sort: { clicks: -1 } },
            { $project: { browser: "$_id", clicks: 1, _id: 0 } }
          ],

          // 📆 Clicks grouped by date for last 30 days
          countByDate: [
            { $match: { createdAt: { $gte: last30Days } } },
            {
              $group: {
                _id: {
                  $dateToString: { format: "%Y-%m-%d", date: "$createdAt" }
                },
                clicks: { $sum: 1 }
              }
            },
            { $sort: { "_id": 1 } },
            { $project: { date: "$_id", clicks: 1, _id: 0 } }
          ]
        }
      }
    ]);

    const result = analytics[0];

    return {
      total_links_shortened: urlIds.length,
      todayClicks: result.todayClicks[0]?.count || 0,
      yesterdayClicks: result.yesterdayClicks[0]?.count || 0,
      totalClicks: result.totalClicks[0]?.count || 0,
      lastMonthClicks: result.lastMonthClicks[0]?.count || 0,
      thisMonthClicks: result.thisMonthClicks[0]?.count || 0,
      last30Days: {
        topCountries: result.topCountries,
        topBrowsers: result.topBrowsers,
        countByDate: result.countByDate
      }
    };

  } catch (err) {
    console.error("❌ Error in getUserAnalytics:", err);
    throw err;
  }
}
export async function getSpecificUrlAnalytics(urlId) {
  try {

    // 🧩 Date references
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    const startOfToday = new Date(today.setHours(0, 0, 0, 0));
    const startOfYesterday = new Date(yesterday.setHours(0, 0, 0, 0));
    const endOfYesterday = new Date(startOfYesterday);
    endOfYesterday.setHours(23, 59, 59, 999);

    const startOfThisMonth = new Date();
    startOfThisMonth.setDate(1);
    startOfThisMonth.setHours(0, 0, 0, 0);

    const startOfLastMonth = new Date(startOfThisMonth);
    startOfLastMonth.setMonth(startOfLastMonth.getMonth() - 1);

    const endOfLastMonth = new Date(startOfThisMonth);
    endOfLastMonth.setMilliseconds(-1);

    const last30Days = new Date();
    last30Days.setDate(last30Days.getDate() - 30);

    // Step 2️⃣: Aggregate from UrlAnalytic
    const analytics = await UrlAnalytic.aggregate([
      {
        $match: {
          url: new mongoose.Types.ObjectId(urlId)
        }
      },
      {
        $facet: {
          // 🧮 Total clicks overall
          totalClicks: [{ $count: "count" }],

          // 📅 Clicks today
          todayClicks: [
            { $match: { createdAt: { $gte: startOfToday } } },
            { $count: "count" }
          ],

          // 📅 Clicks yesterday
          yesterdayClicks: [
            { $match: { createdAt: { $gte: startOfYesterday, $lte: endOfYesterday } } },
            { $count: "count" }
          ],

          // 📅 This month clicks
          thisMonthClicks: [
            { $match: { createdAt: { $gte: startOfThisMonth } } },
            { $count: "count" }
          ],

          // 📅 Last month clicks
          lastMonthClicks: [
            { $match: { createdAt: { $gte: startOfLastMonth, $lte: endOfLastMonth } } },
            { $count: "count" }
          ],

          // 🌎 Top countries in last 30 days
          topCountries: [
            { $match: { createdAt: { $gte: last30Days } } },
            { $group: { _id: "$country", clicks: { $sum: 1 } } },
            { $sort: { clicks: -1 } },
            { $limit: 5 },
            { $project: { country: "$_id", clicks: 1, _id: 0 } }
          ],

          // 🧭 Top browsers in last 30 days
          topBrowsers: [
            { $match: { createdAt: { $gte: last30Days } } },
            { $group: { _id: "$browser", clicks: { $sum: 1 } } },
            { $sort: { clicks: -1 } },
            { $limit: 5 },
            { $project: { browser: "$_id", clicks: 1, _id: 0 } }
          ],

          // 📆 Clicks grouped by date for last 30 days
          countByDate: [
            { $match: { createdAt: { $gte: last30Days } } },
            {
              $group: {
                _id: {
                  $dateToString: { format: "%Y-%m-%d", date: "$createdAt" }
                },
                clicks: { $sum: 1 }
              }
            },
            { $sort: { "_id": 1 } },
            { $project: { date: "$_id", clicks: 1, _id: 0 } }
          ]
        }
      }
    ]);

    const result = analytics[0];

    return {
      todayClicks: result.todayClicks[0]?.count || 0,
      yesterdayClicks: result.yesterdayClicks[0]?.count || 0,
      totalClicks: result.totalClicks[0]?.count || 0,
      lastMonthClicks: result.lastMonthClicks[0]?.count || 0,
      thisMonthClicks: result.thisMonthClicks[0]?.count || 0,
      last30Days: {
        topCountries: result.topCountries,
        topBrowsers: result.topBrowsers,
        countByDate: result.countByDate
      }
    };

  } catch (err) {
    console.error("❌ Error in getUserAnalytics:", err);
    throw err;
  }
}
