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
        required: true
    }, 
    userAgent: {    
        type: String,   
        required: true
    },
    referrer: { 
        type: String,
        default: ""
    },
    country: {
        type: String,
        default: ""
    }
},
{
    timestamps: true
});

const UrlAnalytic = mongoose.model("UrlAnalytic", urlAnalyticSchema);
export default UrlAnalytic; 