import mongoose from "mongoose";

import { Table } from "../models/table.js";
import { ITable } from "../types/index.js";
import { Restaurant } from "../models/restaurant.js";

const tableService = {
  /**
   * Add a new table to a restaurant
   */
  async addTable(
    restaurantId: string,
    tableNumber: number,
    capacity: number
  ): Promise<ITable> {
    // Validate restaurant ID
    if (!mongoose.Types.ObjectId.isValid(restaurantId)) {
      throw new Error("Invalid restaurant ID");
    }

    // Check if restaurant exists
    const restaurant = await Restaurant.findById(restaurantId);
    if (!restaurant) {
      throw new Error("Restaurant not found");
    }

    // Check if restaurant has reached maximum table capacity
    const existingTables = await Table.countDocuments({ restaurantId });
    if (existingTables >= restaurant.totalTables) {
      throw new Error(
        `Restaurant has reached maximum capacity of ${restaurant.totalTables} tables`
      );
    }

    // Check if table number already exists for this restaurant
    const tableExists = await Table.findOne({ restaurantId, tableNumber });
    if (tableExists) {
      throw new Error(
        `Table number ${tableNumber} already exists for this restaurant`
      );
    }

    // Create new table
    const table = new Table({
      restaurantId,
      tableNumber,
      capacity,
    });

    return await table.save();
  },

  /**
   * Retrieves all tables for a specific restaurant, sorted by table number.
   *
   * @param {string} restaurantId - The ID of the restaurant
   * @returns {Promise<ITable[]>} Array of table objects for the restaurant
   * @throws {Error} If restaurant ID is invalid
   */
  async getTablesByRestaurant(restaurantId: string): Promise<ITable[]> {
    if (!mongoose.Types.ObjectId.isValid(restaurantId)) {
      throw new Error("Invalid restaurant ID");
    }

    return await Table.find({ restaurantId }).sort({ tableNumber: 1 });
  },

  /**
   * Retrieves a specific table by its ID.
   *
   * @param {string} id - The ID of the table to retrieve
   * @returns {Promise<ITable>} The table object
   * @throws {Error} If table ID is invalid or table not found
   */
  async getTableById(id: string): Promise<ITable> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new Error("Invalid table ID");
    }

    const table = await Table.findById(id);
    if (!table) {
      throw new Error("Table not found");
    }

    return table;
  },
};

export { tableService };
