const jwt = require('jsonwebtoken');
const { secretKey } = require('./jwt-config');

function generateToken(payload) {
    return jwt.sign(payload, secretKey, { expiresIn: '1h' });
}

function verifyToken(token) {
    try {
        const decoded = jwt.verify(token, secretKey);
        return decoded;
    } catch (err) {
        return null;
    }    
}

module.exports = { generateToken, verifyToken }