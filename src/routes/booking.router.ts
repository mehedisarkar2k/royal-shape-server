import { Router } from "express";
import { validateResource } from "../middleware";
import { getAvailableSlotsHandler, requestBookingHandler } from "../controllers";
import { asyncWrapper } from "../utils";
import { requestBookingSchema } from "../schemas";

const router = Router();

router.get("/available-slots", asyncWrapper(getAvailableSlotsHandler));
router.post("/request", validateResource(requestBookingSchema), asyncWrapper(requestBookingHandler));

export default router;
