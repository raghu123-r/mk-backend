// models/Category.js
import mongoose from "mongoose";

const slugify = (str) =>
  String(str || "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\w-]+/g, "")
    .replace(/--+/g, "-");

const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    // ALWAYS required, because frontend depends on slug to fetch products
    slug: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },

    description: {
      type: String,
      trim: true,
      default: "",
    },

    // old field (keep for backward compatibility)
    image: {
      type: String,
      default: "",
    },

    // preferred image field
    image_url: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual field
categorySchema.virtual("imageUrl").get(function () {
  return this.image_url || this.image || "";
});

// Auto-generate slug if missing
categorySchema.pre("validate", function (next) {
  if (!this.slug && this.name) {
    this.slug = slugify(this.name);
  } else if (this.slug) {
    this.slug = slugify(this.slug);
  }

  // set image_url fallback
  if (!this.image_url && this.image) {
    this.image_url = this.image;
  }

  next();
});

const Category = mongoose.model("Category", categorySchema);
export default Category;
