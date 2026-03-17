import mongoose from "mongoose";
import { Branch } from "../models/branch.js";
import { Restaurant } from "../models/restaurant.js";
import { IBranch } from "../types/index.js";
import { timeToMinutes } from "../utils/timeUtils.js";

export const branchService = {
  async createBranch(
    restaurantId: string,
    name: string,
    address: string,
    openingTime: string,
    closingTime: string,
    totalTables: number,
    ownerId?: string,
  ): Promise<IBranch> {
    if (!mongoose.Types.ObjectId.isValid(restaurantId)) {
      throw new Error("Invalid restaurant ID");
    }

    const restaurant = await Restaurant.findById(restaurantId);
    if (!restaurant) {
      throw new Error("Restaurant not found");
    }

    if (ownerId && restaurant.ownerId.toString() !== ownerId) {
      throw new Error("You can only add branches to your own restaurant");
    }

    const openingMinutes = timeToMinutes(openingTime);
    const closingMinutes = timeToMinutes(closingTime);

    if (openingMinutes >= closingMinutes) {
      throw new Error("Opening time must be before closing time");
    }

    return await Branch.create({
      restaurantId,
      name,
      address,
      openingTime,
      closingTime,
      totalTables,
    });
  },

  async getBranchById(id: string): Promise<IBranch> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new Error("Invalid branch ID");
    }

    const branch = await Branch.findById(id);
    if (!branch) {
      throw new Error("Branch not found");
    }

    return branch;
  },

  async getBranchesByRestaurant(restaurantId: string): Promise<IBranch[]> {
    if (!mongoose.Types.ObjectId.isValid(restaurantId)) {
      throw new Error("Invalid restaurant ID");
    }

    return await Branch.find({ restaurantId }).sort({ createdAt: -1 });
  },
};
