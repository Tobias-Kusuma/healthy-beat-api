const mongoose = require('mongoose');
const { Schema } = mongoose;
const bcrypt = require('bcryptjs');

// user schema and model
const regSchema = new Schema({
    username: String,
    password: String,
    fullname: String,
    birthday: String,
    address: String,
    city: String,
    telpnum: String,
    doctname: String,
    doctmail: String,
    history: [
      {
        date: String,
        time: String,
        result: String,
        image: String,
        pdf: String
      },
    ],
  });

regSchema.pre('save', async function (next) {
    // mengharuskan password untuk dihash
    if (!this.isModified('password')) return next();
    // username tidak boleh sama
    const existUsername = await User.findOne({ username: this.username });
    if (existUsername) {
        const error = new Error('Username has been registered.');
        return next({ success: false, message: 'Username has been registered.', error, code:409 });
    }
    // enkripsi password
    try {
        const salt = await bcrypt.genSalt(10);
        const hashedPass = await bcrypt.hash(this.password, salt);
        this.password = hashedPass;
        next();
    } catch (error) {
        return next({ success: false, message: 'Failed to save user.', error, code:500 });
    }
});

regSchema.methods.addHistory = function (newHistory) {
  this.history.push(newHistory);
  return this.save();
};

regSchema.methods.getHistoryByDateTime = function (date, time) {
  return this.history.find(entry => entry.date === date && entry.time === time);
};


const User = mongoose.model("users", regSchema);

module.exports = { User };