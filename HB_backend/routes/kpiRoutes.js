const express = require('express');
const router = express.Router();
const kpiController = require('../controllers/kpiController');
const { auth } = require("../middleware/auth")

router.post('/kpi-data/create', auth, kpiController.createdata); //ไม่ใช้แล้ว
router.post('/kpi-data/check-duplicates', auth, kpiController.checkDuplicates);
router.post('/kpi-data', auth, kpiController.createOrUpdate);
router.put('/kpi-data', auth, kpiController.updateKPIData);
router.delete("/kpi-data/:id", auth, kpiController.deleteKPIData);
router.get('/kpi-data', kpiController.getKPIData);
router.get('/kpi-data/chart', kpiController.getData);
router.get('/kpi-data/detail', kpiController.getDetail);
router.get('/kpi-data/summary', kpiController.dataCurrentMonth);

router.post('/kpi-name', auth, kpiController.createKPIName);
router.put('/kpi-name', auth, kpiController.updateKPIName);
router.delete('/kpi-name/:id', auth, kpiController.deleteKPIName);
router.get('/kpi-name', kpiController.getKPIName);

module.exports = router; 

// router.post('/create', auth, kpiController.createdata);
// router.post('/checkDuplicates', auth, kpiController.checkDuplicates);
// router.post('/create-or-update', auth, kpiController.createOrUpdate);
// router.put('/updateKPIData', auth, kpiController.updateKPIData);
// router.delete("/deleteKPIData/:id", auth, kpiController.deleteKPIData);
// router.get('/getData', kpiController.getData);
// router.get('/getDetail', kpiController.getDetail);
// router.get('/dataCurrentMonth', kpiController.dataCurrentMonth);
// router.post('/createKPIName', auth, kpiController.createKPIName);
// router.put('/updateKPIName', auth, kpiController.updateKPIName);
// router.delete('/deleteKPIName/:id', auth, kpiController.deleteKPIName);
// router.get('/getKPIName', kpiController.getKPIName);
// router.get('/getKPIData', kpiController.getKPIData);