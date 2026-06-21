const productModel = require("../models/productmodel");
const slugify = require("slugify");

// CREATE PRODUCT
const createProduct = async (req, res) => {
  try {
    const { name, description, category, variants } = req.body;

    const product = new productModel({
      name,
      slug: slugify(name),
      description,
      category,
      variants: JSON.parse(variants),
    });

    // image
    if (req.file) {
      product.photo.data = req.file.buffer;
      product.photo.contentType = req.file.mimetype;
    }

    await product.save();

    res.send({ success: true, product });
  } catch (err) {
    res.status(500).send(err);
  }
};

// GET ALL PRODUCTS
const getProducts = async (req, res) => {
  const products = await productModel
    .find({})
    .select("-photo")
    .populate("category");

  res.send({ success: true, products });
};

// GET SINGLE PRODUCT
const getSingleProduct = async (req, res) => {
  const product = await productModel
    .findOne({ slug: req.params.slug })
    .populate("category");

  res.send({ success: true, product });
};

// GET IMAGE
const getPhoto = async (req, res) => {
  const product = await productModel.findById(req.params.id);

  res.set("Content-Type", product.photo.contentType);
  res.send(product.photo.data);
};

// UPDATE PRODUCT
/*
const updateProduct = async (req, res) => {
  const { id } = req.params;
  const { name, description, category, variants } = req.body;

  const product = await productModel.findByIdAndUpdate(
    id,
    {
      name,
      slug: slugify(name),
      description,
      category,
      variants: JSON.parse(variants),
    },
    { new: true }
  );

  if (req.file) {
    product.photo.data = req.file.buffer;
    product.photo.contentType = req.file.mimetype;
    await product.save();
  }

  res.send({ success: true, product });
};
*/
const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;

    let updateData = {};

    // update name
    if (req.body.name) {
      updateData.name = req.body.name;
      updateData.slug = slugify(req.body.name);
    }

    // update description
    if (req.body.description) {
      updateData.description = req.body.description;
    }

    // update category
    if (req.body.category) {
      updateData.category = req.body.category;
    }

    // update variants ONLY if provided
    if (req.body.variants) {
      updateData.variants = JSON.parse(req.body.variants);
    }

    const product = await productModel.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    );

    // update image if provided
    if (req.file) {
      product.photo.data = req.file.buffer;
      product.photo.contentType = req.file.mimetype;
      await product.save();
    }

    res.send({ success: true, product });

  } catch (error) {
    console.log(error);
    res.status(500).send({ success: false, error });
  }
};

// DELETE PRODUCT
const deleteProduct = async (req, res) => {
  await productModel.findByIdAndDelete(req.params.id);
  res.send({ success: true });
};

module.exports = {
  createProduct,
  getProducts,
  getSingleProduct,
  getPhoto,
  updateProduct,
  deleteProduct,
};