const { Router } = require('express')

const { TitleSubmission, StudentTitleSubmission, ThesisRegistration, StudentProfile } = require('../models')
const adminRouter = require('./admin')
const dosenRouter = require('./dosen')
const mahasiswaRouter = require('./mahasiswa')
const koordinatorRouter = require('./koordinator')

const router = Router()

router.get('/', async (req, res) => {
    try {
        const token = req.cookies.token

        if (token) return res.redirect('/mahasiswa/dashboard')

        const dataStudentProfile = await StudentProfile.findAll({})
        const dataTitleSubmission = await TitleSubmission.findAll({})
        const dataStudentTitleSubmission = await StudentTitleSubmission.findAll({})
        const dataThesisRegistration = await ThesisRegistration.findAll({})

        res.render('index', {
            title: 'Welcome',
            dataStudentProfile,
            dataTitleSubmission,
            dataStudentTitleSubmission,
            dataThesisRegistration
        })
    } catch (error) {
        res.status(500).json({
            status: 500,
            msg: error.message
        })
    }
})

router.use('/admin', adminRouter)
router.use('/dosen', dosenRouter)
router.use('/mahasiswa', mahasiswaRouter)
router.use('/koordinator-skripsi', koordinatorRouter)

module.exports = router