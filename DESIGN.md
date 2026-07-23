## Features
- Each courier services works independently.
- Integrated urbaneBolt and mock courier services.
- Each request is independent of courier specific payload.

# database design

## orders collection
- stores request body from client along with batchId, awbNumber and courierOrderId from the from the psrtner's create order API.
- batchId can be used to improve bulk update furthur.
- currently urbaneBolt manifest api is returning the same orderId fron request. Hence storing orderId as courierOrderId.
-For every every order create or update, timestamps are updated.

## trackingHistory collection.
- Every action on an order will be recorded in this collection along with raw response from courier partner.
- this collection can be used to get the tracking information of the order. Currently relying on Tracking api from urbaneBolt.
- couldn't find any API to update the status of the order. As of now, able to achieve "shipment Manifested" and "Cancelled" status only from the given urbaneBolt APIs.


# Bulk order update

## current implementation
- No backgoround processing. It works as a create order with multiple orders. But client will recieve once all the orders are processed.

## Improvements
- Return batchId for the bulk order EP.
- Process the orders in the back ground (Business logic remains same).
- Expose a new EP to client to track the batchId and results on orders.



