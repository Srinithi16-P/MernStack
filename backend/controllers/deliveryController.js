// ─── deliveryController.js ────────────────────────────────────────────────────
const { getExpectedDelivery, formatDate } = require('../helpers/deliveryHelper');

// ─── GET DELIVERY DATE ESTIMATE ───────────────────────────────────────────────
/*
  GET /api/delivery?pincode=600001
  Public — called from product page before login
  Also called from checkout for final lock-in

  Response:
  {
    "success": true,
    "deliveryDate": "Mon, 7 April 2025",
    "deliveryDateRaw": "2025-04-07T...",
    "shippingDays": 2,
    "zone": "South India",
    "note": "Order before 5 PM IST — dispatches today.",
    "dispatchDate": "Fri, 4 April 2025"
  }
*/
const getDeliveryEstimate = (req, res) => {
    try {
        const { pincode } = req.query;

        if (!pincode) {
            return res.status(422).json({ success: false, message: 'Pincode is required.' });
        }

        const result = getExpectedDelivery(pincode);

        return res.status(200).json({
            success:        true,
            deliveryDate:   formatDate(result.deliveryDate),
            deliveryDateRaw: result.deliveryDate,
            shippingDays:   result.shippingDays,
            zone:           result.zone,
            note:           result.note,
            dispatchDate:   formatDate(result.dispatchDate),
        });

    } catch (error) {
        return res.status(400).json({ success: false, message: error.message });
    }
};

module.exports = { getDeliveryEstimate };