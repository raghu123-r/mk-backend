// src/app.js — fully updated middleware setup
import express from "express";
import morgan from "morgan";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import mongoSanitize from "express-mongo-sanitize";
import xss from "xss-clean";
import rateLimit from "express-rate-limit";
import routes from "./src/routes/index.js";
import { notFound, errorHandler } from "./src/middlewares/error.js";
import contactRoutes from "./src/routes/contact.routes.js";
import adminRoutes from "./src/routes/adminRoutes.js";
import adminProductRoutes from "./src/routes/adminProductRoutes.js";

const cors = require('cors');

const app = express();

// ✅ Trust proxy for rate-limiting behind reverse proxy/load balancer
app.set("trust proxy", 1);

// ✅ Ensure Express parses query strings as plain objects
app.set("query parser", "simple");

// ✅ Defensive middleware — ensures req.query is always a writable plain object
app.use((req, _res, next) => {
  try {
    const currentQuery = req.query || {};
    Object.defineProperty(req, "query", {
      value: Object.assign({}, currentQuery),
      writable: true,
      enumerable: true,
      configurable: true,
    });
  } catch (err) {
    console.warn("query-copy middleware warning:", err.message);
    req.query = {};
  }
  next();
});

// 🛡 Security middlewares
app.use(helmet());

// ✅ CORS with env-driven allowed origins and credentials
const allowedOrigins = (process.env.ALLOWED_ORIGINS ||
  "http://localhost:3000,https://kk-frontend-seven.vercel.app",
"kkfrontend-ib2c4p1ap-it-alliance-techs-projects.vercel.app",
"kkfrontend-git-develop-it-alliance-techs-projects.vercel.app",
"https://kkfrontend-7mtclf1zt-it-alliance-techs-projects.vercel.app/",
"https://kkfrontend-yltna53wg-it-alliance-techs-projects.vercel.app/",
"https://kkfrontend.vercel.app/")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

// app.use(
//   cors({
//     origin: function (origin, callback) {
//       // Allow requests with no origin (like mobile apps or curl requests)
//       if (!origin) return callback(null, true);
//       return allowedOrigins.includes(origin)
//         ? callback(null, true)
//         : callback(new Error("CORS: Origin not allowed"));
//     },
//     credentials: true,
//   })
// );
app.use(cors({
  origin: ("https://kkfrontend.vercel.app",
      "http://localhost:3000,https://kk-frontend-seven.vercel.app",
      "kkfrontend-ib2c4p1ap-it-alliance-techs-projects.vercel.app",
      "kkfrontend-git-develop-it-alliance-techs-projects.vercel.app",
      "https://kkfrontend-7mtclf1zt-it-alliance-techs-projects.vercel.app/",
      "https://kkfrontend-yltna53wg-it-alliance-techs-projects.vercel.app/"), // <-- exact origin of your deployed frontend
  methods: ['GET','POST','PUT','PATCH','DELETE','OPTIONS'],
  credentials: true // if you need cookies/auth
}));

app.options(
  "*",
  cors({
    origin:
      ("https://kkfrontend.vercel.app",
      "http://localhost:3000,https://kk-frontend-seven.vercel.app",
      "kkfrontend-ib2c4p1ap-it-alliance-techs-projects.vercel.app",
      "kkfrontend-git-develop-it-alliance-techs-projects.vercel.app",
      "https://kkfrontend-7mtclf1zt-it-alliance-techs-projects.vercel.app/",
      "https://kkfrontend-yltna53wg-it-alliance-techs-projects.vercel.app/"),
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    credentials: true,
  })
);

app.use(morgan("dev"));

// 🧠 Body parsers — must come before sanitizers
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true }));

// 🧹 Sanitize user input to prevent NoSQL injection
app.use(mongoSanitize({ allowDots: true, replaceWith: "_" }));

// 🍪 Cookie parser + XSS protection + rate limiter
app.use(cookieParser());
app.use(xss());
app.use(rateLimit({ windowMs: 60 * 1000, max: 120 }));

// � Handle Chrome DevTools .well-known requests to prevent 404 logs
app.use("/.well-known/appspecific", (_req, res) => res.status(204).end());

// �🩺 Health check route
app.get("/", (_req, res) =>
  res.json({ ok: true, service: "kitchen-kettles-api" })
);

// 🚀 API routes
// ⭐ This is the ONLY correct route mount you need
app.use("/api", routes);

// ❌ Removed duplicate category mount
// app.use("/api/categories", categoryRoutes);

// 🔐 Admin routes (mounted at /api/admin to match frontend expectations)
app.use("/api/admin", adminRoutes);

// 🧩 Error handlers
app.use(notFound);
app.use(errorHandler);

export default app;
