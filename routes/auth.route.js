import {Router} from "express"
import { login, logout, refreshAccessToken, register,sendOTP,resetPassword } from "../controllers/auth.controller.js";
import { authenticate } from "../middlewares/authenticate.middleware.js";
const router = Router()

router.post("/register",register)
router.post("/login", login)
router.post("/send-otp", sendOTP)
router.post("/reset-password", resetPassword)
router.post("/refresh-token", refreshAccessToken)
router.post("/logout", authenticate, logout)

export { router as authRouter }