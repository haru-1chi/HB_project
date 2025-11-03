const router = require("express").Router();
const authController = require('../controllers/authController');
const { auth } = require("../middleware/auth")
router.post('/login', authController.login);
router.post('/createUser', authController.createUser);
router.post('/user/create', authController.createAccount);
router.put('/user/update', auth, authController.updateUser);
router.put('/user/password', authController.updatePassword);
router.post('/me', auth, authController.getMe); //แก้ให้เป็น get
module.exports = router