const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    name: String,
    slug: String,
    description: String,

    category: {
      type: mongoose.ObjectId,
      ref: "Category",
    },

    variants: [
      {
        weight: String,
        price: Number,
        stock: {
          type: Number,
          default: 0,
        },
      },
    ],

    photo: {
      data: Buffer,
      contentType: String,
    },
  averageRating: { type: Number, default: 0 },
totalReviews:  { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Product", productSchema);