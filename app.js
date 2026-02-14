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
   ✅ CORS .— MUST BE FIRST
================================ */
app.use(cors({
  origin: true,  // Reflect the request origin
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Content-Length', 'X-JSON'],
  maxAge: 86400, // 24 hours
  preflightContinue: false,
  optionsSuccessStatus: 204
}));

/* ================================
   Security & core middleware
================================ */
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));
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