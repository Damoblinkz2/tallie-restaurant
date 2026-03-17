/**
 * Table service — business logic for managing restaurant table records.
 *
 * Handles adding tables to restaurants and querying existing tables.
 * Enforces capacity limits (cannot exceed `restaurant.totalTables`) and
 * ensures table numbers are unique within each restaurant.
 */
import mongoose from "mongoose";

import { Table } from "../models/table.js";
import { ITable } from "../types/index.js";
import { Branch } from "../models/branch.js";
import { Restaurant } from "../models/restaurant.js";

const tableService = {
  /**
   * Add a new table to a restaurant
   */
  async addTable(
    branchId: string,
    tableNumber: number,
    capacity: number,
    ownerId?: string,
  ): Promise<ITable> {
    // Validate branch ID
    if (!mongoose.Types.ObjectId.isValid(branchId)) {
      throw new Error("Invalid branch ID");
    }

    // Check if branch exists
    const branch = await Branch.findById(branchId);
    if (!branch) {
      throw new Error("Branch not found");
    }

    if (ownerId) {
      const restaurant = await Restaurant.findById(branch.restaurantId);
      if (!restaurant || restaurant.ownerId.toString() !== ownerId) {
        throw new Error("You can only manage tables for your own restaurant");
      }
    }

    // Check if branch has reached maximum table capacity
    const existingTables = await Table.countDocuments({ branchId });
    if (existingTables >= branch.totalTables) {
      throw new Error(
        `Branch has reached maximum capacity of ${branch.totalTables} tables`,
      );
    }

    // Check if table number already exists for this branch
    const tableExists = await Table.findOne({ branchId, tableNumber });
    if (tableExists) {
      throw new Error(
        `Table number ${tableNumber} already exists for this branch`,
      );
    }

    // Create new table
    const table = new Table({
      restaurantId: branch.restaurantId,
      branchId,
      tableNumber,
      capacity,
    });

    return await table.save();
  },

  /**
   * Retrieves all tables for a specific restaurant, sorted by table number.
   *
   * @param {string} branchId - The ID of the branch
   * @returns {Promise<ITable[]>} Array of table objects for the branch
   * @throws {Error} If branch ID is invalid
   */
  async getTablesByBranch(branchId: string): Promise<ITable[]> {
    if (!mongoose.Types.ObjectId.isValid(branchId)) {
      throw new Error("Invalid branch ID");
    }

    return await Table.find({ branchId }).sort({ tableNumber: 1 });
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
