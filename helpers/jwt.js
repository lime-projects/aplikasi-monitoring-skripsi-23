const jwt = require('jsonwebtoken')
require('dotenv').config()

const secretKey = process.env.JWT_SECRET_KEY

const generateToken = (user) => {
    const { email } = user

    const token = jwt.sign({ email }, secretKey)

    return token
}

const verifyToken = token => {
    const verifiedToken = jwt.verify(token, secretKey)

    return verifiedToken
}

module.exports = {
    generateToken, verifyToken
}