# courierService
Multi-Courier Integration Platform


## prerequisites
bash

## installation
1. clone the repository
```bash
git clone git@github.com:ymanoj0231/courierService.git
```

2. navigate to repository
```bash
cd courierService
```

3. install dependencies
```bash
npm install
```

4. Run the following command start the backend-application on PORT 4000
```bash
node app.js
```

## Add a new courier service.
1. Add a new folder under services folder. Expose createOrder, trackOrder, updateOrder functions.
2. import service folder to /services/courierPartnerHandler.js file 
3. Add courier_partner identifier in helpers.js to make it available at all places.
4. Add switch case for new courier_partner under buildServicePayload function.

NOTE : urbaneBolt courier service is listed as "courier1" under services folder due to some errors in my system.
