const express = require('express');
const router = express.Router();
const controller = require('../controllers/superadmin.controller')
const { auth, isSupperAdmin } = require('../middlewares/userAuth.middleware');

router.get('/saveDataParents', auth, isSupperAdmin, controller.saveDataPhuhuynh);
router.get('/saveDataInvoices', auth, isSupperAdmin, controller.saveDataInvoices);
router.get('/saveDataStudents', auth, isSupperAdmin, controller.saveDataStudents);

module.exports = router;
