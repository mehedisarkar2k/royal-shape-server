import { Router } from "express";
import { requireUser, validateResource } from "../middleware";
import {
  createCustomerHandler,
  deleteCustomerHandler,
  getAllCustomersHandler,
  getCustomerBookingHistoryHandler,
  getSingleCustomerHandler,
  updateCustomerHandler
} from "../controllers";
import { asyncWrapper } from "../utils";
import { updateCustomerSchema } from "../schemas";
import { createCustomerSchema } from "../schemas";

const router = Router();

router.post("/create", requireUser, validateResource(createCustomerSchema), asyncWrapper(createCustomerHandler));
router.get("/all", requireUser, asyncWrapper(getAllCustomersHandler));
router.get("/single/:customerId", requireUser, asyncWrapper(getSingleCustomerHandler));
router.put(
  "/update/:customerId",
  requireUser,
  validateResource(updateCustomerSchema),
  asyncWrapper(updateCustomerHandler)
);
router.delete("/delete/:customerId", requireUser, asyncWrapper(deleteCustomerHandler));

router.get("/booking-history", requireUser, asyncWrapper(getCustomerBookingHistoryHandler));

export default router;
