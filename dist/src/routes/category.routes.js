import { Router } from "express";
import { protect } from "../middlewares/auth.js";
import { allowRoles } from "../middlewares/roles.js";
import { ROLES } from "../constants/roles.js";
import {
  getCategories,
  getAllCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
  disableCategory,
  enableCategory,
} from "../controllers/category.controller.js";

const router = Router();

router.get("/", getCategories);
router.get("/all", protect, allowRoles(ROLES.ADMIN), getAllCategories);
router.get("/:id", getCategoryById);
router.post("/", protect, allowRoles(ROLES.ADMIN), createCategory);
router.put("/:id", protect, allowRoles(ROLES.ADMIN), updateCategory);
router.delete("/:id", protect, allowRoles(ROLES.ADMIN), deleteCategory);
router.patch("/:id/disable", protect, allowRoles(ROLES.ADMIN), disableCategory);
router.patch("/:id/enable", protect, allowRoles(ROLES.ADMIN), enableCategory);

export default router;
