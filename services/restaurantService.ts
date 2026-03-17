/**
 * Restaurant service — business logic for managing restaurant records.
 *
 * Handles CRUD operations for restaurants and the menu management workflow.
 * All methods validate inputs and throw descriptive errors that are caught by
 * the global error handler and returned as structured API responses.
 */
import { Restaurant } from "../models/restaurant.js";
import { IRestaurant } from "../types/index.js";
import { Branch } from "../models/branch.js";
import { Table } from "../models/table.js";
import { User } from "../models/user.js";
import mongoose from "mongoose";

const restaurantService = {
  /**
   * Creates a new restaurant with the specified details.
   * Validates that opening time is before closing time before saving.
   *
   * @param {string} name - The name of the restaurant
   * @param {string} openingTime - The opening time in HH:MM format
   * @param {string} closingTime - The closing time in HH:MM format
   * @param {number} totalTables - The total number of tables in the restaurant
   * @returns {Promise<IRestaurant>} The created restaurant object
   * @throws {Error} If opening time is not before closing time
   */
  async createRestaurant(name: string, ownerId: string): Promise<IRestaurant> {
    if (!mongoose.Types.ObjectId.isValid(ownerId)) {
      throw new Error("Invalid owner ID");
    }

    const owner = await User.findById(ownerId);
    if (!owner || owner.role !== "restaurant_owner") {
      throw new Error("Restaurant can only be created by a restaurant owner");
    }

    const restaurant = new Restaurant({
      name,
      ownerId,
    });

    return await restaurant.save();
  },

  /**
   * Retrieves full details for a single restaurant, including all of its registered tables.
   * Tables are returned sorted by table number in ascending order.
   *
   * @param {string} id - The MongoDB ObjectId of the restaurant
   * @returns {Promise<object>} The restaurant document merged with a `tables` array
   * @throws {Error} If the ID is not a valid ObjectId or no restaurant is found
   */
  async getRestaurantDetails(id: string) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new Error("Invalid restaurant ID");
    }

    const restaurant = await Restaurant.findById(id);
    if (!restaurant) {
      throw new Error("Restaurant not found");
    }

    const branches = await Branch.find({ restaurantId: id }).sort({
      createdAt: -1,
    });

    const branchIds = branches.map((branch) => branch._id);
    const tables = await Table.find({ branchId: { $in: branchIds } }).sort({
      branchId: 1,
      tableNumber: 1,
    });

    return {
      ...restaurant.toObject(),
      branches,
      tables,
    };
  },

  /**
   * Retrieves all restaurants in the system, sorted by creation date (newest first).
   *
   * @returns {Promise<IRestaurant[]>} Array of all restaurant documents
   */
  async getAllRestaurants(): Promise<IRestaurant[]> {
    return await Restaurant.find().sort({ createdAt: -1 });
  },

  /**
   * Retrieves a single restaurant by its MongoDB ObjectId.
   *
   * @param {string} id - The MongoDB ObjectId of the restaurant
   * @returns {Promise<IRestaurant>} The restaurant document
   * @throws {Error} If the ID is invalid or the restaurant is not found
   */
  async getRestaurantById(id: string): Promise<IRestaurant> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new Error("Invalid restaurant ID");
    }

    const restaurant = await Restaurant.findById(id);
    if (!restaurant) {
      throw new Error("Restaurant not found");
    }

    return restaurant;
  },
};

export { restaurantService };
