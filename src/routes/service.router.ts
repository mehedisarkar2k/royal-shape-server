import { Router } from "express";
import { requireUser, requireRole, validateResource } from "../middleware";
import { createServiceCategorySchema, createServiceSchema } from "../schemas";
import {
  createServiceCategoryHandler,
  createServiceHandler,
  deleteServiceCategoryHandler,
  deleteServiceHandler,
  getAllServiceCategoriesHandler,
  getAllServiceCategoriesWithDetailsHandler,
  getAllServicesOfCategoryHandler,
  getAllServicesWithCategoriesHandler,
  getSingleServiceCategoryHandler,
  getSingleServiceHandler,
  updateServiceCategoryHandler,
  updateServiceHandler
} from "../controllers";
import { asyncWrapper } from "../utils";

const router = Router();

router.get("/service-category/all", requireUser, requireRole("admin"), asyncWrapper(getAllServiceCategoriesHandler));
router.get(
  "/service-with-category/all",
  requireUser,
  requireRole("admin"),
  asyncWrapper(getAllServicesWithCategoriesHandler)
);

router.post(
  "/service-category/create",
  requireUser,
  requireRole("admin"),
  validateResource(createServiceCategorySchema),
  asyncWrapper(createServiceCategoryHandler)
);
router.post(
  "/create",
  requireUser,
  requireRole("admin"),
  validateResource(createServiceSchema),
  asyncWrapper(createServiceHandler)
);

router.get(
  "/service-categories-details",
  requireUser,
  requireRole("admin"),
  asyncWrapper(getAllServiceCategoriesWithDetailsHandler)
);
router.get("/services/:categoryId", requireUser, requireRole("admin"), asyncWrapper(getAllServicesOfCategoryHandler));
router.get(
  "/service-category/single/:id",
  requireUser,
  requireRole("admin"),
  asyncWrapper(getSingleServiceCategoryHandler)
);
router.get("/single/:id", requireUser, requireRole("admin"), asyncWrapper(getSingleServiceHandler));

router.put(
  "/service-category/update/:id",
  requireUser,
  requireRole("admin"),
  validateResource(createServiceCategorySchema),
  asyncWrapper(updateServiceCategoryHandler)
);
router.delete(
  "/service-category/delete/:id",
  requireUser,
  requireRole("admin"),
  asyncWrapper(deleteServiceCategoryHandler)
);
router.put(
  "/update/:id",
  requireUser,
  requireRole("admin"),
  validateResource(createServiceSchema),
  asyncWrapper(updateServiceHandler)
);
router.delete("/delete/:id", requireUser, requireRole("admin"), asyncWrapper(deleteServiceHandler));

export default router;
