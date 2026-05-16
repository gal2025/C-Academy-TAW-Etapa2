// scripts/seedAdmin.js
// Cria o administrador na base de dados (apenas uma vez)
// Uso: node scripts/seedAdmin.js

require("dotenv").config();
const mongoose = require("mongoose");
const User = require("../models/User");

const DB_URI = process.env.MONGO_URI ;

async function seedAdmin() {
  await mongoose.connect(DB_URI);
  console.log("Ligação ao MongoDB estabelecida.");

  // Verifica se já existe um admin — se sim, não cria outro
  const existe = await User.findOne({ isAdmin: true });

  if (existe) {
    console.log(`Admin já existe: ${existe.email}. Nada a fazer.`);
    await mongoose.disconnect();
    return;
  }

  // O hook pre('save') do modelo trata do hash da password automaticamente
  await User.create({
    username: process.env.ADMIN_USERNAME,
    email: process.env.ADMIN_EMAIL,
    password: process.env.ADMIN_PASSWORD,
    nome: process.env.ADMIN_NOME,
    isAdmin: true,
  });

  console.log(
    `✅ Admin criado com sucesso: ${process.env.ADMIN_EMAIL || "admin@cademy.pt"}`,
  );
  await mongoose.disconnect();
}

seedAdmin().catch((err) => {
  console.error("Erro ao criar admin:", err.message);
  process.exit(1);
});
