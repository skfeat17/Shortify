import express from "express"
import cors from "cors"
import { errorHandler } from "./middlewares/error.js";
import cookieParser from "cookie-parser"
const app = express()


app.use(cors({ origin: true, credentials: true }));
app.use(express.json({limit: "16kb"}))
app.use(express.urlencoded({extended: true, limit: "16kb"}))
app.use(express.static("public"))
app.use(cookieParser())

//routes import


//routes declaration


app.use(errorHandler);


export { app }