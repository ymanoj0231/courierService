const express = require('express');
const router = express.Router();
const orderController = require('../controllers/controller.js')

router.post('/orders', orderController.placeOrder)
router.get('/orders/:orderId/track', orderController.trackOrder)
router.post('/orders/:orderId/cancel', orderController.cancelOrder)
router.post('/orders/bulk', orderController.bulkOrderCreateV2)
router.get('/batch/:batchId', orderController.getOrdersByBatchId)

module.exports = router;
