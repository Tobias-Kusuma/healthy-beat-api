const mongoose = require('mongoose');

// membuat fungsi koneksi dengan db test_api_mongoose
async function connectToDatabase(uri) {
    try {
        await mongoose.connect(uri);
        console.log(`Connected with ${uri}`);
    } catch (error) {
        console.error('Failed to connect with error:', error);
    }

    mongoose.connection.on('error', err => {
        console.error(err);
    });
}

module.exports = { connectToDatabase };