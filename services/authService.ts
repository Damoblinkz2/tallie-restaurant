import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { User } from "../models/user.js";
import { IUser, UserRole } from "../types/index.js";

const signToken = (id: string, role: UserRole): string => {
  const expiresIn =
    (process.env.JWT_EXPIRES_IN as jwt.SignOptions["expiresIn"]) || "7d";

  return jwt.sign({ id, role }, process.env.JWT_SECRET || "dev_jwt_secret", {
    expiresIn,
  });
};

export const authService = {
  async register(
    name: string,
    email: string,
    password: string,
    role: UserRole,
  ): Promise<{ user: Partial<IUser>; token: string }> {
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      throw new Error("User with this email already exists");
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      role,
    });

    const token = signToken(user._id.toString(), user.role);

    return {
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      } as Partial<IUser>,
      token,
    };
  },

  async login(
    email: string,
    password: string,
  ): Promise<{ user: Partial<IUser>; token: string }> {
    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      throw new Error("Invalid email or password");
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      throw new Error("Invalid email or password");
    }

    const token = signToken(user._id.toString(), user.role);

    return {
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      } as Partial<IUser>,
      token,
    };
  },
};
