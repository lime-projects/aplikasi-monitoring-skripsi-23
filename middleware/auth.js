const { verifyToken } = require("../helpers/jwt")

const authAdmin = (req, res, next) => {
    const token = req.cookies.token

    if (!token) return res.status(401).redirect('/admin/login')

    req.userToken = verifyToken(token)

    next()
}

const authDosen = (req, res, next) => {
    const token = req.cookies.token

    if (!token) return res.status(401).redirect('/dosen/login')

    req.userToken = verifyToken(token)

    next()
}

const authMahasiswa = (req, res, next) => {
    const token = req.cookies.token

    if (!token) return res.status(401).redirect('/mahasiswa/login')

    req.userToken = verifyToken(token)

    next()
}


const authKoor= (req, res, next) => {
    const token = req.cookies.token

    if (!token) return res.status(401).redirect('/mahasiswa/login')

    req.userToken = verifyToken(token)

    next()
}

  
module.exports = {
    authAdmin, authDosen, authMahasiswa, authKoor
}