import dotenv from "dotenv";
import mongoose from "mongoose";
import { app } from "./app.js";
import { requestInfo } from "./middlewares/reqInfo.middleware.js";
import { redirector } from "./controllers/redirector.controller.js";

// Load environment variables
dotenv.config({
  path: "./.env"
});
app.get("/", (req, res) => {
  console.log(req)
  res.status(200).json({message:"Api is Running Successfully"});
  
});

app.get('/:shortCode',requestInfo,redirector);


// MongoDB connection
const connectDB = async () => {
  try {
    const connectionInstance = await mongoose.connect(process.env.MONGODB_URI);
    console.log(`\n✅ MongoDB connected !! DB HOST: ${connectionInstance.connection.host}`);
  } catch (error) {
    console.log("❌ MongoDB connection FAILED:", error);
    process.exit(1);
  }
};

// Start server only after DB connection
connectDB().then(() => {
  app.listen(process.env.PORT || 8000, () => {
    console.log(`🚀 Server running on port ${process.env.PORT || 8000}`);
  });
});
