import mongoose from "mongoose";

const urlAnalyticSchema = new mongoose.Schema({
    url: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Url",
        required: true,
        index: true
    },
    ipAddress: {
        type: String,
        default: ""
    },
    platform: {
        type: String,
        default: ""
    },
    device: {
        type: String,
        default: ""
    },
    referrer: {
        type: String,
        default: ""
    },
    country: {
        type: String,
        default: ""
    },
    browser: {
        type: String,
        default: ""
    }
},
    {
        timestamps: true
    });

const UrlAnalytic = mongoose.model("UrlAnalytic", urlAnalyticSchema);
export default UrlAnalytic; 