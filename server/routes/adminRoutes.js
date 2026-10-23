const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const auth = require('../middleware/auth');

// All admin routes require: logged in + role === 'admin'
router.use(auth.protect, auth.restrictTo('admin'));

// ── Stats & Overview ──
router.get('/stats',    adminController.getStats);
router.get('/activity', adminController.getRecentActivity);

// ── Resource Lists ──
router.get('/users',    adminController.getAllUsers);
router.get('/projects', adminController.getAllProjects);
router.get('/escrows',  adminController.getAllEscrows);
router.get('/reviews',  adminController.getAllReviews);

// ── Disputes ──
router.get('/disputes',         adminController.getAllDisputes);
router.patch('/disputes/:id',   adminController.resolveDispute);

module.exports = router;
