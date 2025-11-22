// src/app.js — fully updated middleware setup
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import mongoSanitize from 'express-mongo-sanitize';
import xss from 'xss-clean';
import rateLimit from 'express-rate-limit';
import routes from './routes/index.js';
import { notFound, errorHandler } from './middlewares/error.js';
import contactRoutes from "./routes/contact.routes.js";
import adminRoutes from './routes/adminRoutes.js';
import adminProductRoutes from "./routes/adminProductRoutes.js";


const app = express();

// ✅ Ensure Express parses query strings as plain objects
app.set('query parser', 'simple');

// ✅ Defensive middleware — ensures req.query is always a writable plain object
app.use((req, _res, next) => {
  try {
    const currentQuery = req.query || {};
    Object.defineProperty(req, 'query', {
      value: Object.assign({}, currentQuery),
      writable: true,
      enumerable: true,
      configurable: true
    });
  } catch (err) {
    console.warn('query-copy middleware warning:', err.message);
    req.query = {};
  }
  next();
});

// 🛡 Security middlewares
app.use(helmet());

// ✅ Allow all your local frontend ports
app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:5173'
  ],
  credentials: true,
}));

app.use(morgan('dev'));

// 🧠 Body parsers — must come before sanitizers
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));

// 🧹 Sanitize user input to prevent NoSQL injection
app.use(mongoSanitize({ allowDots: true, replaceWith: '_' }));

// 🍪 Cookie parser + XSS protection + rate limiter
app.use(cookieParser());
app.use(xss());
app.use(rateLimit({ windowMs: 60 * 1000, max: 120 }));

// � Handle Chrome DevTools .well-known requests to prevent 404 logs
app.use('/.well-known/appspecific', (_req, res) => res.status(204).end());

// �🩺 Health check route
app.get('/', (_req, res) => res.json({ ok: true, service: 'kitchen-kettles-api' }));

// 🚀 API routes
// ⭐ This is the ONLY correct route mount you need
app.use('/api', routes);

// ❌ Removed duplicate category mount
// app.use("/api/categories", categoryRoutes);

// 🔐 Admin routes
app.use('/admin', adminRoutes);
app.use("/admin", adminProductRoutes);

// 🧩 Error handlers
app.use(notFound);
app.use(errorHandler);



export default app;
