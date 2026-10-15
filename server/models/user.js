import mongoose from "mongoose";

const { Schema, model, Types } = mongoose;

const qualifications = [
  "ITI CIVIL / SURVEY",
  "POLYTECHNIC CIVIL",
  "B.E / B.Tech CIVIL",
];

const UserSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
    },
    company: {
      type: Types.ObjectId,
      ref: "Company",
    },
    organization: {
      type: Types.ObjectId,
      ref: "Organization",
    },
    designation: {
      type: String,
    },
    department: {
      type: String,
    },
    createdBy: {
      type: Types.ObjectId,
      ref: "User",
    },
    phone: {
      type: String,
      minlength: 7,
      trim: true,
    },
    phoneCode: {
      type: String,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: [true, "This Email Is Already In Use"],
    },
    authProvider: {
      type: String,
      enum: ["google"],
    },
    password: {
      type: String,
      required: true,
    },
    gender: {
      type: String,
      enum: ["Male", "Female", "Prefer Not To Say", "Not Defined"],
      default: "Not Defined",
      required: true,
    },
    dob: Date,
    type: {
      type: String,
      enum: ["Student", "Professional", "Company"],
    },
    role: {
      type: String,
      required: true,
      enum: [
        "Super Admin",
        "Survey Manager",
        "Chief Surveyor",
        "Senior Surveyor",
        "Site Engineer",
        "Assistant Engineer",
        "Guest",
      ],
      default: "Guest",
    },
    status: {
      type: String,
      default: "Active",
      enum: ["Active", "Inactive", "Suspended"],
      index: true,
      required: true,
    },
    details: {
      type: {
        instituteName: String,
        qualification: String,
        specialization: String,
        discoverySource: String,
        jobTitle: String,
        industry: String,
        companyName: String,
        size: String,
      },
      default: {},
    },
    isQuizCompleted: {
      type: Boolean,
      default: false,
    },
    quizScore: {
      type: Number,
      default: 0,
      minValue: 0,
      maxValue: 10,
    },
  },
  { timestamps: true }
);

UserSchema.virtual("activityHistory", {
  ref: "History",
  localField: "_id",
  foreignField: "entityId",
  match: { entityType: "User" },
});

UserSchema.set("toObject", { virtuals: true });
UserSchema.set("toJSON", { virtuals: true });

export default model("User", UserSchema);
