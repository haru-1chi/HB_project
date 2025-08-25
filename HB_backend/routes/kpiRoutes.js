const express = require('express');
const router = express.Router();
const kpiController = require('../controllers/kpiController');

router.post('/create', kpiController.createdata);
router.get('/getData', kpiController.getData);
router.get('/getDetail', kpiController.getDetail);
router.post('/createKPIName', kpiController.createKPIName);
router.put('/updateKPIName', kpiController.updateKPIName);
router.delete('/deleteKPIName/:id', kpiController.deleteKPIName);
router.get('/getKPIName', kpiController.getKPIName);
module.exports = router; 
