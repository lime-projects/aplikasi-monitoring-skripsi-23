const { Router } = require('express')

const { authKoor } = require('../middleware/auth')
const { getLogin, login, getDashboardKoor, getPembagianDosen, editPembagianDosen, ubahPembagianDosen, getPermintaanBimbingan, editPermintaanBimbingan, getDaftarDosen, addDosenToDaftar, deleteDaftarDosen, getDaftarDosen2, addDosenToDaftar2, deleteDaftarDosen2, getDaftarDosen3, addDosenToDaftar3, deleteDaftarDosen3, getPengajuanJudul, editPengajuanJudul, deletePengajuanJudul, getJudulDiterima, getProposal, downloadProposal, editProposal, deleteProposal, downloadProposalRevisi1, downloadProposalRevisi2, getProposalMasuk, editProposalMasuk, getProposalTerjadwal, editProposalTerjadwal, editProposalTerjadwalSelesai, getProposalSelesai, editProposalSelesai, getHasilSkripsi, downloadHasilSkripsi, editHasilSkripsi, deleteHasilSkripsi, downloadHasilSkripsiRevisi1, downloadHasilSkripsiRevisi2, getHasilMasuk, editHasilMasuk, getHasilTerjadwal, editHasilTerjadwal, editHasilTerjadwalSelesai, getHasilSelesai, editHasilSelesai, getKomprehensif, downloadKomprehensif, editKomprehensif, deleteKomprehensif, downloadKomprehensifRevisi1, downloadKomprehensifRevisi2, getKomprehensifMasuk, editKomprehensifMasuk, getKomprehensifTerjadwal, editKomprehensifTerjadwal, editKomprehensifTerjadwalSelesai, getKomprehensifSelesai, editKomprehensifSelesai, profile, profilePost, ubahPassword, passwordPost, logout,  exportTableToClipboardPengajuanJudul, exportTableToCSVPengajuanJudul,  exportTableToExcelPengajuanJudul, exportTableToPDFPengajuanJudul, exportTableToClipboardJudulDiterima, exportTableToCSVJudulDiterima, exportTableToExcelJudulDiterima, exportTableToPDFJudulDiterima, exportTableToClipboardPembagianDosen, exportTableToCSVPembagianDosen, exportTableToExcelPembagianDosen, exportTableToPDFPembagianDosen, exportTableToClipboardDaftarDosen1, exportTableToCSVDaftarDosen1, exportTableToExcelDaftarDosen1, exportTableToPDFDaftarDosen1, exportTableToClipboardDaftarDosen2, exportTableToCSVDaftarDosen2, exportTableToExcelDaftarDosen2, exportTableToPDFDaftarDosen2, exportTableToClipboardDaftarDosen3, exportTableToCSVDaftarDosen3, exportTableToExcelDaftarDosen3, exportTableToPDFDaftarDosen3, exportTableToClipboardPermintaanBimbingan, exportTableToCSVPermintaanBimbingan, exportTableToExcelPermintaanBimbingan, exportTableToPDFPermintaanBimbingan, exportTableToClipboardProposal, exportTableToCSVProposal, exportTableToExcelProposal, exportTableToPDFProposal,  } = require('../controllers/koordinatorController')

const {exportTableToClipboardHasil, exportTableToCSVHasil, exportTableToExcelHasil, exportTableToPDFHasil, exportTableToClipboardKomprehensif, exportTableToCSVKomprehensif, exportTableToExcelKomprehensif, exportTableToPDFKomprehensif, exportTableToClipboardProposalMasuk, exportTableToCSVProposalMasuk, exportTableToExcelProposalMasuk, exportTableToPDFProposalMasuk, exportTableToClipboardProposalTerjadwal, exportTableToCSVProposalTerjadwal, exportTableToExcelProposalTerjadwal, exportTableToPDFProposalTerjadwal, exportTableToClipboardProposalSelesai, exportTableToCSVProposalSelesai, exportTableToExcelProposalSelesai, exportTableToPDFProposalSelesai, exportTableToClipboardHasilMasuk, exportTableToCSVHasilMasuk, exportTableToExcelHasilMasuk, exportTableToPDFHasilMasuk, exportTableToClipboardHasilTerjadwal, exportTableToCSVHasilTerjadwal, exportTableToExcelHasilTerjadwal, exportTableToPDFHasilTerjadwal, exportTableToClipboardHasilSelesai, exportTableToCSVHasilSelesai, exportTableToExcelHasilSelesai, exportTableToPDFHasilSelesai, exportTableToClipboardKomprehensifMasuk, exportTableToCSVKomprehensifMasuk, exportTableToExcelKomprehensifMasuk, exportTableToPDFKomprehensifMasuk, exportTableToClipboardKomprehensifTerjadwal, exportTableToCSVKomprehensifTerjadwal,
exportTableToExcelKomprehensifTerjadwal, exportTableToPDFKomprehensifTerjadwal, 
exportTableToClipboardKomprehensifSelesai, exportTableToCSVKomprehensifSelesai, 
exportTableToExcelKomprehensifSelesai, exportTableToPDFKomprehensifSelesai, downloadHasilSkripsiRevisiDosen1, downloadHasilSkripsiRevisiDosen2, downloadProposalRevisiDosen1, downloadProposalRevisiDosen2 } = require('../controllers/koordinatorController') 
 
const koordinatorRouter = Router()

koordinatorRouter.route('/login')
                 .get(getLogin)
                 .post(login)
koordinatorRouter.get('/dashboard', getDashboardKoor)

koordinatorRouter.get('/pembagian-dosen', authKoor, getPembagianDosen)
koordinatorRouter.route('/pembagian-dosen/edit/:id')
                 .post(authKoor, editPembagianDosen)
koordinatorRouter.post('/pembagian-dosen/editDosen/:id', authKoor, ubahPembagianDosen)
koordinatorRouter.get('/permintaan-bimbingan', authKoor, getPermintaanBimbingan)
koordinatorRouter.route('/permintaan-bimbingan/edit/:id')
                 .post(authKoor, editPermintaanBimbingan)

koordinatorRouter.post('/copy-permintaanBimbingan', authKoor, exportTableToClipboardPermintaanBimbingan);
koordinatorRouter.post('/csv-permintaanBimbingan', authKoor, exportTableToCSVPermintaanBimbingan);
koordinatorRouter.post('/excel-permintaanBimbingan', authKoor, exportTableToExcelPermintaanBimbingan);
koordinatorRouter.post('/pdf-permintaanBimbingan', authKoor, exportTableToPDFPermintaanBimbingan);

koordinatorRouter.post('/copy-pembagianDosen', authKoor, exportTableToClipboardPembagianDosen);
koordinatorRouter.post('/csv-pembagianDosen', authKoor, exportTableToCSVPembagianDosen);
koordinatorRouter.post('/excel-pembagianDosen', authKoor, exportTableToExcelPembagianDosen);
koordinatorRouter.post('/pdf-pembagianDosen', authKoor, exportTableToPDFPembagianDosen);

koordinatorRouter.get('/daftar-dosen', authKoor, getDaftarDosen);
koordinatorRouter.post('/daftar-dosen/tambah', authKoor, addDosenToDaftar);
koordinatorRouter.get('/daftar-dosen/delete/:id', authKoor, deleteDaftarDosen)

koordinatorRouter.post('/copy-daftarDosen1', authKoor, exportTableToClipboardDaftarDosen1);
koordinatorRouter.post('/csv-daftarDosen1', authKoor, exportTableToCSVDaftarDosen1);
koordinatorRouter.post('/excel-daftarDosen1', authKoor, exportTableToExcelDaftarDosen1);
koordinatorRouter.post('/pdf-daftarDosen1', authKoor, exportTableToPDFDaftarDosen1);

koordinatorRouter.get('/daftar-dosen2', authKoor, getDaftarDosen2);
koordinatorRouter.post('/daftar-dosen2/tambah', authKoor, addDosenToDaftar2);
koordinatorRouter.get('/daftar-dosen2/delete/:id', authKoor, deleteDaftarDosen2)

koordinatorRouter.post('/copy-daftarDosen2', authKoor, exportTableToClipboardDaftarDosen2);
koordinatorRouter.post('/csv-daftarDosen2', authKoor, exportTableToCSVDaftarDosen2);
koordinatorRouter.post('/excel-daftarDosen2', authKoor, exportTableToExcelDaftarDosen2);
koordinatorRouter.post('/pdf-daftarDosen2', authKoor, exportTableToPDFDaftarDosen2);

koordinatorRouter.get('/daftar-dosen3', authKoor, getDaftarDosen3);
koordinatorRouter.post('/daftar-dosen3/tambah', authKoor, addDosenToDaftar3);
koordinatorRouter.get('/daftar-dosen3/delete/:id', authKoor, deleteDaftarDosen3)

koordinatorRouter.post('/copy-daftarDosen3', authKoor, exportTableToClipboardDaftarDosen3);
koordinatorRouter.post('/csv-daftarDosen3', authKoor, exportTableToCSVDaftarDosen3);
koordinatorRouter.post('/excel-daftarDosen3', authKoor, exportTableToExcelDaftarDosen3);
koordinatorRouter.post('/pdf-daftarDosen3', authKoor, exportTableToPDFDaftarDosen3);

koordinatorRouter.get('/pengajuan-judul', authKoor, getPengajuanJudul)
koordinatorRouter.route('/pengajuan-judul/edit/:id')
                 .post(authKoor, editPengajuanJudul)
koordinatorRouter.get('/pengajuan-judul/delete/:id', authKoor, deletePengajuanJudul)
koordinatorRouter.get('/judul-diterima', authKoor, getJudulDiterima)

koordinatorRouter.post('/copy-pengajuanJudul', authKoor, exportTableToClipboardPengajuanJudul);
koordinatorRouter.post('/csv-pengajuanJudul', authKoor, exportTableToCSVPengajuanJudul);
koordinatorRouter.post('/excel-pengajuanJudul', authKoor, exportTableToExcelPengajuanJudul);
koordinatorRouter.post('/pdf-pengajuanJudul', authKoor, exportTableToPDFPengajuanJudul);

koordinatorRouter.post('/copy-judulDiterima', authKoor, exportTableToClipboardJudulDiterima);
koordinatorRouter.post('/csv-JudulDiterima', authKoor, exportTableToCSVJudulDiterima);
koordinatorRouter.post('/excel-JudulDiterima', authKoor, exportTableToExcelJudulDiterima);
koordinatorRouter.post('/pdf-JudulDiterima', authKoor, exportTableToPDFJudulDiterima);

koordinatorRouter.get('/proposal', authKoor, getProposal)
koordinatorRouter.get('/proposal/download/:id', authKoor, downloadProposal)
koordinatorRouter.route('/proposal/edit/:id')
                 .post(authKoor, editProposal)
koordinatorRouter.get('/proposal/delete/:id', authKoor, deleteProposal)
koordinatorRouter.get('/proposal-revisi1/download/:id', authKoor, downloadProposalRevisi1)
koordinatorRouter.get('/proposal-revisi2/download/:id', authKoor, downloadProposalRevisi2)
koordinatorRouter.get('/proposal-revisiDosen1/download/:id', authKoor, downloadProposalRevisiDosen1)
koordinatorRouter.get('/proposal-revisiDosen2/download/:id', authKoor, downloadProposalRevisiDosen2)


koordinatorRouter.post('/copy-proposal', authKoor, exportTableToClipboardProposal);
koordinatorRouter.post('/csv-proposal', authKoor, exportTableToCSVProposal);
koordinatorRouter.post('/excel-proposal', authKoor, exportTableToExcelProposal);
koordinatorRouter.post('/pdf-proposal', authKoor, exportTableToPDFProposal);

koordinatorRouter.get('/proposal-masuk', authKoor, getProposalMasuk)
koordinatorRouter.route('/proposal-masuk/edit/:id')
                 .post(authKoor, editProposalMasuk)

koordinatorRouter.post('/copy-proposalMasuk', authKoor, exportTableToClipboardProposalMasuk);
koordinatorRouter.post('/csv-proposalMasuk', authKoor, exportTableToCSVProposalMasuk);
koordinatorRouter.post('/excel-proposalMasuk', authKoor, exportTableToExcelProposalMasuk);
koordinatorRouter.post('/pdf-proposalMasuk', authKoor, exportTableToPDFProposalMasuk);

koordinatorRouter.get('/proposal-terjadwal', authKoor, getProposalTerjadwal)
koordinatorRouter.route('/proposal-terjadwal/edit/:id')
                 .post(authKoor, editProposalTerjadwal)
koordinatorRouter.route('/proposal-terjadwal-selesai/edit/:id')
                 .post(authKoor, editProposalTerjadwalSelesai)

koordinatorRouter.post('/copy-proposalTerjadwal', authKoor, exportTableToClipboardProposalTerjadwal);
koordinatorRouter.post('/csv-proposalTerjadwal', authKoor, exportTableToCSVProposalTerjadwal);
koordinatorRouter.post('/excel-proposalTerjadwal', authKoor, exportTableToExcelProposalTerjadwal);
koordinatorRouter.post('/pdf-proposalTerjadwal', authKoor, exportTableToPDFProposalTerjadwal);

koordinatorRouter.get('/proposal-selesai', authKoor, getProposalSelesai)
koordinatorRouter.route('/proposal-selesai/edit/:id')
                 .post(authKoor, editProposalSelesai)

koordinatorRouter.post('/copy-proposalSelesai', authKoor, exportTableToClipboardProposalSelesai);
koordinatorRouter.post('/csv-proposalSelesai', authKoor, exportTableToCSVProposalSelesai);
koordinatorRouter.post('/excel-proposalSelesai', authKoor, exportTableToExcelProposalSelesai);
koordinatorRouter.post('/pdf-proposalSelesai', authKoor, exportTableToPDFProposalSelesai);

koordinatorRouter.get('/hasil-skripsi', authKoor, getHasilSkripsi)
koordinatorRouter.get('/hasil-skripsi/download/:id', authKoor, downloadHasilSkripsi)
koordinatorRouter.route('/hasil-skripsi/edit/:id')
                 .post(authKoor, editHasilSkripsi)
koordinatorRouter.get('/hasil-skripsi/delete/:id', authKoor, deleteHasilSkripsi)
koordinatorRouter.get('/hasil-skripsi-revisi1/download/:id', authKoor, downloadHasilSkripsiRevisi1)
koordinatorRouter.get('/hasil-skripsi-revisi2/download/:id', authKoor, downloadHasilSkripsiRevisi2)
koordinatorRouter.get('/hasil-skripsi-revisiDosen1/download/:id', authKoor, downloadHasilSkripsiRevisiDosen1)
koordinatorRouter.get('/hasil-skripsi-revisiDosen2/download/:id', authKoor, downloadHasilSkripsiRevisiDosen2)

koordinatorRouter.post('/copy-hasil', authKoor, exportTableToClipboardHasil);
koordinatorRouter.post('/csv-hasil', authKoor, exportTableToCSVHasil);
koordinatorRouter.post('/excel-hasil', authKoor, exportTableToExcelHasil);
koordinatorRouter.post('/pdf-hasil', authKoor, exportTableToPDFHasil);

koordinatorRouter.get('/hasil-masuk', authKoor, getHasilMasuk)
koordinatorRouter.route('/hasil-masuk/edit/:id')
                 .post(authKoor, editHasilMasuk)

koordinatorRouter.post('/copy-hasilMasuk', authKoor, exportTableToClipboardHasilMasuk);
koordinatorRouter.post('/csv-hasilMasuk', authKoor, exportTableToCSVHasilMasuk);
koordinatorRouter.post('/excel-hasilMasuk', authKoor, exportTableToExcelHasilMasuk);
koordinatorRouter.post('/pdf-hasilMasuk', authKoor, exportTableToPDFHasilMasuk);
           
koordinatorRouter.get('/hasil-terjadwal', authKoor, getHasilTerjadwal)
koordinatorRouter.route('/hasil-terjadwal/edit/:id')
                 .post(authKoor, editHasilTerjadwal)
koordinatorRouter.route('/hasil-terjadwal-selesai/edit/:id')
                 .post(authKoor, editHasilTerjadwalSelesai)

koordinatorRouter.post('/copy-hasilTerjadwal', authKoor, exportTableToClipboardHasilTerjadwal);
koordinatorRouter.post('/csv-hasilTerjadwal', authKoor, exportTableToCSVHasilTerjadwal);
koordinatorRouter.post('/excel-hasilTerjadwal', authKoor, exportTableToExcelHasilTerjadwal);
koordinatorRouter.post('/pdf-hasilTerjadwal', authKoor, exportTableToPDFHasilTerjadwal);
           
koordinatorRouter.get('/hasil-selesai', authKoor, getHasilSelesai)
koordinatorRouter.route('/hasil-selesai/edit/:id')
                 .post(authKoor, editHasilSelesai)

koordinatorRouter.post('/copy-hasilSelesai', authKoor, exportTableToClipboardHasilSelesai);
koordinatorRouter.post('/csv-hasilSelesai', authKoor, exportTableToCSVHasilSelesai);
koordinatorRouter.post('/excel-hasilSelesai', authKoor, exportTableToExcelHasilSelesai);
koordinatorRouter.post('/pdf-hasilSelesai', authKoor, exportTableToPDFHasilSelesai);

koordinatorRouter.get('/komprehensif', authKoor, getKomprehensif)
koordinatorRouter.get('/komprehensif/download/:id', authKoor, downloadKomprehensif)
koordinatorRouter.route('/komprehensif/edit/:id')
                  .post(authKoor, editKomprehensif)
koordinatorRouter.get('/komprehensif/delete/:id', authKoor, deleteKomprehensif)
koordinatorRouter.get('/komprehensif-revisi1/download/:id', authKoor, downloadKomprehensifRevisi1)
koordinatorRouter.get('/komprehensif-revisi2/download/:id', authKoor, downloadKomprehensifRevisi2)

koordinatorRouter.post('/copy-komprehensif', authKoor, exportTableToClipboardKomprehensif);
koordinatorRouter.post('/csv-komprehensif', authKoor, exportTableToCSVKomprehensif);
koordinatorRouter.post('/excel-komprehensif', authKoor, exportTableToExcelKomprehensif);
koordinatorRouter.post('/pdf-komprehensif', authKoor, exportTableToPDFKomprehensif);

koordinatorRouter.get('/komprehensif-masuk', authKoor, getKomprehensifMasuk)
koordinatorRouter.route('/komprehensif-masuk/edit/:id')
           .post(authKoor, editKomprehensifMasuk)

koordinatorRouter.post('/copy-komprehensifMasuk', authKoor, exportTableToClipboardKomprehensifMasuk);
koordinatorRouter.post('/csv-komprehensifMasuk', authKoor, exportTableToCSVKomprehensifMasuk);
koordinatorRouter.post('/excel-komprehensifMasuk', authKoor, exportTableToExcelKomprehensifMasuk);
koordinatorRouter.post('/pdf-komprehensifMasuk', authKoor, exportTableToPDFKomprehensifMasuk);
           
koordinatorRouter.get('/komprehensif-terjadwal', authKoor, getKomprehensifTerjadwal)
koordinatorRouter.route('/komprehensif-terjadwal/edit/:id')
                 .post(authKoor, editKomprehensifTerjadwal)
koordinatorRouter.route('/komprehensif-terjadwal-selesai/edit/:id')
                 .post(authKoor, editKomprehensifTerjadwalSelesai)

koordinatorRouter.post('/copy-komprehensifTerjadwal', authKoor, exportTableToClipboardKomprehensifTerjadwal);
koordinatorRouter.post('/csv-komprehensifTerjadwal', authKoor, exportTableToCSVKomprehensifTerjadwal);
koordinatorRouter.post('/excel-komprehensifTerjadwal', authKoor, exportTableToExcelKomprehensifTerjadwal);
koordinatorRouter.post('/pdf-komprehensifTerjadwal', authKoor, exportTableToPDFKomprehensifTerjadwal);
           
koordinatorRouter.get('/komprehensif-selesai', authKoor, getKomprehensifSelesai)
koordinatorRouter.route('/komprehensif-selesai/edit/:id')
                 .post(authKoor, editKomprehensifSelesai)

koordinatorRouter.post('/copy-komprehensifSelesai', authKoor, exportTableToClipboardKomprehensifSelesai);
koordinatorRouter.post('/csv-komprehensifSelesai', authKoor, exportTableToCSVKomprehensifSelesai);
koordinatorRouter.post('/excel-komprehensifSelesai', authKoor, exportTableToExcelKomprehensifSelesai);
koordinatorRouter.post('/pdf-komprehensifSelesai', authKoor, exportTableToPDFKomprehensifSelesai);

koordinatorRouter.get('/:id/profile', authKoor, profile)
koordinatorRouter.post('/:id/profile', authKoor, profilePost)
koordinatorRouter.get('/:id/ubah-password', authKoor, ubahPassword)
koordinatorRouter.post('/:id/ubah-password', authKoor, passwordPost)
koordinatorRouter.get('/logout', logout)

module.exports = koordinatorRouter