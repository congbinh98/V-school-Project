const express = require('express');
const router = express.Router();
const { auth, isSupperAdmin, isSchool } = require('../middlewares/userAuth.middleware');
const { getOne, saveFromThanhhat, getAll } = require('../controllers/invoice.controller')
const { merchantGetInvoicesSuccess } = require('../controllers/loginThanhat.controller')
    //get one
router.get('/:id', auth, getOne);

// save from thanhat
router.post('/saveInvoices', auth, isSchool, saveFromThanhhat)
    // set pending
    // router.put('/:id/cancel', auth, isSchool, setCancel)

//get all
router.get('/', auth, getAll);

// sdk thanhat
router.get('/banks/nhan1truong', auth, isSchool, merchantGetInvoicesSuccess)
module.exports = router;