const express = require('express');
const router  = express.Router();
const { getDeliveryEstimate } = require('../controllers/deliveryController');
// GET /api/delivery?pincode=600001
router.get('/', getDeliveryEstimate);
module.exports = router;