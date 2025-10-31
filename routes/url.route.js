import {Router} from "express"
import { createShortUrl, deleteShortUrl, editShortUrl, getMyUrls, getOneUrlAnalytics, getUrlAnalytics } from "../controllers/url.controller.js";
import { authenticate } from "../middlewares/authenticate.middleware.js";
import { randomUrlAuthenticate } from "../middlewares/randomUrlAuthenticate.middleware.js";
import { urlAuthenticate } from "../middlewares/urlOwnerShip.middleware.js";
const router = Router()
//public route
router.post('/create',randomUrlAuthenticate,createShortUrl)
router.get('/track/all',authenticate,getUrlAnalytics)
router.get('/track/:id', getOneUrlAnalytics)
//secured routes
router.put('/edit/:id',authenticate,urlAuthenticate, editShortUrl)
router.delete('/delete/:id',authenticate,urlAuthenticate,deleteShortUrl)
router.get('/fetch',authenticate,getMyUrls)
export { router as urlRouter }