import User from "../models/user.js";
import bcrypt from "bcryptjs";

export const getAllUsers = async (req, res, next) => {
  try {
    const { status, role, search, organization } = req.query;

    const filter = {};

    if (status) filter.status = status;
    if (role) filter.role = role;
    if (organization) filter.organization = organization;

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { phone: { $regex: search, $options: "i" } },
      ];
    }

    const users = await User.find(filter)
      .sort({ createdAt: -1 })
      .populate("organization", "name code")
      .populate("createdBy", "name email")
      .lean();

    res.status(200).json({
      success: true,
      count: users.length,
      message:
        users.length > 0
          ? `${users.length} user${users.length > 1 ? "s" : ""} found`
          : "No users found",
      users,
    });
  } catch (err) {
    next(err);
  }
};

export const getUserById = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id)
      .populate("organization", "name code")
      .populate("createdBy", "name email")
      .lean();

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.status(200).json({
      success: true,
      user,
    });
  } catch (err) {
    next(err);
  }
};

export const createUser = async (req, res, next) => {
  try {
    const { password } = req.body;

    const hashedPassword = await bcrypt.hash(password, 10);

    const payload = {
      ...req.body,
      password: hashedPassword,
      createdBy: req.user?._id,
    };

    const user = await User.create(payload);

    res.status(201).json({
      success: true,
      message: "User created successfully",
      user,
    });
  } catch (err) {
    next(err);
  }
};

export const updateUser = async (req, res, next) => {
  try {
    const updates = { ...req.body };

    // Hash password only if updating
    if (updates.password) {
      updates.password = await bcrypt.hash(updates.password, 10);
    }

    const updated = await User.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true,
    });

    if (!updated) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "User updated successfully",
      user: updated,
    });
  } catch (err) {
    next(err);
  }
};

export const deleteUser = async (req, res, next) => {
  try {
    const deleted = await User.findByIdAndDelete(req.params.id);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "User deleted successfully",
    });
  } catch (err) {
    next(err);
  }
};

export const submitQuiz = async (req, res, next) => {
  try {
    const {
      user: { userId },
      body: { score },
    } = req;

    const user = await User.findById(userId);

    user.isQuizCompleted = true;
    user.quizScore = score;

    await user.save();

    // Process quiz submission logic here
    res.status(200).json({
      success: true,
      message: "Quiz submitted successfully",
      isQuizCompleted: user.isQuizCompleted,
      quizScore: user.quizScore,
    });
  } catch (err) {
    next(err);
  }
};
