import { Router } from "express";
import { requireUser, validateResource } from "../middleware";
import { createCustomerHandler, getAllCustomersHandler } from "../controllers";
import { asyncWrapper } from "../utils";
import {} from "../schemas";
import { createCustomerSchema } from "../schemas";

const router = Router();

router.post("/create", requireUser, validateResource(createCustomerSchema), asyncWrapper(createCustomerHandler));
router.get("/all", requireUser, asyncWrapper(getAllCustomersHandler));

export default router;
