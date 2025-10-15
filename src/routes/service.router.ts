import { Router } from "express";
import { requireUser, validateResource } from "../middleware";
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

router.get("/service-category/all", requireUser, asyncWrapper(getAllServiceCategoriesHandler));
router.get("/service-with-category/all", requireUser, asyncWrapper(getAllServicesWithCategoriesHandler));

router.post(
  "/service-category/create",
  requireUser,
  validateResource(createServiceCategorySchema),
  asyncWrapper(createServiceCategoryHandler)
);
router.post("/create", requireUser, validateResource(createServiceSchema), asyncWrapper(createServiceHandler));

router.get("/service-categories-details", requireUser, asyncWrapper(getAllServiceCategoriesWithDetailsHandler));
router.get("/services/:categoryId", requireUser, asyncWrapper(getAllServicesOfCategoryHandler));
router.get("/service-category/single/:id", requireUser, asyncWrapper(getSingleServiceCategoryHandler));
router.get("/single/:id", requireUser, asyncWrapper(getSingleServiceHandler));

router.put(
  "/service-category/update/:id",
  requireUser,
  validateResource(createServiceCategorySchema),
  asyncWrapper(updateServiceCategoryHandler)
);
router.delete("/service-category/delete/:id", requireUser, asyncWrapper(deleteServiceCategoryHandler));
router.put("/update/:id", requireUser, validateResource(createServiceSchema), asyncWrapper(updateServiceHandler));
router.delete("/delete/:id", requireUser, asyncWrapper(deleteServiceHandler));

export default router;
