const router = require("express").Router();
const authController = require('../controllers/authController');
const { authAndRole } = require("../middleware/auth")
router.post('/login', authController.login);
router.post('/createUser', authController.createUser);
router.post('/user/create', authController.createAccount);
router.put('/user/update', authAndRole(), authController.updateUser);
router.put('/user/password', authController.updatePassword);
router.post('/me', authAndRole(), authController.getMe); //แก้ให้เป็น get
module.exports = router