const { Router } = require('express')
const multer = require('multer')
const uuid = require('uuid');
const { authAdmin} = require('../middleware/auth')
const path = require('path');
const fs = require('fs');

const { registerAPI, getLogin, login, getDashboardAdmin, getThesisRegistrations, addThesis, editThesis, deleteThesis, editStatus, getMahasiswa, addMahasiswa, importMahasiswa, editMahasiswa, deleteMahasiswa, displayStudentPhoto, getDosen, addDosen, editDosen, deleteDosen, getKoorSkripsi, addKoor, editKoor, deleteKoor, getDaftarDosen, addDosenToDaftar, deleteDaftarDosen, getDaftarDosen2, addDosenToDaftar2, deleteDaftarDosen2, getDaftarDosen3, addDosenToDaftar3, deleteDaftarDosen3, getPembagianDosen, addPembagianDosen,  editPembagianDosen, ubahPembagianDosen, getPermintaanBimbingan, editPermintaanBimbingan, getPengajuanJudul, editPengajuanJudul, deletePengajuanJudul, getJudulDiterima, getProposal, downloadProposal, editProposal, deleteProposal, downloadProposalRevisi1, downloadProposalRevisi2, getProposalMasuk, editProposalMasuk,  getProposalTerjadwal, editProposalTerjadwal, editProposalTerjadwalSelesai, getProposalSelesai, editProposalSelesai, getHasilSkripsi, downloadHasilSkripsi, editHasilSkripsi, deleteHasilSkripsi, downloadHasilSkripsiRevisi1, downloadHasilSkripsiRevisi2, getHasilMasuk, editHasilMasuk, getHasilTerjadwal, editHasilTerjadwal, editHasilTerjadwalSelesai, getHasilSelesai, editHasilSelesai, getKomprehensif, downloadKomprehensif, editKomprehensif, deleteKomprehensif, downloadKomprehensifRevisi1,downloadKomprehensifRevisi2, getKomprehensifMasuk, editKomprehensifMasuk, getKomprehensifTerjadwal, editKomprehensifTerjadwal, editKomprehensifTerjadwalSelesai, getKomprehensifSelesai, editKomprehensifSelesai,  profile, profilePost, ubahPassword, passwordPost, logout, exportTableToClipboard, exportTableToCSV, exportTableToExcel, exportTableToPDF, printTable, exportTableToClipboardMahasiswa, exportTableToCSVMahasiswa, exportTableToExcelMahasiswa, exportTableToPDFMahasiswa, printTableMahasiswa, exportTableToClipboardKoor, exportTableToCSVKoor, exportTableToExcelKoor, exportTableToPDFKoor, exportTableToClipboardDaftarDosen1, exportTableToCSVDaftarDosen1, exportTableToExcelDaftarDosen1, exportTableToPDFDaftarDosen1, exportTableToClipboardDaftarDosen2, exportTableToCSVDaftarDosen2, exportTableToExcelDaftarDosen2, exportTableToPDFDaftarDosen2, exportTableToClipboardDaftarDosen3, exportTableToCSVDaftarDosen3, exportTableToExcelDaftarDosen3, exportTableToPDFDaftarDosen3, exportTableToClipboardPengajuanJudul, exportTableToCSVPengajuanJudul, exportTableToExcelPengajuanJudul, exportTableToPDFPengajuanJudul} = require('../controllers/adminController');

const {exportTableToClipboardJudulDiterima, exportTableToCSVJudulDiterima, exportTableToExcelJudulDiterima, exportTableToPDFJudulDiterima, exportTableToClipboardPembagianDosen, exportTableToCSVPembagianDosen, exportTableToExcelPembagianDosen, exportTableToPDFPembagianDosen, exportTableToClipboardPermintaanBimbingan, exportTableToCSVPermintaanBimbingan, exportTableToExcelPermintaanBimbingan, exportTableToPDFPermintaanBimbingan, exportTableToClipboardProposal, exportTableToCSVProposal, exportTableToExcelProposal, exportTableToPDFProposal,exportTableToClipboardProposalMasuk, exportTableToCSVProposalMasuk, exportTableToExcelProposalMasuk, exportTableToPDFProposalMasuk, exportTableToClipboardProposalTerjadwal, exportTableToCSVProposalTerjadwal, exportTableToExcelProposalTerjadwal, exportTableToPDFProposalTerjadwal, exportTableToClipboardProposalSelesai, exportTableToCSVProposalSelesai, exportTableToExcelProposalSelesai, exportTableToPDFProposalSelesai, exportTableToClipboardHasil, exportTableToCSVHasil, exportTableToExcelHasil, exportTableToPDFHasil, exportTableToClipboardHasilMasuk, exportTableToCSVHasilMasuk, exportTableToExcelHasilMasuk, exportTableToPDFHasilMasuk, exportTableToClipboardHasilTerjadwal, exportTableToCSVHasilTerjadwal, exportTableToExcelHasilTerjadwal, exportTableToPDFHasilTerjadwal, exportTableToClipboardHasilSelesai, exportTableToCSVHasilSelesai, exportTableToExcelHasilSelesai, exportTableToPDFHasilSelesai,  exportTableToClipboardKomprehensif, exportTableToCSVKomprehensif, exportTableToExcelKomprehensif, exportTableToPDFKomprehensif, exportTableToClipboardKomprehensifMasuk, exportTableToCSVKomprehensifMasuk, exportTableToExcelKomprehensifMasuk, exportTableToPDFKomprehensifMasuk, exportTableToClipboardKomprehensifTerjadwal, exportTableToCSVKomprehensifTerjadwal, exportTableToExcelKomprehensifTerjadwal, exportTableToPDFKomprehensifTerjadwal, exportTableToClipboardKomprehensifSelesai, exportTableToCSVKomprehensifSelesai, exportTableToExcelKomprehensifSelesai, exportTableToPDFKomprehensifSelesai, downloadHasilSkripsiRevisiDosen1, downloadHasilSkripsiRevisiDosen2, downloadKomprehensifRevisiDosen1, downloadKomprehensifRevisiDosen2, downloadProposalRevisiDosen1, downloadProposalRevisiDosen2} = require('../controllers/adminController');
 
const adminRouter = Router()

adminRouter.post('/api/register', registerAPI)
adminRouter.route('/login')
            .get(getLogin)
            .post(login)
adminRouter.get('/dashboard', authAdmin, getDashboardAdmin)

adminRouter.get('/list-tahun-akademik', authAdmin, getThesisRegistrations)
adminRouter.route('/list-tahun-akademik/tambah')
            .post(authAdmin, addThesis)
adminRouter.route('/list-tahun-akademik/edit/:id')
            .post(authAdmin, editThesis)
adminRouter.post('/list-tahun-akademik/edit-status/:id', editStatus)
adminRouter.get('/list-tahun-akademik/delete/:id', authAdmin, deleteThesis)

adminRouter.get('/mahasiswa', authAdmin, getMahasiswa)
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
      const studentId = req.params.id;
      const path = `uploads/${studentId}`;
      fs.mkdirSync(path, { recursive: true });
      cb(null, path); 
  },
  filename: (req, file, cb) => {
      const extension = file.originalname.split('.').pop();
      cb(null, file.originalname); 
  }
});
const upload = multer({ storage: storage });
adminRouter.route('/mahasiswa/tambah')
           .post(authAdmin, upload.single('foto'), addMahasiswa);
adminRouter.route('/mahasiswa/edit/:id')
           .post(authAdmin, upload.single('foto'), editMahasiswa);
adminRouter.get('/mahasiswa/delete/:id', authAdmin, deleteMahasiswa)
adminRouter.get('/mahasiswa/:id/displayPhoto', authAdmin, displayStudentPhoto)

const storageImport = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploadsImport');
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname);
  }
});
const uploadImport = multer({ storage: storageImport });
// adminRouter.route('/mahasiswa/import')
          //  .post(authAdmin, uploadImport.single('excelFile'), importMahasiswa); 

adminRouter.post('/copy-mahasiswa', authAdmin, exportTableToClipboardMahasiswa);
adminRouter.post('/csv-mahasiswa', authAdmin, exportTableToCSVMahasiswa);
adminRouter.post('/excel-mahasiswa', authAdmin, exportTableToExcelMahasiswa);
adminRouter.post('/pdf-mahasiswa', authAdmin, exportTableToPDFMahasiswa);
adminRouter.post('/print-mahasiswa', authAdmin, printTableMahasiswa);

adminRouter.get('/dosen', authAdmin, getDosen)
adminRouter.route('/dosen/tambah')
            .post(authAdmin, addDosen)
adminRouter.route('/dosen/edit/:id')
            .post(authAdmin, editDosen)
adminRouter.get('/dosen/delete/:id', authAdmin, deleteDosen)


adminRouter.post('/copy', authAdmin, exportTableToClipboard);
adminRouter.post('/csv', authAdmin, exportTableToCSV);
adminRouter.post('/excel', authAdmin, exportTableToExcel);
adminRouter.post('/pdf', authAdmin, exportTableToPDF);
adminRouter.post('/print', authAdmin, printTable);

adminRouter.get('/koordinator-skripsi', authAdmin, getKoorSkripsi)
adminRouter.route('/koordinator-skripsi/tambah')
            .post(authAdmin, addKoor)
adminRouter.route('/koordinator-skripsi/edit/:id')
            .post(authAdmin, editKoor)
adminRouter.get('/koordinator-skripsi/delete/:id', authAdmin, deleteKoor)

adminRouter.post('/copy-koor', authAdmin, exportTableToClipboardKoor);
adminRouter.post('/csv-koor', authAdmin, exportTableToCSVKoor);
adminRouter.post('/excel-koor', authAdmin, exportTableToExcelKoor);
adminRouter.post('/pdf-koor', authAdmin, exportTableToPDFKoor);
//adminRouter.post('/print-koor', authAdmin, printTableKoor);

adminRouter.get('/pengajuan-judul', authAdmin, getPengajuanJudul)
adminRouter.route('/pengajuan-judul/edit/:id')
            .post(authAdmin, editPengajuanJudul)
adminRouter.get('/pengajuan-judul/delete/:id', authAdmin, deletePengajuanJudul)
adminRouter.get('/judul-diterima', authAdmin, getJudulDiterima)

adminRouter.post('/copy-pengajuanJudul', authAdmin, exportTableToClipboardPengajuanJudul);
adminRouter.post('/csv-pengajuanJudul', authAdmin, exportTableToCSVPengajuanJudul);
adminRouter.post('/excel-pengajuanJudul', authAdmin, exportTableToExcelPengajuanJudul);
adminRouter.post('/pdf-pengajuanJudul', authAdmin, exportTableToPDFPengajuanJudul);

adminRouter.post('/copy-judulDiterima', authAdmin, exportTableToClipboardJudulDiterima);
adminRouter.post('/csv-JudulDiterima', authAdmin, exportTableToCSVJudulDiterima);
adminRouter.post('/excel-JudulDiterima', authAdmin, exportTableToExcelJudulDiterima);
adminRouter.post('/pdf-JudulDiterima', authAdmin, exportTableToPDFJudulDiterima);

adminRouter.get('/pembagian-dosen', authAdmin, getPembagianDosen)
adminRouter.route('/pembagian-dosen/tambah')
            .post(authAdmin, addPembagianDosen)
adminRouter.route('/pembagian-dosen/edit/:id')
            .post(authAdmin, editPembagianDosen)
adminRouter.post('/pembagian-dosen/editDosen/:id', authAdmin, ubahPembagianDosen)
adminRouter.get('/permintaan-bimbingan', authAdmin, getPermintaanBimbingan)
adminRouter.route('/permintaan-bimbingan/edit/:id')
           .post(authAdmin, editPermintaanBimbingan)

adminRouter.post('/copy-pembagianDosen', authAdmin, exportTableToClipboardPembagianDosen);
adminRouter.post('/csv-pembagianDosen', authAdmin, exportTableToCSVPembagianDosen);
adminRouter.post('/excel-pembagianDosen', authAdmin, exportTableToExcelPembagianDosen);
adminRouter.post('/pdf-pembagianDosen', authAdmin, exportTableToPDFPembagianDosen);

adminRouter.post('/copy-permintaanBimbingan', authAdmin, exportTableToClipboardPermintaanBimbingan);
adminRouter.post('/csv-permintaanBimbingan', authAdmin, exportTableToCSVPermintaanBimbingan);
adminRouter.post('/excel-permintaanBimbingan', authAdmin, exportTableToExcelPermintaanBimbingan);
adminRouter.post('/pdf-permintaanBimbingan', authAdmin, exportTableToPDFPermintaanBimbingan);

adminRouter.get('/daftar-dosen', authAdmin, getDaftarDosen);
adminRouter.post('/daftar-dosen/tambah', authAdmin, addDosenToDaftar);
adminRouter.get('/daftar-dosen/delete/:id', authAdmin, deleteDaftarDosen)

adminRouter.post('/copy-daftarDosen1', authAdmin, exportTableToClipboardDaftarDosen1);
adminRouter.post('/csv-daftarDosen1', authAdmin, exportTableToCSVDaftarDosen1);
adminRouter.post('/excel-daftarDosen1', authAdmin, exportTableToExcelDaftarDosen1);
adminRouter.post('/pdf-daftarDosen1', authAdmin, exportTableToPDFDaftarDosen1);
// adminRouter.post('/print-daftarDosen1', authAdmin, printTableMahasiswa);

adminRouter.get('/daftar-dosen2', authAdmin, getDaftarDosen2);
adminRouter.post('/daftar-dosen2/tambah', authAdmin, addDosenToDaftar2);
adminRouter.get('/daftar-dosen2/delete/:id', authAdmin, deleteDaftarDosen2)

adminRouter.post('/copy-daftarDosen2', authAdmin, exportTableToClipboardDaftarDosen2);
adminRouter.post('/csv-daftarDosen2', authAdmin, exportTableToCSVDaftarDosen2);
adminRouter.post('/excel-daftarDosen2', authAdmin, exportTableToExcelDaftarDosen2);
adminRouter.post('/pdf-daftarDosen2', authAdmin, exportTableToPDFDaftarDosen2);

adminRouter.get('/daftar-dosen3', authAdmin, getDaftarDosen3);
adminRouter.post('/daftar-dosen3/tambah', authAdmin, addDosenToDaftar3);
adminRouter.get('/daftar-dosen3/delete/:id', authAdmin, deleteDaftarDosen3)

adminRouter.post('/copy-daftarDosen3', authAdmin, exportTableToClipboardDaftarDosen3);
adminRouter.post('/csv-daftarDosen3', authAdmin, exportTableToCSVDaftarDosen3);
adminRouter.post('/excel-daftarDosen3', authAdmin, exportTableToExcelDaftarDosen3);
adminRouter.post('/pdf-daftarDosen3', authAdmin, exportTableToPDFDaftarDosen3);

adminRouter.get('/proposal', authAdmin, getProposal)
adminRouter.get('/proposal/download/:id', authAdmin, downloadProposal)
adminRouter.route('/proposal/edit/:id')
           .post(authAdmin, editProposal)
adminRouter.get('/proposal/delete/:id', authAdmin, deleteProposal)
adminRouter.get('/proposal-revisi1/download/:id', authAdmin, downloadProposalRevisi1)
adminRouter.get('/proposal-revisi2/download/:id', authAdmin, downloadProposalRevisi2)
adminRouter.get('/proposal-revisiDosen1/download/:id', authAdmin, downloadProposalRevisiDosen1)
adminRouter.get('/proposal-revisiDosen2/download/:id', authAdmin, downloadProposalRevisiDosen2)

adminRouter.post('/copy-proposal', authAdmin, exportTableToClipboardProposal);
adminRouter.post('/csv-proposal', authAdmin, exportTableToCSVProposal);
adminRouter.post('/excel-proposal', authAdmin, exportTableToExcelProposal);
adminRouter.post('/pdf-proposal', authAdmin, exportTableToPDFProposal);

adminRouter.get('/proposal-masuk', authAdmin, getProposalMasuk)
adminRouter.route('/proposal-masuk/edit/:id')
           .post(authAdmin, editProposalMasuk)

adminRouter.post('/copy-proposalMasuk', authAdmin, exportTableToClipboardProposalMasuk);
adminRouter.post('/csv-proposalMasuk', authAdmin, exportTableToCSVProposalMasuk);
adminRouter.post('/excel-proposalMasuk', authAdmin, exportTableToExcelProposalMasuk);
adminRouter.post('/pdf-proposalMasuk', authAdmin, exportTableToPDFProposalMasuk);

adminRouter.get('/proposal-terjadwal', authAdmin, getProposalTerjadwal)
adminRouter.route('/proposal-terjadwal/edit/:id')
           .post(authAdmin, editProposalTerjadwal)
adminRouter.route('/proposal-terjadwal-selesai/edit/:id')
           .post(authAdmin, editProposalTerjadwalSelesai)

adminRouter.post('/copy-proposalTerjadwal', authAdmin, exportTableToClipboardProposalTerjadwal);
adminRouter.post('/csv-proposalTerjadwal', authAdmin, exportTableToCSVProposalTerjadwal); //100
adminRouter.post('/excel-proposalTerjadwal', authAdmin, exportTableToExcelProposalTerjadwal);
adminRouter.post('/pdf-proposalTerjadwal', authAdmin, exportTableToPDFProposalTerjadwal);

adminRouter.get('/proposal-selesai', authAdmin, getProposalSelesai)
adminRouter.route('/proposal-selesai/edit/:id')
           .post(authAdmin, editProposalSelesai)

adminRouter.post('/copy-proposalSelesai', authAdmin, exportTableToClipboardProposalSelesai);
adminRouter.post('/csv-proposalSelesai', authAdmin, exportTableToCSVProposalSelesai);
adminRouter.post('/excel-proposalSelesai', authAdmin, exportTableToExcelProposalSelesai);
adminRouter.post('/pdf-proposalSelesai', authAdmin, exportTableToPDFProposalSelesai);

adminRouter.get('/hasil-skripsi', authAdmin, getHasilSkripsi)
adminRouter.get('/hasil-skripsi/download/:id', authAdmin, downloadHasilSkripsi)
adminRouter.route('/hasil-skripsi/edit/:id')
           .post(authAdmin, editHasilSkripsi)
adminRouter.get('/hasil-skripsi/delete/:id', authAdmin, deleteHasilSkripsi)
adminRouter.get('/hasil-revisi1/download/:id', authAdmin, downloadHasilSkripsiRevisi1)
adminRouter.get('/hasil-revisi2/download/:id', authAdmin, downloadHasilSkripsiRevisi2)
adminRouter.get('/hasil-skripsi-revisiDosen1/download/:id', authAdmin, downloadHasilSkripsiRevisiDosen1)
adminRouter.get('/hasil-skripsi-revisiDosen2/download/:id', authAdmin, downloadHasilSkripsiRevisiDosen2)

adminRouter.post('/copy-hasil', authAdmin, exportTableToClipboardHasil);
adminRouter.post('/csv-hasil', authAdmin, exportTableToCSVHasil);
adminRouter.post('/excel-hasil', authAdmin, exportTableToExcelHasil);
adminRouter.post('/pdf-hasil', authAdmin, exportTableToPDFHasil);

adminRouter.get('/hasil-masuk', authAdmin, getHasilMasuk)
adminRouter.route('/hasil-masuk/edit/:id')
           .post(authAdmin, editHasilMasuk)

adminRouter.post('/copy-hasilMasuk', authAdmin, exportTableToClipboardHasilMasuk);
adminRouter.post('/csv-hasilMasuk', authAdmin, exportTableToCSVHasilMasuk);
adminRouter.post('/excel-hasilMasuk', authAdmin, exportTableToExcelHasilMasuk);
adminRouter.post('/pdf-hasilMasuk', authAdmin, exportTableToPDFHasilMasuk);
           
adminRouter.get('/hasil-terjadwal', authAdmin, getHasilTerjadwal)
adminRouter.route('/hasil-terjadwal/edit/:id')
           .post(authAdmin, editHasilTerjadwal)
adminRouter.route('/hasil-terjadwal-selesai/edit/:id')
           .post(authAdmin, editHasilTerjadwalSelesai)

adminRouter.post('/copy-hasilTerjadwal', authAdmin, exportTableToClipboardHasilTerjadwal);
adminRouter.post('/csv-hasilTerjadwal', authAdmin, exportTableToCSVHasilTerjadwal);
adminRouter.post('/excel-hasilTerjadwal', authAdmin, exportTableToExcelHasilTerjadwal);
adminRouter.post('/pdf-hasilTerjadwal', authAdmin, exportTableToPDFHasilTerjadwal);
           
adminRouter.get('/hasil-selesai', authAdmin, getHasilSelesai)
adminRouter.route('/hasil-selesai/edit/:id')
           .post(authAdmin, editHasilSelesai)

adminRouter.post('/copy-hasilSelesai', authAdmin, exportTableToClipboardHasilSelesai);
adminRouter.post('/csv-hasilSelesai', authAdmin, exportTableToCSVHasilSelesai);
adminRouter.post('/excel-hasilSelesai', authAdmin, exportTableToExcelHasilSelesai);
adminRouter.post('/pdf-hasilSelesai', authAdmin, exportTableToPDFHasilSelesai);

adminRouter.get('/komprehensif', authAdmin, getKomprehensif)
adminRouter.get('/komprehensif/download/:id', authAdmin, downloadKomprehensif)
adminRouter.route('/komprehensif/edit/:id')
           .post(authAdmin, editKomprehensif)
adminRouter.get('/komprehensif/delete/:id', authAdmin, deleteKomprehensif)
adminRouter.get('/komprehensif-revisi1/download/:id', authAdmin, downloadKomprehensifRevisi1)
adminRouter.get('/komprehensif-revisi2/download/:id', authAdmin, downloadKomprehensifRevisi2)
adminRouter.get('/komprehensif-revisiDosen1/download/:id', authAdmin, downloadKomprehensifRevisiDosen1)
adminRouter.get('/komprehensif-revisiDosen2/download/:id', authAdmin, downloadKomprehensifRevisiDosen2)

adminRouter.post('/copy-komprehensif', authAdmin, exportTableToClipboardKomprehensif);
adminRouter.post('/csv-komprehensif', authAdmin, exportTableToCSVKomprehensif);
adminRouter.post('/excel-komprehensif', authAdmin, exportTableToExcelKomprehensif);
adminRouter.post('/pdf-komprehensif', authAdmin, exportTableToPDFKomprehensif);

adminRouter.get('/komprehensif-masuk', authAdmin, getKomprehensifMasuk)
adminRouter.route('/komprehensif-masuk/edit/:id')
           .post(authAdmin, editKomprehensifMasuk)
           
adminRouter.post('/copy-komprehensifMasuk', authAdmin, exportTableToClipboardKomprehensifMasuk);
adminRouter.post('/csv-komprehensifMasuk', authAdmin, exportTableToCSVKomprehensifMasuk);
adminRouter.post('/excel-komprehensifMasuk', authAdmin, exportTableToExcelKomprehensifMasuk);
adminRouter.post('/pdf-komprehensifMasuk', authAdmin, exportTableToPDFKomprehensifMasuk);

adminRouter.get('/komprehensif-terjadwal', authAdmin, getKomprehensifTerjadwal)
adminRouter.route('/komprehensif-terjadwal/edit/:id')
           .post(authAdmin, editKomprehensifTerjadwal)
adminRouter.route('/komprehensif-terjadwal-selesai/edit/:id')
           .post(authAdmin, editKomprehensifTerjadwalSelesai)

adminRouter.post('/copy-komprehensifTerjadwal', authAdmin, exportTableToClipboardKomprehensifTerjadwal);
adminRouter.post('/csv-komprehensifTerjadwal', authAdmin, exportTableToCSVKomprehensifTerjadwal);
adminRouter.post('/excel-komprehensifTerjadwal', authAdmin, exportTableToExcelKomprehensifTerjadwal);
adminRouter.post('/pdf-komprehensifTerjadwal', authAdmin, exportTableToPDFKomprehensifTerjadwal);
           
adminRouter.get('/komprehensif-selesai', authAdmin, getKomprehensifSelesai)
adminRouter.route('/komprehensif-selesai/edit/:id')
           .post(authAdmin, editKomprehensifSelesai)

adminRouter.post('/copy-komprehensifSelesai', authAdmin, exportTableToClipboardKomprehensifSelesai);
adminRouter.post('/csv-komprehensifSelesai', authAdmin, exportTableToCSVKomprehensifSelesai);
adminRouter.post('/excel-komprehensifSelesai', authAdmin, exportTableToExcelKomprehensifSelesai);
adminRouter.post('/pdf-komprehensifSelesai', authAdmin, exportTableToPDFKomprehensifSelesai);

adminRouter.get('/:id/profile', profile)
adminRouter.post('/:id/profile', profilePost)
adminRouter.get('/:id/ubah-password', ubahPassword)
adminRouter.post('/:id/ubah-password', passwordPost)
adminRouter.get('/logout', logout)

module.exports = adminRouter