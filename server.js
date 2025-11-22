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

// ⭐ ADD ROUTES IMPORT
import routes from "./src/routes/index.js";

const PORT = process.env.PORT || 5001;

// ⭐ MOUNT API ROUTES HERE
app.use("/api", routes);

const server = createServer(app);

server.listen(PORT, () => {
  console.log(`API running on http://localhost:${PORT}`);
});
