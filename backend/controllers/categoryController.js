const categoryModel = require("../models/categorymodel");
const slugify = require("slugify");

// CREATE
const createCategory = async (req, res) => {
  const { name } = req.body;

  const existing = await categoryModel.findOne({ name });
  if (existing) return res.send({ message: "Already exists" });

  const category = await new categoryModel({
    name,
    slug: slugify(name),
  }).save();

  res.send({ success: true, category });
};

// GET ALL
const getCategories = async (req, res) => {
  const data = await categoryModel.find({});
  res.send({ success: true, data });
};

// UPDATE
const updateCategory = async (req, res) => {
  const { id } = req.params;
  const { name } = req.body;

  const category = await categoryModel.findByIdAndUpdate(
    id,
    { name, slug: slugify(name) },
    { new: true }
  );

  res.send({ success: true, category });
};

// DELETE
const deleteCategory = async (req, res) => {
  await categoryModel.findByIdAndDelete(req.params.id);
  res.send({ success: true });
};

module.exports = {
  createCategory,
  getCategories,
  updateCategory,
  deleteCategory,
};