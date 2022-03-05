const express = require('express');
const router = express.Router();

const paymentSDKcontroller = require('../controllers/paymentSDK.controller');

// verify data
router.post('/verifyData', paymentSDKcontroller.verifyData);

// result data
router.post('/getResult', paymentSDKcontroller.getResult);

// query transaction
router.post('/queryTrans', paymentSDKcontroller.queryTrans);

module.exports = router
