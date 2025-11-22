// src/routes/adminProductRoutes.js
import express from "express";
import { listProducts, deleteProduct } from "../controllers/adminProductController.js";

const router = express.Router();

router.get("/", listProducts);
router.delete("/:id", deleteProduct);

export default router;
