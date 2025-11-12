const express = require('express');
const router = express.Router();
const kpiController = require('../controllers/kpiController');
const kpiMedController = require('../controllers/kpiMedController');
const { authAndRole } = require("../middleware/auth")

router.post('/kpi-data/create', authAndRole(1, 2), kpiController.createdata); //ไม่ใช้แล้ว
router.post('/kpi-data/check-duplicates', authAndRole(1, 2), kpiController.checkDuplicates);
router.post('/kpi-data', authAndRole(1, 2), kpiController.createOrUpdate);
router.put('/kpi-data', authAndRole(1, 2), kpiController.updateKPIData);
router.delete("/kpi-data/:id", authAndRole(1, 2), kpiController.deleteKPIData);
router.get('/kpi-data', kpiController.getKPIData);
router.get('/kpi-data/chart', kpiController.getData);
router.get('/kpi-data/detail', kpiController.getDetail);
router.get('/kpi-data/summary', kpiController.dataCurrentMonth);

router.post('/kpi-name', authAndRole(1, 2), kpiController.createKPIName);
router.put('/kpi-name', authAndRole(1, 2), kpiController.updateKPIName);
router.delete('/kpi-name/:id', authAndRole(1, 2), kpiController.deleteKPIName);
router.get('/kpi-name', kpiController.getKPIName);

router.post('/kpi-name-med', authAndRole(1, 2), kpiMedController.createKPINameMed);
router.put('/kpi-name-med', authAndRole(1, 2), kpiMedController.updateKPINameMed);
router.get('/kpi-name-med', kpiMedController.getKPIMedName);
router.delete('/kpi-name-med/:id', authAndRole(1, 2), kpiMedController.deleteKPINameMed);
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

// ไว้จัดการสิทธิ์ที่มากขึ้นแบบไม่ hard code
// const { auth } = require("../middleware/auth");
// const { checkPermission } = require("../middleware/checkPermission");

// router.post("/kpi-data", auth, checkPermission("kpi_form"), kpiController.createOrUpdate);
// router.put("/kpi-data", auth, checkPermission("kpi_form"), kpiController.updateKPIData);
// router.delete("/kpi-data/:id", auth, checkPermission("kpi_form"), kpiController.deleteKPIData);