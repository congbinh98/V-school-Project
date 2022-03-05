const express = require('express');
const { auth, checkEmailUpdate, checkUpdateProfile } = require("../middlewares/userAuth.middleware");
const { login, updateProfile } = require('../controllers/auth.controller');

const router = express.Router();

router.post('/login', login);

// update profile
router.post('/updateProfile', auth, checkEmailUpdate, checkUpdateProfile, updateProfile)
module.exports = router;