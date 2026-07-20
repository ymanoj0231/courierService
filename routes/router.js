const express = require('express');
const router = express.Router();
const orderController = require('../controllers/controller.js')

router.post('/api/v1/orders', orderController.placeOrder)
router.get('/api/v1/orders/:orderId/track', orderController.trackOrder)
router.post('/api/v1/orders/:orderId/cancel', orderController.cancelOrder)
router.post('/api/v1/orders/bulk', orderController.bulkOrderUpdate)

module.exports = router;
