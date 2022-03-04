const express = require('express');
const router = express.Router();
const controller = require('../controllers/parent.controller');
const { isSchool, isSupperAdmin, auth }= require("../middlewares/userAuth.middleware");
router.get('/', auth,isSchool,controller.getAll);

router.post('/:id',auth,isSchool,controller.getOne);  

router.put('/:id',auth, isSchool,controller.updateAccount);

router.put('/:id/ban',auth,isSchool,controller.ban);
   
router.put('/:id/unban',auth,isSchool,controller.unban);

router.put('/:id/update',auth,isSchool,controller.updateParent);

module.exports = router;