import { Router } from "express";
import { requireUser, requireRole, validateResource } from "../middleware";
import {
  bulkMarkBookingsAsCompletedHandler,
  cancelBookingHandler,
  cancelOwnBookingHandler,
  confirmBookingHandler,
  getAllBookingsHandler,
  getAvailableSlotsHandler,
  getBookingShortStatsHandler,
  getPublicSingleBookingHandler,
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
  requireRole("admin"),
  validateResource(requestBookingSchema),
  asyncWrapper(manualCreateBookingHandler)
);
router.put(
  "/confirm",
  requireUser,
  requireRole("admin"),
  validateResource(confirmBookingSchema),
  asyncWrapper(confirmBookingHandler)
);
router.put(
  "/cancel",
  requireUser,
  requireRole("admin"),
  validateResource(confirmBookingSchema),
  asyncWrapper(cancelBookingHandler)
);
// Customer-scoped: ownership + 24h rule enforced inside the handler (no admin role)
router.put(
  "/customer/cancel",
  requireUser,
  validateResource(confirmBookingSchema),
  asyncWrapper(cancelOwnBookingHandler)
);
router.put(
  "/mark-completed",
  requireUser,
  requireRole("admin"),
  validateResource(confirmBookingSchema),
  asyncWrapper(markBookingAsCompletedHandler)
);
router.get("/all", requireUser, requireRole("admin"), asyncWrapper(getAllBookingsHandler));
router.get("/short-stats", requireUser, requireRole("admin"), asyncWrapper(getBookingShortStatsHandler));
router.put(
  "/bulk-mark-completed",
  requireUser,
  requireRole("admin"),
  validateResource(bulkMarkBookingsSchema),
  asyncWrapper(bulkMarkBookingsAsCompletedHandler)
);
router.get("/single/:bookingId", requireUser, requireRole("admin"), asyncWrapper(getSingleBookingHandler));
router.put(
  "/update/:bookingId",
  requireUser,
  requireRole("admin"),
  validateResource(updateBookingSchema),
  asyncWrapper(updateBookingHandler)
);
router.get("/public/single/:bookingId", asyncWrapper(getPublicSingleBookingHandler));

export default router;
