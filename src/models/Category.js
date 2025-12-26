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

    isActive: {
      type: Boolean,
      default: true,
    },

    // Homepage priority fields
    showOnHomepage: { 
      type: Boolean, 
      default: false 
    },
    homepageOrder: { 
      type: Number, 
      min: 1, 
      max: 4,
      sparse: true // Allow null/undefined, but enforce uniqueness when set
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Ensure homepageOrder is unique when showOnHomepage is true
categorySchema.index(
  { homepageOrder: 1 }, 
  { 
    unique: true, 
    partialFilterExpression: { showOnHomepage: true, homepageOrder: { $exists: true } }
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
