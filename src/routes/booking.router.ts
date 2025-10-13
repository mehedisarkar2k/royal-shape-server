import { Router } from "express";
import { requireUser, validateResource } from "../middleware";
import {
  bulkMarkBookingsAsCompletedHandler,
  cancelBookingHandler,
  confirmBookingHandler,
  getAllBookingsHandler,
  getAvailableSlotsHandler,
  getBookingShortStatsHandler,
  manualCreateBookingHandler,
  requestBookingHandler
} from "../controllers";
import { asyncWrapper } from "../utils";
import { bulkMarkBookingsSchema, confirmBookingSchema, requestBookingSchema } from "../schemas";

const router = Router();

router.get("/public/available-slots", asyncWrapper(getAvailableSlotsHandler));
router.post("/public/request", validateResource(requestBookingSchema), asyncWrapper(requestBookingHandler));
router.post(
  "/manual-create",
  requireUser,
  validateResource(requestBookingSchema),
  asyncWrapper(manualCreateBookingHandler)
);
router.put("/confirm", requireUser, validateResource(confirmBookingSchema), asyncWrapper(confirmBookingHandler));
router.put("/cancel", requireUser, validateResource(confirmBookingSchema), asyncWrapper(cancelBookingHandler));
router.get("/all", asyncWrapper(getAllBookingsHandler));
router.get("/short-stats", requireUser, asyncWrapper(getBookingShortStatsHandler));
router.get(
  "/bulk-mark-completed",
  requireUser,
  validateResource(bulkMarkBookingsSchema),
  asyncWrapper(bulkMarkBookingsAsCompletedHandler)
);

export default router;
