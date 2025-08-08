import { Router } from "express";
import { validateResource } from "../middleware";
import { asyncWrapper } from "../utils";
import { adminLoginSchema, customerLoginSchema } from "../schemas";
import { adminLoginHandler, customerLoginHandler } from "../controllers";

const router = Router();

router.post("/login/admin", validateResource(adminLoginSchema), asyncWrapper(adminLoginHandler));

router.post("/login/customer", validateResource(customerLoginSchema), asyncWrapper(customerLoginHandler));

export default router;
