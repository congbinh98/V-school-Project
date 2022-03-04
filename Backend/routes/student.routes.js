const express = require('express');
const { auth, isSchool } = require('../middlewares/userAuth.middleware')
const router = express.Router();
var multer = require("multer");
var upload = multer({ dest: "./public/uploads/" });
const { getOne, getAllByToken, saveStudents, getOneNoToken, getAllNoToken } = require('../controllers/student.controller')

//get all by phone
router.get('/', auth, getAllByToken)

// get one
router.get('/:id', auth, getOne);

//get by bhyt no token
router.get('/noToken/:bhyt', getOneNoToken)

//get by schoolid, classcode, name
router.get('/public/noToken', getAllNoToken)

// create many student
// router.post('/',upload.single("students"), auth, isSchool, createManyStudent);

// save students
router.post('/saveStudents', auth, isSchool, saveStudents)

module.exports = router;
