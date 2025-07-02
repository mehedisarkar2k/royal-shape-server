import { Router } from "express";
import { validateResource } from "../middleware";
import { asyncWrapper } from "../utils";
import { contactFormSubmitSchema } from "../schemas";
import { contactFormSubmitHandler } from "../controllers/contact.controller";

const router = Router();

router.post("/submit", validateResource(contactFormSubmitSchema), asyncWrapper(contactFormSubmitHandler));

export default router;
