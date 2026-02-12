import mongoose from "mongoose";

const slugify = (str) =>
  String(str || "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\w-]+/g, "")
    .replace(/--+/g, "-");

const subCategorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    slug: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },

    description: {
      type: String,
      default: "",
    },

    // Image for homepage card
    image: {
      type: String,
      default: "",
    },

    image_url: {
      type: String,
      default: "",
    },

    // Parent Category (Brass Lamps, Cookwares, etc.)
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
      index: true,
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    // Homepage control
    showOnHomepage: {
      type: Boolean,
      default: false,
    },

    homepageOrder: {
      type: Number,
      min: 1,
      max: 6,
      sparse: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual image field
subCategorySchema.virtual("imageUrl").get(function () {
  return this.image_url || this.image || "";
});

// Auto slug & image fallback
subCategorySchema.pre("validate", function (next) {
  if (!this.slug && this.name) {
    this.slug = slugify(this.name);
  } else if (this.slug) {
    this.slug = slugify(this.slug);
  }

  if (!this.image_url && this.image) {
    this.image_url = this.image;
  }

  next();
});

const SubCategory = mongoose.model("SubCategory", subCategorySchema);
export default SubCategory;
