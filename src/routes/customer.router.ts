import { Router } from "express";
import { requireUser, validateResource } from "../middleware";
import {
  createCustomerHandler,
  getAllCustomersHandler,
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

export default router;
