const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

const JWT_SECRET = process.env.JWT_SECRET || 'a_vossa_chave_secreta_muito_segura'; 
const TOKEN_EXPIRATION = '1h';

exports.register = async (req, res) => {
     try {
          const { username, email, password, nome, telemovel, nif, morada, fotografia } = req.body;
               
          const existingUser = await User.findOne({ $or: [{ username }, { email }] });
               if (existingUser) {
                    return res.status(409).json({
                         success: false, 
                         message: 'Username ou email já registados.'
                      });
               }
 
                   // Criar o novo utilizador
              const newUser = new User({
               username,
               email,
               password, 
               nome,
               telemovel,
               nif,
               morada,
               fotografia,
                // A flag isAdmin é 'false' por defeito (definido no Schema)
                  }); 
                  
                  await newUser.save();
 
                  // Resposta de Sucesso
              res.status(201).json({ 
               success: true, 
               message: 'Utilizador registado com sucesso.',
               user: { username: newUser.username, email: newUser.email, nome: newUser.nome }
          });
                  
     } catch (error) { 
          console.error("Erro no registo:", error);
          res.status(500).json({
               success: false, 
               message: 'Erro interno do servidor durante o registo.'
          });
      }
};

exports.login = async (req, res) => {
    try {
       const { identifier, password } = req.body; 
            
             const user = await User.findOne({ 
            $or: [{ username: identifier }, { email: identifier }] 
       });
 
             if (!user) {
            return res.status(401).json({
                 success: false,
                 message: 'Credenciais inválidas.'
            });
        }
 
            const isMatch = await bcrypt.compare(password, user.password);

            if (!isMatch) {
                return res.status(401).json({
                    success: false, 
                    message: 'Credenciais inválidas.'
                });
            }    
          
      const payload = {
            id: user._id,
            username: user.username,
            isAdmin: user.isAdmin
      };
 
            const token = jwt.sign(payload, JWT_SECRET, { 
            expiresIn: TOKEN_EXPIRATION 
      });
 
            // Resposta de Sucesso
            res.status(200).json({
          success: true,
          message: 'Login bem-sucedido.',
          token, // Este token deverá ser guardado no frontend (localStorage)
           user: { username: user.username, isAdmin: user.isAdmin, nome: user.nome }
      });
 
    } catch (error) {
        console.error("Erro no login:", error);
        res.status(500).json({
             success: false, 
             message: 'Erro interno do servidor durante o login.'
        });
    }
};

exports.getProfile = async (req, res) => {
    try {
        // Obter o token do cabeçalho de Autorização (Bearer Token)
        const authHeader = req.headers.authorization;
        const token = authHeader && authHeader.split(' ')[1];
        
        if (!token) {
            return res.status(401).json({ success: false, message: 'Acesso negado. Token não fornecido.' });
        }

        // Verificar o token
        const decoded = jwt.verify(token, JWT_SECRET);
        
        // Buscar o utilizador na base de dados (excluindo a palavra-passe para maior segurança)
        const user = await User.findById(decoded.id).select('-password');

        if (!user) {
            return res.status(404).json({ success: false, message: 'Utilizador não encontrado.' });
        }

        res.status(200).json({ success: true, user });
    } catch (error) {
        console.error("Erro ao obter perfil:", error);
        res.status(401).json({ success: false, message: 'Token inválido ou expirado.' });
    }
};

exports.getAllUsers = async (req, res) => {
    try {
        const authHeader = req.headers.authorization;
        const token = authHeader && authHeader.split(' ')[1];
        
        if (!token) {
            return res.status(401).json({ success: false, message: 'Acesso negado. Token não fornecido.' });
        }

        // Verificar o token para garantir que a sessão é válida
        jwt.verify(token, JWT_SECRET);
        
        // Buscar todos os utilizadores na base de dados (excluindo a palavra-passe por segurança)
        const users = await User.find().select('-password');
        res.status(200).json({ success: true, users });
    } catch (error) {
        console.error("Erro ao listar utilizadores:", error);
        res.status(500).json({ success: false, message: 'Erro ao carregar a lista de utilizadores.' });
    }
};

exports.getUser = async (req, res) => {
    try {
        const authHeader = req.headers.authorization;
        const token = authHeader && authHeader.split(' ')[1];
        if (!token) return res.status(401).json({ success: false, message: 'Acesso negado. Token não fornecido.' });
        jwt.verify(token, JWT_SECRET);

        const { username } = req.params;
        const user = await User.findOne({ username }).select('-password');
        
        if (!user) {
            return res.status(404).json({ success: false, message: 'Utilizador não encontrado.' });
        }

        res.status(200).json({ success: true, user });
    } catch (error) {
        console.error("Erro ao obter utilizador:", error);
        res.status(500).json({ success: false, message: 'Erro ao carregar utilizador.' });
    }
};

exports.updateUser = async (req, res) => {
    try {
        const authHeader = req.headers.authorization;
        const token = authHeader && authHeader.split(' ')[1];
        if (!token) return res.status(401).json({ success: false, message: 'Acesso negado. Token não fornecido.' });
        jwt.verify(token, JWT_SECRET);

        const { username } = req.params;
        const { email, password, nome, telemovel, nif, morada, fotografia } = req.body;

        const updateData = { email, nome, telemovel, nif, morada };
        
        if (password) {
            updateData.password = password; // Se a password vier preenchida atualizamos
        }
        if (fotografia) {
            updateData.fotografia = fotografia; // Se houver nova fotografia atualizamos
        }

        const user = await User.findOne({ username });
        if (!user) {
          return res.status(404).json({ success: false, message: 'Utilizador não encontrado.' });  
        }
        // Atualizar os campos do utilizador
        Object.assign(user, updateData);
        await user.save();
        res.status(200).json({ success: true, message: 'Utilizador atualizado com sucesso.', user });
        
       
    } catch (error) {
        console.error("Erro ao atualizar utilizador:", error);
        res.status(500).json({ success: false, message: 'Erro ao atualizar o utilizador.' });
    }
};

exports.deleteUser = async (req, res) => {
    try {
        const authHeader = req.headers.authorization;
        const token = authHeader && authHeader.split(' ')[1];
        if (!token) return res.status(401).json({ success: false, message: 'Acesso negado. Token não fornecido.' });
        jwt.verify(token, JWT_SECRET);

        const { username } = req.params;
        const deletedUser = await User.findOneAndDelete({ username });
        
        if (!deletedUser) {
            return res.status(404).json({ success: false, message: 'Utilizador não encontrado.' });
        }

        res.status(200).json({ success: true, message: 'Utilizador removido com sucesso.' });
    } catch (error) {
        console.error("Erro ao remover utilizador:", error);
        res.status(500).json({ success: false, message: 'Erro ao remover o utilizador.' });
    }
};
