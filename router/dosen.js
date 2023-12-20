const { Router } = require('express')
const multer = require('multer')
const path = require('path')
const fs = require('fs');
const async = require('async'); 

const { /* getRegisterPage, register, */ getLogin, login, getDashboardDosen, getPengajuanJudul, editPengajuanJudul, getJudulDiterima, getBimbinganProposal, downloadProposal, addRevisiProposal,addRevisiProposalPb1, addRevisiProposalPb2,  downloadProposalRevisi1, downloadProposalRevisi2, downloadProposalRevisiDosen1, downloadProposalRevisiDosen2, getPermintaanBimbingan, editPermintaanBimbingan, getBimbinganHasilSkripsi, downloadHasil, addRevisiHasil, addRevisiHasilPb1, addRevisiHasilPb2, downloadHasilSkripsiRevisi1, downloadHasilSkripsiRevisi2, downloadHasilSkripsiRevisiDosen1, downloadHasilSkripsiRevisiDosen2, getBimbinganKomprehensif, downloadKomprehensif, addRevisiKomprehensif, addRevisiKomprehensifPb1, addRevisiKomprehensifPb2,  downloadKomprehensifRevisi1, downloadKomprehensifRevisi2, downloadKomprehensifRevisiDosen1, downloadKomprehensifRevisiDosen2, getJadwalProposal, getJadwalHasilSkripsi, getJadwalKomprehensif, 
getRiwayatProposal, getRiwayatHasilSkripsi, getRiwayatKomprehensif, profile, profilePost, ubahPassword, passwordPost, logout, exportTableToClipboardPengajuanJudul, exportTableToCSVPengajuanJudul, exportTableToExcelPengajuanJudul, exportTableToPDFPengajuanJudul, exportTableToClipboardJudulDiterima, exportTableToCSVJudulDiterima, exportTableToExcelJudulDiterima, exportTableToPDFJudulDiterima} = require('../controllers/dosenController')
const { authDosen } = require('../middleware/auth')

const dosenRouter = Router()

dosenRouter.route('/login')
            .get(getLogin)
            .post(login)
dosenRouter.get('/dashboard', authDosen, getDashboardDosen)
dosenRouter.get('/pengajuan-judul', authDosen, getPengajuanJudul)
dosenRouter.route('/pengajuan-judul/edit/:id')
           .post(authDosen, editPengajuanJudul)
dosenRouter.get('/judul-diterima', authDosen, getJudulDiterima)

dosenRouter.post('/copy-pengajuanJudul', authDosen, exportTableToClipboardPengajuanJudul);
dosenRouter.post('/csv-pengajuanJudul', authDosen, exportTableToCSVPengajuanJudul);
dosenRouter.post('/excel-pengajuanJudul', authDosen, exportTableToExcelPengajuanJudul);
dosenRouter.post('/pdf-pengajuanJudul', authDosen, exportTableToPDFPengajuanJudul);

dosenRouter.post('/copy-judulDiterima', authDosen, exportTableToClipboardJudulDiterima);
dosenRouter.post('/csv-JudulDiterima', authDosen, exportTableToCSVJudulDiterima);
dosenRouter.post('/excel-JudulDiterima', authDosen, exportTableToExcelJudulDiterima);
dosenRouter.post('/pdf-JudulDiterima', authDosen, exportTableToPDFJudulDiterima);

dosenRouter.get('/permintaan-bimbingan', authDosen, getPermintaanBimbingan)
dosenRouter.route('/permintaan-bimbingan/edit/:id')
           .post(authDosen, editPermintaanBimbingan)
dosenRouter.get('/bimbingan/proposal', authDosen, getBimbinganProposal)
dosenRouter.get('/bimbingan/proposal/download/:id', authDosen, downloadProposal)

const uploadProposalRevisiDosen1 = multer({
  storage: multer.diskStorage({
      destination: function (req, file, cb) {
          cb(null, path.join(__dirname, '../uploadProposalRevisiDosen1'))
      },
      filename: function (req, file, cb) {
          cb(null, file.originalname)
      }
  })
})

dosenRouter.post('/bimbingan/proposal-revisiPb1/tambah/:id', authDosen, uploadProposalRevisiDosen1.single
('proposalRevisiDosen1'), addRevisiProposalPb1)


const uploadProposalRevisiDosen2 = multer({
storage: multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, path.join(__dirname, '../uploadProposalRevisiDosen2'))
    },
    filename: function (req, file, cb) {
        cb(null, file.originalname)
    }
})
})
dosenRouter.post('/bimbingan/proposal-revisiPb2/tambah/:id', authDosen, uploadProposalRevisiDosen2.single
('proposalRevisiDosen2'), addRevisiProposalPb2)

dosenRouter.post('/bimbingan/proposal-revisi/tambah/:id', authDosen, addRevisiProposal)
dosenRouter.get('/proposal-revisi1/download/:id', authDosen, downloadProposalRevisi1)
dosenRouter.get('/proposal-revisi2/download/:id', authDosen, downloadProposalRevisi2)

dosenRouter.get('/proposal-revisiDosen1/download/:id', authDosen, downloadProposalRevisiDosen1)
dosenRouter.get('/proposal-revisiDosen2/download/:id', authDosen, downloadProposalRevisiDosen2)

dosenRouter.get('/bimbingan/hasil-skripsi', authDosen, getBimbinganHasilSkripsi)
dosenRouter.get('/bimbingan/hasil-skripsi/download/:id', authDosen, downloadHasil)
const uploadHasilSkripsiRevisiDosen1 = multer({
    storage: multer.diskStorage({
        destination: function (req, file, cb) {
            cb(null, path.join(__dirname, '../uploadHasilRevisiDosen1'))
        },
        filename: function (req, file, cb) {
            cb(null, file.originalname)
        }
    })
})

dosenRouter.post('/bimbingan/hasil-skripsi-revisi/tambah/:id', authDosen, addRevisiHasil)
dosenRouter.post('/bimbingan/hasil-skripsi-revisiPb1/tambah/:id', authDosen, uploadHasilSkripsiRevisiDosen1.single
('hasilSkripsiRevisiDosen1'), addRevisiHasilPb1)


const uploadHasilSkripsiRevisiDosen2 = multer({
  storage: multer.diskStorage({
      destination: function (req, file, cb) {
          cb(null, path.join(__dirname, '../uploadHasilRevisiDosen2'))
      },
      filename: function (req, file, cb) {
          cb(null, file.originalname)
      }
  })
})
dosenRouter.post('/bimbingan/hasil-skripsi-revisiPb2/tambah/:id', authDosen, uploadHasilSkripsiRevisiDosen2.single
('hasilSkripsiRevisiDosen2'), addRevisiHasilPb2)

dosenRouter.get('/hasil-skripsi-revisi1/download/:id', authDosen, downloadHasilSkripsiRevisi1)
dosenRouter.get('/hasil-skripsi-revisi2/download/:id', authDosen, downloadHasilSkripsiRevisi2)

dosenRouter.get('/hasil-skripsi-revisiDosen1/download/:id', authDosen, downloadHasilSkripsiRevisiDosen1)
dosenRouter.get('/hasil-skripsi-revisiDosen2/download/:id', authDosen, downloadHasilSkripsiRevisiDosen2)

dosenRouter.get('/bimbingan/komprehensif', authDosen, getBimbinganKomprehensif)
dosenRouter.get('/bimbingan/komprehensif/download/:id', authDosen, downloadKomprehensif)
const uploadKomprehensifRevisiDosen1= multer({
    storage: multer.diskStorage({
        destination: function (req, file, cb) {
            cb(null, path.join(__dirname, '../uploadKomprehensifRevisiDosen1'))
        },
        filename: function (req, file, cb) {
            cb(null, file.originalname)
        }
    })
})

dosenRouter.post('/bimbingan/komprehensif-revisi/tambah/:id', authDosen, addRevisiKomprehensif)
dosenRouter.post('/bimbingan/komprehensif-revisiPb1/tambah/:id', authDosen, uploadKomprehensifRevisiDosen1.single('komprehensifRevisiDosen1'), addRevisiKomprehensifPb1)

const uploadKomprehensifRevisiDosen2= multer({
  storage: multer.diskStorage({
      destination: function (req, file, cb) {
          cb(null, path.join(__dirname, '../uploadKomprehensifRevisiDosen2'))
      },
      filename: function (req, file, cb) {
          cb(null, file.originalname)
      }
  })
})

dosenRouter.post('/bimbingan/komprehensif-revisiPb2/tambah/:id', authDosen, uploadKomprehensifRevisiDosen2.single
('komprehensifRevisiDosen2'), addRevisiKomprehensifPb2)

dosenRouter.get('/komprehensif-revisi1/download/:id', authDosen, downloadKomprehensifRevisi1)
dosenRouter.get('/komprehensif-revisi2/download/:id', authDosen, downloadKomprehensifRevisi2)

dosenRouter.get('/komprehensif-revisiDosen1/download/:id', authDosen, downloadKomprehensifRevisiDosen1)
dosenRouter.get('/komprehensif-revisiDosen2/download/:id', authDosen, downloadKomprehensifRevisiDosen2)

dosenRouter.get('/jadwal/proposal', authDosen, getJadwalProposal)
dosenRouter.get('/jadwal/hasil-skripsi', authDosen, getJadwalHasilSkripsi)
dosenRouter.get('/jadwal/komprehensif', authDosen, getJadwalKomprehensif)

dosenRouter.get('/riwayat/proposal', authDosen, getRiwayatProposal)
dosenRouter.get('/riwayat/hasil-skripsi', authDosen, getRiwayatHasilSkripsi)
dosenRouter.get('/riwayat/komprehensif', authDosen, getRiwayatKomprehensif)

dosenRouter.get('/:id/profile', authDosen, profile)
dosenRouter.post('/:id/profile', authDosen, profilePost)
dosenRouter.get('/:id/ubah-password', authDosen, ubahPassword)
dosenRouter.post('/:id/ubah-password', authDosen, passwordPost)
dosenRouter.get('/logout', logout)

module.exports = dosenRouter