// src/routes/adminProductRoutes.js
import express from "express";
import { listProducts, deleteProduct } from "../controllers/adminProductController.js";
import { requireAuth, requireAdmin } from "../middlewares/auth.js";

const router = express.Router();

// Protect all admin product routes
router.use(requireAuth, requireAdmin);

router.get("/", listProducts);
router.delete("/:id", deleteProduct);

export default router;
