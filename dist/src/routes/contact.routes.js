import express from "express";
import { getContactInfo } from "../controllers/contact.controller.js";

const router = express.Router();

// GET /api/contact-info
router.get("/contact-info", getContactInfo);

export default router;
