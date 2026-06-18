import { Router } from "express";
import { requireUser, requireRole, validateResource } from "../middleware";
import {
  addEmployeeHandler,
  deleteEmployeeHandler,
  getAllEmployeesHandler,
  getSingleEmployeeHandler,
  updateEmployeeHandler
} from "../controllers";
import { asyncWrapper } from "../utils";
import { addEmployeeSchema } from "../schemas";

const router = Router();

router.post(
  "/create",
  requireUser,
  requireRole("admin"),
  validateResource(addEmployeeSchema),
  asyncWrapper(addEmployeeHandler)
);
router.get("/all", requireUser, requireRole("admin"), asyncWrapper(getAllEmployeesHandler));
router.get("/single/:employeeId", requireUser, requireRole("admin"), asyncWrapper(getSingleEmployeeHandler));
router.delete("/delete/:employeeId", requireUser, requireRole("admin"), asyncWrapper(deleteEmployeeHandler));
router.put(
  "/update/:employeeId",
  requireUser,
  requireRole("admin"),
  validateResource(addEmployeeSchema),
  asyncWrapper(updateEmployeeHandler)
);

export default router;
