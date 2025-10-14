import { Router } from "express";
import { requireUser, validateResource } from "../middleware";
import {
  bulkMarkBookingsAsCompletedHandler,
  cancelBookingHandler,
  confirmBookingHandler,
  getAllBookingsHandler,
  getAvailableSlotsHandler,
  getBookingShortStatsHandler,
  getSingleBookingHandler,
  manualCreateBookingHandler,
  markBookingAsCompletedHandler,
  requestBookingHandler,
  updateBookingHandler
} from "../controllers";
import { asyncWrapper } from "../utils";
import { bulkMarkBookingsSchema, confirmBookingSchema, requestBookingSchema, updateBookingSchema } from "../schemas";

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
router.put(
  "/mark-completed",
  requireUser,
  validateResource(confirmBookingSchema),
  asyncWrapper(markBookingAsCompletedHandler)
);
router.get("/all", requireUser, asyncWrapper(getAllBookingsHandler));
router.get("/short-stats", requireUser, asyncWrapper(getBookingShortStatsHandler));
router.put(
  "/bulk-mark-completed",
  requireUser,
  validateResource(bulkMarkBookingsSchema),
  asyncWrapper(bulkMarkBookingsAsCompletedHandler)
);
router.get("/single/:bookingId", requireUser, asyncWrapper(getSingleBookingHandler));
router.put(
  "/update/:bookingId",
  requireUser,
  validateResource(updateBookingSchema),
  asyncWrapper(updateBookingHandler)
);

export default router;
