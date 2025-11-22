import mongoose from "mongoose";

const contactInfoSchema = new mongoose.Schema(
  {
    phone: { type: String, required: true },
    email: { type: String, required: true },
    address: { type: String, required: true },
  },
  { timestamps: true }
);

export default mongoose.model("ContactInfo", contactInfoSchema);
