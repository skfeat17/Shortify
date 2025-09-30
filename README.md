# 🚀Nodejs Backend Starter Template

A production-ready **Node.js + Express + MongoDB** backend boilerplate with utilities like API responses, error handling, async handler, Cloudinary integration, and email (SMTP) support.

---

## ✨ Features

- ⚡ **Express.js** server setup
- 📦 **MongoDB (Mongoose)** integration
- 🔐 Authentication-ready (JWT)
- 🛠️ **Utility functions**:
  - `ApiResponse` → Consistent API responses  
  - `ApiError` → JSON-based error handling  
  - `asyncHandler` → Centralized async error wrapper  
- ☁️ **Cloudinary upload support**
- 📧 **Nodemailer SMTP integration**
- 📜 OTP templates (EJS-based)
- 🔑 Secure `.env` configuration

---

## 📂 Project Structure

```
nodejs-backend-starter/
├── config/
│   └── cloudinary.js       # Cloudinary config
├── controllers/
│   └── user.js             # Example user controller
├── middlewares/
│   ├── error.js            # Error handler middleware
│   ├── multer.js           # File upload middleware
│   └── verify.js           # Auth verification middleware
├── models/
│   └── user.js             # Example user model
├── routes/
│   └── (your routes here)
├── utils/
│   ├── ApiError.js
│   ├── ApiResponse.js
│   ├── asyncHandler.js
│   ├── cloudinaryUpload.js
│   ├── nodemailer.js
│   └── otp-template.ejs
├── app.js                  # Express app config
├── db.js                   # MongoDB connection
├── index.js                # Server entry point
├── sample.env              # Example environment variables
├── package.json
└── vercel.json             # Vercel deployment config
```

---

## ⚙️ Installation

```bash
# Clone the repo
git clone https://github.com/your-username/nodejs-backend-starter.git

# Navigate into the folder
cd nodejs-backend-starter

# Install dependencies
npm install
```

---

## 🔑 Environment Variables

Rename **`sample.env` → `.env`** and update values:

```env
PORT=8000
MONGODB_URI=your-mongodb-uri
CORS_ORIGIN=*

ACCESS_TOKEN_EXPIRY=15m
REFRESH_TOKEN_EXPIRY=7d
ACCESS_TOKEN_SECRET=your-secret
REFRESH_TOKEN_SECRET=your-refresh-secret

CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

SMTP_HOST=
SMTP_PORT=
SMTP_USER=
SMTP_PASS=

APP_NAME=NodeJSBackendStarter
OTP_TOKEN_SECRET=your-otp-secret
SIMPLE_CRYPTO_SECRET_KEY=your-crypto-secret
```

---

## ▶️ Running the Server

### Development
```bash
npm run dev
```

### Production
```bash
npm start
```

Server runs at: **http://localhost:8000**

---

## 📡 API Response Format

All responses follow this structure:

```json
{
  "code": 200,
  "message": "Success",
  "data": {}
}
```

Error responses:

```json
{
  "code": 400,
  "message": "Bad Request",
  "data": null
}
```

---

## 🚀 Deployment

- Supports **Vercel** (see `vercel.json`)  
- Works with **Render, Railway, Heroku, or Docker**

---

## 🤝 Contributing

Pull requests are welcome! For major changes, open an issue first to discuss your ideas.

---

## 📜 License

[MIT](LICENSE)
