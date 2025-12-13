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

const cors = require('cors');

// allow only your Vercel frontend (better security than "*")
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


app.options('*', cors({
  origin: 'https://kkfrontend.vercel.app',
  methods: ['GET','POST','PUT','PATCH','DELETE','OPTIONS'],
  credentials: true
}));

const PORT = process.env.PORT || 5001;

const server = createServer(app);

server.listen(PORT, () => {
  console.log(`API running on http://localhost:${PORT}`);
});
