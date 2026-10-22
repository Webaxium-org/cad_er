import mongoose from "mongoose";

export default mongoose.model("InvoiceCounter", new mongoose.Schema({
  _id: { type: String },
  value: { type: Number, required: true, default: 0 },
}));
