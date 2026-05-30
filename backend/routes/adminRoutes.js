const express = require('express');
const router = express.Router();
const adminController = require('../controllers/AdminController');
const authenticate = require('../middleware/auth');

router.use(authenticate);

router.get('/dashboard', adminController.getDashboardData);
router.get('/customers', adminController.getCustomers);
router.post('/customers', adminController.createCustomer);
router.delete('/customers/:id', adminController.deleteCustomer);
router.get('/customers/:id', adminController.getCustomerDetails);
router.post('/customers/:id/toggle-subscription', adminController.toggleSubscription);
router.post('/customers/:id/renew', adminController.renewSubscription);

module.exports = router;
