import { Router } from "express";
import { restaurantController } from "../controllers/restaurantController.js";

const router = Router();

router.post("/", restaurantController.createRestaurant);
router.get("/", restaurantController.getAllRestaurants);
router.get("/:id", restaurantController.getRestaurantDetails);

export default router;
