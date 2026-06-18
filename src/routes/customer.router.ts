import { Router } from "express";
import { requireUser, requireRole, validateResource } from "../middleware";
import {
  createCustomerHandler,
  deleteCustomerHandler,
  getAllCustomersHandler,
  getAuthenticatedSingleCustomerHandler,
  getCustomerBookingHistoryHandler,
  getSingleCustomerHandler,
  updateAuthenticatedCustomerHandler,
  updateCustomerHandler,
  uploadAuthenticatedCustomerProfileImageHandler
} from "../controllers";
import { asyncWrapper } from "../utils";
import { updateAuthenticatedCustomerSchema, updateCustomerSchema } from "../schemas";
import { createCustomerSchema } from "../schemas";
import upload from "../utils/multer";

const router = Router();

router.post(
  "/create",
  requireUser,
  requireRole("admin"),
  validateResource(createCustomerSchema),
  asyncWrapper(createCustomerHandler)
);
router.get("/all", requireUser, requireRole("admin"), asyncWrapper(getAllCustomersHandler));
router.get("/single/:customerId", requireUser, requireRole("admin"), asyncWrapper(getSingleCustomerHandler));
router.put(
  "/update/:customerId",
  requireUser,
  requireRole("admin"),
  validateResource(updateCustomerSchema),
  asyncWrapper(updateCustomerHandler)
);
router.delete("/delete/:customerId", requireUser, requireRole("admin"), asyncWrapper(deleteCustomerHandler));

router.get("/booking-history", requireUser, asyncWrapper(getCustomerBookingHistoryHandler));
router.get("/authenticated/single", requireUser, asyncWrapper(getAuthenticatedSingleCustomerHandler));
router.put(
  "/authenticated/update",
  requireUser,
  validateResource(updateAuthenticatedCustomerSchema),
  asyncWrapper(updateAuthenticatedCustomerHandler)
);
router.post(
  "/authenticated/upload-profile-image",
  requireUser,
  upload.single("profile-image"),
  asyncWrapper(uploadAuthenticatedCustomerProfileImageHandler)
);

export default router;
