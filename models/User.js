const mongoose = require('mongoose'); 
const bcrypt = require('bcrypt'); 

const UserSchema = new mongoose.Schema({ 
    username: {
          type: String,
          required: true, 
          unique: true,   
          trim: true            
     },
  email: {
          type: String,
          required: true,
          unique: true,
          trim: true,
          lowercase: true 
    },
  password: {
         type: String,
         required: true
  },
    nome: {
         type: String,
         required: true
  },


    telemovel: String,
  nif: String,
  morada: String,
  fotografia: String,
    
    isAdmin: {
         type: Boolean,
         default: false 
     }
 }, {
     timestamps: true   
 });


UserSchema.pre('save', async function() {
    if (!this.isModified('password')) return;
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

UserSchema.methods.compararPassword = async function(palavraPasseCandidata) {
    return await bcrypt.compare(palavraPasseCandidata, this.password);
};

const User = mongoose.model('User', UserSchema); 

module.exports = User; 