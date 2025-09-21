const router = require("express").Router();
const authController = require('../controllers/authController');
const { auth } = require("../middleware/auth")
router.post('/login', authController.login);
router.post('/createUser', authController.createUser);
router.post('/me', auth, authController.getMe);
module.exports = router