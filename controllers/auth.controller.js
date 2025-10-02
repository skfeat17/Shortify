import User from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken"
import { sendEmail } from "../utils/nodemailer.js";
import pkg from "simple-crypto-js";
const { default: SimpleCrypto } = pkg;
const httpOptions = {
  httpOnly: true,
  secure: true,
};
const generateAccessAndRefereshTokens = async (userId) => {
  try {
    const user = await User.findById(userId)
    const accessToken = user.generateAccessToken()
    const refreshToken = user.generateRefreshToken()

    user.refreshToken = refreshToken
    await user.save({ validateBeforeSave: false })

    return { accessToken, refreshToken }


  } catch (error) {
    console.log(error)
    throw new ApiError(500, "Something went wrong while generating referesh and access token")
  }
}
// Register a new user
export const register = asyncHandler(async (req, res) => {
  let { firstname, lastname, username, email, password } = req.body;
  if (!firstname || !lastname || !username || !email || !password) {
    throw new ApiError(400, "All fields are required")
  }
  const nameTitle = (str) => {
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  }
  firstname = nameTitle(firstname.trim());
  lastname = nameTitle(lastname.trim());
  username = username.trim().toLowerCase();
  email = email.trim().toLowerCase();
  password = password.trim();

  const existingUser = await User.find({ $or: [{ email }, { username }] })
  if (existingUser.length > 0) {
    if (existingUser[0].email === email) {
      throw new ApiError(409, "Email already in use")
    }
    if (existingUser[0].username === username) {
      throw new ApiError(409, "Username already in use")
    }

  }
  const avatar = `https://ui-avatars.com/api/?name=${firstname}+${lastname}&size=200&bold=true&background=random`
  const user = await User.create({ firstname, lastname, username, email, password, avatar });
  const tokens = await generateAccessAndRefereshTokens(user._id)
  res.status(201)
    .cookie("accessToken", tokens.accessToken, httpOptions)
    .cookie("refreshToken", tokens.refreshToken, httpOptions)
    .json(new ApiResponse(
      201,
      {
        user,
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken
      },
      "User registered successfully"
    ));
});
// Login user
export const login = asyncHandler(async (req, res) => {
  let {identifier, password} = req.body;
  if (!identifier || !password) {
    throw new ApiError(400, "All fields are required")
  }
  identifier = identifier.trim().toLowerCase();
  password = password.trim();
  const user = await User.findOne({ $or: [{ email: identifier }, { username: identifier }] });
  if (!user) {
    throw new ApiError(401, "User Not Found")
  }
  const isPasswordCorrect = await user.isPasswordCorrect(password)
  if (!isPasswordCorrect) {
    throw new ApiError(401, "Incorrect Password")
  }
  const tokens = await generateAccessAndRefereshTokens(user._id)
  res.status(200)
    .cookie("accessToken", tokens.accessToken, httpOptions)
    .cookie("refreshToken", tokens.refreshToken, httpOptions)
    .json(new ApiResponse(
      200,
      {
        user,
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken
      },
      "User logged in successfully"
    ))
});
//Refresh access token
export const refreshAccessToken = asyncHandler(async (req, res) => {
  const token = req.cookies?.refreshToken || req.header("Authorization")?.replace("Bearer ", "");
  if (!token) {
    throw new ApiError(401, "Unauthorized request")
  }
  let decoded;
  try {
    decoded = jwt.verify(token, process.env.REFRESH_TOKEN_SECRET);
  } catch (err) {
    throw new ApiError(401, "Invalid or expired refresh token");
  }
  const user = await User.findById(decoded._id);
  if (!user) {
    throw new ApiError(404, "User not found");
  }
  const storedRefreshToken = user.refreshToken;
  if (!storedRefreshToken) {
    throw new ApiError(404, "No refresh token stored for this user");
  }
  if (storedRefreshToken != token) {
    throw new ApiError(403, "Refresh token is invalid or expired");
  }
  const accessToken = user.generateAccessToken()
  res
    .cookie("accessToken", accessToken, httpOptions)
    .status(200)
    .json(new ApiResponse(200, { newAccessToken: accessToken }, "Access Token refreshed successfully"));

})
//SEND OTP
export const sendOTP = asyncHandler(async (req, res) => {
  const { email } = req.body;
  if (!email) {
    throw new ApiError(400, "Email is required");
  }
  // 1. Find user by email
  const user = await User.findOne({ email });
  if (!user) {
    throw new ApiError(404, "User not found");
  }
  // 2. Generate OTP (4-digit)
  const otp = Math.floor(1000 + Math.random() * 9000).toString();
  const secretKey = process.env.SIMPLE_CRYPTO_SECRET_KEY
  const simpleCrypto = new SimpleCrypto(secretKey)
  const cipherText = simpleCrypto.encrypt(otp)
  // 3. Send OTP via email
  await sendEmail({
    to: user.email,
    name: user.name,
    otp
  });

  // 4. Create a user-specific token (cookie) to verify later
  const credentialsToken = jwt.sign(
    { userId: user._id, otpToken: cipherText },
    process.env.OTP_TOKEN_SECRET,
    { expiresIn: "10m" }
  );

  // Cookie expires in 10 minutes
  const otpCookieOptions = {
    ...httpOptions,
    maxAge: 10 * 60 * 1000
  };

  // 5. Send response
  res
    .cookie("credentialsToken", credentialsToken, otpCookieOptions)
    .status(200)
    .json(
      new ApiResponse(200, { credentialsToken }, "OTP sent successfully")
    );
});
//FORGOT/RESET PASSWORD
export const resetPassword = asyncHandler(async (req, res) => {
  const { otp, newPassword } = req.body;
  if (!otp || !newPassword) {
    throw new ApiError(400, "OTP and New Password Required");
  }

  const credentialsToken =
    req.cookies?.credentialsToken ||
    req.header("Authorization")?.replace("Bearer ", "");

  if (!credentialsToken) {
    throw new ApiError(401, "Unauthorized request");
  }

  let decoded;
  try {
    decoded = jwt.verify(credentialsToken, process.env.OTP_TOKEN_SECRET);
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      throw new ApiError(401, "OTP Expired");
    }
    throw new ApiError(400, "Invalid or malformed token");
  }

  const user = await User.findById(decoded.userId);
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  // Decrypt stored OTP
  const secretKey = process.env.SIMPLE_CRYPTO_SECRET_KEY;
  const simpleCrypto = new SimpleCrypto(secretKey);
  const originalOTP = simpleCrypto.decrypt(decoded.otpToken);

  const newOTP = otp.toString()
  if (newOTP != originalOTP) {
    throw new ApiError(401, "Incorrect OTP");
  }

  user.password = newPassword;
  await user.save({ validateBeforeSave: false });

  // Clear OTP cookie
  res.clearCookie("credentialsToken", httpOptions);

  res
    .status(200)
    .json(new ApiResponse(200, {}, "Password reset successfully"));
});
//Logout User
export const logout = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const user = await User.findById(userId);
  user.refreshToken = null;
  await user.save({ validateBeforeSave: false });
  res
    .clearCookie("accessToken", httpOptions)
    .clearCookie("refreshToken", httpOptions)
    .status(200)
    .json(new ApiResponse(200, {}, "User logged out successfully"));
});
