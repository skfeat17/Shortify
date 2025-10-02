import {Router} from "express"
import { createCustomUrl, createRandomUrl, editShortUrl } from "../controllers/url.controller.js";
import { authenticate } from "../middlewares/authenticate.middleware.js";
import { randomUrlAuthenticate } from "../middlewares/randomUrlAuthenticate.middleware.js";
import { urlAuthenticate } from "../middlewares/urlOwnerShip.middleware.js";
const router = Router()
//public route
router.post('/post/random',randomUrlAuthenticate,createRandomUrl)
//secured routes
router.post('/post/custom',authenticate,createCustomUrl)
router.put('/edit/:id',authenticate,urlAuthenticate, editShortUrl)
export { router as urlRouter }