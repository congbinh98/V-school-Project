const express = require('express');
const router = express.Router();

const transactioncontroller = require('../controllers/transaction.controller');
const middlewareAuth = require("../middlewares/userAuth.middleware");

// Get one transaction
router.get('/:id', middlewareAuth.auth, middlewareAuth.isSupperAdmin, transactioncontroller.getOne);

// Get all transactions
router.get('/', middlewareAuth.auth, middlewareAuth.isSupperAdmin, transactioncontroller.getAll);

module.exports = router