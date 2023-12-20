const { Router } = require('express')
const multer = require('multer')
const uuid = require('uuid');
const path = require('path')

const { getRegisterPage, register, getLogin, login, getDashboardMahasiswa, getDaftarJudul, getJudulDiterima, pengajuanDosen, postPengajuanDosen,  getPengajuanJudul, postPengajuanJudul1, editPengajuanJudul1, editPengajuanJudul2, postPengajuanJudul2, getProposalPage, postProposalPage, downloadProposal, updateProposal, editStatusJadwalProposal, downloadProposalRevisiDosen1, postProposalRevisi1Page, downloadProposalRevisi, postProposalRevisi2Page, downloadProposalRevisi2, getHasilSkripsiPage, postHasilPage, downloadHasil, downloadHasilRevisiDosen1, downloadHasilRevisiDosen2, updateHasil, editStatusJadwalHasil, postHasilSkripsiRevisi1Page, downloadHasilSkripsiRevisi1, postHasilSkripsiRevisi2Page, downloadHasilSkripsiRevisi2, getKomprehensifPage, postKomprehensifPage, downloadKomprehensif, updateKomprehensif, editStatusJadwalKomprehensif, postKomprehensifRevisi1Page, downloadKomprehensifRevisi, postKomprehensifRevisi2Page, downloadKomprehensifRevisi2, getPassword, forgotPassword, showResetPasswordForm, resetPassword, profile, profilePost, ubahPassword, passwordPost, logout} = require('../controllers/mahasiswaController')
const { authMahasiswa } = require('../middleware/auth');

const mahasiswaRouter = Router()
mahasiswaRouter.route('/register')
               .get(getRegisterPage)
               .post(register)
mahasiswaRouter.route('/login')
               .get(getLogin)
               .post(login)
mahasiswaRouter.get('/forgot', getPassword);
mahasiswaRouter.post('/forgot', forgotPassword);

mahasiswaRouter.get('/reset/:token', showResetPasswordForm);
mahasiswaRouter.post('/reset/:token', resetPassword);

mahasiswaRouter.get('/dashboard', authMahasiswa, getDashboardMahasiswa)
mahasiswaRouter.get('/daftar-judul', authMahasiswa, getDaftarJudul)
mahasiswaRouter.get('/judul-diterima', authMahasiswa, getJudulDiterima)

mahasiswaRouter.get('/pengajuan-judul', authMahasiswa, getPengajuanJudul )
mahasiswaRouter.post('/pengajuan-judul',authMahasiswa, postPengajuanJudul1)
mahasiswaRouter.post('/pengajuan-judul2',authMahasiswa, postPengajuanJudul2)
mahasiswaRouter.post('/pengajuan-editJudul1',authMahasiswa, editPengajuanJudul1)
mahasiswaRouter.post('/pengajuan-editJudul2',authMahasiswa, editPengajuanJudul2)

mahasiswaRouter.get('/pengajuan-dosen', authMahasiswa, pengajuanDosen)
mahasiswaRouter.post('/pengajuan-dosen', authMahasiswa, postPengajuanDosen)

mahasiswaRouter.get('/proposal', authMahasiswa, getProposalPage)
const uploadProposal = multer({
    storage: multer.diskStorage({
        destination: function (req, file, cb) {
            cb(null, path.join(__dirname, '../upload'))
        },
        filename: function (req, file, cb) {
            cb(null, file.originalname)
        }
    })
})
mahasiswaRouter.post('/proposal', authMahasiswa, uploadProposal.single('proposal'), postProposalPage);
mahasiswaRouter.get('/proposal/download/:id', authMahasiswa, downloadProposal)
mahasiswaRouter.post('/proposal/edit', authMahasiswa, uploadProposal.single('proposal'), updateProposal);
mahasiswaRouter.post('/proposal-status/edit', authMahasiswa, uploadProposal.single('proposal'),editStatusJadwalProposal);
mahasiswaRouter.get('/proposal/download-dosen1/:id', authMahasiswa, downloadProposalRevisiDosen1);
const uploadProposalRevisi1 = multer({
    storage: multer.diskStorage({
        destination: function (req, file, cb) {
            cb(null, path.join(__dirname, '../uploadRevisi1'))
        },
        filename: function (req, file, cb) {
            cb(null, file.originalname)
        }
    })
})
mahasiswaRouter.post('/proposal-revisi', authMahasiswa, uploadProposalRevisi1.single('proposalRevisi1'), postProposalRevisi1Page);
mahasiswaRouter.get('/proposal-revisi/download/:id', authMahasiswa, downloadProposalRevisi)
const uploadProposalRevisi2 = multer({
    storage: multer.diskStorage({
        destination: function (req, file, cb) {
            cb(null, path.join(__dirname, '../uploadRevisi2'))
        },
        filename: function (req, file, cb) {
            cb(null, file.originalname)
        }
    })
})
mahasiswaRouter.post('/proposal-revisi2', authMahasiswa, uploadProposalRevisi2.single('proposalRevisi2'), 
postProposalRevisi2Page);
mahasiswaRouter.get('/proposal-revisi2/download/:id', authMahasiswa, downloadProposalRevisi2)

mahasiswaRouter.get('/hasil-skripsi', authMahasiswa, getHasilSkripsiPage)
const uploadHasil = multer({
    storage: multer.diskStorage({
        destination: function (req, file, cb) {
            cb(null, path.join(__dirname, '../uploadHasil'))
        },
        filename: function (req, file, cb) {
            cb(null, file.originalname)
        }
    })
})
mahasiswaRouter.post('/hasil-skripsi', authMahasiswa, uploadHasil.single('hasilSkripsi'), postHasilPage);
mahasiswaRouter.get('/hasil-skripsi/download/:id', authMahasiswa, downloadHasil)
mahasiswaRouter.post('/hasil-skripsi/edit', authMahasiswa, uploadHasil.single('hasilSkripsi'), updateHasil);
mahasiswaRouter.post('/hasil-skripsi-status/edit', authMahasiswa, uploadHasil.single('hasilSkripsi'),
editStatusJadwalHasil);

mahasiswaRouter.get('/hasil-skripsi-revisiDosen1/download/:id', authMahasiswa, downloadHasilRevisiDosen1);
mahasiswaRouter.get('/hasil-skripsi-revisiDosen2/download/:id', authMahasiswa, downloadHasilRevisiDosen2);

const uploadHasilSkripsiRevisi1 = multer({
    storage: multer.diskStorage({
        destination: function (req, file, cb) {
            cb(null, path.join(__dirname, '../uploadRevisi1'))
        },
        filename: function (req, file, cb) {
            cb(null, file.originalname)
        }
    })
})
mahasiswaRouter.post('/hasil-skripsi-revisi', authMahasiswa, uploadHasilSkripsiRevisi1.single('hasilSkripsiRevisi1'), postHasilSkripsiRevisi1Page);
mahasiswaRouter.get('/hasil-skripsi-revisi/download/:id', authMahasiswa, downloadHasilSkripsiRevisi1)
const uploadHasilSkripsiRevisi2 = multer({
    storage: multer.diskStorage({
        destination: function (req, file, cb) {
            cb(null, path.join(__dirname, '../uploadRevisi2'))
        },
        filename: function (req, file, cb) {
            cb(null, file.originalname)
        }
    })
})
mahasiswaRouter.post('/hasil-skripsi-revisi2', authMahasiswa, uploadHasilSkripsiRevisi2.single('hasilSkripsiRevisi2'), postHasilSkripsiRevisi2Page);
mahasiswaRouter.get('/hasil-skripsi-revisi2/download/:id', authMahasiswa, downloadHasilSkripsiRevisi2)

mahasiswaRouter.get('/komprehensif', authMahasiswa, getKomprehensifPage)
const uploadKomprehensif = multer({
    storage: multer.diskStorage({
        destination: function (req, file, cb) {
            cb(null, path.join(__dirname, '../uploadKomprehensif'))
        },
        filename: function (req, file, cb) {
            cb(null, file.originalname)
        }
    })
})
mahasiswaRouter.post('/komprehensif', authMahasiswa, uploadKomprehensif.single('komprehensif'), postKomprehensifPage);
mahasiswaRouter.get('/komprehensif/download/:id', authMahasiswa, downloadKomprehensif)
mahasiswaRouter.post('/komprehensif/edit', authMahasiswa, uploadKomprehensif.single('komprehensif'), updateKomprehensif);
mahasiswaRouter.post('/komprehensif-status/edit', authMahasiswa, uploadKomprehensif.single('komprehensif'),
editStatusJadwalKomprehensif);
const uploadKomprehensifRevisi1 = multer({
    storage: multer.diskStorage({
        destination: function (req, file, cb) {
            cb(null, path.join(__dirname, '../uploadRevisi1'))
        },
        filename: function (req, file, cb) {
            cb(null, file.originalname)
        }
    })
})
mahasiswaRouter.post('/komprehensif-revisi', authMahasiswa, uploadKomprehensifRevisi1.single('komprehensifRevisi1'), postKomprehensifRevisi1Page);
mahasiswaRouter.get('/komprehensif-revisi/download/:id', authMahasiswa, downloadKomprehensifRevisi)
const uploadKomprehensifRevisi2 = multer({
    storage: multer.diskStorage({
        destination: function (req, file, cb) {
            cb(null, path.join(__dirname, '../uploadRevisi2'))
        },
        filename: function (req, file, cb) {
            cb(null, file.originalname)
        }
    })
})
mahasiswaRouter.post('/komprehensif-revisi2', authMahasiswa, uploadKomprehensifRevisi2.single('komprehensifRevisi2'), 
postKomprehensifRevisi2Page);
mahasiswaRouter.get('/komprehensif-revisi2/download/:id', authMahasiswa, downloadKomprehensifRevisi2)

mahasiswaRouter.get('/:id/profile', authMahasiswa, profile)
mahasiswaRouter.post('/:id/profile', authMahasiswa, profilePost)
mahasiswaRouter.get('/:id/ubah-password', authMahasiswa, ubahPassword)
mahasiswaRouter.post('/:id/ubah-password', authMahasiswa, passwordPost)
mahasiswaRouter.get('/logout', logout)

module.exports = mahasiswaRouter