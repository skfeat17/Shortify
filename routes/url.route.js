import {Router} from "express"
import { createCustomUrl, createRandomUrl, deleteShortUrl, editShortUrl, getUrlAnalytics } from "../controllers/url.controller.js";
import { authenticate } from "../middlewares/authenticate.middleware.js";
import { randomUrlAuthenticate } from "../middlewares/randomUrlAuthenticate.middleware.js";
import { urlAuthenticate } from "../middlewares/urlOwnerShip.middleware.js";
const router = Router()
//public route
router.post('/post/random',randomUrlAuthenticate,createRandomUrl)
router.get('/track/:shortUrlCode',getUrlAnalytics)
//secured routes
router.post('/post/custom',authenticate,createCustomUrl)
router.put('/edit/:id',authenticate,urlAuthenticate, editShortUrl)
router.delete('/delete/:id',authenticate,urlAuthenticate,deleteShortUrl)
export { router as urlRouter }