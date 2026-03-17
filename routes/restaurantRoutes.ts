/**
 * Restaurant routes — /api/restaurants
 *
 * Route mapping:
 *   POST   /             → Create a new restaurant
 *   GET    /             → List all restaurants
 *   GET    /:id          → Get a restaurant's details (including its tables)
 *   PATCH  /:id/menu     → Upload / replace the restaurant's menu
 *   GET    /:id/menu     → Retrieve the restaurant's current menu
 *
 * Each route runs one or more `validateRequest` middleware checks before
 * the controller handler so that invalid requests are rejected early.
 */
import { Router } from "express";
import { restaurantController } from "../controllers/restaurantController.js";
import { validateRequest } from "../middleware/validateRequest.js";
import { requestSchemas } from "../validation/schemas.js";
import { authorize, protect } from "../middleware/auth.js";

const router = Router();

router.post(
  "/",
  protect,
  authorize("restaurant_owner"),
  validateRequest(requestSchemas.createRestaurant),
  restaurantController.createRestaurant,
);
router.get("/", restaurantController.getAllRestaurants);
router.get(
  "/:id",
  validateRequest(requestSchemas.idParam, "params"),
  restaurantController.getRestaurantDetails,
);

export default router;
