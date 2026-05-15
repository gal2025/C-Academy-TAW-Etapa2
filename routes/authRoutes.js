const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { verificarToken, verificarAdmin } = require('../middleware/authMiddleware');

router.post('/register', authController.register);
router.post('/login', authController.login);
router.get('/profile', verificarToken, authController.getProfile);
router.get('/users', verificarToken, verificarAdmin, authController.getAllUsers);
router.get('/users/:username', verificarToken, authController.getUser);
router.put('/users/:username', verificarToken, authController.updateUser);
router.delete('/users/:username', verificarToken, verificarAdmin, authController.deleteUser);

module.exports = router;