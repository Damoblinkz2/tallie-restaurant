/**
 * Table routes — /api/tables
 *
 * Route mapping:
 *   POST  /                   → Add a new table to a restaurant
 *   GET   /:restaurantId      → List all tables for a restaurant
 *
 * Each route validates its inputs with `validateRequest` before the controller runs.
 */
import { Router } from "express";
import { tableController } from "../controllers/tableController.js";
import { validateRequest } from "../middleware/validateRequest.js";
import { requestSchemas } from "../validation/schemas.js";
import { authorize, protect } from "../middleware/auth.js";

const router = Router();

router.post(
  "/",
  protect,
  authorize("restaurant_owner"),
  validateRequest(requestSchemas.addTable),
  tableController.addTable,
);
router.get(
  "/branch/:branchId",
  validateRequest(requestSchemas.branchIdParam, "params"),
  tableController.getTablesByRestaurant,
);

export default router;
