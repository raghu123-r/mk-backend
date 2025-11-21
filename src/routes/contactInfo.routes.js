import { Router } from "express";
import { getContactInfo, updateContactInfo } from "../controllers/contactInfo.controller.js";

const router = Router();

router.get("/", getContactInfo);     // Fetch contact info
router.put("/", updateContactInfo);  // Update contact info

export default router;
