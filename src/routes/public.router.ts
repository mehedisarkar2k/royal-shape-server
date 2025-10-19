// * for website mainly

import { Router } from "express";
import { getWebsiteHomePublicDataHandler } from "../controllers";
import { asyncWrapper } from "../utils";

const router = Router();

router.get("/website/home", asyncWrapper(getWebsiteHomePublicDataHandler));

export default router;
