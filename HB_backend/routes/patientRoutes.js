// routes/patientRoutes.js
const express = require('express');
const { fetchPatientState,summary, stateOPDS} = require('../controllers/patientController');

const router = express.Router();

router.get('/patient-state', fetchPatientState);
router.get('/summary', summary);
router.get('/departments/state', stateOPDS);
module.exports = router;
