const bcrypt = require('bcrypt')
require('dotenv').config()

const saltRounds = +process.env.SALTROUNDS

const encryptPass = (pass) => {
    return bcrypt.hashSync(pass, saltRounds)
}

const decryptPass = (pass, hash) => {
    return bcrypt.compareSync(pass, hash)
}

module.exports = {
    encryptPass, decryptPass
}