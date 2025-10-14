import { Router } from "express";
import { requireUser, validateResource } from "../middleware";
import { addEmployeeHandler, getAllEmployeesHandler } from "../controllers";
import { asyncWrapper } from "../utils";
import { addEmployeeSchema } from "../schemas";

const router = Router();

router.post("/create", requireUser, validateResource(addEmployeeSchema), asyncWrapper(addEmployeeHandler));
router.get("/all", requireUser, asyncWrapper(getAllEmployeesHandler));
// router.get("/single/:employeeId", requireUser, asyncWrapper(getSingleEmployeeHandler));

export default router;
