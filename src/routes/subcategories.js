import { Router } from "express";
import { protect } from "../middlewares/auth.js";
import { allowRoles } from "../middlewares/roles.js";
import { ROLES } from "../constants/roles.js";

import {
  getSubCategories,
  getAllSubCategories,
  createSubCategory,
  updateSubCategory,
  deleteSubCategory,
  enableSubCategory,
  disableSubCategory,
} from "../controllers/subcategory.controller.js";

const router = Router();

/**
 * PUBLIC (Frontend)
 * Used by:
 * - Category → Subcategory listing
 * - Homepage subcategories
 */
router.get("/", getSubCategories);
router.get("/by-category", getSubCategories); // ✅ ADD THIS LINE

/**
 * ADMIN
 */
router.get("/all", protect, allowRoles(ROLES.ADMIN), getAllSubCategories);
router.post("/", protect, allowRoles(ROLES.ADMIN), createSubCategory);
router.put("/:id", protect, allowRoles(ROLES.ADMIN), updateSubCategory);
router.delete("/:id", protect, allowRoles(ROLES.ADMIN), deleteSubCategory);
router.patch("/:id/enable", protect, allowRoles(ROLES.ADMIN), enableSubCategory);
router.patch("/:id/disable", protect, allowRoles(ROLES.ADMIN), disableSubCategory);

export default router;
