import mongoose from "mongoose";

const STATUS = [
  "OPEN",
  "IN_PROGRESS",
  "POSTPONED",
  "RESOLVED",
  "CLOSED",
  "REOPENED",
];

const ticketSchema = new mongoose.Schema(
  {
    ticketNo: {
      type: String,
      unique: true,
    },

    feedbackType: {
      type: String,
      required: true,
      enum: ["Complaints", "Suggestions"],
    },

    description: {
      type: String,
      required: true,
    },

    status: {
      type: String,
      enum: STATUS,
      default: "OPEN",
    },

    priority: {
      type: String,
      enum: ["LOW", "MEDIUM", "HIGH", "CRITICAL"],
      default: "MEDIUM",
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    followups: [
      {
        message: String,
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        status: {
          type: String,
          enum: STATUS,
        },
        postponedUntil: {
          type: Date,
        },
        resolvedAt: {
          type: Date,
        },
        createdAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

ticketSchema.pre("save", async function (next) {
  if (!this.ticketNo) {
    const count = await mongoose.model("Tickets").countDocuments();
    this.ticketNo = `TKT-${count + 1001}`;
  }
  next();
});

export default mongoose.model("Tickets", ticketSchema);
