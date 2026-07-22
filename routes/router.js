const express = require('express');
const router = express.Router();
const orderController = require('../controllers/controller.js')

router.post('/', orderController.placeOrder)
router.get('/:orderId/track', orderController.trackOrder)
router.post('/:orderId/cancel', orderController.cancelOrder)
router.post('/bulk', orderController.bulkOrderCreate)

module.exports = router;
