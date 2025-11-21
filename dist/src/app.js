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
import categoryRoutes from "./routes/category.routes.js";
import contactRoutes from "./routes/contact.routes.js";

const app = express();

app.use("/api", contactRoutes);

// ✅ Ensure Express parses query strings as plain objects
app.set('query parser', 'simple');

// ✅ Defensive middleware — ensures req.query is always a writable plain object
app.use((req, _res, next) => {
  try {
    // Force req.query to be a plain writable object by reading current value
    // and redefining as a data property. This works even if query is a getter
    // on the prototype chain (IncomingMessage.prototype.query)
    const currentQuery = req.query || {};
    Object.defineProperty(req, 'query', {
      value: Object.assign({}, currentQuery),
      writable: true,
      enumerable: true,
      configurable: true
    });
  } catch (err) {
    console.warn('query-copy middleware warning:', err.message);
    // Fallback: ensure req.query exists as an empty object
    req.query = {};
  }
  next();
});

// 🛡 Security middlewares
app.use(helmet());

// ✅ Allow all your local frontend ports
app.use(cors({
  origin: [
    'http://localhost:3000', // Next.js default port
    'http://localhost:3001', // alternate frontend port
    'http://localhost:5173'  // Vite dev server port
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
app.use('/api', routes);
 
app.use("/api/categories", categoryRoutes);

// 🧩 Error handlers
app.use(notFound);
app.use(errorHandler);

export default app;
