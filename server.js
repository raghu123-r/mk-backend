import dotenv from "dotenv";
dotenv.config();

console.log(
  "DEBUG ENV — EMAIL_USER set?",
  !!process.env.EMAIL_USER,
  "EMAIL_APP_PASSWORD length:",
  (process.env.EMAIL_APP_PASSWORD || "").length
);

import { createServer } from "http";
import app from "./app.js";
import "./src/config/db.js";

const PORT = process.env.PORT || 5001;

const server = createServer(app);

server.listen(PORT, () => {
  console.log(`API running on http://localhost:${PORT}`);
});
