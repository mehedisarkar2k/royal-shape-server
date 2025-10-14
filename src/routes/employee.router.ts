import { Router } from "express";
import { requireUser, validateResource } from "../middleware";
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

router.post("/create", requireUser, validateResource(addEmployeeSchema), asyncWrapper(addEmployeeHandler));
router.get("/all", requireUser, asyncWrapper(getAllEmployeesHandler));
router.get("/single/:employeeId", requireUser, asyncWrapper(getSingleEmployeeHandler));
router.delete("/delete/:employeeId", requireUser, asyncWrapper(deleteEmployeeHandler));
router.put(
  "/update/:employeeId",
  requireUser,
  validateResource(addEmployeeSchema),
  asyncWrapper(updateEmployeeHandler)
);

export default router;
