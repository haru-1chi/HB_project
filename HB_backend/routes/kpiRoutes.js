const express = require('express');
const router = express.Router();
const kpiController = require('../controllers/kpiController');
const kpiMedController = require('../controllers/kpiMedController');
const opdController = require('../controllers/opdController');
const qualityController = require('../controllers/qualityController');
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

router.post('/kpi-data-med', authAndRole(1, 2), kpiMedController.createKPIMedError);
router.put('/kpi-data-med', authAndRole(1, 2), kpiMedController.updateKPIMedError);
router.get('/kpi-data-med', kpiMedController.getKPIMedData);
router.delete('/kpi-data-med/:id', authAndRole(1, 2), kpiMedController.deleteKPIMedError);
router.get('/kpi-data-med/chart', kpiMedController.getKPIMedPie);
router.get('/kpi-data-med/stack', kpiMedController.getKPIMedStack);

router.post('/mission-name', authAndRole(1, 2), opdController.missionGroupController.create);
router.put('/mission-name', authAndRole(1, 2), opdController.missionGroupController.update);
router.delete('/mission-name/:id', authAndRole(1, 2), opdController.missionGroupController.delete);
router.get('/mission-name', opdController.missionGroupController.list);

router.post('/work-name', authAndRole(1, 2), opdController.workGroupController.create);
router.put('/work-name', authAndRole(1, 2), opdController.workGroupController.update);
router.delete('/work-name/:id', authAndRole(1, 2), opdController.workGroupController.delete);
router.get('/work-name', opdController.workGroupController.list);

router.post('/opd-name', authAndRole(1, 2), opdController.opdController.create);
router.put('/opd-name', authAndRole(1, 2), opdController.opdController.update);
router.delete('/opd-name/:id', authAndRole(1, 2), opdController.opdController.delete);
router.get('/opd-name', opdController.opdController.list);
router.get('/opd-name-group', opdController.getWorkOPDGroup);

router.post('/kpi-quality', authAndRole(1, 2), qualityController.createKPIDataQuality);
router.get('/kpi-quality', qualityController.getKPIDataQuality);
router.put("/kpi-quality/:id", authAndRole(1, 2), qualityController.updateKPIDataQuality);

// router.put('/opd-name', authAndRole(1, 2), opdController.updateOPDName);
// router.delete('/opd-name/:id', authAndRole(1, 2), opdController.deleteOPDName);

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