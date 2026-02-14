import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";

import routes from "./src/routes/index.js";
import adminRoutes from "./src/routes/adminRoutes.js";
import { notFound, errorHandler } from "./src/middlewares/error.js";
import subCategoryRoutes from "./src/routes/subcategories.js";

const app = express();

/* ================================
   ✅ CORS — MUST BE FIRST
================================ */
const allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:3001", // ✅ Your frontend port
  "http://localhost:3002", // optional
  "https://kkfrontend.vercel.app",
  "https://kk-frontend-seven.vercel.app",
  "https://mannarcraft-m5dl.vercel.app",
  "https://kkfrontend-ib2c4p1ap-it-alliance-techs-projects.vercel.app",
  "https://kkfrontend-git-develop-it-alliance-techs-projects.vercel.app",
  "https://kkfrontend-7mtclf1zt-it-alliance-techs-projects.vercel.app",
  "https://kkfrontend-yltna53wg-it-alliance-techs-projects.vercel.app",
];

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (like Postman or curl)
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      } else {
        console.error("❌ CORS blocked:", origin);
        return callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

/* ================================
   Security & core middleware
================================ */
app.use(helmet());
app.use(morgan("dev"));

app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true }));

app.use(cookieParser());
app.use(
  rateLimit({
    windowMs: 60 * 1000,
    max: 120,
  })
);

/* ================================
   Routes
================================ */
app.use("/api/subcategories", subCategoryRoutes);

app.get("/", (_req, res) => {
  res.json({ ok: true, service: "kitchen-kettles-api" });
});

app.use("/api", routes);
app.use("/api/admin", adminRoutes);

/* ================================
   Errors
================================ */
app.use(notFound);
app.use(errorHandler);

export default app;
