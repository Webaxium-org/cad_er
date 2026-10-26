import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import User from "../models/user.js";
import OnboardingVerification from "../models/onboardingVerification.js";
import { normalizePhone } from "../utils/onboardingVerification.js";
import Company from "../models/company.js";
import Opening from "../models/opening.js";
import jwt from "../utils/jwt.js";
import { send_mail } from "../utils/mailer.js";
import { EMAIL_TEMPLATES } from "../utils/emails/templates.js";
import { ensureTrialSubscription } from "../services/trialSubscription.js";
import { getTotalSubscriptionSavings } from "../services/subscriptionSavings.js";
import {
  getCurrentSubscription,
  hasSubscriptionAccess,
} from "../services/subscriptionAccess.js";

export const loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).populate("company");

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
        },
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
        { statusCode: 403 }, // Forbidden
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
      body: { accessToken, action },
    } = req;

    if (action !== "login" && action !== "register") {
      throw Object.assign(new Error("Invalid action"), {
        statusCode: 400,
      });
    }

    const googleRes = await fetch(
      `https://www.googleapis.com/oauth2/v3/userinfo`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    );

    const payload = await googleRes.json();
    const { email, name, sub, picture } = payload;

    if (!email) {
      throw Object.assign(new Error("Google authentication failed"), {
        statusCode: 401,
      });
    }

    let user = await User.findOne({ email }).populate("company");

    // if (action === "login" && !user) {
    //   throw Object.assign(
    //     new Error("Account not found. Please sign up first."),
    //     { statusCode: 404 },
    //   );
    // }

    if (!user) {
      user = await User.create({
        name,
        email,
        password: await bcrypt.hash(sub, 10),
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
      body: { name, email, password },
    } = req;

    // Validate required fields
    if (!name || !email || !password) {
      throw Object.assign(new Error("All fields are required"), {
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

export const registerAccountType = async (req, res, next) => {
  try {
    const {
      body: { type, details, phone },
      user: { userId, isAuthenticated, type: userType },
    } = req;

    if (!isAuthenticated) {
      throw Object.assign(new Error("User not found"), {
        statusCode: 404,
      });
    }

    if (userType) {
      throw Object.assign(new Error("User already has an account type"), {
        statusCode: 400,
      });
    }

    const user = await User.findById(userId);

    if (!user) throw Object.assign(new Error("User not found"), { statusCode: 404 });
    if (!["Student", "Professional", "Company"].includes(type)) {
      throw Object.assign(new Error("Select a valid account type"), { statusCode: 400 });
    }
    const normalizedPhone = normalizePhone(phone);
    if (!normalizedPhone) {
      throw Object.assign(new Error("Enter a valid phone number including country code"), { statusCode: 400 });
    }
    if (await User.exists({ phone: normalizedPhone, _id: { $ne: userId } })) {
      throw Object.assign(new Error("Phone number already registered. Please use another number."), { statusCode: 409 });
    }
    const verification = await OnboardingVerification.findOne({
      user: userId, phone: normalizedPhone, providerRequestId: { $type: "string" }, verifiedAt: { $ne: null }, expiresAt: { $gt: new Date() },
    });
    if (!verification) {
      throw Object.assign(new Error("Verify your phone number before completing setup"), { statusCode: 400 });
    }
    user.phoneVerifiedAt = verification.verifiedAt;
    user.phone = normalizedPhone;

    const isFilled = (val) => typeof val === "string" && val.trim().length > 0;

    // 🔒 Validation based on type
    if (type === "Student") {
      const { instituteName, qualification, specialization, discoverySource } =
        details || {};

      if (
        !isFilled(instituteName) ||
        !isFilled(qualification) ||
        !isFilled(specialization) ||
        !isFilled(discoverySource)
      ) {
        throw Object.assign(new Error("All student fields are required"), {
          statusCode: 400,
        });
      }

      // Trim before saving
      details.instituteName = instituteName.trim();
      details.qualification = qualification.trim();
      details.specialization = specialization.trim();
      details.discoverySource = discoverySource.trim();
    }

    if (type === "Professional") {
      const { jobTitle, industry } = details || {};

      if (!isFilled(jobTitle) || !isFilled(industry)) {
        throw Object.assign(new Error("All professional fields are required"), {
          statusCode: 400,
        });
      }

      details.jobTitle = jobTitle.trim();
      details.industry = industry.trim();
    }

    if (type === "Company") {
      const { companyName, size } = details || {};

      if (!isFilled(companyName) || !isFilled(size)) {
        throw Object.assign(new Error("All company fields are required"), {
          statusCode: 400,
        });
      }

      const company = await Company.create({
        name: companyName.trim(),
        size: size.trim(),
        createdBy: userId,
      });

      user.company = company._id;

      details.companyName = companyName.trim();
      details.size = size.trim();
    }

    user.type = type;
    user.details = details;
    if (type === "Professional") {
      const session = await mongoose.startSession();
      try {
        session.startTransaction();
        await user.save({ session });
        await ensureTrialSubscription(user._id, { session });
        await session.commitTransaction();
      } catch (error) {
        await session.abortTransaction();
        throw error;
      } finally {
        session.endSession();
      }
    } else {
      await user.save();
    }

    let finalUser = user;

    if (type === "Company") {
      finalUser = await User.findById(user._id).populate("company");
    }

    const { password: _, ...userWithoutPassword } = finalUser.toObject();

    res.status(200).json({
      success: true,
      user: userWithoutPassword,
    });
  } catch (err) {
    if (err.code === 11000 && (err.keyPattern?.phone || err.keyValue?.phone)) {
      return next(Object.assign(new Error("Phone number already registered. Please use another number."), { statusCode: 409 }));
    }
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
      user: { userId, role, type },
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

    if (type === "Company") {
      const openings = await Opening.find({ createdBy: userId });
      stats = { ...stats, openings };
    }

    if (type === "Professional" && role !== "Super Admin") {
      // Backfill one trial for Professionals who onboarded before subscriptions existed.
      const [subscription, totalSavingsPaise] = await Promise.all([
        getCurrentSubscription(userId), getTotalSubscriptionSavings(userId),
      ]);
      stats.totalSavingsPaise = totalSavingsPaise;
      stats.subscription = {
        kind: subscription.kind,
        planCode: subscription.planCode,
        planName: subscription.pricingSnapshot?.name,
        status: subscription.status,
        periodStart: subscription.periodStart,
        periodEnd: subscription.periodEnd,
        projectLimit: subscription.projectLimit,
        projectCount: subscription.projectCount,
        hasAccess: hasSubscriptionAccess(subscription),
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

export const contactForm = async (req, res, next) => {
  try {
    const { name, email, phone, message } = req.body;

    if (!name || !email || !message) {
      throw Object.assign(new Error("All fields are required"), {
        statusCode: 400,
      });
    }

    const adminEmail = process.env.SUPPORT_EMAILS;

    if (!adminEmail) {
      throw Object.assign(new Error("Admin email not configured"), {
        statusCode: 500,
      });
    }

    const data = { name, email, phone, message };

    const [adminMailSent, clientMailSent] = await Promise.all([
      send_mail(
        adminEmail,
        "New Contact Form Submission",
        EMAIL_TEMPLATES.CONTACT_FORM_ADMIN(data),
      ),
      send_mail(
        email,
        "Thank you for contacting us!",
        EMAIL_TEMPLATES.CONTACT_FORM_CLIENT(data),
      ),
    ]);

    if (!adminMailSent || !clientMailSent) {
      throw Object.assign(new Error("Failed to send emails"), {
        statusCode: 500,
      });
    }

    res.status(200).json({
      success: true,
      message: "Message sent successfully",
    });
  } catch (err) {
    next(err);
  }
};

export const scheduleDemoForm = async (req, res, next) => {
  try {
    const { contactPerson, organizationName, designation, email, phone } =
      req.body;

    if (
      !contactPerson ||
      !organizationName ||
      !designation ||
      !email ||
      !phone
    ) {
      throw Object.assign(new Error("Missing required fields"), {
        statusCode: 400,
      });
    }

    const adminEmail = process.env.SUPPORT_EMAILS;

    if (!adminEmail) {
      throw Object.assign(new Error("Admin email not configured"), {
        statusCode: 500,
      });
    }

    const [adminMailSent, clientMailSent] = await Promise.all([
      send_mail(
        adminEmail,
        "New Schedule Demo Form Submission",
        EMAIL_TEMPLATES.SCHEDULE_DEMO_ADMIN(req.body),
      ),
      send_mail(
        email,
        "Thank you for scheduling a demo!",
        EMAIL_TEMPLATES.SCHEDULE_DEMO_CLIENT(req.body),
      ),
    ]);

    if (!adminMailSent || !clientMailSent) {
      throw Object.assign(new Error("Failed to send emails"), {
        statusCode: 500,
      });
    }

    res.status(200).json({
      success: true,
      message: "Demo scheduled successfully",
    });
  } catch (err) {
    next(err);
  }
};
