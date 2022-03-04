const controller = require("../controllers/notification.controller");
const express = require("express");
const router = express.Router();
const { checkFormNotification, checkForError, checkFormSetRead } = require('../middlewares/notification.middleware')
const { auth, isSchool } = require('../middlewares/userAuth.middleware')

// add one
router.post('/', auth, isSchool, checkFormNotification, checkForError, controller.addOne);
// set is read
router.put('/', auth, checkFormSetRead, controller.setIsReadAll);
// router.put('/', checkFormSetRead, checkForError, controller.setIsReadMany);

module.exports = router;