import mongoose from "mongoose";
import { Menu } from "../models/menu.js";
import { Branch } from "../models/branch.js";
import { IMenu, IMenuItem } from "../types/index.js";
import { Restaurant } from "../models/restaurant.js";

export const menuService = {
  async upsertBranchMenu(
    branchId: string,
    items: IMenuItem[],
    ownerId?: string,
  ): Promise<IMenu[]> {
    if (!mongoose.Types.ObjectId.isValid(branchId)) {
      throw new Error("Invalid branch ID");
    }

    const branch = await Branch.findById(branchId);
    if (!branch) {
      throw new Error("Branch not found");
    }

    if (ownerId) {
      const restaurant = await Restaurant.findById(branch.restaurantId);
      if (!restaurant || restaurant.ownerId.toString() !== ownerId) {
        throw new Error("You can only manage menu for your own restaurant");
      }
    }

    await Menu.deleteMany({ branchId });

    if (items.length === 0) {
      return [];
    }

    await Menu.insertMany(
      items.map((item) => ({
        ...item,
        restaurantId: branch.restaurantId,
        branchId: branch._id,
      })),
    );

    return await Menu.find({ branchId }).sort({ name: 1 });
  },

  async getBranchMenu(branchId: string): Promise<IMenu[]> {
    if (!mongoose.Types.ObjectId.isValid(branchId)) {
      throw new Error("Invalid branch ID");
    }

    return await Menu.find({ branchId }).sort({ name: 1 });
  },
};
