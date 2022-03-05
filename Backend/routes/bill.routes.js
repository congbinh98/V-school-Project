const express = require('express');
const router = express.Router();

const billcontroller = require('../controllers/bill.controller');
const middlewareAuth = require("../middlewares/userAuth.middleware");

// Get all bill
router.get('/',middlewareAuth.auth, middlewareAuth.isSupperAdmin, billcontroller.findAll);

// Get all bill by token
router.get('/getAllByToken',middlewareAuth.auth, billcontroller.findAllByToken);

// Get all bill by parentId
router.get('/parent/:id/getall',middlewareAuth.auth, middlewareAuth.isSchool, billcontroller.findAllByParentId);

// Get one bill by id
router.get('/:id',middlewareAuth.auth, billcontroller.findById);

// Add new bill
router.post('/',middlewareAuth.auth,middlewareAuth.isParent, billcontroller.newBill);
// Add new bill
router.post('/noToken', billcontroller.newBillNoToken);

module.exports = router