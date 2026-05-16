const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const {
  verificarToken,
  verificarAdmin,
} = require("../middleware/authMiddleware");
const { body, validationResult } = require("express-validator");

const verificarValidacao = (req, res, next) => {
  const erros = validationResult(req);
  if (!erros.isEmpty()) {
    return res.status(400).json({ success: false, errors: erros.array() });
  }
  next();
};

const validarRegisto = [
  body("username")
    .trim()
    .isLength({ min: 3, max: 20 })
    .withMessage("Username deve ter entre 3 e 20 caracteres.")
    .matches(/^[a-zA-Z0-9_.-]+$/)
    .withMessage("Username apenas pode conter letras, números, . _ -"),
  body("email")
    .trim()
    .isEmail()
    .withMessage("Email inválido.")
    .normalizeEmail(),
  body("password")
    .isLength({ min: 6 })
    .withMessage("Password deve ter pelo menos 6 caracteres."),
  body("nome")
    .trim()
    .isLength({ min: 3 })
    .withMessage("Nome deve ter pelo menos 3 caracteres.")
    .escape(),
  body("telemovel")
    .matches(/^\d{9}$/)
    .withMessage("Telemóvel deve ter exatamente 9 dígitos."),
  body("nif")
    .matches(/^\d{9}$/)
    .withMessage("NIF deve ter exatamente 9 dígitos."),
  body("morada")
    .trim()
    .notEmpty()
    .withMessage("Morada é obrigatória.")
    .escape(),
];

const validarLogin = [
  body("identifier")
    .trim()
    .notEmpty()
    .withMessage("Username ou email é obrigatório."),
  body("password").notEmpty().withMessage("Password é obrigatória."),
];

router.post("/register", validarRegisto, verificarValidacao, authController.register);
router.post("/login", validarLogin, verificarValidacao, authController.login);
router.get("/profile", verificarToken, authController.getProfile);
router.get("/users", verificarToken, verificarAdmin, authController.getAllUsers);
router.get("/users/:username", verificarToken, authController.getUser);
router.put("/users/:username", verificarToken, authController.updateUser);
router.delete("/users/:username", verificarToken, verificarAdmin, authController.deleteUser);

module.exports = router;