const express = require("express");
const router = express.Router();
const upload = require("../middlewares/upload");

const {
  createProduct,
  getProducts,
  getSingleProduct,
  getPhoto,
  updateProduct,
  deleteProduct,
} = require("../controllers/productController");

router.post("/create", upload.single("photo"), createProduct);
router.get("/all", getProducts);
router.get("/:slug", getSingleProduct);
router.get("/photo/:id", getPhoto);
router.put("/update/:id", upload.single("photo"), updateProduct);
router.delete("/delete/:id", deleteProduct);

module.exports = router;