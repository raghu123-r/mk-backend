import { Router } from "express";
import { protect } from "../middlewares/auth.js";
import { allowRoles } from "../middlewares/roles.js";
import { ROLES } from "../constants/roles.js";
import {
  getCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
} from "../controllers/category.controller.js";

const router = Router();

router.get("/", getCategories);
router.get("/:id", getCategoryById);
router.post("/", protect, allowRoles(ROLES.ADMIN), createCategory);
router.put("/:id", protect, allowRoles(ROLES.ADMIN), updateCategory);
router.delete("/:id", protect, allowRoles(ROLES.ADMIN), deleteCategory);

export default router;
