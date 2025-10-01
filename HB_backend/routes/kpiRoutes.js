const express = require('express');
const router = express.Router();
const kpiController = require('../controllers/kpiController');
const { auth } = require("../middleware/auth")

router.post('/create', auth, kpiController.createdata);
router.put('/updateKPIData', auth, kpiController.updateKPIData);
router.get('/getData', kpiController.getData);
router.get('/getDetail', kpiController.getDetail);
router.get('/dataCurrentMonth', kpiController.dataCurrentMonth);
router.post('/createKPIName', auth, kpiController.createKPIName);
router.put('/updateKPIName', auth, kpiController.updateKPIName);
router.delete('/deleteKPIName/:id', auth, kpiController.deleteKPIName);
router.get('/getKPIName', kpiController.getKPIName);
router.get('/getKPIData', kpiController.getKPIData);
module.exports = router; 
