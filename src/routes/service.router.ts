import { Router } from "express";
import { requireUser, validateResource } from "../middleware";
import { createServiceCategorySchema, createServiceSchema } from "../schemas";
import {
  createServiceCategoryHandler,
  createServiceHandler,
  deleteServiceCategoryHandler,
  deleteServiceHandler,
  getAllServiceCategoriesHandler,
  getAllServicesWithCategoriesHandler,
  updateServiceCategoryHandler,
  updateServiceHandler
} from "../controllers";
import { asyncWrapper } from "../utils";

const router = Router();

router.post(
  "/service-category/create",
  requireUser,
  validateResource(createServiceCategorySchema),
  asyncWrapper(createServiceCategoryHandler)
);
router.get("/service-category/all", requireUser, asyncWrapper(getAllServiceCategoriesHandler));
router.get("/service-with-category/all", requireUser, asyncWrapper(getAllServicesWithCategoriesHandler));
router.put(
  "/service-category/update/:id",
  requireUser,
  validateResource(createServiceCategorySchema),
  asyncWrapper(updateServiceCategoryHandler)
);
router.delete("/service-category/delete/:id", requireUser, asyncWrapper(deleteServiceCategoryHandler));

router.post("/create", requireUser, validateResource(createServiceSchema), asyncWrapper(createServiceHandler));
router.put("/update/:id", requireUser, validateResource(createServiceSchema), asyncWrapper(updateServiceHandler));
router.delete("/delete/:id", requireUser, asyncWrapper(deleteServiceHandler));

export default router;
