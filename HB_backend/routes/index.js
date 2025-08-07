const router = require("express").Router();
const { createUser, login, logout } = require('../controllers/patientController');
const { verifyToken } = require("../../middleware/auth")

// router.post("/users", UserController.createUser)
// router.get("/users", auth, UserController.getUsers)
// router.get("/users/:user_id", auth, UserController.getUser)
// router.put("/users/:user_id", auth, UserController.updateUser)
// router.put("/users/:user_id/change-password", auth, UserController.updateUserPassword)
// router.delete("/users/:user_id", auth, UserController.deleteUser)
router.post('/create-user', verifyToken, verifyAdmin, createUser);

module.exports = router