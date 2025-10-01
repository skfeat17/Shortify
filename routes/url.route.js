import {Router} from "express"
import { createRandomUrl } from "../controllers/url.controller.js";
import { authenticate } from "../middlewares/authenticate.middleware.js";
const router = Router()

router.post('/post/random',createRandomUrl)

export { router as urlRouter }