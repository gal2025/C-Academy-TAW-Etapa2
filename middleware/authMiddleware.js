const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET ;

exports.verificarToken = (req, res, next) => {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.status(401).json({ success: false, message: 'Token não fornecido.' });
    try {
        req.utilizador = jwt.verify(token, JWT_SECRET);
        next();
    } catch {
        res.status(401).json({ success: false, message: 'Token inválido ou expirado.' });
    }
};

exports.verificarAdmin = (req, res, next) => {
    if (!req.utilizador || !req.utilizador.isAdmin) {
        return res.status(403).json({ success: false, message: 'Acesso negado. Apenas administradores.' });
    }
    next();
};