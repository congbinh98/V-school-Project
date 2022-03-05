const { getOne, getAll, setStatus, update, resetPassword, getAllNoToken } = require("../controllers/school.controller");
const express = require("express");
const router = express.Router();
const { auth, isSupperAdmin, isSchool } = require('../middlewares/userAuth.middleware');
const { checkForError, checkFormUpdate, checkFormResetPass } = require('../middlewares/school.middleware');
// get all
router.get('/', auth, getAll);
// get one
router.get('/:id', auth, getOne);
// ban/unban
router.put('/setStatus/:id', auth, isSupperAdmin, setStatus);
// update
router.put('/', auth, isSchool, checkFormUpdate, checkForError, update);
// reset password
router.put('/reset-password', auth, isSchool, checkFormResetPass, checkForError, resetPassword);
// get all no token
router.get('/public/noToken', getAllNoToken);

module.exports = router;