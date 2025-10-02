import mongoose from "mongoose";

const urlSchema = new mongoose.Schema({
    title:{
        type: String,
        trim: true
    },
    originalUrl: {
        type: String,
        required: true,
        trim: true
    },
    shortUrlCode: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        index: true
    },
    blacklisted: {
        type: Boolean,
        default: false
    },
    clicks: {
        type: Number,
        default: 0
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    }
},
{
    timestamps: true
});

const Url = mongoose.model("Url", urlSchema);
export default Url;