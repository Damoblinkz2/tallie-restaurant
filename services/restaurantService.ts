import { Restaurant } from "../models/restaurant.js";
import { IRestaurant } from "../types/index.js";
import { Table } from "../models/table.js";
import mongoose from "mongoose";
import { timeToMinutes } from "../utils/timeUtils.js";

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
  async createRestaurant(
    name: string,
    openingTime: string,
    closingTime: string,
    totalTables: number
  ): Promise<IRestaurant> {
    // Validate opening time is before closing time
    const openingMinutes = timeToMinutes(openingTime);
    const closingMinutes = timeToMinutes(closingTime);

    if (openingMinutes >= closingMinutes) {
      throw new Error("Opening time must be before closing time");
    }

    const restaurant = new Restaurant({
      name,
      openingTime,
      closingTime,
      totalTables,
    });

    return await restaurant.save();
  },

  /**
   * Get restaurant details with all tables
   */
  async getRestaurantDetails(id: string) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new Error("Invalid restaurant ID");
    }

    const restaurant = await Restaurant.findById(id);
    if (!restaurant) {
      throw new Error("Restaurant not found");
    }

    const tables = await Table.find({ restaurantId: id }).sort({
      tableNumber: 1,
    });

    return {
      ...restaurant.toObject(),
      tables,
    };
  },

  /**
   * Get all restaurants
   */
  async getAllRestaurants(): Promise<IRestaurant[]> {
    return await Restaurant.find().sort({ createdAt: -1 });
  },

  /**
   * Get restaurant by ID
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
