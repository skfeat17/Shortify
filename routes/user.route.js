import {Router} from "express"
import { getUser } from "../controllers/user.controller.js"
const router = Router()

router.get('/get/:identifier',getUser)

export { router as userRouter }