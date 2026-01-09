import { Router } from "express";
import { tableController } from "../controllers/tableController.js";

const router = Router();

router.post("/", tableController.addTable);
router.get("/:restaurantId", tableController.getTablesByRestaurant);

export default router;
