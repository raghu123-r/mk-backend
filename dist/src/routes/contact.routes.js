import express from "express";
import { getContactInfo } from "../controllers/contactInfo.controller.js";
import { createContact } from "../controllers/contact.controller.js";

const router = express.Router();

// GET /api/contact-info
router.get("/contact-info", getContactInfo);

// POST /api/contact - Save contact form submission
router.post("/", createContact);

export default router;
