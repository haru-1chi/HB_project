// routes/patientRoutes.js
const express = require('express');
const { summary, stateOPDS} = require('../controllers/patientController');

const router = express.Router();

router.get('/summary', summary);
router.get('/departments/state', stateOPDS);
module.exports = router;
