## Design

-Each courier services works independently.
-Integrated urbaneBolt and mock courier services.
-Each request is independent of courier specific payload.

## Add a new courier service.
1. Add a new folder under services folder. Expose createOrder, trackOrder, updateOrder functions.
2. import service folder to /services/courierPartnerHandler.js file 
3. Add courier_partner identifier in helpers.js to make it available at all places.
4. Add switch case for new courier_partner under buildServicePayload function.

NOTE : urbaneBolt courier service is listed as "courier1" under services folder due to some errors in my system.

## Bulk order update

# current implementation
- No backgoround processing. It works as a multiple create order. But client will recieve once all the orders are processed.

# Improvements
- Return batchId for the bulk order EP.
- Process the orders in the back ground (Business logic remains same).
- Expose a new EP to client to track the batchId.


