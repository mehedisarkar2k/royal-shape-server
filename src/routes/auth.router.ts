import { Router } from "express";
import { validateResource } from "../middleware";
import { asyncWrapper } from "../utils";
import { adminLoginSchema, customerLoginSchema, customerRegistrationSchema } from "../schemas";
import { adminLoginHandler, customerLoginHandler, customerRegistrationHandler } from "../controllers";

const router = Router();

router.post("/login/admin", validateResource(adminLoginSchema), asyncWrapper(adminLoginHandler));

router.post(
  "/registration/customer",
  validateResource(customerRegistrationSchema),
  asyncWrapper(customerRegistrationHandler)
);
router.post("/login/customer", validateResource(customerLoginSchema), asyncWrapper(customerLoginHandler));

export default router;
