import bcrypt from "bcryptjs";
import User from "../models/user.js";
import jwt from "../utils/jwt.js";

export const loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      throw Object.assign(new Error("Invalid credentials"), {
        statusCode: 401,
      });
    }

    if (user.authProvider === "google") {
      throw Object.assign(
        new Error("Please sign in with Google, not with email/password"),
        {
          statusCode: 401,
        }
      );
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      throw Object.assign(new Error("Invalid credentials"), {
        statusCode: 401,
      });
    }

    // Check if the user's status is not "Active"
    if (user.status !== "Active") {
      throw Object.assign(
        new Error(`Login failed. Your account is currently ${user.status}.`),
        { statusCode: 403 } // Forbidden
      );
    }

    const token = jwt(user._id);

    const { password: _, ...userWithoutPassword } = user.toObject();

    const isProd = process.env.NODE_ENV === "production";

    res
      .cookie("access__", token, {
        httpOnly: true,
        secure: isProd,
        sameSite: isProd ? "none" : "lax",
        path: "/",
        domain: isProd ? ".getcader.com" : undefined,
        maxAge: Number(process.env.TOKEN_EXPIRY_DAYS) * 24 * 60 * 60 * 1000,
      })
      .status(200)
      .json({ status: "success", user: { ...userWithoutPassword } });
  } catch (err) {
    next(err);
  }
};

export const googleLogin = async (req, res, next) => {
  try {
    const {
      body: { accessToken, type, action, qualification },
    } = req;

    if (action !== "login" && action !== "register") {
      throw Object.assign(new Error("Invalid action"), {
        statusCode: 400,
      });
    }

    if (action === "register" && !["Student", "Professional"].includes(type)) {
      throw Object.assign(new Error("Invalid user type for registration"), {
        statusCode: 400,
      });
    }

    const googleRes = await fetch(
      `https://www.googleapis.com/oauth2/v3/userinfo`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    const payload = await googleRes.json();
    const { email, name, sub, picture } = payload;

    if (!email) {
      throw Object.assign(new Error("Google authentication failed"), {
        statusCode: 401,
      });
    }

    let user = await User.findOne({ email });

    if (action === "login" && !user) {
      throw Object.assign(
        new Error("Account not found. Please sign up first."),
        { statusCode: 404 }
      );
    }

    if (!user) {
      if (type === "Student" && !qualification) {
        throw Object.assign(
          new Error("Qualification is required for Students"),
          {
            statusCode: 400,
          }
        );
      }

      user = await User.create({
        name,
        email,
        password: await bcrypt.hash(sub, 10),
        type,
        qualification: type === "Student" ? qualification : undefined,
        authProvider: "google",
        status: "Active",
      });
    }

    const token = jwt(user._id);

    const { password, ...userWithoutPassword } = user.toObject();

    const isProd = process.env.NODE_ENV === "production";

    res
      .cookie("access__", token, {
        httpOnly: true,
        secure: isProd,
        sameSite: isProd ? "none" : "lax",
        path: "/",
        domain: isProd ? ".getcader.com" : undefined,
        maxAge: Number(process.env.TOKEN_EXPIRY_DAYS) * 24 * 60 * 60 * 1000,
      })
      .status(200)
      .json({
        status: "success",
        user: userWithoutPassword,
      });
  } catch (err) {
    next(err);
  }
};

export const registerUser = async (req, res, next) => {
  try {
    const {
      body: { name, email, password, type, qualification },
    } = req;

    // Validate required fields
    if (!name || !email || !password || !type) {
      throw Object.assign(new Error("All fields are required"), {
        statusCode: 400,
      });
    }

    // Validate type
    if (!["Student", "Professional"].includes(type)) {
      throw Object.assign(new Error("Invalid user type"), { statusCode: 400 });
    }

    if (type === "Student" && !qualification) {
      throw Object.assign(new Error("Qualification is required for Students"), {
        statusCode: 400,
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw Object.assign(new Error("Email already registered"), {
        statusCode: 409,
      });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user
    const newUser = await User.create({
      name,
      email,
      password: hashedPassword,
      type,
      qualification: type === "Student" ? qualification : undefined,
      status: "Active",
    });

    // Generate JWT token
    const token = jwt(newUser._id);

    const { password: _, ...userWithoutPassword } = newUser.toObject();

    const isProd = process.env.NODE_ENV === "production";

    // Set cookie
    res
      .cookie("access__", token, {
        httpOnly: true,
        secure: isProd,
        sameSite: isProd ? "none" : "lax",
        path: "/",
        domain: isProd ? ".getcader.com" : undefined,
        maxAge: Number(process.env.TOKEN_EXPIRY_DAYS) * 24 * 60 * 60 * 1000,
      })
      .status(201)
      .json({
        status: "success",
        user: userWithoutPassword,
      });
  } catch (err) {
    next(err);
  }
};

export const logoutUser = (req, res, next) => {
  try {
    const isProd = process.env.NODE_ENV === "production";

    res.clearCookie("access__", {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? "none" : "lax",
      path: "/",
      domain: isProd ? ".getcader.com" : undefined,
    });

    res.status(200).json({
      status: "success",
      message: "Logged out successfully",
    });
  } catch (err) {
    next(err);
  }
};

export const getDashboard = async (req, res, next) => {
  try {
    const {
      user: { userId, role },
    } = req;

    let stats = {
      totalUsers: 0,
      students: 0,
      professionals: 0,
    };

    if (role === "Super Admin") {
      // Exclude current logged-in admin if needed
      const baseQuery = { _id: { $ne: userId } };

      const [totalUsers, students, professionals] = await Promise.all([
        User.countDocuments(baseQuery),
        User.countDocuments({ ...baseQuery, type: "Student" }),
        User.countDocuments({ ...baseQuery, type: "Professional" }),
      ]);

      stats = {
        totalUsers,
        students,
        professionals,
      };
    }

    res.status(200).json({
      status: "success",
      stats,
    });
  } catch (err) {
    next(err);
  }
};
