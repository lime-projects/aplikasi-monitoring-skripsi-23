const { User, /*ThesisRegistration, */ StudentUser, LecturerUser, CoordinatorUser, DevisionOfLecturer, ListOfLecturer1, ListOfLecturer2, ListOfLecturer3, TitleSubmission, TitleSubmission2, Proposal, HasilSkripsi, Komprehensif, /*PresensiBimbingan */ } = require('../models')

const { encryptPass, decryptPass } = require('../helpers/bcrypt')
const { generateToken } = require('../helpers/jwt')
const colors = require('../helpers/colors')
const path = require('path');
const copyPaste = require('copy-paste');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;
const ExcelJS = require('exceljs');
const pdf = require('pdf-creator-node');
const fs = require('fs');

const getLogin = async (req, res) => {
    try {
        if (req.cookies.token) {
            return res.redirect('/');
        }

        res.render('koordinator/loginKoor');
    } catch (error) {
        res.status(500).json({
            status: 500,
            msg: error.message,
        });
    }
};

const login = async (req, res) => {
    const { username, password } = req.body;

    try {
        const usernameExist = await CoordinatorUser.findOne({
            where: {
                username
            }
        });

        if (!usernameExist) {
            console.log('username belum terdaftar');
            return res.status(404).redirect('/koordinator-skripsi/login');
        }

        if (!decryptPass(password, usernameExist.password)) {
            console.log('username dan password salah');
            return res.status(400).redirect('/koordinator-skripsi/login');
        }

        if (usernameExist.role !== 'Koordinator') {
            console.log('Role bukan koordinator');
            return res.status(400).redirect('/koordinator-skripsi/login');
        }

        res.status(201)
            .cookie('token', generateToken(usernameExist))
            .cookie('id', usernameExist.id)
            .cookie('username', usernameExist.username)
            .redirect('/koordinator-skripsi/dashboard');
    } catch (error) {
        res.status(500).json({
            status: 500,
            msg: error.message
        });
    }
};

const getDashboardKoor = async (req, res) => {
    try {
        const { id, username } = req.cookies;

        const profile = await CoordinatorUser.findOne({
            where: { id },
        });

        if (!profile) {
            return res.status(404).json({ message: 'Profile koordinator tidak ditemukan' });
        }

        const students = await StudentUser.findAll({});
        const lecturers = await LecturerUser.findAll({});
        const koors = await CoordinatorUser.findAll({});
        const titleSubs = await TitleSubmission.findAll({});
        const jumlahMahasiswaProposal = await Proposal.findAll({});
        const jumlahMahasiswaHasil = await HasilSkripsi.findAll({});
        const jumlahMahasiswaKomprehensif = await HasilSkripsi.findAll({});
        const pengajuanDosen = await DevisionOfLecturer.findAll({});
        const titleFilterPengajuan0 = titleSubs.filter(item => item.statusPengajuan === false);
        const titleFilterPengajuan1 = titleSubs.filter(item => item.statusPengajuan === true);

        res.render('koordinator/dashboardKoor', {
            title: 'Selamat Datang di Aplikasi Monitoring Skripsi',
            id,
            profile,
            username,
            students,
            lecturers,
            koors,
            titleSubs,
            titleFilterPengajuan0,
            titleFilterPengajuan1,
            jumlahMahasiswaProposal,
            jumlahMahasiswaHasil,
            jumlahMahasiswaKomprehensif,
            pengajuanDosen
        });
    } catch (error) {
        res.status(500).json({
            status: 500,
            msg: error.message
        });
    }
};

const getPembagianDosen = async (req, res) => {
    try {
        const { id, username } = req.cookies;

        const profile = await CoordinatorUser.findOne({
            where: { id },
        });

        if (!profile) {
            return res.status(404).json({ message: 'Profile mahasiswa tidak ditemukan' });
        }

        const dataPembagianDosen = await DevisionOfLecturer.findAll({});
        const daftarPb1 = await ListOfLecturer1.findAll({}); 
        const daftarPb2 = await ListOfLecturer2.findAll({}); 
        const daftarPb3 = await ListOfLecturer3.findAll({}); 

        const warna1 = {};
        const warna2 = {};
        const warna3 = {};
        dataPembagianDosen.forEach((pembagianDosen) => {
            warna1[pembagianDosen.id] = colors.getStatusColor1(pembagianDosen.statusPembimbing1);
            warna2[pembagianDosen.id] = colors.getStatusColor2(pembagianDosen.statusPembimbing2);
            warna3[pembagianDosen.id] = colors.getStatusColor3(pembagianDosen.statusPembahas);
        });

        res.render('koordinator/pembagianDosen', {
            title: 'Pembagian Dosen',
            id,
            username,
            profile,
            dataPembagianDosen,
            daftarPb1,
            daftarPb2,
            daftarPb3,
            warna1,
            warna2,
            warna3,
            colors,
            editSuccess: req.flash('editSuccess'),
            addSuccess1: req.flash('addSuccess1')
        });

    } catch (error) {
        res.status(500).json({
            status: 500,
            msg: error.message
        });
    }
};

const editPembagianDosen = async (req, res) => {
    try {
        const { id } = req.params;

        const { nama, npm, statusPembimbing1, statusPembimbing2, statusPembahas, tanggalPengajuan, StudentUserId } = req.body;

        await DevisionOfLecturer.update({
            nama,
            npm,
            statusPembimbing1,
            statusPembimbing2,
            statusPembahas,
            tanggalPengajuan,
            StudentUserId,
        }, {
            where: {
                id
            }
        });

        return res.redirect('/koordinator-skripsi/pembagian-dosen');
    } catch (error) {
        res.status(500).json({
            status: 500,
            msg: error.message
        });
    }
};

const ubahPembagianDosen = async (req, res) => {
    try {
        const { id } = req.params;

        const { newDosenPembimbing1, newDosenPembimbing2, newDosenPembahas } = req.body;
        const pembagianDosen = await DevisionOfLecturer.findByPk(id);

        if (!pembagianDosen) {
            return res.status(404).json({ success: false, message: 'Data mahasiswa tidak ditemukan.' });
        }

        if (newDosenPembimbing1 !== undefined) {
            pembagianDosen.dosenPembimbing1 = newDosenPembimbing1;
            req.flash('editSuccess', 'Dosen pembimbing 1 berhasil DIUBAH!');
        }

        if (newDosenPembimbing2 !== undefined) {
            pembagianDosen.dosenPembimbing2 = newDosenPembimbing2;
            req.flash('editSuccess', 'Dosen pembimbing 2 berhasil DIUBAH!');
        }

        if (newDosenPembahas !== undefined) {
            pembagianDosen.dosenPembahas = newDosenPembahas;
            req.flash('editSuccess', 'Dosen pembahas berhasil DIUBAH!');
        }

        await pembagianDosen.save();

        return res.redirect('/koordinator-skripsi/pembagian-dosen');
    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: 'Terjadi kesalahan saat mengubah data.' });
    }
};

const exportTableToClipboardPembagianDosen = async (req, res, next) => {
    try {
      const data = await DevisionOfLecturer.findAll({});
  
    const csvData = data.map((pembagianDosen, index) => {
      return `${index + 1}\t${pembagianDosen.npm}\t${pembagianDosen.nama}\t${pembagianDosen.dosenPembimbing1}\t${pembagianDosen.dosenPembimbing2}\t${pembagianDosen.dosenPembahas}\t${pembagianDosen.tanggalPengajuan}\t${pembagianDosen.statusPembimbing1}\t${pembagianDosen.statusPembimbing2}\t${pembagianDosen.statusPembahas}\n`;
    }).join('');
    
  
      copyPaste.copy(csvData, () => {
        req.flash('addSuccess1', 'Data pembagian dosen mahasiswa berhasil disalin ke clipboard ')
        res.redirect('/koordinator-skripsi/pembagian-dosen');
      });
    } catch (error) {
      next(new Error('controllers/koordinatorController.js:exportTableToClipboardPembagianDosen - ' + error.message));
    }
  };
  
  const exportTableToCSVPembagianDosen  = async (req, res, next) => {
    const path = './file-output';
  
    const data = await DevisionOfLecturer.findAll({});
  
    const csvWriter = createCsvWriter({
      path: `${path}/Pembagian_Dosen_Mahasiswa.csv`,
      header: [
        { id: 's_no', title: 'No', width: 5 },
        { id: 'npm', title: 'NPM', width: 20 },
        { id: 'nama', title: 'Nama', width: 20 },
        { id: 'dosenPembimbing1', title: 'Dosen Pembimbing 1', width: 30 },
        { id: 'dosenPembimbing2', title: 'Dosen Pembimbing 2', width: 30 },
        { id: 'dosenPembahas', title: 'Dosen Pembahas', width: 30 },
        { id: 'tanggalPengajuan', title: 'Tanggal Penngajuan', width: 70 },
        { id: 'statusPembimbing1', title: 'Status Pembimbing 1', width: 70 },
        { id: 'statusPembimbing1', title: 'Status Pembimbing 1', width: 20 },
        { id: 'statusPembahas', title: 'Status Pembahas', width: 20 },
      ],
      alwaysQuote: true, 
    });
  
    const csvData = data.map((pembagianDosen, index) => {
      return {
        s_no: index + 1,
        npm: pembagianDosen.npm,
        nama: pembagianDosen.nama,
        dosenPembimbing1: pembagianDosen.dosenPembimbing1,
        dosenPembimbing2: pembagianDosen.dosenPembimbing2,
        dosenPembahas: pembagianDosen.dosenPembahas,
        tanggalPengajuan: pembagianDosen.tanggalPengajuan,
        statusPembimbing1: pembagianDosen.statusPembimbing1, 
        statusPembimbing2: pembagianDosen.statusPembimbing2, 
        statusPembahas: pembagianDosen.statusPembahas
      };
    });
    
    let counter = 1;
    data.forEach((pembagianDosen) => {
      pembagianDosen.s_no = counter;
      counter++;
    });
  
    try {
      await csvWriter.writeRecords(csvData);
  
      res.download(`${path}/Pembagian_Dosen_Mahasiswa.csv`, 'Pembagian_Dosen_Mahasiswa.csv', (err) => {
        if (err) {
          console.log(err);
        } else {
          fs.unlinkSync(`${path}/Pembagian_Dosen_Mahasiswa.csv`);
        }
      });
    } catch (error) {
      next(
        new Error('controllers/koordinatorController.js:exportTableToCSVPembagianDosen - ' + error.message)
      );
    }
  };
  
  const exportTableToExcelPembagianDosen  = async (req, res, next) => {
  
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("PembagianDosen");
    const path = "./file-output";
  
    const data = await DevisionOfLecturer.findAll({});
  
    worksheet.columns = [
      { header: 'No', key: 's_no', width: 5 },
      { header: 'NPM', key: 'npm', width: 20},
      { header: 'Nama', key: 'nama', width: 20 },
      { header: 'Dosen Pembimbing 1', key: 'dosenPembimbing1', width: 30  },
      { header: 'Dosen Pembimbing 2', key: 'dosenPembimbing2', width: 30  },
      { header: 'Dosen Pembahas', key: 'dosenPembahas', width: 30  },
      { header: 'Tanggal Pengajuan', key: 'tanggalPengajuan', width: 70 },
      { header: 'Status Pembimbing 1', key: 'statusPembimbing1', width: 70 },
      { header: 'Status Pembimbing 2', key: 'statusPembimbing2', width: 70 },
      { header: 'Status Pembahas', key: 'statusPembahas', width: 30 },
    ];
  
    const csvData = data.map((pembagianDosen, index) => {
      return {
        s_no: index + 1,
        npm: pembagianDosen.npm,
        nama: pembagianDosen.nama,
        dosenPembimbing1: pembagianDosen.dosenPembimbing1,
        dosenPembimbing2: pembagianDosen.dosenPembimbing2,
        dosenPembahas: pembagianDosen.dosenPembahas,
        tanggalPengajuan: pembagianDosen.tanggalPengajuan,
        statusPembimbing1: pembagianDosen.statusPembimbing1, 
        statusPembimbing2: pembagianDosen.statusPembimbing2, 
        statusPembahas: pembagianDosen.statusPembahas
      };
    });
      
  
    let counter = 1;
    csvData.forEach((pembagianDosen) => {
      pembagianDosen.s_no = counter;
      worksheet.addRow(pembagianDosen);
      counter++;
    });
    let list = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J" ];
    for (let i = 0; i <= counter; i++) {
      list.forEach((item) => {
        worksheet.getCell(item + i).border = {
          top: { style: "thin" },
          left: { style: "thin" },
          bottom: { style: "thin" },
          right: { style: "thin" },
        };
      });
    }
    worksheet.getRow(1).eachCell((cell) => {
      cell.font = { bold: true };
    });
  
    try {
      const data2 = await workbook.xlsx
        .writeFile(`${path}/Pembagian_Dosen_Mahasiswa.xlsx`)
        .then(() => {
          res.download(`${path}/Pembagian_Dosen_Mahasiswa.xlsx`, "Pembagian_Dosen_Mahasiswa.xlsx", (err) => {
            if (err) {
              console.log(err);
            } else {
              fs.unlinkSync(`${path}/Pembagian_Dosen_Mahasiswa.xlsx`);
            }
          });
        });
    } catch (error) {
      next(
        new Error(
          "controllers/koordinatorController.js:exportTableToExcelPembagianDosen - " + error.message
        )
      );
    }
  };
  
  const exportTableToPDFPembagianDosen = async (req, res, next) => {
    try {
      let pathFile = "./file-output";
      let fileName = "Pembagian_Dosen_Mahasiswa.pdf";
      let fullPath = pathFile + "/" + fileName;
      let html = fs.readFileSync("./templates/templatePembagianDosen.html", "utf-8");
      let options = {
        format: "A4",
        orientation: "landscape",
        border: "10mm",
        header: {
          height: "5mm",
          contents: '<div style="text-align: center;"></div>',
        },
        footer: {
          height: "28mm",
          contents: {
            first: "",
            2: "Second page",
            default: '<span style="color: #444;">{{page}}</span>/<span>{{pages}}</span>',
            last: "",
          },
        },
      };
      const data = await DevisionOfLecturer.findAll({});
      let devisions = [];
      data.forEach((pembagianDosen, index) => { 
        devisions.push({
          s_no: index + 1,
          npm: pembagianDosen.npm,
          nama: pembagianDosen.nama,
          dosenPembimbing1: pembagianDosen.dosenPembimbing1,
          dosenPembimbing2: pembagianDosen.dosenPembimbing2,
          dosenPembahas: pembagianDosen.dosenPembahas,
          tanggalPengajuan: pembagianDosen.tanggalPengajuan,
          statusPembimbing1: pembagianDosen.statusPembimbing1,
          statusPembimbing2: pembagianDosen.statusPembimbing2,
          statusPembahas: pembagianDosen.statusPembahas,
        });
      });
      let document = {
        html: html,
        data: {
          devisions: devisions,
        },
        path: fullPath,
        type: "",
      };
      
      const pdf = require("pdf-creator-node"); 
      const process = await pdf.create(document, options);
      if (process) {
        res.download(fullPath, fileName, (err) => {
          if (err) {
            console.log(err);
          } else {
            fs.unlinkSync(fullPath);
          }
        });
      }
    } catch (error) {
      next(
        new Error(
          "controllers/koordinatorController.js:exportTableToPDFPembagianDosen - " + error.message
        )
      );
    }
  };

const getPermintaanBimbingan = async (req, res) => {
    try {
        const { id, username } = req.cookies;

        const profile = await StudentUser.findOne({
            where: {
                id
            },
        });

        const dataPembagianDosen = await DevisionOfLecturer.findAll({});
        const daftarPb1 = await ListOfLecturer1.findAll({}); 
        const daftarPb2 = await ListOfLecturer2.findAll({}); 
        const daftarPb3 = await ListOfLecturer3.findAll({}); 

        const warna4 = {};

        dataPembagianDosen.forEach((pembagianDosen) => {
            warna4[pembagianDosen.id] = colors.getStatusColor4(pembagianDosen.statusPermintaanBimbingan);
        });

        res.render('koordinator/permintaanBimbingan', {
            title: 'Permintaan Bimbingan',
            id,
            username,
            profile,
            daftarPb1,
            daftarPb2,
            daftarPb3,
            warna4,
            colors,
            dataPembagianDosen,
            addSuccess1: req.flash('addSuccess1'),
            editSuccess: req.flash('editSuccess')
        });

    } catch (error) {
        res.status(500).json({
            status: 500,
            msg: error.message
        });
    }
};

const editPermintaanBimbingan = async (req, res) => {
    try {
        const { id } = req.params;

        const {nama, npm, tanggalPengajuan, keterangan, statusPermintaanBimbingan, StudentUserId
        } = req.body;

        await DevisionOfLecturer.update({
            nama,
            npm,
            tanggalPengajuan,
            keterangan, 
            statusPermintaanBimbingan,
            StudentUserId
        }, {
            where: {
                id
            }
        });

        return res.redirect('/koordinator-skripsi/permintaan-bimbingan');
    } catch (error) {
        res.status(500).json({
            status: 500,
            msg: error.message
        });
    }
};

const exportTableToClipboardPermintaanBimbingan = async (req, res, next) => {
    try {
      const data = await DevisionOfLecturer.findAll({});
  
    const csvData = data.map((permintaanBimbingan, index) => {
      return `${index + 1}\t${permintaanBimbingan.npm}\t${permintaanBimbingan.nama}\t${permintaanBimbingan.dosenPembimbing1}\t${permintaanBimbingan.dosenPembimbing2}\t${permintaanBimbingan.dosenPembahas}\t${permintaanBimbingan.tanggalPengajuan}\t${permintaanBimbingan.keterangan}\t${permintaanBimbingan.statusPermintaanBimbingan}\n`;
    }).join('');
    
  
      copyPaste.copy(csvData, () => {
        req.flash('addSuccess1', 'Data permintaan bimbingan berhasil disalin ke clipboard ')
        res.redirect('/koordinator-skripsi/permintaan-bimbingan');
      });
    } catch (error) {
      next(new Error('controllers/koordinatorController.js:exportTableToClipboardPermintaanBimbingan - ' + error.message));
    }
  };
  
  const exportTableToCSVPermintaanBimbingan  = async (req, res, next) => {
    const path = './file-output';
  
    const data = await DevisionOfLecturer.findAll({});
  
    const csvWriter = createCsvWriter({
      path: `${path}/Permintaan_Bimbingan.csv`,
      header: [
        { id: 's_no', title: 'No', width: 5 },
        { id: 'npm', title: 'NPM', width: 20 },
        { id: 'nama', title: 'Nama', width: 20 },
        { id: 'dosenPembimbing1', title: 'Dosen Pembimbing 1', width: 30 },
        { id: 'dosenPembimbing2', title: 'Dosen Pembimbing 2', width: 30 },
        { id: 'dosenPembahas', title: 'Dosen Pembahas', width: 30 },
        { id: 'tanggalPengajuan', title: 'Tanggal Pengajuan', width: 70 },
        { id: 'keterangan', title: 'Keterangan', width: 70 },
        { id: 'statusPermintaanBimbingan', title: 'Status Permintaan Bimbingan', width: 20 }
      ],
      alwaysQuote: true, 
    });
  
    const csvData = data.map((permintaanBimbingan, index) => {
      return {
        s_no: index + 1,
        npm: permintaanBimbingan.npm,
        nama: permintaanBimbingan.nama,
        dosenPembimbing1: permintaanBimbingan.dosenPembimbing1,
        dosenPembimbing2: permintaanBimbingan.dosenPembimbing2,
        dosenPembahas: permintaanBimbingan.dosenPembahas,
        tanggalPengajuan: permintaanBimbingan.tanggalPengajuan,
        keterangan: permintaanBimbingan.keterangan, 
        statusPermintaanBimbingan: permintaanBimbingan.statusPermintaanBimbingan
      };
    });
    
    let counter = 1;
    data.forEach((permintaanBimbingan) => {
      permintaanBimbingan.s_no = counter;
      counter++;
    });
  
    try {
      await csvWriter.writeRecords(csvData);
  
      res.download(`${path}/Permintaan_Bimbingan.csv`, 'Permintaan_Bimbingan.csv', (err) => {
        if (err) {
          console.log(err);
        } else {
          fs.unlinkSync(`${path}/Permintaan_Bimbingan.csv`);
        }
      });
    } catch (error) {
      next(
        new Error('controllers/koordinatorController.js:exportTableToCSVPermintaanBimbingan - ' + error.message)
      );
    }
  };
  
  const exportTableToExcelPermintaanBimbingan  = async (req, res, next) => {
  
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("PermintaanBimbingan");
    const path = "./file-output";
  
    const data = await DevisionOfLecturer.findAll({});
  
    worksheet.columns = [
      { header: 'No', key: 's_no', width: 5 },
      { header: 'NPM', key: 'npm', width: 20},
      { header: 'Nama', key: 'nama', width: 20 },
      { header: 'Dosen Pembimbing 1', key: 'dosenPembimbing1', width: 30  },
      { header: 'Dosen Pembimbing 2', key: 'dosenPembimbing2', width: 30  },
      { header: 'Dosen Pembahas', key: 'dosenPembahas', width: 30  },
      { header: 'Tanggal Pengajuan', key: 'tanggalPengajuan', width: 70 },
      { header: 'Keterangan', key: 'keterangan', width: 70 },
      { header: 'Status Permintaan Bimbingan', key: 'statusPermintaanBimbingan', width: 40 }
    ];
  
    const csvData = data.map((permintaanBimbingan, index) => {
      return {
        s_no: index + 1,
        npm: permintaanBimbingan.npm,
        nama: permintaanBimbingan.nama,
        dosenPembimbing1: permintaanBimbingan.dosenPembimbing1,
        dosenPembimbing2: permintaanBimbingan.dosenPembimbing2,
        dosenPembahas: permintaanBimbingan.dosenPembahas,
        tanggalPengajuan: permintaanBimbingan.tanggalPengajuan,
        keterangan: permintaanBimbingan.keterangan, 
        statusPermintaanBimbingan: permintaanBimbingan.statusPermintaanBimbingan
      };
    });
      
    let counter = 1;
    csvData.forEach((permintaanBimbingan) => {
      permintaanBimbingan.s_no = counter;
      worksheet.addRow(permintaanBimbingan);
      counter++;
    });
    let list = ["A", "B", "C", "D", "E", "F", "G", "H", "I" ];
    for (let i = 0; i <= counter; i++) {
      list.forEach((item) => {
        worksheet.getCell(item + i).border = {
          top: { style: "thin" },
          left: { style: "thin" },
          bottom: { style: "thin" },
          right: { style: "thin" },
        };
      });
    }
    worksheet.getRow(1).eachCell((cell) => {
      cell.font = { bold: true };
    });
  
    try {
      const data2 = await workbook.xlsx
        .writeFile(`${path}/Permintaan_Bimbingan.xlsx`)
        .then(() => {
          res.download(`${path}/Permintaan_Bimbingan.xlsx`, "Permintaan_Bimbingan.xlsx", (err) => {
            if (err) {
              console.log(err);
            } else {
              fs.unlinkSync(`${path}/Permintaan_Bimbingan.xlsx`);
            }
          });
        });
    } catch (error) {
      next(
        new Error(
          "controllers/koordinatorController.js:exportTableToExcelPermintaanBimbingan - " + error.message
        )
      );
    }
  };
  
  const exportTableToPDFPermintaanBimbingan = async (req, res, next) => {
    try {
      let pathFile = "./file-output";
      let fileName = "Permintaan_Bimbingan.pdf";
      let fullPath = pathFile + "/" + fileName;
      let html = fs.readFileSync("./templates/templatePermintaanBimbingan.html", "utf-8");
      let options = {
        format: "A4",
        orientation: "landscape",
        border: "10mm",
        header: {
          height: "5mm",
          contents: '<div style="text-align: center;"></div>',
        },
        footer: {
          height: "28mm",
          contents: {
            first: "",
            2: "Second page",
            default: '<span style="color: #444;">{{page}}</span>/<span>{{pages}}</span>',
            last: "",
          },
        },
      };
      const data = await DevisionOfLecturer.findAll({});
      let guidances = [];
      data.forEach((permintaanBimbingan, index) => { 
        guidances.push({
          s_no: index + 1,
          npm: permintaanBimbingan.npm,
          nama: permintaanBimbingan.nama,
          dosenPembimbing1: permintaanBimbingan.dosenPembimbing1,
          dosenPembimbing2: permintaanBimbingan.dosenPembimbing2,
          dosenPembahas: permintaanBimbingan.dosenPembahas,
          tanggalPengajuan: permintaanBimbingan.tanggalPengajuan,
          keterangan: permintaanBimbingan.keterangan,
          statusPermintaanBimbingan: permintaanBimbingan.statusPermintaanBimbingan
        });
      });
      let document = {
        html: html,
        data: {
          guidances: guidances,
        },
        path: fullPath,
        type: "",
      };
      
      const pdf = require("pdf-creator-node"); 
      const process = await pdf.create(document, options);
      if (process) {
        res.download(fullPath, fileName, (err) => {
          if (err) {
            console.log(err);
          } else {
            fs.unlinkSync(fullPath);
          }
        });
      }
    } catch (error) {
      next(
        new Error(
          "controllers/koordinatorController.js:exportTableToPDFPermintaanBimbingan - " + error.message
        )
      );
    }
  };

const getDaftarDosen = async (req, res) => {
    try {
      const { id, username } = req.cookies;
  
      const daftarPb1 = await ListOfLecturer1.findAll({});
      const daftarDosen = await LecturerUser.findAll({});
      const pb1 = daftarDosen.map(item => item.nama);
  
      return res.render('koordinator/daftarDosen', {
        title: 'Daftar Dosen Pembimbing 1',
        id,
        username,
        daftarPb1,
        daftarDosen,
        pb1,
        addSuccess: req.flash('addSuccess'),
        addSuccess1: req.flash('addSuccess1'),
        addError: req.flash('addError'),
        deleteSuccess: req.flash('deleteSuccess'),
        validateError: req.flash('validateError')
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Terjadi kesalahan saat mengambil daftar dosen.' })
    }
  };
  
const addDosenToDaftar = async (req, res) => {
    try {
      const { dosenPembimbing1 } = req.body;
  
      const existingDosen = await ListOfLecturer1.findOne({
        where: {
          dosenPembimbing1
        }
      });
  
      if (existingDosen) {
        req.flash('addError', 'Dosen sudah ada dalam daftar!');
        return res.redirect('/koordinator-skripsi/daftar-dosen');
      }
  
      await ListOfLecturer1.create({
        dosenPembimbing1
      });
  
      req.flash('addSuccess', 'Daftar dosen pembimbing 1 berhasil DITAMBAH!');
      return res.redirect('/koordinator-skripsi/daftar-dosen');
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Terjadi kesalahan.' });
    }
  };
  

const deleteDaftarDosen = async (req, res) => {
    try {
        const { id } = req.params;

        await ListOfLecturer1.destroy({
            where: {
                id
            }
        });

        req.flash('deleteSuccess', 'Daftar dosen pembimbing 1 berhasil DIHAPUS!')
        res.redirect('/koordinator-skripsi/daftar-dosen');
    } catch (error) {
        res.status(500).json({
            status: 500,
            msg: error.message
        });
    }
};

const exportTableToClipboardDaftarDosen1 = async (req, res, next) => {
    try {
      const data = await ListOfLecturer1.findAll({}); 
  
      const csvData = data.map((daftarDosen1, index) => {
        return `${index + 1}\t${daftarDosen1.dosenPembimbing1}\n`;
      }).join('');
  
      copyPaste.copy(csvData, () => {
        req.flash('addSuccess1', 'Data daftar dosen pembimbing 1 berhasil disalin ke clipboard ')
        res.redirect('/koordinator-skripsi/daftar-dosen');
      });
    } catch (error) {
      next(new Error('controllers/koordinatorController.js:exportTableToClipboardDaftarDosen1 - ' + error.message));
    }
  };
  
  const exportTableToCSVDaftarDosen1  = async (req, res, next) => {
    const path = './file-output';
  
    const data = await ListOfLecturer1.findAll({});
  
    const csvWriter = createCsvWriter({
      path: `${path}/Daftar_Dosen_Pembimbing1.csv`,
      header: [
        { id: 's_no', title: 'No', width: 5 },
        { id: 'dosenPembimbing1', title: 'Dosen Pembimbing 1', width: 20 }
      ],
      alwaysQuote: true, 
    });
    
  
    let counter = 1;
    data.forEach((daftarDosen1) => {
      daftarDosen1.s_no = counter;
      counter++;
    });
  
    try {
      await csvWriter.writeRecords(data);
  
      res.download(`${path}/Daftar_Dosen_Pembimbing1.csv`, 'Daftar_Dosen_Pembimbing1.csv', (err) => {
        if (err) {
          console.log(err);
        } else {
          fs.unlinkSync(`${path}/Daftar_Dosen_Pembimbing1.csv`);
        }
      });
    } catch (error) {
      next(
        new Error('controllers/koordinatorController.js:exportTableToCSVDaftarDosen1 - ' + error.message)
      );
    }
  };
  
  const exportTableToExcelDaftarDosen1  = async (req, res, next) => {
  
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Daftar_Dosen_Pembimbing1");
    const path = "./file-output";
  
    const data = await ListOfLecturer1.findAll({});
  
    worksheet.columns = [
      { header: 'No', key: 's_no', width: 5 },
      { header: 'Dosen Pembimbing 1', key: 'dosenPembimbing1', width: 30}
    ];
  
    let counter = 1;
    data.forEach((daftarDosen1) => {
      daftarDosen1.s_no = counter;
      worksheet.addRow(daftarDosen1);
      counter++;
    });
    let list = ["A", "B"];
    for (let i = 0; i <= counter; i++) {
      list.forEach((item) => {
        worksheet.getCell(item + i).border = {
          top: { style: "thin" },
          left: { style: "thin" },
          bottom: { style: "thin" },
          right: { style: "thin" },
        };
      });
    }
    worksheet.getRow(1).eachCell((cell) => {
      cell.font = { bold: true };
    });
  
    try {
      const data2 = await workbook.xlsx
        .writeFile(`${path}/Daftar_Dosen_Pembimbing1.xlsx`)
        .then(() => {
          res.download(`${path}/Daftar_Dosen_Pembimbing1.xlsx`, "Daftar_Dosen_Pembimbing1.xlsx", (err) => {
            if (err) {
              console.log(err);
            } else {
              fs.unlinkSync(`${path}/Daftar_Dosen_Pembimbing1.xlsx`);
            }
          });
        });
    } catch (error) {
      next(
        new Error(
          "controllers/koordinatorController.js:exportTableToExcelDaftarDosen1 - " + error.message
        )
      );
    }
  };
  
  const exportTableToPDFDaftarDosen1 = async (req, res, next) => {
      try {
        let pathFile = "./file-output";
        let fileName = "Daftar_Dosen_Pembimbing1.pdf";
        let fullPath = pathFile + "/" + fileName;
        let html = fs.readFileSync("./templates/templateDaftarDosen1.html", "utf-8");
        let options = {
          format: "A4",
          orientation: "portrait",
          border: "10mm",
          header: {
            height: "5mm",
            contents: '<div style="text-align: center;"></div>',
          },
          footer: {
            height: "28mm",
            contents: {
              first: "",
              2: "Second page", 
              default:
                '<span style="color: #444;">{{page}}</span>/<span>{{pages}}</span>', 
              last: "",
            },
          },
        };
        const data = await ListOfLecturer1.findAll({});
        let lecturer1s = [];
        data.forEach((daftarDosen1, no) => {
          lecturer1s.push({
            no: no + 1,
            dosenPembimbing1: daftarDosen1.dosenPembimbing1
          });
        });
        let document = {
          html: html,
          data: {
            lecturer1s: lecturer1s,
          },
          path: fullPath,
          type: "",
        };
        const process = await pdf.create(document, options);
        if (process) {
          res.download(fullPath, fileName, (err) => {
            if (err) {
              console.log(err);
            } else {
              fs.unlinkSync(fullPath);
            }
          });
        }
      } catch (error) {
        next(
          new Error(
            "controllers/koordinatorController.js:exportTableToPDFDaftarDosen1 - " + err.message
          )
        );
      }
    };

const getDaftarDosen2 = async (req, res) => {
    try {
      const { id, username } = req.cookies;
  
      const daftarPb2 = await ListOfLecturer2.findAll({});
      const daftarDosen = await LecturerUser.findAll({});
      const pb2 = daftarDosen.map(item => item.nama);
  
      return res.render('koordinator/daftarDosen2', {
        title: 'Daftar Dosen Pembimbing 2',
        id,
        username,
        daftarPb2,
        daftarDosen,
        pb2,
        addSuccess2: req.flash('addSuccess2'),
        addSuccess3: req.flash('addSuccess3'),
        addError2: req.flash('addError2'),
        deleteSuccess: req.flash('deleteSuccess'),
        validateError: req.flash('validateError')
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Terjadi kesalahan saat mengambil daftar dosen.' })
    }
  };

const addDosenToDaftar2 = async (req, res) => {
  try {
    const { dosenPembimbing2 } = req.body;

    const existingDosen = await ListOfLecturer2.findOne({
      where: {
        dosenPembimbing2
      }
    });

    if (existingDosen) {
      req.flash('addError2', 'Dosen sudah ada dalam daftar!');
      return res.redirect('/koordinator-skripsi/daftar-dosen2');
    }

    await ListOfLecturer2.create({
      dosenPembimbing2
    });

    req.flash('addSuccess2', 'Daftar dosen pembimbing 2 berhasil DITAMBAH!');
    return res.redirect('/koordinator-skripsi/daftar-dosen2');
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Terjadi kesalahan.' });
  }
};

const deleteDaftarDosen2 = async (req, res) => {
  try {
    const { id } = req.params;

    await ListOfLecturer2.destroy({
      where: {
        id
      }
    });

    req.flash('deleteSuccess', 'Daftar dosen pembimbing 2 berhasil DIHAPUS!');
    res.redirect('/koordinator-skripsi/daftar-dosen2');
  } catch (error) {
    res.status(500).json({
      status: 500,
      msg: error.message
    });
  }
};

const exportTableToClipboardDaftarDosen2 = async (req, res, next) => {
    try {
      const data = await ListOfLecturer2.findAll({}); 
  
      const csvData = data.map((daftarDosen2, index) => {
        return `${index + 1}\t${daftarDosen2.dosenPembimbing2}\n`;
      }).join('');
  
      copyPaste.copy(csvData, () => {
        req.flash('addSuccess3', 'Data daftar dosen pembimbing 2 berhasil disalin ke clipboard ')
        res.redirect('/koordinator-skripsi/daftar-dosen2');
      });
    } catch (error) {
      next(new Error('controllers/koordinatorController.js:exportTableToClipboardDaftarDosen2 - ' + error.message));
    }
  };
  
  const exportTableToCSVDaftarDosen2  = async (req, res, next) => {
    const path = './file-output';
  
    const data = await ListOfLecturer2.findAll({});
  
    const csvWriter = createCsvWriter({
      path: `${path}/Daftar_Dosen_Pembimbing2.csv`,
      header: [
        { id: 's_no', title: 'No', width: 5 },
        { id: 'dosenPembimbing2', title: 'Dosen Pembimbing 2', width: 20 }
      ],
      alwaysQuote: true, 
    });
    
  
    let counter = 1;
    data.forEach((daftarDosen2) => {
      daftarDosen2.s_no = counter;
      counter++;
    });
  
    try {
      await csvWriter.writeRecords(data);
  
      res.download(`${path}/Daftar_Dosen_Pembimbing2.csv`, 'Daftar_Dosen_Pembimbing2.csv', (err) => {
        if (err) {
          console.log(err);
        } else {
          fs.unlinkSync(`${path}/Daftar_Dosen_Pembimbing2.csv`);
        }
      });
    } catch (error) {
      next(
        new Error('controllers/koordinatorController.js:exportTableToCSVDaftarDosen2 - ' + error.message)
      );
    }
  };
  
  const exportTableToExcelDaftarDosen2  = async (req, res, next) => {
  
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Daftar_Dosen_Pembimbing2");
    const path = "./file-output";
  
    const data = await ListOfLecturer2.findAll({});
  
    worksheet.columns = [
      { header: 'No', key: 's_no', width: 5 },
      { header: 'Dosen Pembimbing 2', key: 'dosenPembimbing2', width: 30}
    ];
  
    let counter = 1;
    data.forEach((daftarDosen2) => {
      daftarDosen2.s_no = counter;
      worksheet.addRow(daftarDosen2);
      counter++;
    });
    let list = ["A", "B"];
    for (let i = 0; i <= counter; i++) {
      list.forEach((item) => {
        worksheet.getCell(item + i).border = {
          top: { style: "thin" },
          left: { style: "thin" },
          bottom: { style: "thin" },
          right: { style: "thin" },
        };
      });
    }
    worksheet.getRow(1).eachCell((cell) => {
      cell.font = { bold: true };
    });
  
    try {
      const data2 = await workbook.xlsx
        .writeFile(`${path}/Daftar_Dosen_Pembimbing2.xlsx`)
        .then(() => {
          res.download(`${path}/Daftar_Dosen_Pembimbing2.xlsx`, "Daftar_Dosen_Pembimbing2.xlsx", (err) => {
            if (err) {
              console.log(err);
            } else {
              fs.unlinkSync(`${path}/Daftar_Dosen_Pembimbing2.xlsx`);
            }
          });
        });
    } catch (error) {
      next(
        new Error(
          "controllers/koordinatorController.js:exportTableToExcelDaftarDosen2 - " + error.message
        )
      );
    }
  };
  
  const exportTableToPDFDaftarDosen2 = async (req, res, next) => {
      try {
        let pathFile = "./file-output";
        let fileName = "Daftar_Dosen_Pembimbing2.pdf";
        let fullPath = pathFile + "/" + fileName;
        let html = fs.readFileSync("./templates/templateDaftarDosen2.html", "utf-8");
        let options = {
          format: "A4",
          orientation: "portrait",
          border: "10mm",
          header: {
            height: "5mm",
            contents: '<div style="text-align: center;"></div>',
          },
          footer: {
            height: "28mm",
            contents: {
              first: "",
              2: "Second page", 
              default:
                '<span style="color: #444;">{{page}}</span>/<span>{{pages}}</span>', 
              last: "",
            },
          },
        };
        const data = await ListOfLecturer2.findAll({});
        let lecturer2s = [];
        data.forEach((daftarDosen2, no) => {
          lecturer2s.push({
            no: no + 1,
            dosenPembimbing2: daftarDosen2.dosenPembimbing2
          });
        });
        let document = {
          html: html,
          data: {
            lecturer2s: lecturer2s,
          },
          path: fullPath,
          type: "",
        };
        const process = await pdf.create(document, options);
        if (process) {
          res.download(fullPath, fileName, (err) => {
            if (err) {
              console.log(err);
            } else {
              fs.unlinkSync(fullPath);
            }
          });
        }
      } catch (error) {
        next(
          new Error(
            "controllers/koordinatorController.js:exportTableToPDFDaftarDosen2 - " + err.message
          )
        );
      }
    };

const getDaftarDosen3 = async (req, res) => {
    try {
      const { id, username } = req.cookies;
  
      const daftarPb3 = await ListOfLecturer3.findAll({});
      const daftarDosen = await LecturerUser.findAll({});
      const pb3 = daftarDosen.map(item => item.nama);
  
      return res.render('koordinator/daftarDosen3', {
        title: 'Daftar Dosen Pembahas',
        id,
        username,
        daftarPb3,
        daftarDosen,
        pb3,
        addSuccess1: req.flash('addSuccess1'),
        addSuccess3: req.flash('addSuccess3'),
        addError3: req.flash('addError3'),
        deleteSuccess: req.flash('deleteSuccess'),
        validateError: req.flash('validateError')
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Terjadi kesalahan saat mengambil daftar dosen.' })
    }
  };

const addDosenToDaftar3 = async (req, res) => {
  try {
    const { dosenPembahas } = req.body;

    const existingDosen = await ListOfLecturer3.findOne({
      where: {
        dosenPembahas
      }
    });

    if (existingDosen) {
      req.flash('addError3', 'Dosen sudah ada dalam daftar!');
      return res.redirect('/koordinator-skripsi/daftar-dosen3');
    }

    await ListOfLecturer3.create({
      dosenPembahas
    });

    req.flash('addSuccess3', 'Daftar dosen pembahas berhasil DITAMBAH!');
    return res.redirect('/koordinator-skripsi/daftar-dosen3');
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Terjadi kesalahan.' });
  }
};


const deleteDaftarDosen3 = async (req, res) => {
  try {
    const { id } = req.params;

    await ListOfLecturer3.destroy({
      where: {
        id
      }
    });

    req.flash('deleteSuccess', 'Daftar dosen pembahas berhasil DIHAPUS!');
    res.redirect('/koordinator-skripsi/daftar-dosen3');
  } catch (error) {
    res.status(500).json({
      status: 500,
      msg: error.message
    });
  }
};

const exportTableToClipboardDaftarDosen3 = async (req, res, next) => {
    try {
      const data = await ListOfLecturer3.findAll({}); 
  
      const csvData = data.map((daftarDosen3, index) => {
        return `${index + 1}\t${daftarDosen3.dosenPembahas}\n`;
      }).join('');
  
      copyPaste.copy(csvData, () => {
        req.flash('addSuccess1', 'Data daftar dosen pembahas berhasil disalin ke clipboard ')
        res.redirect('/koordinator-skripsi/daftar-dosen3');
      });
    } catch (error) {
      next(new Error('controllers/koordinatorController.js:exportTableToClipboardDaftarDosen3 - ' + error.message));
    }
  };
  
  const exportTableToCSVDaftarDosen3  = async (req, res, next) => {
    const path = './file-output';
  
    const data = await ListOfLecturer3.findAll({});
  
    const csvWriter = createCsvWriter({
      path: `${path}/Daftar_Dosen_Pembahas.csv`,
      header: [
        { id: 's_no', title: 'No', width: 5 },
        { id: 'dosenPembahas', title: 'Dosen Pembahas', width: 20 }
      ],
      alwaysQuote: true, 
    });
    
  
    let counter = 1;
    data.forEach((daftarDosen3) => {
      daftarDosen3.s_no = counter;
      counter++;
    });
  
    try {
      await csvWriter.writeRecords(data);
  
      res.download(`${path}/Daftar_Dosen_Pembahas.csv`, 'Daftar_Dosen_Pembahas.csv', (err) => {
        if (err) {
          console.log(err);
        } else {
          fs.unlinkSync(`${path}/Daftar_Dosen_Pembahas.csv`);
        }
      });
    } catch (error) {
      next(
        new Error('controllers/koordinatorController.js:exportTableToCSVDaftarDosen3 - ' + error.message)
      );
    }
  };
  
  const exportTableToExcelDaftarDosen3  = async (req, res, next) => {
  
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Daftar_Dosen_Pembahas");
    const path = "./file-output";
  
    const data = await ListOfLecturer3.findAll({});
  
    worksheet.columns = [
      { header: 'No', key: 's_no', width: 5 },
      { header: 'Dosen Pembahas', key: 'dosenPembahas', width: 30}
    ];
  
    let counter = 1;
    data.forEach((daftarDosen3) => {
      daftarDosen3.s_no = counter;
      worksheet.addRow(daftarDosen3);
      counter++;
    });
    let list = ["A", "B"];
    for (let i = 0; i <= counter; i++) {
      list.forEach((item) => {
        worksheet.getCell(item + i).border = {
          top: { style: "thin" },
          left: { style: "thin" },
          bottom: { style: "thin" },
          right: { style: "thin" },
        };
      });
    }
    worksheet.getRow(1).eachCell((cell) => {
      cell.font = { bold: true };
    });
  
    try {
      const data2 = await workbook.xlsx
        .writeFile(`${path}/Daftar_Dosen_Pembahas.xlsx`)
        .then(() => {
          res.download(`${path}/Daftar_Dosen_Pembahas.xlsx`, "Daftar_Dosen_Pembahas.xlsx", (err) => {
            if (err) {
              console.log(err);
            } else {
              fs.unlinkSync(`${path}/Daftar_Dosen_Pembahas.xlsx`);
            }
          });
        });
    } catch (error) {
      next(
        new Error(
          "controllers/koordinatorController.js:exportTableToExcelDaftarDosen3 - " + error.message
        )
      );
    }
  };
  
  const exportTableToPDFDaftarDosen3 = async (req, res, next) => {
      try {
        let pathFile = "./file-output";
        let fileName = "Daftar_Dosen_Pembahas.pdf";
        let fullPath = pathFile + "/" + fileName;
        let html = fs.readFileSync("./templates/templateDaftarDosen3.html", "utf-8");
        let options = {
          format: "A4",
          orientation: "portrait",
          border: "10mm",
          header: {
            height: "5mm",
            contents: '<div style="text-align: center;"></div>',
          },
          footer: {
            height: "28mm",
            contents: {
              first: "",
              2: "Second page", 
              default:
                '<span style="color: #444;">{{page}}</span>/<span>{{pages}}</span>', 
              last: "",
            },
          },
        };
        const data = await ListOfLecturer3.findAll({});
        let lecturer3s = [];
        data.forEach((daftarDosen3, no) => {
          lecturer3s.push({
            no: no + 1,
            dosenPembahas: daftarDosen3.dosenPembahas
          });
        });
        let document = {
          html: html,
          data: {
            lecturer3s: lecturer3s,
          },
          path: fullPath,
          type: "",
        };
        const process = await pdf.create(document, options);
        if (process) {
          res.download(fullPath, fileName, (err) => {
            if (err) {
              console.log(err);
            } else {
              fs.unlinkSync(fullPath);
            }
          });
        }
      } catch (error) {
        next(
          new Error(
            "controllers/koordinatorController.js:exportTableToPDFDaftarDosen3 - " + err.message
          )
        );
      }
    };

const getPengajuanJudul = async (req, res) => {
    try {
        const { id, username } = req.cookies;

        const profile = await CoordinatorUser.findOne({
            where: { id },
        });

        const dataPengajuanJudul = await TitleSubmission.findAll({
            include: [
              {
                model: DevisionOfLecturer,
                attributes: ['dosenPembimbing1', 'dosenPembimbing2'], 
              },
            ],
        });

        const dataPengajuanJudul2 = await TitleSubmission2.findAll({});


        const warna = colors.getStatusColor();
        for (const pengajuanJudul of dataPengajuanJudul) {
            pengajuanJudul.warna = colors.getStatusColor(pengajuanJudul.statusPersetujuan);
        }

        res.render('koordinator/pengajuanJudul', {
            title: 'Pengajuan Judul',
            id, 
            username,
            profile,
            dataPengajuanJudul,
            dataPengajuanJudul2,
            warna,
            colors,
            addSuccess1: req.flash('addSuccess1')
        });
    } catch (error) {
        res.status(500).json({
            status: 500,
            msg: error.message
        });
    }
};

const editPengajuanJudul = async (req, res) => {
    try {
        const { id } = req.params;

        const { statusPersetujuan, StudentUserId } = req.body;

        const dataPengajuanJudul = await TitleSubmission.findAll({});

        await TitleSubmission.update({
            statusPersetujuan,
            StudentUserId,
            dataPengajuanJudul
        }, {
            where: {
                id
            }
        });

        return res.redirect('/koordinator-skripsi/pengajuan-judul');
    } catch (error) {
        res.status(500).json({
            status: 500,
            msg: error.message
        });
    }
};

const deletePengajuanJudul = async (req, res) => {
    try {
        const { id } = req.params;

        await TitleSubmission.destroy({
            where: {
                id
            }
        });

        res.redirect('/koordinator-skripsi/pengajuan-judul');
    } catch (error) {
        res.status(500).json({
            status: 500,
            msg: error.message
        });
    }
};

const exportTableToClipboardPengajuanJudul = async (req, res, next) => {
    try {
      const data = await TitleSubmission.findAll({
        include: [
          {
            model: TitleSubmission2,
            attributes: ['judul2',], 
            as: 'judul2',
          },
          {
            model: DevisionOfLecturer,
            attributes: ['dosenPembimbing1', 'dosenPembimbing2'], 
          },
        ],
    });
  
    const csvData = data.map((pengajuanJudul, index) => {
      const judul2Value = pengajuanJudul.judul2 ? pengajuanJudul.judul2.judul2 : '';
      return `${index + 1}\t${pengajuanJudul.npm}\t${pengajuanJudul.nama}\t${pengajuanJudul.DevisionOfLecturer.dosenPembimbing1}\t${pengajuanJudul.DevisionOfLecturer.dosenPembimbing2}\t${pengajuanJudul.judul1}\t${judul2Value}\t${pengajuanJudul.statusPersetujuan}\n`;
    }).join('');
    
  
      copyPaste.copy(csvData, () => {
        req.flash('addSuccess1', 'Data pengajuan judul mahasiswa berhasil disalin ke clipboard ')
        res.redirect('/koordinator-skripsi/pengajuan-judul');
      });
    } catch (error) {
      next(new Error('controllers/koordinatorController.js:exportTableToClipboardPengajuanJudul - ' + error.message));
    }
  };
  
  const exportTableToCSVPengajuanJudul  = async (req, res, next) => {
    const path = './file-output';
  
    const data = await TitleSubmission.findAll({
      include: [
        {
          model: TitleSubmission2,
          attributes: ['judul2',], 
          as: 'judul2',
        },
        {
          model: DevisionOfLecturer,
          attributes: ['dosenPembimbing1', 'dosenPembimbing2'], 
        },
      ],
  });
  
    const csvWriter = createCsvWriter({
      path: `${path}/Pengajuan_Judul_Mahasiswa.csv`,
      header: [
        { id: 's_no', title: 'No', width: 5 },
        { id: 'npm', title: 'NPM', width: 20 },
        { id: 'nama', title: 'Nama', width: 20 },
        { id: 'dosenPembimbing1', title: 'Dosen Pembimbing 1', width: 30 },
        { id: 'dosenPembimbing2', title: 'Dosen Pembimbing 2', width: 30 },
        { id: 'judul1', title: 'Judul 1', width: 70 },
        { id: 'judul2', title: 'Judul 2', width: 70 },
        { id: 'statusPersetujuan', title: 'Status Persetujuan', width: 20 },
      ],
      alwaysQuote: true, 
    });
  
    const csvData = data.map((pengajuanJudul, index) => {
      const judul2Value = pengajuanJudul.judul2 ? pengajuanJudul.judul2.judul2 : '';
      return {
        s_no: index + 1,
        npm: pengajuanJudul.npm,
        nama: pengajuanJudul.nama,
        dosenPembimbing1: pengajuanJudul.DevisionOfLecturer.dosenPembimbing1,
        dosenPembimbing2: pengajuanJudul.DevisionOfLecturer.dosenPembimbing2,
        judul1: pengajuanJudul.judul1,
        judul2: judul2Value, 
        statusPersetujuan: pengajuanJudul.statusPersetujuan,
      };
    });
    
    let counter = 1;
    data.forEach((pengajuanJudul) => {
      pengajuanJudul.s_no = counter;
      counter++;
    });
  
    try {
      await csvWriter.writeRecords(csvData);
  
      res.download(`${path}/Pengajuan_Judul_Mahasiswa.csv`, 'Pengajuan_Judul_Mahasiswa.csv', (err) => {
        if (err) {
          console.log(err);
        } else {
          fs.unlinkSync(`${path}/Pengajuan_Judul_Mahasiswa.csv`);
        }
      });
    } catch (error) {
      next(
        new Error('controllers/koordinatorController.js:exportTableToCSVPengajuanJudul - ' + error.message)
      );
    }
  };
  
  const exportTableToExcelPengajuanJudul  = async (req, res, next) => {
  
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Mahasiswa");
    const path = "./file-output";
  
    const data = await TitleSubmission.findAll({
      include: [
        {
          model: TitleSubmission2,
          attributes: ['judul2',], 
          as: 'judul2',
        },
        {
          model: DevisionOfLecturer,
          attributes: ['dosenPembimbing1', 'dosenPembimbing2'], 
        },
      ],
  });
  
    worksheet.columns = [
      { header: 'No', key: 's_no', width: 5 },
      { header: 'NPM', key: 'npm', width: 20},
      { header: 'Nama', key: 'nama', width: 20 },
      { header: 'Dosen Pembimbing 1', key: 'dosenPembimbing1', width: 30  },
      { header: 'Dosen Pembimbing 2', key: 'dosenPembimbing2', width: 30  },
      { header: 'Judul 1', key: 'judul1', width: 70 },
      { header: 'Judul 2', key: 'judul2', width: 70 },
      { header: 'Status Persetujuan', key: 'statusPersetujuan', width: 30 },
    ];
  
    const csvData = data.map((pengajuanJudul, index) => {
      const judul2Value = pengajuanJudul.judul2 ? pengajuanJudul.judul2.judul2 : '';
      return {
        s_no: index + 1,
        npm: pengajuanJudul.npm,
        nama: pengajuanJudul.nama,
        dosenPembimbing1: pengajuanJudul.DevisionOfLecturer.dosenPembimbing1,
        dosenPembimbing2: pengajuanJudul.DevisionOfLecturer.dosenPembimbing2,
        judul1: pengajuanJudul.judul1,
        judul2: judul2Value, 
        statusPersetujuan: pengajuanJudul.statusPersetujuan,
      };
    });
      
  
    let counter = 1;
    csvData.forEach((pengajuanJudul) => {
      pengajuanJudul.s_no = counter;
      worksheet.addRow(pengajuanJudul);
      counter++;
    });
    let list = ["A", "B", "C", "D", "E", "F", "G", "H"];
    for (let i = 0; i <= counter; i++) {
      list.forEach((item) => {
        worksheet.getCell(item + i).border = {
          top: { style: "thin" },
          left: { style: "thin" },
          bottom: { style: "thin" },
          right: { style: "thin" },
        };
      });
    }
    worksheet.getRow(1).eachCell((cell) => {
      cell.font = { bold: true };
    });
  
    try {
      const data2 = await workbook.xlsx
        .writeFile(`${path}/Pengajuan_Judul_Mahasiswa.xlsx`)
        .then(() => {
          res.download(`${path}/Pengajuan_Judul_Mahasiswa.xlsx`, "Pengajuan_Judul_Mahasiswa.xlsx", (err) => {
            if (err) {
              console.log(err);
            } else {
              fs.unlinkSync(`${path}/Pengajuan_Judul_Mahasiswa.xlsx`);
            }
          });
        });
    } catch (error) {
      next(
        new Error(
          "controllers/koordinatorController.js:exportTableToExcelPengajuanJudul - " + error.message
        )
      );
    }
  };
  
  const exportTableToPDFPengajuanJudul  = async (req, res, next) => {
      try {
        let pathFile = "./file-output";
        let fileName = "Pengajuan_Judul_Mahasiswa.pdf";
        let fullPath = pathFile + "/" + fileName;
        let html = fs.readFileSync("./templates/templatePengajuanJudul.html", "utf-8");
        let options = {
          format: "A4",
          orientation: "landscape",
          border: "10mm",
          header: {
            height: "5mm",
            contents: '<div style="text-align: center;"></div>',
          },
          footer: {
            height: "28mm",
            contents: {
              first: "",
              2: "Second page", 
              default:
                '<span style="color: #444;">{{page}}</span>/<span>{{pages}}</span>', 
              last: "",
            },
          },
        };
        
        const data = await TitleSubmission.findAll({
          include: [
            {
              model: TitleSubmission2,
              attributes: ['judul2',], 
              as: 'judul2',
            },
            {
              model: DevisionOfLecturer,
              attributes: ['dosenPembimbing1', 'dosenPembimbing2'], 
            },
          ],
      });
  
      const csvData = data.map((pengajuanJudul, index) => {
        const judul2Value = pengajuanJudul.judul2 ? pengajuanJudul.judul2.judul2 : '';
        return {
          s_no: index + 1,
          npm: pengajuanJudul.npm,
          nama: pengajuanJudul.nama,
          dosenPembimbing1: pengajuanJudul.DevisionOfLecturer.dosenPembimbing1,
          dosenPembimbing2: pengajuanJudul.DevisionOfLecturer.dosenPembimbing2,
          judul1: pengajuanJudul.judul1,
          judul2: judul2Value, 
          statusPersetujuan: pengajuanJudul.statusPersetujuan,
        };
      });
  
        let titles = [];
        csvData.forEach((pengajuanJudul, no) => {
          titles.push({
            no: no + 1,
            id: pengajuanJudul._id,
            npm: pengajuanJudul.npm,
            nama: pengajuanJudul.nama,
            dosenPembimbing1: pengajuanJudul.dosenPembimbing1,
            dosenPembimbing2: pengajuanJudul.dosenPembimbing2,
            judul1: pengajuanJudul.judul1,
            judul2: pengajuanJudul.judul2,
            statusPersetujuan: pengajuanJudul.statusPersetujuan
          });
        });
        let document = {
          html: html,
          data: {
            titles : titles ,
          },
          path: fullPath,
          type: "",
        };
        const process = await pdf.create(document, options);
        if (process) {
          res.download(fullPath, fileName, (err) => {
            if (err) {
              console.log(err);
            } else {
              fs.unlinkSync(fullPath);
            }
          });
        }
      } catch (error) {
        next(
          new Error(
            "controllers/koordinatorController.js:exportTableToPDFPengajuanJudul - " + err.message
          )
        );
      }
    };

const getJudulDiterima = async (req, res) => {
    try {
        const { id, username } = req.cookies;

        const profile = await StudentUser.findOne({
            where: { id },
        });

        const dataPengajuanJudul = await TitleSubmission.findAll({
            include: [
              {
                model: DevisionOfLecturer,
                attributes: ['dosenPembimbing1', 'dosenPembimbing2'], 
              },
            ],
        });

        const dataPengajuanJudul2 = await TitleSubmission2.findAll({})
       
        const warna = colors.getStatusColor();
        for (const pengajuanJudul of dataPengajuanJudul) {
            pengajuanJudul.warna = colors.getStatusColor(pengajuanJudul.statusPersetujuan);
        }

        const dataJudul1Diterima = dataPengajuanJudul.filter(item => item.statusPersetujuan === 'Judul 1 Diterima');
        const dataJudul2Diterima = dataPengajuanJudul.filter(item => item.statusPersetujuan === 'Judul 2 Diterima');

        res.render('koordinator/judulDiterima', {
            title: 'Judul Diterima',
            id,
            username,
            profile,
            dataPengajuanJudul,
            dataPengajuanJudul2,
            warna,
            colors,
            dataJudul1Diterima,
            dataJudul2Diterima,
            addSuccess1: req.flash('addSuccess1')
        });
    } catch (error) {
        res.status(500).json({
            status: 500,
            msg: error.message
        });
    }
};

const exportTableToClipboardJudulDiterima = async (req, res, next) => {
    try {
      const data = await TitleSubmission.findAll({
        include: [
          {
            model: TitleSubmission2,
            attributes: ['judul2',], 
            as: 'judul2',
          },
          {
            model: DevisionOfLecturer,
            attributes: ['dosenPembimbing1', 'dosenPembimbing2'], 
          },
        ],
    });
  
    const filteredData = data.filter((pengajuanJudul) => {
      return pengajuanJudul.statusPersetujuan === 'Judul 1 Diterima' || pengajuanJudul.statusPersetujuan === 'Judul 2 Diterima';
    });
    
    const csvData = filteredData.map((pengajuanJudul, index) => {
      const judul2Value = pengajuanJudul.judul2 ? pengajuanJudul.judul2.judul2 : '';
      return `${index + 1}\t${pengajuanJudul.npm}\t${pengajuanJudul.nama}\t${pengajuanJudul.DevisionOfLecturer.dosenPembimbing1}\t${pengajuanJudul.DevisionOfLecturer.dosenPembimbing2}\t${pengajuanJudul.judul1}\t${judul2Value}\t${pengajuanJudul.statusPersetujuan}\n`;
    }).join('');
  
      copyPaste.copy(csvData, () => {
        req.flash('addSuccess1', 'Data pengajuan judul mahasiswa berhasil disalin ke clipboard ')
        res.redirect('/koordinator-skripsi/judul-diterima');
      });
    } catch (error) {
      next(new Error('controllers/koordinatorController.js:exportTableToClipboardJudulDiterima - ' + error.message));
    }
  };
  
  const exportTableToCSVJudulDiterima  = async (req, res, next) => {
    const path = './file-output';
  
    const data = await TitleSubmission.findAll({
      include: [
        {
          model: TitleSubmission2,
          attributes: ['judul2',], 
          as: 'judul2',
        },
        {
          model: DevisionOfLecturer,
          attributes: ['dosenPembimbing1', 'dosenPembimbing2'], 
        },
      ],
  });
  
    const csvWriter = createCsvWriter({
      path: `${path}/Pengajuan_Judul_Mahasiswa.csv`,
      header: [
        { id: 's_no', title: 'No', width: 5 },
        { id: 'npm', title: 'NPM', width: 20 },
        { id: 'nama', title: 'Nama', width: 20 },
        { id: 'dosenPembimbing1', title: 'Dosen Pembimbing 1', width: 30 },
        { id: 'dosenPembimbing2', title: 'Dosen Pembimbing 2', width: 30 },
        { id: 'judul1', title: 'Judul 1', width: 70 },
        { id: 'judul2', title: 'Judul 2', width: 70 },
        { id: 'statusPersetujuan', title: 'Status Persetujuan', width: 20 },
      ],
      alwaysQuote: true, 
    });
  
  
    const csvData = data.map((pengajuanJudul, index) => {
      const judul2Value = pengajuanJudul.judul2 ? pengajuanJudul.judul2.judul2 : '';
      return {
        s_no: index + 1,
        npm: pengajuanJudul.npm,
        nama: pengajuanJudul.nama,
        dosenPembimbing1: pengajuanJudul.DevisionOfLecturer.dosenPembimbing1,
        dosenPembimbing2: pengajuanJudul.DevisionOfLecturer.dosenPembimbing2,
        judul1: pengajuanJudul.judul1,
        judul2: judul2Value, 
        statusPersetujuan: pengajuanJudul.statusPersetujuan,
      };
    });
  
    const filteredData = csvData.filter((pengajuanJudul) => {
      return pengajuanJudul.statusPersetujuan === 'Judul 1 Diterima' || pengajuanJudul.statusPersetujuan === 'Judul 2 Diterima';
    });
    
    let counter = 1;
    data.forEach((pengajuanJudul) => {
      pengajuanJudul.s_no = counter;
      counter++;
    });
  
    try {
      await csvWriter.writeRecords(filteredData);
  
      res.download(`${path}/Pengajuan_Judul_Mahasiswa.csv`, 'Pengajuan_Judul_Mahasiswa.csv', (err) => {
        if (err) {
          console.log(err);
        } else {
          fs.unlinkSync(`${path}/Pengajuan_Judul_Mahasiswa.csv`);
        }
      });
    } catch (error) {
      next(
        new Error('controllers/koordinatorController.js:exportTableToCSVJudulDiterima - ' + error.message)
      );
    }
  };
  
  const exportTableToExcelJudulDiterima  = async (req, res, next) => {
  
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Mahasiswa");
    const path = "./file-output";
  
    const data = await TitleSubmission.findAll({
      include: [
        {
          model: TitleSubmission2,
          attributes: ['judul2',], 
          as: 'judul2',
        },
        {
          model: DevisionOfLecturer,
          attributes: ['dosenPembimbing1', 'dosenPembimbing2'], 
        },
      ],
  });
  
    worksheet.columns = [
      { header: 'No', key: 's_no', width: 5 },
      { header: 'NPM', key: 'npm', width: 20},
      { header: 'Nama', key: 'nama', width: 20 },
      { header: 'Dosen Pembimbing 1', key: 'dosenPembimbing1', width: 30  },
      { header: 'Dosen Pembimbing 2', key: 'dosenPembimbing2', width: 30  },
      { header: 'Judul 1', key: 'judul1', width: 70 },
      { header: 'Judul 2', key: 'judul2', width: 70 },
      { header: 'Status Persetujuan', key: 'statusPersetujuan', width: 30 },
    ];
  
    const csvData = data.map((pengajuanJudul, index) => {
      const judul2Value = pengajuanJudul.judul2 ? pengajuanJudul.judul2.judul2 : '';
      return {
        s_no: index + 1,
        npm: pengajuanJudul.npm,
        nama: pengajuanJudul.nama,
        dosenPembimbing1: pengajuanJudul.DevisionOfLecturer.dosenPembimbing1,
        dosenPembimbing2: pengajuanJudul.DevisionOfLecturer.dosenPembimbing2,
        judul1: pengajuanJudul.judul1,
        judul2: judul2Value, 
        statusPersetujuan: pengajuanJudul.statusPersetujuan,
      };
    });
  
    const filteredData = csvData.filter((pengajuanJudul) => {
      return pengajuanJudul.statusPersetujuan === 'Judul 1 Diterima' || pengajuanJudul.statusPersetujuan === 'Judul 2 Diterima';
    });
  
    let counter = 1;
    filteredData.forEach((pengajuanJudul) => {
      pengajuanJudul.s_no = counter;
      worksheet.addRow(pengajuanJudul);
      counter++;
    });
    let list = ["A", "B", "C", "D", "E", "F", "G", "H"];
    for (let i = 0; i <= counter; i++) {
      list.forEach((item) => {
        worksheet.getCell(item + i).border = {
          top: { style: "thin" },
          left: { style: "thin" },
          bottom: { style: "thin" },
          right: { style: "thin" },
        };
      });
    }
    worksheet.getRow(1).eachCell((cell) => {
      cell.font = { bold: true };
    });
  
    try {
      const data2 = await workbook.xlsx
        .writeFile(`${path}/Pengajuan_Judul_Mahasiswa.xlsx`)
        .then(() => {
          res.download(`${path}/Pengajuan_Judul_Mahasiswa.xlsx`, "Pengajuan_Judul_Mahasiswa.xlsx", (err) => {
            if (err) {
              console.log(err);
            } else {
              fs.unlinkSync(`${path}/Pengajuan_Judul_Mahasiswa.xlsx`);
            }
          });
        });
    } catch (error) {
      next(
        new Error(
          "controllers/koordinatorController.js:exportTableToExcelJudulDiterima - " + error.message
        )
      );
    }
  };
  
  const exportTableToPDFJudulDiterima  = async (req, res, next) => {
      try {
        let pathFile = "./file-output";
        let fileName = "Pengajuan_Judul_Mahasiswa.pdf";
        let fullPath = pathFile + "/" + fileName;
        let html = fs.readFileSync("./templates/templateJudulDiterima.html", "utf-8");
        let options = {
          format: "A4",
          orientation: "landscape",
          border: "10mm",
          header: {
            height: "5mm",
            contents: '<div style="text-align: center;"></div>',
          },
          footer: {
            height: "28mm",
            contents: {
              first: "",
              2: "Second page", 
              default:
                '<span style="color: #444;">{{page}}</span>/<span>{{pages}}</span>', 
              last: "",
            },
          },
        };
        
        const data = await TitleSubmission.findAll({
          include: [
            {
              model: TitleSubmission2,
              attributes: ['judul2',], 
              as: 'judul2',
            },
            {
              model: DevisionOfLecturer,
              attributes: ['dosenPembimbing1', 'dosenPembimbing2'], 
            },
          ],
      });
  
      const csvData = data.map((pengajuanJudul, index) => {
        const judul2Value = pengajuanJudul.judul2 ? pengajuanJudul.judul2.judul2 : '';
        return {
          s_no: index + 1,
          npm: pengajuanJudul.npm,
          nama: pengajuanJudul.nama,
          dosenPembimbing1: pengajuanJudul.DevisionOfLecturer.dosenPembimbing1,
          dosenPembimbing2: pengajuanJudul.DevisionOfLecturer.dosenPembimbing2,
          judul1: pengajuanJudul.judul1,
          judul2: judul2Value, 
          statusPersetujuan: pengajuanJudul.statusPersetujuan,
        };
      });
  
      const filteredData = csvData.filter((pengajuanJudul) => {
        return pengajuanJudul.statusPersetujuan === 'Judul 1 Diterima' || pengajuanJudul.statusPersetujuan === 
  'Judul 2 Diterima';
      });
  
        let titles = [];
        filteredData .forEach((pengajuanJudul, no) => {
          titles.push({
            no: no + 1,
            id: pengajuanJudul._id,
            npm: pengajuanJudul.npm,
            nama: pengajuanJudul.nama,
            dosenPembimbing1: pengajuanJudul.dosenPembimbing1,
            dosenPembimbing2: pengajuanJudul.dosenPembimbing2,
            judul1: pengajuanJudul.judul1,
            judul2: pengajuanJudul.judul2,
            statusPersetujuan: pengajuanJudul.statusPersetujuan
          });
        });
        let document = {
          html: html,
          data: {
            titles : titles ,
          },
          path: fullPath,
          type: "",
        };
        const process = await pdf.create(document, options);
        if (process) {
          res.download(fullPath, fileName, (err) => {
            if (err) {
              console.log(err);
            } else {
              fs.unlinkSync(fullPath);
            }
          });
        }
      } catch (error) {
        next(
          new Error(
            "controllers/koordinatorController.js:exportTableToPDFJudulDiterima - " + err.message
          )
        );
      }
    }

const getProposal = async (req, res) => {
    try {
        const { id, username } = req.cookies;

        const profile = await StudentUser.findOne({
            where: { id },
        });

        const dataProposal = await Proposal.findAll({
            include: [
              {
                model: DevisionOfLecturer,
                attributes: ['dosenPembimbing1', 'dosenPembimbing2', 'dosenPembahas'], 
              },
              {
                model: TitleSubmission,
                attributes: ['judul1', 'statusPersetujuan'], 
              },
              {
                model: TitleSubmission2,
                attributes: ['judul2'], 
              },
            ],
        });

        const warna5 = {};
        dataProposal.forEach((proposalStatus) => {
            warna5[proposalStatus.id] = colors.getStatusColor5(proposalStatus.statusProposal);
        });

        res.render('koordinator/proposal', {
            title: 'Proposal',
            id,
            username,
            profile,
            dataProposal,
            warna5,
            colors,
            addSuccess1: req.flash('addSuccess1')
        });
    } catch (error) {
        res.status(500).json({
            status: 500,
            msg: error.message
        });
    }
};

const downloadProposal = async (req, res) => {
    try {
        const { id } = req.params;

        const proposal = await Proposal.findOne({
            where: { id },
        });

        if (!proposal) {
            return res.status(404).send('Proposal tidak ditemukan.');
        }

        const proposalPath = `./upload/${proposal.proposal}`;
        res.download(proposalPath);
    } catch (error) {
        res.status(500).json({
            status: 500,
            msg: error.message,
        });
    }
};

const editProposal = async (req, res) => {
    try {
        const { id } = req.params;
        const { statusProposal, StudentUserId } = req.body;

        const dataProposal = await Proposal.findAll({});

        await Proposal.update({
            statusProposal,
            StudentUserId,
            dataProposal,
        }, {
            where: {
                id
            }
        });

        return res.redirect('/koordinator-skripsi/proposal');
    } catch (error) {
        res.status(500).json({
            status: 500,
            msg: error.message
        });
    }
};

const deleteProposal = async (req, res) => {
    try {
        const { id } = req.params;

        await Proposal.destroy({
            where: {
                id
            }
        });

        req.flash('deleteSuccess', 'Data proposal mahasiswa berhasil DIHAPUS!');
        res.redirect('/koordinator-skripsi/proposal');
    } catch (error) {
        res.status(500).json({
            status: 500,
            msg: error.message
        });
    }
};

const downloadProposalRevisi1 = async (req, res) => {
    try {
      const { id } = req.params;
  
      const proposalRevisi1 = await Proposal.findOne({
        where: { id },
      });
  
      if (!proposalRevisi1) {
        return res.status(404).send('Proposal tidak ditemukan.');
      }
  
      const proposalRevisi1Path = `./uploadRevisi1/${proposalRevisi1.proposalRevisi1}`;
      res.download(proposalRevisi1Path);
    } catch (error) {
      res.status(500).json({
        status: 500,
        msg: error.message,
      });
    }
}; 

const downloadProposalRevisi2 = async (req, res) => {
    try {
      const { id } = req.params;
  
      const proposalRevisi2 = await Proposal.findOne({
        where: { id },
      });
  
      if (!proposalRevisi2) {
        return res.status(404).send('Proposal tidak ditemukan.');
      }
  
      const proposalRevisi2Path = `./uploadRevisi2/${proposalRevisi2.proposalRevisi2}`;
      res.download(proposalRevisi2Path);
    } catch (error) {
      res.status(500).json({
        status: 500,
        msg: error.message,
      });
    }
};

const downloadProposalRevisiDosen1 = async (req, res) => {
  try {
    const { id } = req.params;

    const proposalRevisiDosen1 = await Proposal.findOne({
      where: { id },
    });

    if (!proposalRevisiDosen1) {
      return res.status(404).send('Proposal tidak ditemukan.');
    }

    const proposalRevisiDosen1Path = `./uploadProposalRevisiDosen1/${proposalRevisiDosen1.proposalRevisiDosen1}`;
    res.download(proposalRevisiDosen1Path);
  } catch (error) {
    res.status(500).json({
      status: 500,
      msg: error.message,
    });
  }
}; 

const downloadProposalRevisiDosen2 = async (req, res) => {
  try {
    const { id } = req.params;

    const proposalRevisiDosen2 = await Proposal.findOne({
      where: { id },
    });

    if (!proposalRevisiDosen2) {
      return res.status(404).send('Proposal tidak ditemukan.');
    }

    const proposalRevisiDosen2Path = `./uploadProposalRevisiDosen2/${proposalRevisiDosen2.proposalRevisiDosen2}`;
    res.download(proposalRevisiDosen2Path);
  } catch (error) {
    res.status(500).json({
      status: 500,
      msg: error.message,
    });
  }
};

const exportTableToClipboardProposal = async (req, res, next) => {
    try {
      const data = await Proposal.findAll({
        include: [
          {
            model: DevisionOfLecturer,
            attributes: ['dosenPembimbing1', 'dosenPembimbing2', 'dosenPembahas'], 
          },
          {
            model: TitleSubmission,
            attributes: ['judul1', 'statusPersetujuan'], 
          },
          {
            model: TitleSubmission2,
            attributes: ['judul2'], 
          },
        ],
    });
    
    const csvData = data.map((proposal, index) => {
      const judulValue = proposal.TitleSubmission
        ? proposal.TitleSubmission.statusPersetujuan === 'Judul 1 Diterima'
          ? proposal.TitleSubmission.judul1
          : proposal.TitleSubmission.statusPersetujuan === 'Judul 2 Diterima'
          ? proposal.TitleSubmission2.judul2
          : '-'
        : '-';
      return `${index + 1}\t${proposal.npm}\t${proposal.nama}\t${judulValue}\t${proposal.DevisionOfLecturer.dosenPembimbing1}\t${proposal.DevisionOfLecturer.dosenPembimbing2}\t${proposal.DevisionOfLecturer.dosenPembahas}\t${proposal.tanggalPengajuan}\t${proposal.proposal}\t${proposal.revisi1}\t${proposal.revisi2}\t${proposal.proposalRevisi1}\t${proposal.proposalRevisi2}\t${proposal.statusProposal}\t${proposal.jadwalSeminarProposal}\n`;
    }).join('');
    
      copyPaste.copy(csvData, () => {
        req.flash('addSuccess1', 'Data bimbingan proposal mahasiswa berhasil disalin ke clipboard ')
        res.redirect('/koordinator-skripsi/proposal');
      });
    } catch (error) {
      next(new Error('controllers/koordinatorController.js:exportTableToClipboardProposal - ' + error.message));
    }
  };
    
  const exportTableToCSVProposal  = async (req, res, next) => {
    const path = './file-output';
    
    const data = await Proposal.findAll({
      include: [
        {
          model: DevisionOfLecturer,
          attributes: ['dosenPembimbing1', 'dosenPembimbing2', 'dosenPembahas'], 
        },
        {
          model: TitleSubmission,
          attributes: ['judul1', 'statusPersetujuan'], 
        },
        {
          model: TitleSubmission2,
          attributes: ['judul2'], 
        },
      ],
  });
    
    const csvWriter = createCsvWriter({
      path: `${path}/Bimbingan_Proposal.csv`,
      header: [
        { id: 's_no', title: 'No', width: 5 },
        { id: 'npm', title: 'NPM', width: 20 },
        { id: 'nama', title: 'Nama', width: 20 },
        { id: 'judul', title: 'Judul', width: 20 },
        { id: 'dosenPembimbing1', title: 'Dosen Pembimbing 1', width: 30 },
        { id: 'dosenPembimbing2', title: 'Dosen Pembimbing 2', width: 30 },
        { id: 'dosenPembahas', title: 'Dosen Pembahas', width: 30 },
        { id: 'tanggalPengajuan', title: 'Tanggal Pengajuan', width: 30 },
        { id: 'proposal', title: 'Proposal Mahasiswa', width: 70 },
        { id: 'revisi1', title: 'Revisi Dari Dosen Pb 1', width: 70 },
        { id: 'revisi2', title: 'Revisi Dari Dosen Pb 2', width: 70 },
        { id: 'proposalRevisi1', title: 'Revisi Bimbingan Proposal Mahasiswa Pb 1', width: 70 },
        { id: 'proposalRevisi2', title: 'Revisi Bimbingan Proposal Mahasiswa Pb 2', width: 70 },
        { id: 'statusProposal', title: 'Status Proposal', width: 20 },
        { id: 'jadwalSeminarProposal', title: 'Jadwal Seminar Proposal', width: 20 }
      ],
      alwaysQuote: true, 
    });
    
    const csvData = data.map((proposal, index) => {
      const judulValue = proposal.TitleSubmission
    ? proposal.TitleSubmission.statusPersetujuan === 'Judul 1 Diterima'
      ? proposal.TitleSubmission.judul1
      : proposal.TitleSubmission.statusPersetujuan === 'Judul 2 Diterima'
      ? proposal.TitleSubmission2.judul2
      : '-'
    : '-';
      return {
        s_no: index + 1,
        npm: proposal.npm,
        nama: proposal.nama,
        judul: judulValue,
        dosenPembimbing1: proposal.DevisionOfLecturer.dosenPembimbing1,
        dosenPembimbing2: proposal.DevisionOfLecturer.dosenPembimbing2,
        dosenPembahas: proposal.DevisionOfLecturer.dosenPembahas,
        tanggalPengajuan: proposal.tanggalPengajuan, 
        proposal: proposal.proposal, 
        revisi1: proposal.revisi1,
        revisi2: proposal.revisi2,
        proposalRevisi1: proposal.proposalRevisi1,
        proposalRevisi2: proposal.proposalRevisi2,
        statusProposal: proposal.statusProposal,
        jadwalSeminarProposal: proposal.jadwalSeminarProposal,
      };
    });
    
    let counter = 1;
    data.forEach((proposal) => {
      proposal.s_no = counter;
      counter++;
    });
    
    try {
      await csvWriter.writeRecords(csvData);
    
      res.download(`${path}/Bimbingan_Proposal.csv`, 'Bimbingan_Proposal.csv', (err) => {
        if (err) {
          console.log(err);
        } else {
          fs.unlinkSync(`${path}/Bimbingan_Proposal.csv`);
        }
      });
    } catch (error) {
      next(
        new Error('controllers/koordinatorController.js:exportTableToCSVProposal - ' + error.message)
      );
    }
  };
    
  const exportTableToExcelProposal  = async (req, res, next) => {
    
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("BimbinganProposal");
    const path = "./file-output";
  
    const data = await Proposal.findAll({
      include: [
        {
          model: DevisionOfLecturer,
          attributes: ['dosenPembimbing1', 'dosenPembimbing2', 'dosenPembahas'], 
        },
        {
          model: TitleSubmission,
          attributes: ['judul1', 'statusPersetujuan'], 
        },
        {
          model: TitleSubmission2,
          attributes: ['judul2'], 
        },
      ],
  });
    
    worksheet.columns = [
      { header: 'No', key: 's_no', width: 5 },
      { header: 'NPM', key: 'npm', width: 20},
      { header: 'Nama', key: 'nama', width: 20 },
      { header: 'Judul', key: 'judul', width: 20 },
      { header: 'Dosen Pembimbing 1', key: 'dosenPembimbing1', width: 30  },
      { header: 'Dosen Pembimbing 2', key: 'dosenPembimbing2', width: 30  },
      { header: 'Dosen Pembahas', key: 'dosenPembahas', width: 30  },
      { header: 'Tanggal Pengajuan', key: 'tanggalPengajuan', width: 70 },
      { header: 'Proposal', key: 'proposal', width: 70 },
      { header: 'Revisi dari Pb 1', key: 'revisi1', width: 70 },
      { header: 'Revisi dari Pb 2', key: 'revisi2', width: 70 },
      { header: 'Proposal Revisi Mahasiswa Pb 1', key: 'proposalRevisi1', width: 70 },
      { header: 'Proposal Revisi Mahasiswa Pb 2', key: 'proposalRevisi2', width: 70 },
      { header: 'Status Proposal', key: 'statusProposal', width: 30 },
      { header: 'Jadwal Seminar Proposal', key: 'jadwalSeminarProposal', width: 30 }
    ];
    
    const csvData = data.map((proposal, index) => {
      const judulValue = proposal.TitleSubmission
      ? proposal.TitleSubmission.statusPersetujuan === 'Judul 1 Diterima'
        ? proposal.TitleSubmission.judul1
        : proposal.TitleSubmission.statusPersetujuan === 'Judul 2 Diterima'
        ? proposal.TitleSubmission2.judul2
        : '-'
      : '-';
      return {
        s_no: index + 1,
        npm: proposal.npm,
        nama: proposal.nama,
        judul: judulValue,
        dosenPembimbing1: proposal.DevisionOfLecturer.dosenPembimbing1,
        dosenPembimbing2: proposal.DevisionOfLecturer.dosenPembimbing2,
        dosenPembahas: proposal.DevisionOfLecturer.dosenPembahas,
        tanggalPengajuan: proposal.tanggalPengajuan, 
        proposal: proposal.proposal, 
        revisi1: proposal.revisi1,
        revisi2: proposal.revisi2,
        proposalRevisi1: proposal.proposalRevisi1,
        proposalRevisi2: proposal.proposalRevisi2,
        statusProposal: proposal.statusProposal,
        jadwalSeminarProposal: proposal.jadwalSeminarProposal,
      };
    });
      
    
    let counter = 1;
    csvData.forEach((proposal) => {
      proposal.s_no = counter;
      worksheet.addRow(proposal);
      counter++;
    });
    let list = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O" ];
    for (let i = 0; i <= counter; i++) {
      list.forEach((item) => {
        worksheet.getCell(item + i).border = {
          top: { style: "thin" },
          left: { style: "thin" },
          bottom: { style: "thin" },
          right: { style: "thin" },
        };
      });
    }
    worksheet.getRow(1).eachCell((cell) => {
      cell.font = { bold: true };
    });
    
    try {
      const data2 = await workbook.xlsx
        .writeFile(`${path}/Bimbingan_Proposal.xlsx`)
        .then(() => {
          res.download(`${path}/Bimbingan_Proposal.xlsx`, "Bimbingan_Proposal.xlsx", (err) => {
            if (err) {
              console.log(err);
            } else {
              fs.unlinkSync(`${path}/Bimbingan_Proposal.xlsx`);
            }
          });
        });
    } catch (error) {
      next(
        new Error(
          "controllers/koordinatorController.js:exportTableToExcelProposal - " + error.message
        )
      );
    }
  };
  const exportTableToPDFProposal  = async (req, res, next) => {
    try {
      let pathFile = "./file-output";
      let fileName = "Bimbingan_Proposal.pdf";
      let fullPath = pathFile + "/" + fileName;
      let html = fs.readFileSync("./templates/templateProposal.html", "utf-8");
      let options = {
        format: "A4",
        orientation: "landscape",
        border: "10mm",
        header: {
          height: "5mm",
          contents: '<div style="text-align: center;"></div>',
        },
        footer: {
          height: "28mm",
          contents: {
            first: "",
            2: "Second page", 
            default:
              '<span style="color: #444;">{{page}}</span>/<span>{{pages}}</span>', 
            last: "",
          },
        },
      };
      
      const data = await Proposal.findAll({
        include: [
          {
            model: DevisionOfLecturer,
            attributes: ['dosenPembimbing1', 'dosenPembimbing2', 'dosenPembahas'], 
          },
          {
            model: TitleSubmission,
            attributes: ['judul1', 'statusPersetujuan'], 
          },
          {
            model: TitleSubmission2,
            attributes: ['judul2'], 
          },
        ],
    });
    const proposals = data.map((proposal, index) => {
      const judulValue = proposal.TitleSubmission
        ? proposal.TitleSubmission.statusPersetujuan === 'Judul 1 Diterima'
          ? proposal.TitleSubmission.judul1
          : proposal.TitleSubmission.statusPersetujuan === 'Judul 2 Diterima'
          ? proposal.TitleSubmission2.judul2
          : '-'
        : '-';
      const dosenPembimbing1 = proposal.DevisionOfLecturer?.dosenPembimbing1 || '-';
      const dosenPembimbing2 = proposal.DevisionOfLecturer?.dosenPembimbing2 || '-';
      const dosenPembahas = proposal.DevisionOfLecturer?.dosenPembahas || '-';
      return {
        s_no: index + 1,
        npm: proposal.npm || '-',
        nama: proposal.nama || '-',
        judul: judulValue,
        dosenPembimbing1,
        dosenPembimbing2,
        dosenPembahas,
        tanggalPengajuan: proposal.tanggalPengajuan || '-',
        proposal: proposal.proposal || '-',
        revisi1: proposal.revisi1 || '-',
        revisi2: proposal.revisi2 || '-',
        proposalRevisi1: proposal.proposalRevisi1 || '-',
        proposalRevisi2: proposal.proposalRevisi2 || '-',
        statusProposal: proposal.statusProposal || '-',
        jadwalSeminarProposal: proposal.jadwalSeminarProposal || '-',
      };
    });
    const document = {
      html: html,
      data: {
        proposals: proposals,
      },
      path: fullPath,
      type: "",
    };
    const process = await pdf.create(document, options);
    if (process) {
      res.download(fullPath, fileName, (err) => {
        if (err) {
          console.log(err);
        } else {
          fs.unlinkSync(fullPath);
        }
      });
    }
  } catch (error) {
    next(
      new Error(
        "controllers/koordinatorController.js:exportTableToPDFProposal - " + error.message
      )
    );
  }
};

const getProposalMasuk = async (req, res) => {
    try {
        const { id, username } = req.cookies;

        const profile = await StudentUser.findOne({
            where: { id },
        });

        const dataProposal = await Proposal.findAll({
            include: [
              {
                model: DevisionOfLecturer,
                attributes: ['dosenPembimbing1', 'dosenPembimbing2', 'dosenPembahas'], 
              },
              {
                model: TitleSubmission,
                attributes: ['judul1', 'statusPersetujuan'], 
              },
              {
                model: TitleSubmission2,
                attributes: ['judul2'], 
              },
            ],
        });

        res.render('koordinator/proposalMasuk', {
            title: 'Proposal Masuk',
            id,
            username,
            profile,
            dataProposal,
            addSuccess1: req.flash('addSuccess1')
        });
    } catch (error) {
        res.status(500).json({
            status: 500,
            msg: error.message
        });
    }
};

const editProposalMasuk = async (req, res) => {
    try {
        const { id } = req.params;
        const { statusProposal, StudentUserId, jadwalSeminarProposal } = req.body;

        const dataProposal = await Proposal.findAll({});

        await Proposal.update({
            statusProposal,
            StudentUserId,
            dataProposal,
            jadwalSeminarProposal
        }, {
            where: {
                id
            }
        });

        return res.redirect('/koordinator-skripsi/proposal-masuk');
    } catch (error) {
        res.status(500).json({
            status: 500,
            msg: error.message
        });
    }
};

const exportTableToClipboardProposalMasuk = async (req, res, next) => {
  try {
    const data = await Proposal.findAll({
      include: [
        {
          model: DevisionOfLecturer,
          attributes: ['dosenPembimbing1', 'dosenPembimbing2', 'dosenPembahas'], 
        },
        {
          model: TitleSubmission,
          attributes: ['judul1', 'statusPersetujuan'], 
        },
        {
          model: TitleSubmission2,
          attributes: ['judul2'], 
        },
      ],
  });

  const csvData = data
  .filter(proposalMasuk => !proposalMasuk.jadwalSeminarProposal) 
  .map((proposalMasuk, index) => {
    const judulValue = proposalMasuk.TitleSubmission
      ? proposalMasuk.TitleSubmission.statusPersetujuan === 'Judul 1 Diterima'
        ? proposalMasuk.TitleSubmission.judul1
        : proposalMasuk.TitleSubmission.statusPersetujuan === 'Judul 2 Diterima'
        ? proposalMasuk.TitleSubmission2.judul2
        : '-'
      : '-';
    return `${index + 1}\t${proposalMasuk.npm}\t${proposalMasuk.nama}\t${judulValue}\t${proposalMasuk.DevisionOfLecturer.dosenPembimbing1}\t${proposalMasuk.DevisionOfLecturer.dosenPembimbing2}\t${proposalMasuk.DevisionOfLecturer.dosenPembahas}\t${proposalMasuk.tanggalPengajuan}\t${proposalMasuk.proposal}\t${proposalMasuk.jadwalSeminarProposal}\n`;
  })
  .join('');

  
    copyPaste.copy(csvData, () => {
      req.flash('addSuccess1', 'Data proposal masuk berhasil disalin ke clipboard ')
      res.redirect('/koordintor-skripsi/proposal-masuk');
    });
  } catch (error) {
    next(new Error('controllers/koordinatorController.js:exportTableToClipboardProposalMasuk - ' + error.message));
  }
};
  
const exportTableToCSVProposalMasuk  = async (req, res, next) => {
  const path = './file-output';
  
  const data = await Proposal.findAll({
    include: [
      {
        model: DevisionOfLecturer,
        attributes: ['dosenPembimbing1', 'dosenPembimbing2', 'dosenPembahas'], 
      },
      {
        model: TitleSubmission,
        attributes: ['judul1', 'statusPersetujuan'], 
      },
      {
        model: TitleSubmission2,
        attributes: ['judul2'], 
      },
    ],
});
  
  const csvWriter = createCsvWriter({
    path: `${path}/Proposal_Masuk.csv`,
    header: [
      { id: 's_no', title: 'No', width: 5 },
      { id: 'npm', title: 'NPM', width: 20 },
      { id: 'nama', title: 'Nama', width: 20 },
      { id: 'judul', title: 'Judul', width: 20 },
      { id: 'dosenPembimbing1', title: 'Dosen Pembimbing 1', width: 30 },
      { id: 'dosenPembimbing2', title: 'Dosen Pembimbing 2', width: 30 },
      { id: 'dosenPembahas', title: 'Dosen Pembahas', width: 30 },
      { id: 'tanggalPengajuan', title: 'Tanggal Pengajuan', width: 30 },
      { id: 'proposal', title: 'Proposal Mahasiswa', width: 70 },
      { id: 'jadwalSeminarProposal', title: 'Jadwal Seminar Proposal', width: 20 }
    ],
    alwaysQuote: true, 
  });
  
  const filteredData = data
  .filter(proposalMasuk => !proposalMasuk.jadwalSeminarProposal);

  const csvData = filteredData.map((proposalMasuk, index) => {
    const judulValue = proposalMasuk.TitleSubmission
  ? proposalMasuk.TitleSubmission.statusPersetujuan === 'Judul 1 Diterima'
    ? proposalMasuk.TitleSubmission.judul1
    : proposalMasuk.TitleSubmission.statusPersetujuan === 'Judul 2 Diterima'
    ? proposalMasuk.TitleSubmission2.judul2
    : '-'
  : '-';
    return {
      s_no: index + 1,
      npm: proposalMasuk.npm,
      nama: proposalMasuk.nama,
      judul: judulValue,
      dosenPembimbing1: proposalMasuk.DevisionOfLecturer.dosenPembimbing1,
      dosenPembimbing2: proposalMasuk.DevisionOfLecturer.dosenPembimbing2,
      dosenPembahas: proposalMasuk.DevisionOfLecturer.dosenPembahas,
      tanggalPengajuan: proposalMasuk.tanggalPengajuan, 
      proposal: proposalMasuk.proposal, 
      jadwalSeminarProposal: proposalMasuk.jadwalSeminarProposal,
    };
  });
  
  let counter = 1;
  data.forEach((proposalMasuk) => {
    proposalMasuk.s_no = counter;
    counter++;
  });
  
  try {
    await csvWriter.writeRecords(csvData);
  
    res.download(`${path}/Proposal_Masuk.csv`, 'Proposal_Masuk.csv', (err) => {
      if (err) {
        console.log(err);
      } else {
        fs.unlinkSync(`${path}/Proposal_Masuk.csv`);
      }
    });
  } catch (error) {
    next(
      new Error('controllers/koordinatorController.js:exportTableToCSVProposalMasuk - ' + error.message)
    );
  }
};
  
const exportTableToExcelProposalMasuk  = async (req, res, next) => {
  
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("ProposalMasuk");
  const path = "./file-output";

  const data = await Proposal.findAll({
    include: [
      {
        model: DevisionOfLecturer,
        attributes: ['dosenPembimbing1', 'dosenPembimbing2', 'dosenPembahas'], 
      },
      {
        model: TitleSubmission,
        attributes: ['judul1', 'statusPersetujuan'], 
      },
      {
        model: TitleSubmission2,
        attributes: ['judul2'], 
      },
    ],
});
  
  worksheet.columns = [
    { header: 'No', key: 's_no', width: 5 },
    { header: 'NPM', key: 'npm', width: 20},
    { header: 'Nama', key: 'nama', width: 20 },
    { header: 'Judul', key: 'judul', width: 20 },
    { header: 'Dosen Pembimbing 1', key: 'dosenPembimbing1', width: 30  },
    { header: 'Dosen Pembimbing 2', key: 'dosenPembimbing2', width: 30  },
    { header: 'Dosen Pembahas', key: 'dosenPembahas', width: 30  },
    { header: 'Tanggal Pengajuan', key: 'tanggalPengajuan', width: 70 },
    { header: 'Proposal', key: 'proposal', width: 70 },
    { header: 'Jadwal Seminar Proposal', key: 'jadwalSeminarProposal', width: 30 }
  ];

  const filteredData = data
.filter(proposalMasuk => !proposalMasuk.jadwalSeminarProposal);
  
  const csvData = filteredData.map((proposalMasuk, index) => {
    const judulValue = proposalMasuk.TitleSubmission
    ? proposalMasuk.TitleSubmission.statusPersetujuan === 'Judul 1 Diterima'
      ? proposalMasuk.TitleSubmission.judul1
      : proposalMasuk.TitleSubmission.statusPersetujuan === 'Judul 2 Diterima'
      ? proposalMasuk.TitleSubmission2.judul2
      : '-'
    : '-';
    return {
      s_no: index + 1,
      npm: proposalMasuk.npm,
      nama: proposalMasuk.nama,
      judul: judulValue,
      dosenPembimbing1: proposalMasuk.DevisionOfLecturer.dosenPembimbing1,
      dosenPembimbing2: proposalMasuk.DevisionOfLecturer.dosenPembimbing2,
      dosenPembahas: proposalMasuk.DevisionOfLecturer.dosenPembahas,
      tanggalPengajuan: proposalMasuk.tanggalPengajuan, 
      proposal: proposalMasuk.proposal, 
      jadwalSeminarProposal: proposalMasuk.jadwalSeminarProposal,
    };
  });
    
  
  let counter = 1;
  csvData.forEach((proposalMasuk) => {
    proposalMasuk.s_no = counter;
    worksheet.addRow(proposalMasuk);
    counter++;
  });
  let list = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J"];
  for (let i = 0; i <= counter; i++) {
    list.forEach((item) => {
      worksheet.getCell(item + i).border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      };
    });
  }
  worksheet.getRow(1).eachCell((cell) => {
    cell.font = { bold: true };
  });
  
  try {
    const data2 = await workbook.xlsx
      .writeFile(`${path}/Proposal_Masuk.xlsx`)
      .then(() => {
        res.download(`${path}/Proposal_Masuk.xlsx`, "Proposal_Masuk.xlsx", (err) => {
          if (err) {
            console.log(err);
          } else {
            fs.unlinkSync(`${path}/Proposal_Masuk.xlsx`);
          }
        });
      });
  } catch (error) {
    next(
      new Error(
        "controllers/koordinatorController.js:exportTableToExcelProposalMasuk - " + error.message
      )
    );
  }
};

const exportTableToPDFProposalMasuk = async (req, res, next) => {
  try {
    let pathFile = "./file-output";
    let fileName = "Proposal_Masuk.pdf";
    let fullPath = pathFile + "/" + fileName;
    let html = fs.readFileSync("./templates/templateProposalMasuk.html", "utf-8");
    let options = {
      format: "A4",
      orientation: "landscape",
      border: "10mm",
      header: {
        height: "5mm",
        contents: '<div style="text-align: center;"></div>',
      },
      footer: {
        height: "28mm",
        contents: {
          first: "",
          2: "Second page", 
          default:
            '<span style="color: #444;">{{page}}</span>/<span>{{pages}}</span>', 
          last: "",
        },
      },
    };
    
    const data = await Proposal.findAll({
      include: [
        {
          model: DevisionOfLecturer,
          attributes: ['dosenPembimbing1', 'dosenPembimbing2', 'dosenPembahas'], 
        },
        {
          model: TitleSubmission,
          attributes: ['judul1', 'statusPersetujuan'], 
        },
        {
          model: TitleSubmission2,
          attributes: ['judul2'], 
        },
      ],
  });

  const filteredData = data
  .filter(proposalMasuk => !proposalMasuk.jadwalSeminarProposal);

  const proposalMasuks = filteredData.map((proposalMasuk, index) => {
    const judulValue = proposalMasuk.TitleSubmission
      ? proposalMasuk.TitleSubmission.statusPersetujuan === 'Judul 1 Diterima'
        ? proposalMasuk.TitleSubmission.judul1
        : proposalMasuk.TitleSubmission.statusPersetujuan === 'Judul 2 Diterima'
        ? proposalMasuk.TitleSubmission2.judul2
        : '-'
      : '-';
    const dosenPembimbing1 = proposalMasuk.DevisionOfLecturer?.dosenPembimbing1 || '-';
    const dosenPembimbing2 = proposalMasuk.DevisionOfLecturer?.dosenPembimbing2 || '-';
    const dosenPembahas = proposalMasuk.DevisionOfLecturer?.dosenPembahas || '-';

    return {
      s_no: index + 1,
      npm: proposalMasuk.npm || '-',
      nama: proposalMasuk.nama || '-',
      judul: judulValue,
      dosenPembimbing1,
      dosenPembimbing2,
      dosenPembahas,
      tanggalPengajuan: proposalMasuk.tanggalPengajuan || '-',
      proposal: proposalMasuk.proposal || '-',
      jadwalSeminarProposal: proposalMasuk.jadwalSeminarProposal || '-',
    };
  });

  const document = {
    html: html,
    data: {
      proposalMasuks: proposalMasuks,
    },
    path: fullPath,
    type: "",
  };

  const process = await pdf.create(document, options);
  if (process) {
    res.download(fullPath, fileName, (err) => {
      if (err) {
        console.log(err);
      } else {
        fs.unlinkSync(fullPath);
      }
    });
  }
} catch (error) {
  next(
    new Error(
      "controllers/koordinatorController.js:exportTableToPDFProposalMasuk - " + error.message
    )
  );
}
};

const getProposalTerjadwal = async (req, res) => {
    try {
        const { id, username } = req.cookies;

        const profile = await StudentUser.findOne({
            where: { id },
        });

        const dataProposal = await Proposal.findAll({
            include: [
              {
                model: DevisionOfLecturer,
                attributes: ['dosenPembimbing1', 'dosenPembimbing2', 'dosenPembahas'], 
              },
              {
                model: TitleSubmission,
                attributes: ['judul1', 'statusPersetujuan'], 
              },
              {
                model: TitleSubmission2,
                attributes: ['judul2'], 
              },
            ],
        });

        const warna5 = {};

        dataProposal.forEach((proposalStatus) => {
            warna5[proposalStatus.id] = colors.getStatusColor5(proposalStatus.statusProposal);
        });

        res.render('koordinator/proposalTerjadwal', {
            title: 'Proposal Terjadwal',
            id,
            username,
            profile,
            dataProposal,
            warna5,
            colors,
            addSuccess1: req.flash('addSuccess1')
        });
    } catch (error) {
        res.status(500).json({
            status: 500,
            msg: error.message
        });
    }
};

const editProposalTerjadwal = async (req, res) => {
    try {
        const { id } = req.params;
        const { statusProposal, StudentUserId, jadwalSeminarProposal } = req.body;

        const dataProposal = await Proposal.findAll({});

        await Proposal.update({
            statusProposal,
            StudentUserId,
            dataProposal,
            jadwalSeminarProposal
        }, {
            where: {
                id
            }
        });

        return res.redirect('/koordinator-skripsi/proposal-terjadwal');
    } catch (error) {
        res.status(500).json({
            status: 500,
            msg: error.message
        });
    }
};

const editProposalTerjadwalSelesai = async (req, res) => {
    try {
        const { id } = req.params;
        const { statusProposal, StudentUserId, jadwalSeminarProposal } = req.body;

        const dataProposal = await Proposal.findAll({});

        await Proposal.update({
            statusProposal,
            StudentUserId,
            dataProposal,
            jadwalSeminarProposal
        }, {
            where: {
                id
            }
        });

        return res.redirect('/koordinator-skripsi/proposal-terjadwal');
    } catch (error) {
        res.status(500).json({
            status: 500,
            msg: error.message
        });
    }
};

const exportTableToClipboardProposalTerjadwal = async (req, res, next) => {
  try {
    const data = await Proposal.findAll({
      include: [
        {
          model: DevisionOfLecturer,
          attributes: ['dosenPembimbing1', 'dosenPembimbing2', 'dosenPembahas'], 
        },
        {
          model: TitleSubmission,
          attributes: ['judul1', 'statusPersetujuan'], 
        },
        {
          model: TitleSubmission2,
          attributes: ['judul2'], 
        },
      ],
  });

  const csvData = data
  .filter(proposalTerjadwal => proposalTerjadwal.jadwalSeminarProposal && proposalTerjadwal.statusProposal !== 'Selesai') 
  .map((proposalTerjadwal, index) => {
    return `${index + 1}\t${proposalTerjadwal.npm}\t${proposalTerjadwal.nama}\t${proposalTerjadwal.proposal}\t${proposalTerjadwal.jadwalSeminarProposal}\t${proposalTerjadwal.statusProposal}\n`;
  })
  .join('');

    copyPaste.copy(csvData, () => {
      req.flash('addSuccess1', 'Data proposal terjadwal berhasil disalin ke clipboard ')
      res.redirect('/koordinator-skripsi/proposal-terjadwal');
    });
  } catch (error) {
    next(new Error('controllers/koordinatorController.js:exportTableToClipboardProposalTerjadwal - ' + error.message));
  }
};
  
const exportTableToCSVProposalTerjadwal  = async (req, res, next) => {
  const path = './file-output';
  
  const data = await Proposal.findAll({
    include: [
      {
        model: DevisionOfLecturer,
        attributes: ['dosenPembimbing1', 'dosenPembimbing2', 'dosenPembahas'], 
      },
      {
        model: TitleSubmission,
        attributes: ['judul1', 'statusPersetujuan'], 
      },
      {
        model: TitleSubmission2,
        attributes: ['judul2'], 
      },
    ],
});
  
  const csvWriter = createCsvWriter({
    path: `${path}/Proposal_Terjadwal.csv`,
    header: [
      { id: 's_no', title: 'No', width: 5 },
      { id: 'npm', title: 'NPM', width: 20 },
      { id: 'nama', title: 'Nama', width: 20 },
      { id: 'proposal', title: 'Proposal Mahasiswa', width: 70 },
      { id: 'jadwalSeminarProposal', title: 'Jadwal Seminar Proposal', width: 20 },
      { id: 'statusProposal', title: 'StatusProposal', width: 20 }
    ],
    alwaysQuote: true, 
  });

  const filteredData = data
.filter(proposalTerjadwal => proposalTerjadwal.jadwalSeminarProposal && proposalTerjadwal.statusProposal !== 
'Selesai');

  const csvData = filteredData.map((proposalTerjadwal, index) => {
    return {
      s_no: index + 1,
      npm: proposalTerjadwal.npm,
      nama: proposalTerjadwal.nama,
      proposal: proposalTerjadwal.proposal, 
      jadwalSeminarProposal: proposalTerjadwal.jadwalSeminarProposal,
      statusProposal: proposalTerjadwal.statusProposal,
    };
  });
  
  let counter = 1;
  data.forEach((proposalTerjadwal) => {
    proposalTerjadwal.s_no = counter;
    counter++;
  });
  
  try {
    await csvWriter.writeRecords(csvData);
  
    res.download(`${path}/Proposal_Terjadwal.csv`, 'Proposal_Terjadwal.csv', (err) => {
      if (err) {
        console.log(err);
      } else {
        fs.unlinkSync(`${path}/Proposal_Terjadwal.csv`);
      }
    });
  } catch (error) {
    next(
      new Error('controllers/koordinatorController.js:exportTableToCSVProposalTerjadwal - ' + error.message)
    );
  }
};
  
const exportTableToExcelProposalTerjadwal  = async (req, res, next) => {
  
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("ProposalTerjadwal");
  const path = "./file-output";

  const data = await Proposal.findAll({
    include: [
      {
        model: DevisionOfLecturer,
        attributes: ['dosenPembimbing1', 'dosenPembimbing2', 'dosenPembahas'], 
      },
      {
        model: TitleSubmission,
        attributes: ['judul1', 'statusPersetujuan'], 
      },
      {
        model: TitleSubmission2,
        attributes: ['judul2'], 
      },
    ],
});
  
  worksheet.columns = [
    { header: 'No', key: 's_no', width: 5 },
    { header: 'NPM', key: 'npm', width: 20},
    { header: 'Nama', key: 'nama', width: 20 },
    { header: 'Proposal', key: 'proposal', width: 70 },
    { header: 'Jadwal Seminar Proposal', key: 'jadwalSeminarProposal', width: 30 },
    { header: 'Status Proposal', key: 'statusProposal', width: 30 }
  ];

  const filteredData = data
.filter(proposalTerjadwal => proposalTerjadwal.jadwalSeminarProposal && proposalTerjadwal.statusProposal !== 
'Selesai');
  
  const csvData = filteredData.map((proposalTerjadwal, index) => {
    return {
      s_no: index + 1,
      npm: proposalTerjadwal.npm,
      nama: proposalTerjadwal.nama,
      proposal: proposalTerjadwal.proposal, 
      jadwalSeminarProposal: proposalTerjadwal.jadwalSeminarProposal,
      statusProposal: proposalTerjadwal.statusProposal,
    };
  });
    
  
  let counter = 1;
  csvData.forEach((proposalTerjadwal) => {
    proposalTerjadwal.s_no = counter;
    worksheet.addRow(proposalTerjadwal);
    counter++;
  });
  let list = ["A", "B", "C", "D", "E", "F"];
  for (let i = 0; i <= counter; i++) {
    list.forEach((item) => {
      worksheet.getCell(item + i).border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      };
    });
  }
  worksheet.getRow(1).eachCell((cell) => {
    cell.font = { bold: true };
  });
  
  try {
    const data2 = await workbook.xlsx
      .writeFile(`${path}/Proposal_Terjadwal.xlsx`)
      .then(() => {
        res.download(`${path}/Proposal_Terjadwal.xlsx`, "Proposal_Terjadwal.xlsx", (err) => {
          if (err) {
            console.log(err);
          } else {
            fs.unlinkSync(`${path}/Proposal_Terjadwal.xlsx`);
          }
        });
      });
  } catch (error) {
    next(
      new Error(
        "controllers/koordinatorController.js:exportTableToExcelProposalTerjadwal - " + error.message
      )
    );
  }
};

const exportTableToPDFProposalTerjadwal = async (req, res, next) => {
  try {
    let pathFile = "./file-output";
    let fileName = "Proposal_Terjadwal.pdf";
    let fullPath = pathFile + "/" + fileName;
    let html = fs.readFileSync("./templates/templateProposalTerjadwal.html", "utf-8");
    let options = {
      format: "A4",
      orientation: "landscape",
      border: "10mm",
      header: {
        height: "5mm",
        contents: '<div style="text-align: center;"></div>',
      },
      footer: {
        height: "28mm",
        contents: {
          first: "",
          2: "Second page", 
          default:
            '<span style="color: #444;">{{page}}</span>/<span>{{pages}}</span>', 
          last: "",
        },
      },
    };
    
    const data = await Proposal.findAll({
      include: [
        {
          model: DevisionOfLecturer,
          attributes: ['dosenPembimbing1', 'dosenPembimbing2', 'dosenPembahas'], 
        },
        {
          model: TitleSubmission,
          attributes: ['judul1', 'statusPersetujuan'], 
        },
        {
          model: TitleSubmission2,
          attributes: ['judul2'], 
        },
      ],
  });

  const filteredData = data
  .filter(proposalTerjadwal => proposalTerjadwal.jadwalSeminarProposal && proposalTerjadwal.statusProposal !== 
'Selesai');


  const proposalTerjadwals = filteredData.map((proposalTerjadwal, index) => {
    return {
      s_no: index + 1,
      npm: proposalTerjadwal.npm || '-',
      nama: proposalTerjadwal.nama || '-',
      proposal: proposalTerjadwal.proposal || '-',
      jadwalSeminarProposal: proposalTerjadwal.jadwalSeminarProposal || '-',
      statusProposal: proposalTerjadwal.statusProposal || '-',
    };
  });

  const document = {
    html: html,
    data: {
      proposalTerjadwals: proposalTerjadwals,
    },
    path: fullPath,
    type: "",
  };

  const process = await pdf.create(document, options);
  if (process) {
    res.download(fullPath, fileName, (err) => {
      if (err) {
        console.log(err);
      } else {
        fs.unlinkSync(fullPath);
      }
    });
  }
} catch (error) {
  next(
    new Error(
      "controllers/koordinatorController.js:exportTableToPDFProposalTerjadwal - " + error.message
    )
  );
}
};

const getProposalSelesai = async (req, res) => {
    try {
        const { id, username } = req.cookies;

        const profile = await StudentUser.findOne({
            where: { id },
        });

        const dataProposal = await Proposal.findAll({
            include: [
              {
                model: DevisionOfLecturer,
                attributes: ['dosenPembimbing1', 'dosenPembimbing2', 'dosenPembahas'], 
              },
              {
                model: TitleSubmission,
                attributes: ['judul1', 'statusPersetujuan'], 
              },
              {
                model: TitleSubmission2,
                attributes: ['judul2'], 
              },
            ],
        });

        const warna5 = {};

        dataProposal.forEach((proposalStatus) => {
            warna5[proposalStatus.id] = colors.getStatusColor5(proposalStatus.statusProposal);
        });

        res.render('koordinator/proposalSelesai', {
            title: 'Proposal Selesai',
            id,
            username,
            profile,
            dataProposal,
            warna5,
            colors,
            addSuccess1: req.flash('addSuccess1')
        });
    } catch (error) {
        res.status(500).json({
            status: 500,
            msg: error.message
        });
    }
};

const editProposalSelesai = async (req, res) => {
    try {
        const { id } = req.params;
        const { statusProposal, StudentUserId, jadwalSeminarProposal } = req.body;

        const dataProposal = await Proposal.findAll({});

        await Proposal.update({
            statusProposal,
            StudentUserId,
            dataProposal,
            jadwalSeminarProposal
        }, {
            where: {
                id
            }
        });

        return res.redirect('/koordinator-skripsi/proposal-selesai');
    } catch (error) {
        res.status(500).json({
            status: 500,
            msg: error.message
        });
    }
};

const exportTableToClipboardProposalSelesai = async (req, res, next) => {
  try {
    const data = await Proposal.findAll({
      include: [
        {
          model: DevisionOfLecturer,
          attributes: ['dosenPembimbing1', 'dosenPembimbing2', 'dosenPembahas'], 
        },
        {
          model: TitleSubmission,
          attributes: ['judul1', 'statusPersetujuan'], 
        },
        {
          model: TitleSubmission2,
          attributes: ['judul2'], 
        },
      ],
  });

  const csvData = data
  .filter(proposalSelesai => proposalSelesai.statusProposal === 'Selesai') 
  .map((proposalSelesai, index) => {
    const judulValue = proposalSelesai.TitleSubmission
    ? proposalSelesai.TitleSubmission.statusPersetujuan === 'Judul 1 Diterima'
      ? proposalSelesai.TitleSubmission.judul1
      : proposalSelesai.TitleSubmission.statusPersetujuan === 'Judul 2 Diterima'
      ? proposalSelesai.TitleSubmission2.judul2
      : '-'
    : '-';
    return `${index + 1}\t${proposalSelesai.npm}\t${proposalSelesai.nama}\t${judulValue}\t${proposalSelesai.proposal}\t${proposalSelesai.jadwalSeminarProposal}\t${proposalSelesai.statusProposal}\n`;
  })
  .join('');

    copyPaste.copy(csvData, () => {
      req.flash('addSuccess1', 'Data proposal selesai berhasil disalin ke clipboard ')
      res.redirect('/koordinator-skripsi/proposal-selesai');
    });
  } catch (error) {
    next(new Error('controllers/koordinatorController.js:exportTableToClipboardProposalSelesai - ' + error.message));
  }
};
  
const exportTableToCSVProposalSelesai  = async (req, res, next) => {
  const path = './file-output';
  
  const data = await Proposal.findAll({
    include: [
      {
        model: DevisionOfLecturer,
        attributes: ['dosenPembimbing1', 'dosenPembimbing2', 'dosenPembahas'], 
      },
      {
        model: TitleSubmission,
        attributes: ['judul1', 'statusPersetujuan'], 
      },
      {
        model: TitleSubmission2,
        attributes: ['judul2'], 
      },
    ],
});
  
  const csvWriter = createCsvWriter({
    path: `${path}/Proposal_Selesai.csv`,
    header: [
      { id: 's_no', title: 'No', width: 5 },
      { id: 'npm', title: 'NPM', width: 20 },
      { id: 'judul', title: 'Judul', width: 20 },
      { id: 'nama', title: 'Nama', width: 20 },
      { id: 'proposal', title: 'Proposal Mahasiswa', width: 70 },
      { id: 'jadwalSeminarProposal', title: 'Jadwal Seminar Proposal', width: 20 },
      { id: 'statusProposal', title: 'StatusProposal', width: 20 }
    ],
    alwaysQuote: true, 
  });
  
  const filteredData = data
  .filter(proposalSelesai => proposalSelesai.statusProposal === 'Selesai');

  const csvData = filteredData.map((proposalSelesai, index) => {
    const judulValue = proposalSelesai.TitleSubmission
    ? proposalSelesai.TitleSubmission.statusPersetujuan === 'Judul 1 Diterima'
      ? proposalSelesai.TitleSubmission.judul1
      : proposalSelesai.TitleSubmission.statusPersetujuan === 'Judul 2 Diterima'
      ? proposalSelesai.TitleSubmission2.judul2
      : '-'
    : '-';
    return {
      s_no: index + 1,
      npm: proposalSelesai.npm,
      nama: proposalSelesai.nama,
      judul: judulValue,
      proposal: proposalSelesai.proposal, 
      jadwalSeminarProposal: proposalSelesai.jadwalSeminarProposal,
      statusProposal: proposalSelesai.statusProposal,
    };
  });
  
  let counter = 1;
  data.forEach((proposalSelesai) => {
    proposalSelesai.s_no = counter;
    counter++;
  });
  
  try {
    await csvWriter.writeRecords(csvData);
  
    res.download(`${path}/Proposal_Selesai.csv`, 'Proposal_Selesai.csv', (err) => {
      if (err) {
        console.log(err);
      } else {
        fs.unlinkSync(`${path}/Proposal_Selesai.csv`);
      }
    });
  } catch (error) {
    next(
      new Error('controllers/koordinatorController.js:exportTableToCSVProposalSelesai - ' + error.message)
    );
  }
};
  
const exportTableToExcelProposalSelesai  = async (req, res, next) => {
  
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("ProposalSelesai");
  const path = "./file-output";

  const data = await Proposal.findAll({
    include: [
      {
        model: DevisionOfLecturer,
        attributes: ['dosenPembimbing1', 'dosenPembimbing2', 'dosenPembahas'], 
      },
      {
        model: TitleSubmission,
        attributes: ['judul1', 'statusPersetujuan'], 
      },
      {
        model: TitleSubmission2,
        attributes: ['judul2'], 
      },
    ],
});
  
  worksheet.columns = [
    { header: 'No', key: 's_no', width: 5 },
    { header: 'NPM', key: 'npm', width: 20},
    { header: 'Nama', key: 'nama', width: 20 },
    { header: 'Judul', key: 'judul', width: 20 },
    { header: 'Proposal', key: 'proposal', width: 70 },
    { header: 'Jadwal Seminar Proposal', key: 'jadwalSeminarProposal', width: 30 },
    { header: 'Status Proposal', key: 'statusProposal', width: 30 }
  ];

  const filteredData = data
  .filter(proposalSelesai => proposalSelesai.statusProposal === 'Selesai');
  
  const csvData = filteredData.map((proposalSelesai, index) => {
    const judulValue = proposalSelesai.TitleSubmission
    ? proposalSelesai.TitleSubmission.statusPersetujuan === 'Judul 1 Diterima'
      ? proposalSelesai.TitleSubmission.judul1
      : proposalSelesai.TitleSubmission.statusPersetujuan === 'Judul 2 Diterima'
      ? proposalSelesai.TitleSubmission2.judul2
      : '-'
    : '-';
    return {
      s_no: index + 1,
      npm: proposalSelesai.npm,
      nama: proposalSelesai.nama,
      judul: judulValue,
      proposal: proposalSelesai.proposal, 
      jadwalSeminarProposal: proposalSelesai.jadwalSeminarProposal,
      statusProposal: proposalSelesai.statusProposal,
    };
  });
    
  
  let counter = 1;
  csvData.forEach((proposalSelesai) => {
    proposalSelesai.s_no = counter;
    worksheet.addRow(proposalSelesai);
    counter++;
  });
  let list = ["A", "B", "C", "D", "E", "F", "G"];
  for (let i = 0; i <= counter; i++) {
    list.forEach((item) => {
      worksheet.getCell(item + i).border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      };
    });
  }
  worksheet.getRow(1).eachCell((cell) => {
    cell.font = { bold: true };
  });
  
  try {
    const data2 = await workbook.xlsx
      .writeFile(`${path}/Proposal_Selesai.xlsx`)
      .then(() => {
        res.download(`${path}/Proposal_Selesai.xlsx`, "Proposal_Selesai.xlsx", (err) => {
          if (err) {
            console.log(err);
          } else {
            fs.unlinkSync(`${path}/Proposal_Selesai.xlsx`);
          }
        });
      });
  } catch (error) {
    next(
      new Error(
        "controllers/koordinatorController.js:exportTableToExcelProposalSelesai - " + error.message
      )
    );
  }
};

const exportTableToPDFProposalSelesai = async (req, res, next) => {
  try {
    let pathFile = "./file-output";
    let fileName = "Proposal_Selesai.pdf";
    let fullPath = pathFile + "/" + fileName;
    let html = fs.readFileSync("./templates/templateProposalSelesai.html", "utf-8");
    let options = {
      format: "A4",
      orientation: "landscape",
      border: "10mm",
      header: {
        height: "5mm",
        contents: '<div style="text-align: center;"></div>',
      },
      footer: {
        height: "28mm",
        contents: {
          first: "",
          2: "Second page", 
          default:
            '<span style="color: #444;">{{page}}</span>/<span>{{pages}}</span>', 
          last: "",
        },
      },
    };
    
    const data = await Proposal.findAll({
      include: [
        {
          model: DevisionOfLecturer,
          attributes: ['dosenPembimbing1', 'dosenPembimbing2', 'dosenPembahas'], 
        },
        {
          model: TitleSubmission,
          attributes: ['judul1', 'statusPersetujuan'], 
        },
        {
          model: TitleSubmission2,
          attributes: ['judul2'], 
        },
      ],
  });

  const filteredData = data
  .filter(proposalSelesai => proposalSelesai.statusProposal === 'Selesai');
  
  const proposalSelesais = filteredData.map((proposalSelesai, index) => {
    const judulValue = proposalSelesai.TitleSubmission
      ? proposalSelesai.TitleSubmission.statusPersetujuan === 'Judul 1 Diterima'
        ? proposalSelesai.TitleSubmission.judul1
        : proposalSelesai.TitleSubmission.statusPersetujuan === 'Judul 2 Diterima'
        ? proposalSelesai.TitleSubmission2.judul2
        : '-'
      : '-';
    return {
      s_no: index + 1,
      npm: proposalSelesai.npm || '-',
      nama: proposalSelesai.nama || '-',
      judul: judulValue,
      proposal: proposalSelesai.proposal || '-',
      jadwalSeminarProposal: proposalSelesai.jadwalSeminarProposal || '-',
      statusProposal: proposalSelesai.statusProposal || '-',
    };
  });

  const document = {
    html: html,
    data: {
      proposalSelesais: proposalSelesais,
    },
    path: fullPath,
    type: "",
  };

  const process = await pdf.create(document, options);
  if (process) {
    res.download(fullPath, fileName, (err) => {
      if (err) {
        console.log(err);
      } else {
        fs.unlinkSync(fullPath);
      }
    });
  }
} catch (error) {
  next(
    new Error(
      "controllers/koordinatorController.js:exportTableToPDFProposalSelesai - " + error.message
    )
  );
}
};

const getHasilSkripsi = async (req, res) => {
    try {
        const { id, username } = req.cookies;

        const profile = await StudentUser.findOne({
            where: { id },
        });

        const dataHasilSkripsi = await HasilSkripsi.findAll({
            include: [
              {
                model: DevisionOfLecturer,
                attributes: ['dosenPembimbing1', 'dosenPembimbing2', 'dosenPembahas'], 
              },
              {
                model: TitleSubmission,
                attributes: ['judul1', 'statusPersetujuan'], 
              },
              {
                model: TitleSubmission2,
                attributes: ['judul2'], 
              },
            ],
        });

        const warna6 = {};
        dataHasilSkripsi.forEach((hasilStatus) => {
            warna6[hasilStatus.id] = colors.getStatusColor5(hasilStatus.statusHasilSkripsi);
        });

        res.render('koordinator/hasil', {
            title: 'Hasil Skripsi',
            id,
            username,
            profile,
            dataHasilSkripsi,
            warna6,
            colors,
            addSuccess1: req.flash('addSuccess1')
        });
    } catch (error) {
        res.status(500).json({
            status: 500,
            msg: error.message
        });
    }
};

const downloadHasilSkripsi = async (req, res) => {
    try {
        const { id } = req.params;

        const hasilSkripsi = await HasilSkripsi.findOne({
            where: { id },
        });

        if (!hasilSkripsi) {
            return res.status(404).send('Hasil skripsi tidak ditemukan.');
        }

        const hasilPath = `./uploadHasil/${hasilSkripsi.hasilSkripsi}`;
        res.download(hasilPath);
    } catch (error) {
        res.status(500).json({
            status: 500,
            msg: error.message,
        });
    }
};

const editHasilSkripsi = async (req, res) => {
    try {
        const { id } = req.params;
        const { statusProposal, StudentUserId, jadwalSeminarHasil } = req.body;

        const dataHasilSkripsi = await HasilSkripsi.findAll({});

        await HasilSkripsi.update({
            statusProposal,
            StudentUserId,
            dataHasilSkripsi,
            jadwalSeminarHasil
        }, {
            where: {
                id
            }
        });

        return res.redirect('/koordinator-skripsi/hasil-skripsi');
    } catch (error) {
        res.status(500).json({
            status: 500,
            msg: error.message
        });
    }
};

const deleteHasilSkripsi = async (req, res) => {
    try {
        const { id } = req.params;

        await HasilSkripsi.destroy({
            where: {
                id
            }
        });

        req.flash('deleteSuccess', 'Data hasil mahasiswa berhasil DIHAPUS!');
        res.redirect('/koordinator-skripsi/proposal');
    } catch (error) {
        res.status(500).json({
            status: 500,
            msg: error.message
        });
    }
};

const downloadHasilSkripsiRevisi1 = async (req, res) => {
    try {
      const { id } = req.params;
  
      const hasilSkripsiRevisi1 = await HasilSkripsi.findOne({
        where: { id },
      });
  
      if (!hasilSkripsiRevisi1) {
        return res.status(404).send('Hasil skripsi tidak ditemukan.');
      }
  
      const hasilSkripsiRevisi1Path = `./uploadRevisi1/${hasilSkripsiRevisi1.hasilSkripsiRevisi1}`;
      res.download(hasilSkripsiRevisi1Path);
    } catch (error) {
      res.status(500).json({
        status: 500,
        msg: error.message,
      });
    }
}; 

const downloadHasilSkripsiRevisi2 = async (req, res) => {
    try {
      const { id } = req.params;
  
      const hasilSkripsiRevisi2 = await HasilSkripsi.findOne({
        where: { id },
      });
  
      if (!hasilSkripsiRevisi2) {
        return res.status(404).send('Proposal tidak ditemukan.');
      }
  
      const hasilSkripsiRevisi2Path = `./uploadRevisi2/${hasilSkripsiRevisi2.hasilSkripsiRevisi2}`;
      res.download(hasilSkripsiRevisi2Path);
    } catch (error) {
      res.status(500).json({
        status: 500,
        msg: error.message,
      });
    }
  }; 

  const downloadHasilSkripsiRevisiDosen1 = async (req, res) => {
    try {
      const { id } = req.params;
  
      const hasilSkripsiRevisiDosen1 = await HasilSkripsi.findOne({
        where: { id },
      });
  
      if (!hasilSkripsiRevisiDosen1) {
        return res.status(404).send('Hasil skripsi tidak ditemukan.');
      }
  
      const hasilSkripsiRevisiDosen1Path = `./uploadHasilRevisiDosen1/${hasilSkripsiRevisiDosen1.hasilSkripsiRevisiDosen1}`;
      res.download(hasilSkripsiRevisiDosen1Path);
    } catch (error) {
      res.status(500).json({
        status: 500,
        msg: error.message,
      });
    }
  }; 
  
  const downloadHasilSkripsiRevisiDosen2 = async (req, res) => {
    try {
      const { id } = req.params;
  
      const hasilSkripsiRevisiDosen2 = await HasilSkripsi.findOne({
        where: { id },
      });
  
      if (!hasilSkripsiRevisiDosen2) {
        return res.status(404).send('Hasil skripsi tidak ditemukan.');
      }
  
      const hasilSkripsiRevisiDosen2Path = `./uploadHasilRevisiDosen2/${hasilSkripsiRevisiDosen2.hasilSkripsiRevisiDosen2}`;
      res.download(hasilSkripsiRevisiDosen2Path);
    } catch (error) {
      res.status(500).json({
        status: 500,
        msg: error.message,
      });
    }
  }; 

  const exportTableToClipboardHasil = async (req, res, next) => {
    try {
      const data = await HasilSkripsi.findAll({
        include: [
          {
            model: DevisionOfLecturer,
            attributes: ['dosenPembimbing1', 'dosenPembimbing2', 'dosenPembahas'], 
          },
          {
            model: TitleSubmission,
            attributes: ['judul1', 'statusPersetujuan'], 
          },
          {
            model: TitleSubmission2,
            attributes: ['judul2'], 
          },
        ],
    });
    
    const csvData = data.map((hasil, index) => {
      const judulValue = hasil.TitleSubmission
        ? hasil.TitleSubmission.statusPersetujuan === 'Judul 1 Diterima'
          ? hasil.TitleSubmission.judul1
          : hasil.TitleSubmission.statusPersetujuan === 'Judul 2 Diterima'
          ? hasil.TitleSubmission2.judul2
          : '-'
        : '-';
      return `${index + 1}\t${hasil.npm}\t${hasil.nama}\t${judulValue}\t${hasil.DevisionOfLecturer.dosenPembimbing1}\t${hasil.DevisionOfLecturer.dosenPembimbing2}\t${hasil.DevisionOfLecturer.dosenPembahas}\t${hasil.tanggalPengajuan}\t${hasil.hasilSkripsi}\t${hasil.revisi1}\t${hasil.revisi2}\t${hasil.hasilSkripsiRevisi1}\t${hasil.hasilSkripsiRevisi2}\t${hasil.statusHasilSkripsi}\t${hasil.jadwalSeminarHasil}\n`;
    }).join('');
    
      copyPaste.copy(csvData, () => {
        req.flash('addSuccess1', 'Data bimbingan hasil mahasiswa berhasil disalin ke clipboard ')
        res.redirect('/koordinator-skripsi/hasil-skripsi');
      });
    } catch (error) {
      next(new Error('controllers/koordinatorController.js:exportTableToClipboardHasil - ' + error.message));
    }
  };
    
  const exportTableToCSVHasil  = async (req, res, next) => {
    const path = './file-output';
    
    const data = await HasilSkripsi.findAll({
      include: [
        {
          model: DevisionOfLecturer,
          attributes: ['dosenPembimbing1', 'dosenPembimbing2', 'dosenPembahas'], 
        },
        {
          model: TitleSubmission,
          attributes: ['judul1', 'statusPersetujuan'], 
        },
        {
          model: TitleSubmission2,
          attributes: ['judul2'], 
        },
      ],
  });
    
    const csvWriter = createCsvWriter({
      path: `${path}/Bimbingan_Hasil.csv`,
      header: [
        { id: 's_no', title: 'No', width: 5 },
        { id: 'npm', title: 'NPM', width: 20 },
        { id: 'nama', title: 'Nama', width: 20 },
        { id: 'judul', title: 'Judul', width: 20 },
        { id: 'dosenPembimbing1', title: 'Dosen Pembimbing 1', width: 30 },
        { id: 'dosenPembimbing2', title: 'Dosen Pembimbing 2', width: 30 },
        { id: 'dosenPembahas', title: 'Dosen Pembahas', width: 30 },
        { id: 'tanggalPengajuan', title: 'Tanggal Pengajuan', width: 30 },
        { id: 'hasilSkripsi', title: 'Hasil Skripsi', width: 70 },
        { id: 'revisi1', title: 'Revisi Dari Dosen Pb 1', width: 70 },
        { id: 'revisi2', title: 'Revisi Dari Dosen Pb 2', width: 70 },
        { id: 'hasilSkripsiRevisi1', title: 'Revisi Bimbingan Hasil Skripsi Mahasiswa Pb 1', width: 70 },
        { id: 'hasilSkripsiRevisi2', title: 'Revisi Bimbingan Hasil Skripsi Mahasiswa Pb 2', width: 70 },
        { id: 'statusHasilSkripsi', title: 'Status Hasil Skripsi', width: 20 },
        { id: 'jadwalSeminarHasil', title: 'Jadwal Seminar Hasil', width: 20 }
      ],
      alwaysQuote: true, 
    });
    
    const csvData = data.map((hasil, index) => {
      const judulValue = hasil.TitleSubmission
    ? hasil.TitleSubmission.statusPersetujuan === 'Judul 1 Diterima'
      ? hasil.TitleSubmission.judul1
      : hasil.TitleSubmission.statusPersetujuan === 'Judul 2 Diterima'
      ? hasil.TitleSubmission2.judul2
      : '-'
    : '-';
      return {
        s_no: index + 1,
        npm: hasil.npm,
        nama: hasil.nama,
        judul: judulValue,
        dosenPembimbing1: hasil.DevisionOfLecturer.dosenPembimbing1,
        dosenPembimbing2: hasil.DevisionOfLecturer.dosenPembimbing2,
        dosenPembahas: hasil.DevisionOfLecturer.dosenPembahas,
        tanggalPengajuan: hasil.tanggalPengajuan, 
        hasilSkripsi: hasil.hasilSkripsi, 
        revisi1: hasil.revisi1,
        revisi2: hasil.revisi2,
        hasilSkripsiRevisi1: hasil.hasilSkripsiRevisi1,
        hasilSkripsiRevisi2: hasil.hasilSkripsiRevisi2,
        statusHasilSkripsi: hasil.statusHasilSkripsi,
        jadwalSeminarHasil: hasil.jadwalSeminarHasil,
      };
    });
    
    let counter = 1;
    data.forEach((hasil) => {
      hasil.s_no = counter;
      counter++;
    });
    
    try {
      await csvWriter.writeRecords(csvData);
    
      res.download(`${path}/Bimbingan_Hasil.csv`, 'Bimbingan_Hasil.csv', (err) => {
        if (err) {
          console.log(err);
        } else {
          fs.unlinkSync(`${path}/Bimbingan_Hasil.csv`);
        }
      });
    } catch (error) {
      next(
        new Error('controllers/koordinatorController.js:exportTableToCSVHasil - ' + error.message)
      );
    }
  };
    
  const exportTableToExcelHasil  = async (req, res, next) => {
    
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("BimbinganHasil");
    const path = "./file-output";
  
    const data = await HasilSkripsi.findAll({
      include: [
        {
          model: DevisionOfLecturer,
          attributes: ['dosenPembimbing1', 'dosenPembimbing2', 'dosenPembahas'], 
        },
        {
          model: TitleSubmission,
          attributes: ['judul1', 'statusPersetujuan'], 
        },
        {
          model: TitleSubmission2,
          attributes: ['judul2'], 
        },
      ],
  });
    
    worksheet.columns = [
      { header: 'No', key: 's_no', width: 5 },
      { header: 'NPM', key: 'npm', width: 20},
      { header: 'Nama', key: 'nama', width: 20 },
      { header: 'Judul', key: 'judul', width: 20 },
      { header: 'Dosen Pembimbing 1', key: 'dosenPembimbing1', width: 30  },
      { header: 'Dosen Pembimbing 2', key: 'dosenPembimbing2', width: 30  },
      { header: 'Dosen Pembahas', key: 'dosenPembahas', width: 30  },
      { header: 'Tanggal Pengajuan', key: 'tanggalPengajuan', width: 70 },
      { header: 'Hasil Skripsi', key: 'hasilSkripsi', width: 70 },
      { header: 'Revisi dari Pb 1', key: 'revisi1', width: 70 },
      { header: 'Revisi dari Pb 2', key: 'revisi2', width: 70 },
      { header: 'Hasil Skripsi Revisi Mahasiswa Pb 1', key: 'hasilSkripsiRevisi1', width: 70 },
      { header: 'Hasil Skripsi Revisi Mahasiswa Pb 2', key: 'hasilSkripsiRevisi2', width: 70 },
      { header: 'Status Hasil Skripsi', key: 'statusHasilSkripsi', width: 30 },
      { header: 'Jadwal Seminar Hasil', key: 'jadwalSeminarHasil', width: 30 }
    ];
    
    const csvData = data.map((hasil, index) => {
      const judulValue = hasil.TitleSubmission
      ? hasil.TitleSubmission.statusPersetujuan === 'Judul 1 Diterima'
        ? hasil.TitleSubmission.judul1
        : hasil.TitleSubmission.statusPersetujuan === 'Judul 2 Diterima'
        ? hasil.TitleSubmission2.judul2
        : '-'
      : '-';
      return {
        s_no: index + 1,
        npm: hasil.npm,
        nama: hasil.nama,
        judul: judulValue,
        dosenPembimbing1: hasil.DevisionOfLecturer.dosenPembimbing1,
        dosenPembimbing2: hasil.DevisionOfLecturer.dosenPembimbing2,
        dosenPembahas: hasil.DevisionOfLecturer.dosenPembahas,
        tanggalPengajuan: hasil.tanggalPengajuan, 
        hasilSkripsi: hasil.hasilSkripsi,
        revisi1: hasil.revisi1,
        revisi2: hasil.revisi2,
        hasilSkripsiRevisi1: hasil.hasilSkripsiRevisi1,
        hasilSkripsiRevisi2: hasil.hasilSkripsiRevisi2, 
        statusHasilSkripsi: hasil.statusHasilSkripsi,
        jadwalSeminarHasil: hasil.jadwalSeminarHasil,
      };
    });
      
    
    let counter = 1;
    csvData.forEach((hasil) => {
      hasil.s_no = counter;
      worksheet.addRow(hasil);
      counter++;
    });
    let list = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O" ];
    for (let i = 0; i <= counter; i++) {
      list.forEach((item) => {
        worksheet.getCell(item + i).border = {
          top: { style: "thin" },
          left: { style: "thin" },
          bottom: { style: "thin" },
          right: { style: "thin" },
        };
      });
    }
    worksheet.getRow(1).eachCell((cell) => {
      cell.font = { bold: true };
    });
    
    try {
      const data2 = await workbook.xlsx
        .writeFile(`${path}/Bimbingan_Hasil.xlsx`)
        .then(() => {
          res.download(`${path}/Bimbingan_Hasil.xlsx`, "Bimbingan_Hasil.xlsx", (err) => {
            if (err) {
              console.log(err);
            } else {
              fs.unlinkSync(`${path}/Bimbingan_Hasil.xlsx`);
            }
          });
        });
    } catch (error) {
      next(
        new Error(
          "controllers/koordinatorController.js:exportTableToExcelHasil- " + error.message
        )
      );
    }
  };
    
  const exportTableToPDFHasil  = async (req, res, next) => {
      try {
        let pathFile = "./file-output";
        let fileName = "Bimbingan_Hasil.pdf";
        let fullPath = pathFile + "/" + fileName;
        let html = fs.readFileSync("./templates/templateHasil.html", "utf-8");
        let options = {
          format: "A4",
          orientation: "landscape",
          border: "10mm",
          header: {
            height: "5mm",
            contents: '<div style="text-align: center;"></div>',
          },
          footer: {
            height: "28mm",
            contents: {
              first: "",
              2: "Second page", 
              default:
                '<span style="color: #444;">{{page}}</span>/<span>{{pages}}</span>', 
              last: "",
            },
          },
        };
        
        const data = await HasilSkripsi.findAll({
          include: [
            {
              model: DevisionOfLecturer,
              attributes: ['dosenPembimbing1', 'dosenPembimbing2', 'dosenPembahas'], 
            },
            {
              model: TitleSubmission,
              attributes: ['judul1', 'statusPersetujuan'], 
            },
            {
              model: TitleSubmission2,
              attributes: ['judul2'], 
            },
          ],
      });
  
      const hasils = data.map((hasil, no) => {
        const judulValue = hasil.TitleSubmission
          ? hasil.TitleSubmission.statusPersetujuan === 'Judul 1 Diterima'
            ? hasil.TitleSubmission.judul1
            : hasil.TitleSubmission.statusPersetujuan === 'Judul 2 Diterima'
            ? hasil.TitleSubmission2.judul2
            : '-'
          : '-';
        const dosenPembimbing1 = hasil.DevisionOfLecturer?.dosenPembimbing1 || '-';
        const dosenPembimbing2 = hasil.DevisionOfLecturer?.dosenPembimbing2 || '-';
        const dosenPembahas = hasil.DevisionOfLecturer?.dosenPembahas || '-';
  
        return {
          s_no: no + 1,
          npm: hasil.npm || '-',
          nama: hasil.nama || '-',
          judul: judulValue,
          dosenPembimbing1,
          dosenPembimbing2,
          dosenPembahas,
          tanggalPengajuan: hasil.tanggalPengajuan || '-',
          hasilSkripsi: hasil.hasilSkripsi || '-',
          revisi1: hasil.revisi1 || '-',
          revisi2: hasil.revisi2 || '-',
          hasilSkripsiRevisi1: hasil.hasilSkripsiRevisi1 || '-',
          hasilSkripsiRevisi2: hasil.hasilSkripsiRevisi2 || '-',
          statusHasilSkripsi: hasil.statusHasilSkripsi || '-',
          jadwalSeminarHasil: hasil.jadwalSeminarHasil || '-',
        };
      });
  
      const document = {
        html: html,
        data: {
          hasils: hasils,
        },
        path: fullPath,
        type: "",
      };
  
      const process = await pdf.create(document, options);
      if (process) {
        res.download(fullPath, fileName, (err) => {
          if (err) {
            console.log(err);
          } else {
            fs.unlinkSync(fullPath);
          }
        });
      }
    } catch (error) {
      next(
        new Error(
          "controllers/koordinatorController.js:exportTableToPDFHasil - " + error.message
        )
      );
    }
  };

const getHasilMasuk = async (req, res) => {
    try {
        const { id, username } = req.cookies;

        const profile = await StudentUser.findOne({
            where: { id },
        });

        const dataHasil = await HasilSkripsi.findAll({
            include: [
              {
                model: DevisionOfLecturer,
                attributes: ['dosenPembimbing1', 'dosenPembimbing2', 'dosenPembahas'], 
              },
              {
                model: TitleSubmission,
                attributes: ['judul1', 'statusPersetujuan'], 
              },
              {
                model: TitleSubmission2,
                attributes: ['judul2'], 
              },
            ],
        });

        res.render('koordinator/hasilMasuk', {
            title: 'Bimbingan Hasil Skripsi Masuk',
            id,
            username,
            profile,
            dataHasil,
            addSuccess1: req.flash('addSuccess1')
        });
    } catch (error) {
        res.status(500).json({
            status: 500,
            msg: error.message
        });
    }
};

const editHasilMasuk = async (req, res) => {
    try {
        const { id } = req.params;
        const { statusHasilSkripsi, StudentUserId, jadwalSeminarHasil } = req.body;

        const dataHasil = await HasilSkripsi.findAll({});

        await HasilSkripsi.update({
            statusHasilSkripsi,
            StudentUserId,
            dataHasil,
            jadwalSeminarHasil
        }, {
            where: {
                id
            }
        });

        return res.redirect('/koordinator-skripsi/hasil-masuk');
    } catch (error) {
        res.status(500).json({
            status: 500,
            msg: error.message
        });
    }
};

const exportTableToClipboardHasilMasuk = async (req, res, next) => {
  try {
    const data = await HasilSkripsi.findAll({
      include: [
        {
          model: DevisionOfLecturer,
          attributes: ['dosenPembimbing1', 'dosenPembimbing2', 'dosenPembahas'], 
        },
        {
          model: TitleSubmission,
          attributes: ['judul1', 'statusPersetujuan'], 
        },
        {
          model: TitleSubmission2,
          attributes: ['judul2'], 
        },
      ],
  });

  const csvData = data
  .filter(hasilMasuk => !hasilMasuk.jadwalSeminarHasil) 
  .map((hasilMasuk, index) => {
    const judulValue = hasilMasuk.TitleSubmission
      ? hasilMasuk.TitleSubmission.statusPersetujuan === 'Judul 1 Diterima'
        ? hasilMasuk.TitleSubmission.judul1
        : hasilMasuk.TitleSubmission.statusPersetujuan === 'Judul 2 Diterima'
        ? hasilMasuk.TitleSubmission2.judul2
        : '-'
      : '-';
    return `${index + 1}\t${hasilMasuk.npm}\t${hasilMasuk.nama}\t${judulValue}\t${hasilMasuk.DevisionOfLecturer.dosenPembimbing1}\t${hasilMasuk.DevisionOfLecturer.dosenPembimbing2}\t${hasilMasuk.DevisionOfLecturer.dosenPembahas}\t${hasilMasuk.tanggalPengajuan}\t${hasilMasuk.hasilSkripsi}\t${hasilMasuk.jadwalSeminarHasil}\n`;
  })
  .join('');

  
    copyPaste.copy(csvData, () => {
      req.flash('addSuccess1', 'Data hasil skripsi masuk berhasil disalin ke clipboard ')
      res.redirect('/koordinator-skripsi/hasil-masuk');
    });
  } catch (error) {
    next(new Error('controllers/koordinatorController.js:exportTableToClipboardHasilMasuk - ' + error.message));
  }
};
  
const exportTableToCSVHasilMasuk  = async (req, res, next) => {
  const path = './file-output';
  
  const data = await HasilSkripsi.findAll({
    include: [
      {
        model: DevisionOfLecturer,
        attributes: ['dosenPembimbing1', 'dosenPembimbing2', 'dosenPembahas'], 
      },
      {
        model: TitleSubmission,
        attributes: ['judul1', 'statusPersetujuan'], 
      },
      {
        model: TitleSubmission2,
        attributes: ['judul2'], 
      },
    ],
});
  
  const csvWriter = createCsvWriter({
    path: `${path}/Hasil_Masuk.csv`,
    header: [
      { id: 's_no', title: 'No', width: 5 },
      { id: 'npm', title: 'NPM', width: 20 },
      { id: 'nama', title: 'Nama', width: 20 },
      { id: 'judul', title: 'Judul', width: 20 },
      { id: 'dosenPembimbing1', title: 'Dosen Pembimbing 1', width: 30 },
      { id: 'dosenPembimbing2', title: 'Dosen Pembimbing 2', width: 30 },
      { id: 'dosenPembahas', title: 'Dosen Pembahas', width: 30 },
      { id: 'tanggalPengajuan', title: 'Tanggal Pengajuan', width: 30 },
      { id: 'hasilSkripsi', title: 'Hasil Skripsi Mahasiswa', width: 70 },
      { id: 'jadwalSeminarHasil', title: 'Jadwal Seminar Hasil', width: 20 }
    ],
    alwaysQuote: true, 
  });
  
  const filteredData = data
  .filter(hasilMasuk => !hasilMasuk.jadwalSeminarHasil);

  const csvData = filteredData.map((hasilMasuk, index) => {
    const judulValue = hasilMasuk.TitleSubmission
  ? hasilMasuk.TitleSubmission.statusPersetujuan === 'Judul 1 Diterima'
    ? hasilMasuk.TitleSubmission.judul1
    : hasilMasuk.TitleSubmission.statusPersetujuan === 'Judul 2 Diterima'
    ? hasilMasuk.TitleSubmission2.judul2
    : '-'
  : '-';
    return {
      s_no: index + 1,
      npm: hasilMasuk.npm,
      nama: hasilMasuk.nama,
      judul: judulValue,
      dosenPembimbing1: hasilMasuk.DevisionOfLecturer.dosenPembimbing1,
      dosenPembimbing2: hasilMasuk.DevisionOfLecturer.dosenPembimbing2,
      dosenPembahas: hasilMasuk.DevisionOfLecturer.dosenPembahas,
      tanggalPengajuan: hasilMasuk.tanggalPengajuan, 
      hasilSkripsi: hasilMasuk.hasilSkripsi, 
      jadwalSeminarHasil: hasilMasuk.jadwalSeminarHasil,
    };
  });
  
  let counter = 1;
  data.forEach((hasilMasuk) => {
    hasilMasuk.s_no = counter;
    counter++;
  });
  
  try {
    await csvWriter.writeRecords(csvData);
  
    res.download(`${path}/Hasil_Masuk.csv`, 'Hasil_Masuk.csv', (err) => {
      if (err) {
        console.log(err);
      } else {
        fs.unlinkSync(`${path}/Hasil_Masuk.csv`)
      }
    });
  } catch (error) {
    next(
      new Error('controllers/koordinatorController.js:exportTableToCSVHasilMasuk - ' + error.message)
    );
  }
};
  
const exportTableToExcelHasilMasuk  = async (req, res, next) => {
  
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("HasilMasuk");
  const path = "./file-output";

  const data = await HasilSkripsi.findAll({
    include: [
      {
        model: DevisionOfLecturer,
        attributes: ['dosenPembimbing1', 'dosenPembimbing2', 'dosenPembahas'], 
      },
      {
        model: TitleSubmission,
        attributes: ['judul1', 'statusPersetujuan'], 
      },
      {
        model: TitleSubmission2,
        attributes: ['judul2'], 
      },
    ],
});
  
  worksheet.columns = [
    { header: 'No', key: 's_no', width: 5 },
    { header: 'NPM', key: 'npm', width: 20},
    { header: 'Nama', key: 'nama', width: 20 },
    { header: 'Judul', key: 'judul', width: 20 },
    { header: 'Dosen Pembimbing 1', key: 'dosenPembimbing1', width: 30  },
    { header: 'Dosen Pembimbing 2', key: 'dosenPembimbing2', width: 30  },
    { header: 'Dosen Pembahas', key: 'dosenPembahas', width: 30  },
    { header: 'Tanggal Pengajuan', key: 'tanggalPengajuan', width: 70 },
    { header: 'Hasil Skripsi', key: 'hasilSkripsi', width: 70 },
    { header: 'Jadwal Seminar Hasil', key: 'jadwalSeminarHasil', width: 30 }
  ];

  const filteredData = data
.filter(hasilMasuk => !hasilMasuk.jadwalSeminarHasil);
  
  const csvData = filteredData.map((hasilMasuk, index) => {
    const judulValue = hasilMasuk.TitleSubmission
    ? hasilMasuk.TitleSubmission.statusPersetujuan === 'Judul 1 Diterima'
      ? hasilMasuk.TitleSubmission.judul1
      : hasilMasuk.TitleSubmission.statusPersetujuan === 'Judul 2 Diterima'
      ? hasilMasuk.TitleSubmission2.judul2
      : '-'
    : '-';
    return {
      s_no: index + 1,
      npm: hasilMasuk.npm,
      nama: hasilMasuk.nama,
      judul: judulValue,
      dosenPembimbing1: hasilMasuk.DevisionOfLecturer.dosenPembimbing1,
      dosenPembimbing2: hasilMasuk.DevisionOfLecturer.dosenPembimbing2,
      dosenPembahas: hasilMasuk.DevisionOfLecturer.dosenPembahas,
      tanggalPengajuan: hasilMasuk.tanggalPengajuan, 
      hasilSkripsi: hasilMasuk.hasilSkripsi, 
      jadwalSeminarHasil: hasilMasuk.jadwalSeminarHasil,
    };
  });
    
  
  let counter = 1;
  csvData.forEach((hasilMasuk) => {
    hasilMasuk.s_no = counter;
    worksheet.addRow(hasilMasuk);
    counter++;
  });
  let list = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J"];
  for (let i = 0; i <= counter; i++) {
    list.forEach((item) => {
      worksheet.getCell(item + i).border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      };
    });
  }
  worksheet.getRow(1).eachCell((cell) => {
    cell.font = { bold: true };
  });
  
  try {
    const data2 = await workbook.xlsx
      .writeFile(`${path}/Hasil_Masuk.xlsx`)
      .then(() => {
        res.download(`${path}/Hasil_Masuk.xlsx`, "Hasil_Masuk.xlsx", (err) => {
          if (err) {
            console.log(err);
          } else {
            fs.unlinkSync(`${path}/Hasil_Masuk.xlsx`);
          }
        });
      });
  } catch (error) {
    next(
      new Error(
        "controllers/koordinatorController.js:exportTableToExcelHasilMasuk - " + error.message
      )
    );
  }
};

const exportTableToPDFHasilMasuk = async (req, res, next) => {
  try {
    let pathFile = "./file-output";
    let fileName = "Hasil_Masuk.pdf";
    let fullPath = pathFile + "/" + fileName;
    let html = fs.readFileSync("./templates/templateHasilMasuk.html", "utf-8");
    let options = {
      format: "A4",
      orientation: "landscape",
      border: "10mm",
      header: {
        height: "5mm",
        contents: '<div style="text-align: center;"></div>',
      },
      footer: {
        height: "28mm",
        contents: {
          first: "",
          2: "Second page", 
          default:
            '<span style="color: #444;">{{page}}</span>/<span>{{pages}}</span>', 
          last: "",
        },
      },
    };
    
    const data = await HasilSkripsi.findAll({
      include: [
        {
          model: DevisionOfLecturer,
          attributes: ['dosenPembimbing1', 'dosenPembimbing2', 'dosenPembahas'], 
        },
        {
          model: TitleSubmission,
          attributes: ['judul1', 'statusPersetujuan'], 
        },
        {
          model: TitleSubmission2,
          attributes: ['judul2'], 
        },
      ],
  });

  const filteredData = data
  .filter(hasilMasuk => !hasilMasuk.jadwalSeminarHasil);

  const hasilMasuks = filteredData.map((hasilMasuk, index) => {
    const judulValue = hasilMasuk.TitleSubmission
      ? hasilMasuk.TitleSubmission.statusPersetujuan === 'Judul 1 Diterima'
        ? hasilMasuk.TitleSubmission.judul1
        : hasilMasuk.TitleSubmission.statusPersetujuan === 'Judul 2 Diterima'
        ? hasilMasuk.TitleSubmission2.judul2
        : '-'
      : '-';
    const dosenPembimbing1 = hasilMasuk.DevisionOfLecturer?.dosenPembimbing1 || '-';
    const dosenPembimbing2 = hasilMasuk.DevisionOfLecturer?.dosenPembimbing2 || '-';
    const dosenPembahas = hasilMasuk.DevisionOfLecturer?.dosenPembahas || '-';

    return {
      s_no: index + 1,
      npm: hasilMasuk.npm || '-',
      nama: hasilMasuk.nama || '-',
      judul: judulValue,
      dosenPembimbing1,
      dosenPembimbing2,
      dosenPembahas,
      tanggalPengajuan: hasilMasuk.tanggalPengajuan || '-',
      hasilSkripsi: hasilMasuk.hasilSkripsi || '-',
      jadwalSeminarHasil: hasilMasuk.jadwalSeminarHasil || '-',
    };
  });

  const document = {
    html: html,
    data: {
      hasilMasuks: hasilMasuks,
    },
    path: fullPath,
    type: "",
  };

  const process = await pdf.create(document, options);
  if (process) {
    res.download(fullPath, fileName, (err) => {
      if (err) {
        console.log(err);
      } else {
        fs.unlinkSync(fullPath);
      }
    });
  }
} catch (error) {
  next(
    new Error(
      "controllers/koordinatorController.js:exportTableToPDFHasilMasuk - " + error.message
    )
  );
 }
};

const getHasilTerjadwal = async (req, res) => {
    try {
        const { id, username } = req.cookies;

        const profile = await StudentUser.findOne({
            where: { id },
        });

        const dataHasil = await HasilSkripsi.findAll({
            include: [
              {
                model: DevisionOfLecturer,
                attributes: ['dosenPembimbing1', 'dosenPembimbing2', 'dosenPembahas'], 
              },
              {
                model: TitleSubmission,
                attributes: ['judul1', 'statusPersetujuan'], 
              },
              {
                model: TitleSubmission2,
                attributes: ['judul2'], 
              },
            ],
        });

        const warna6 = {};

        dataHasil.forEach((hasilStatus) => {
            warna6[hasilStatus.id] = colors.getStatusColor6(hasilStatus.statusHasilSkripsi);
        });

        res.render('koordinator/hasilTerjadwal', {
            title: 'Hasil Skripsi Terjadwal',
            id,
            username,
            profile,
            dataHasil,
            warna6,
            colors,
            addSuccess1: req.flash('addSuccess1')
        });
    } catch (error) {
        res.status(500).json({
            status: 500,
            msg: error.message
        });
    }
};

const editHasilTerjadwal = async (req, res) => {
    try {
        const { id } = req.params;
        const { statusHasilSkripsi, StudentUserId, jadwalSeminarHasil } = req.body;

        const dataHasil = await HasilSkripsi.findAll({});

        await HasilSkripsi.update({
            statusHasilSkripsi,
            StudentUserId,
            dataHasil,
            jadwalSeminarHasil
        }, {
            where: {
                id
            }
        });

        return res.redirect('/koordinator-skripsi/hasil-terjadwal');
    } catch (error) {
        res.status(500).json({
            status: 500,
            msg: error.message
        });
    }
};

const editHasilTerjadwalSelesai = async (req, res) => {
    try {
        const { id } = req.params;
        const { statusHasilSkripsi, StudentUserId, jadwalSeminarHasil } = req.body;

        const dataHasil = await HasilSkripsi.findAll({});

        await HasilSkripsi.update({
            statusHasilSkripsi,
            StudentUserId,
            dataHasil,
            jadwalSeminarHasil
        }, {
            where: {
                id
            }
        });

        return res.redirect('/koordinator-skripsi/hasil-terjadwal');
    } catch (error) {
        res.status(500).json({
            status: 500,
            msg: error.message
        });
    }
};

const exportTableToClipboardHasilTerjadwal = async (req, res, next) => {
  try {
    const data = await HasilSkripsi.findAll({
      include: [
        {
          model: DevisionOfLecturer,
          attributes: ['dosenPembimbing1', 'dosenPembimbing2', 'dosenPembahas'], 
        },
        {
          model: TitleSubmission,
          attributes: ['judul1', 'statusPersetujuan'], 
        },
        {
          model: TitleSubmission2,
          attributes: ['judul2'], 
        },
      ],
  });

  const csvData = data
  .filter(hasilTerjadwal => hasilTerjadwal.jadwalSeminarHasil && hasilTerjadwal.statusHasilSkripsi !== 'Selesai') 
  .map((hasilTerjadwal, index) => {
    return `${index + 1}\t${hasilTerjadwal.npm}\t${hasilTerjadwal.nama}\t${hasilTerjadwal.hasilSkripsi}\t${hasilTerjadwal.jadwalSeminarHasil}\t${hasilTerjadwal.statusHasilSkripsi}\n`;
  })
  .join('');

    copyPaste.copy(csvData, () => {
      req.flash('addSuccess1', 'Data hasil skripsi terjadwal berhasil disalin ke clipboard ')
      res.redirect('/koordinator-skripsi/hasil-terjadwal');
    });
  } catch (error) {
    next(new Error('controllers/koordinatorController.js:exportTableToClipboardHasilTerjadwal - ' + error.message));
  }
};
  
const exportTableToCSVHasilTerjadwal  = async (req, res, next) => {
  const path = './file-output';
  
  const data = await HasilSkripsi.findAll({
    include: [
      {
        model: DevisionOfLecturer,
        attributes: ['dosenPembimbing1', 'dosenPembimbing2', 'dosenPembahas'], 
      },
      {
        model: TitleSubmission,
        attributes: ['judul1', 'statusPersetujuan'], 
      },
      {
        model: TitleSubmission2,
        attributes: ['judul2'], 
      },
    ],
});
  
  const csvWriter = createCsvWriter({
    path: `${path}/Hasil_Terjadwal.csv`,
    header: [
      { id: 's_no', title: 'No', width: 5 },
      { id: 'npm', title: 'NPM', width: 20 },
      { id: 'nama', title: 'Nama', width: 20 },
      { id: 'hasilSkripsi', title: 'Hasil Skripsi Mahasiswa', width: 70 },
      { id: 'jadwalSeminarHasil', title: 'Jadwal Seminar Hasil', width: 20 },
      { id: 'statusHasilSkripsi', title: 'Status Hasil Skripsi', width: 20 }
    ],
    alwaysQuote: true, 
  });

  const filteredData = data
  .filter(hasilTerjadwal => hasilTerjadwal.jadwalSeminarHasil && hasilTerjadwal.statusHasilSkripsi !== 'Selesai');

  const csvData = filteredData.map((hasilTerjadwal, index) => {
    return {
      s_no: index + 1,
      npm: hasilTerjadwal.npm,
      nama: hasilTerjadwal.nama,
      hasilSkripsi: hasilTerjadwal.hasilSkripsi, 
      jadwalSeminarHasil: hasilTerjadwal.jadwalSeminarHasil,
      statusHasilSkripsi: hasilTerjadwal.statusHasilSkripsi,
    };
  });
  
  let counter = 1;
  data.forEach((hasilTerjadwal) => {
    hasilTerjadwal.s_no = counter;
    counter++;
  });
  
  try {
    await csvWriter.writeRecords(csvData);
  
    res.download(`${path}/Hasil_Terjadwal.csv`, 'Hasil_Terjadwal.csv', (err) => {
      if (err) {
        console.log(err);
      } else {
        fs.unlinkSync(`${path}/Hasil_Terjadwal.csv`);
      }
    });
  } catch (error) {
    next(
      new Error('controllers/koordinatorController.js:exportTableToCSVHasilTerjadwal - ' + error.message)
    );
  }
};
  
const exportTableToExcelHasilTerjadwal  = async (req, res, next) => {
  
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("HasilTerjadwal");
  const path = "./file-output";

  const data = await HasilSkripsi.findAll({
    include: [
      {
        model: DevisionOfLecturer,
        attributes: ['dosenPembimbing1', 'dosenPembimbing2', 'dosenPembahas'], 
      },
      {
        model: TitleSubmission,
        attributes: ['judul1', 'statusPersetujuan'], 
      },
      {
        model: TitleSubmission2,
        attributes: ['judul2'], 
      },
    ],
});
  
  worksheet.columns = [
    { header: 'No', key: 's_no', width: 5 },
    { header: 'NPM', key: 'npm', width: 20},
    { header: 'Nama', key: 'nama', width: 20 },
    { header: 'Hasil Skripsi Mahasiswa', key: 'hasilSkripsi', width: 70 },
    { header: 'Jadwal Seminar Hasil', key: 'jadwalSeminarHasil', width: 30 },
    { header: 'Status Hasil Skripsi', key: 'statusHasilSkripsi', width: 30 }
  ];

  const filteredData = data
.filter(hasilTerjadwal => hasilTerjadwal.jadwalSeminarHasil && hasilTerjadwal.statusHasilSkripsi !== 'Selesai');
  
  const csvData = filteredData.map((hasilTerjadwal, index) => {
    return {
      s_no: index + 1,
      npm: hasilTerjadwal.npm,
      nama: hasilTerjadwal.nama,
      hasilSkripsi: hasilTerjadwal.hasilSkripsi, 
      jadwalSeminarHasil: hasilTerjadwal.jadwalSeminarHasil,
      statusHasilSkripsi: hasilTerjadwal.statusHasilSkripsi,
    };
  });
    
  
  let counter = 1;
  csvData.forEach((hasilTerjadwal) => {
    hasilTerjadwal.s_no = counter;
    worksheet.addRow(hasilTerjadwal);
    counter++;
  });
  let list = ["A", "B", "C", "D", "E", "F"];
  for (let i = 0; i <= counter; i++) {
    list.forEach((item) => {
      worksheet.getCell(item + i).border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      };
    });
  }
  worksheet.getRow(1).eachCell((cell) => {
    cell.font = { bold: true };
  });
  
  try {
    const data2 = await workbook.xlsx
      .writeFile(`${path}/Hasil_Terjadwal.xlsx`)
      .then(() => {
        res.download(`${path}/Hasil_Terjadwal.xlsx`, "Hasil_Terjadwal.xlsx", (err) => {
          if (err) {
            console.log(err);
          } else {
            fs.unlinkSync(`${path}/Hasil_Terjadwal.xlsx`);
          }
        });
      });
  } catch (error) {
    next(
      new Error(
        "controllers/koordinatorController.js:exportTableToExcelHasilTerjadwal - " + error.message
      )
    );
  }
};

const exportTableToPDFHasilTerjadwal = async (req, res, next) => {
  try {
    let pathFile = "./file-output";
    let fileName = "Hasil_Terjadwal.pdf";
    let fullPath = pathFile + "/" + fileName;
    let html = fs.readFileSync("./templates/templateHasilTerjadwal.html", "utf-8");
    let options = {
      format: "A4",
      orientation: "landscape",
      border: "10mm",
      header: {
        height: "5mm",
        contents: '<div style="text-align: center;"></div>',
      },
      footer: {
        height: "28mm",
        contents: {
          first: "",
          2: "Second page", 
          default:
            '<span style="color: #444;">{{page}}</span>/<span>{{pages}}</span>', 
          last: "",
        },
      },
    };
    
    const data = await HasilSkripsi.findAll({
      include: [
        {
          model: DevisionOfLecturer,
          attributes: ['dosenPembimbing1', 'dosenPembimbing2', 'dosenPembahas'], 
        },
        {
          model: TitleSubmission,
          attributes: ['judul1', 'statusPersetujuan'], 
        },
        {
          model: TitleSubmission2,
          attributes: ['judul2'], 
        },
      ],
  });

  const filteredData = data
  .filter(hasilTerjadwal => hasilTerjadwal.jadwalSeminarHasil && hasilTerjadwal.statusHasilSkripsi !== 'Selesai');

  const hasilTerjadwals = filteredData.map((hasilTerjadwal, index) => {
    return {
      s_no: index + 1,
      npm: hasilTerjadwal.npm || '-',
      nama: hasilTerjadwal.nama || '-',
      hasilSkripsi: hasilTerjadwal.hasilSkripsi || '-',
      jadwalSeminarHasil: hasilTerjadwal.jadwalSeminarHasil || '-',
      statusHasilSkripsi: hasilTerjadwal.statusHasilSkripsi || '-',
    };
  });

  const document = {
    html: html,
    data: {
      hasilTerjadwals: hasilTerjadwals,
    },
    path: fullPath,
    type: "",
  };

  const process = await pdf.create(document, options);
  if (process) {
    res.download(fullPath, fileName, (err) => {
      if (err) {
        console.log(err);
      } else {
        fs.unlinkSync(fullPath);
      }
    });
  }
} catch (error) {
  next(
    new Error(
      "controllers/koordinatorController.js:exportTableToPDFHasilTerjadwal - " + error.message
    )
  );
}
};

const getHasilSelesai = async (req, res) => {
    try {
        const { id, username } = req.cookies;

        const profile = await StudentUser.findOne({
            where: { id },
        });

        const dataHasil = await HasilSkripsi.findAll({
            include: [
              {
                model: DevisionOfLecturer,
                attributes: ['dosenPembimbing1', 'dosenPembimbing2', 'dosenPembahas'], 
              },
              {
                model: TitleSubmission,
                attributes: ['judul1', 'statusPersetujuan'], 
              },
              {
                model: TitleSubmission2,
                attributes: ['judul2'], 
              },
            ],
        });

        const warna6 = {};

        dataHasil.forEach((hasilStatus) => {
            warna6[hasilStatus.id] = colors.getStatusColor5(hasilStatus.statusHasilSkripsi);
        });

        res.render('koordinator/hasilSelesai', {
            title: 'Hasil Skripsi Selesai',
            id,
            username,
            profile,
            dataHasil,
            warna6,
            colors,
            addSuccess1: req.flash('addSuccess1')
        });
    } catch (error) {
        res.status(500).json({
            status: 500,
            msg: error.message
        });
    }
};

const editHasilSelesai = async (req, res) => {
    try {
        const { id } = req.params;
        const { statusHasilSkripsi, StudentUserId, jadwalSeminarHasil } = req.body;

        const dataHasil = await HasilSkripsi.findAll({});

        await HasilSkripsi.update({
            statusHasilSkripsi,
            StudentUserId,
            dataHasil,
            jadwalSeminarHasil
        }, {
            where: {
                id
            }
        });

        return res.redirect('/koordinator-skripsi/hasil-selesai');
    } catch (error) {
        res.status(500).json({
            status: 500,
            msg: error.message
        });
    }
};

const exportTableToClipboardHasilSelesai = async (req, res, next) => {
  try {
    const data = await HasilSkripsi.findAll({
      include: [
        {
          model: DevisionOfLecturer,
          attributes: ['dosenPembimbing1', 'dosenPembimbing2', 'dosenPembahas'], 
        },
        {
          model: TitleSubmission,
          attributes: ['judul1', 'statusPersetujuan'], 
        },
        {
          model: TitleSubmission2,
          attributes: ['judul2'], 
        },
      ],
  });

  const csvData = data
  .filter(hasilSelesai => hasilSelesai.statusHasilSkripsi === 'Selesai') 
  .map((hasilSelesai, index) => {
    const judulValue = hasilSelesai.TitleSubmission
    ? hasilSelesai.TitleSubmission.statusPersetujuan === 'Judul 1 Diterima'
      ? hasilSelesai.TitleSubmission.judul1
      : hasilSelesai.TitleSubmission.statusPersetujuan === 'Judul 2 Diterima'
      ? hasilSelesai.TitleSubmission2.judul2
      : '-'
    : '-';
    return `${index + 1}\t${hasilSelesai.npm}\t${hasilSelesai.nama}\t${judulValue}\t${hasilSelesai.hasilSkripsi}\t${hasilSelesai.jadwalSeminarHasil}\t${hasilSelesai.statusHasilSkripsi}\n`;
  })
  .join('');

    copyPaste.copy(csvData, () => {
      req.flash('addSuccess1', 'Data hasil skripsi selesai berhasil disalin ke clipboard ')
      res.redirect('/koordinator-skripsi/hasil-selesai');
    });
  } catch (error) {
    next(new Error('controllers/koordinatorController.js:exportTableToClipboardHasilSelesai - ' + error.message));
  }
};

const exportTableToCSVHasilSelesai  = async (req, res, next) => {
  const path = './file-output';
  
  const data = await HasilSkripsi.findAll({
    include: [
      {
        model: DevisionOfLecturer,
        attributes: ['dosenPembimbing1', 'dosenPembimbing2', 'dosenPembahas'], 
      },
      {
        model: TitleSubmission,
        attributes: ['judul1', 'statusPersetujuan'], 
      },
      {
        model: TitleSubmission2,
        attributes: ['judul2'], 
      },
    ],
});
  
  const csvWriter = createCsvWriter({
    path: `${path}/Hasil_Selesai.csv`,
    header: [
      { id: 's_no', title: 'No', width: 5 },
      { id: 'npm', title: 'NPM', width: 20 },
      { id: 'judul', title: 'Judul', width: 20 },
      { id: 'nama', title: 'Nama', width: 20 },
      { id: 'hasilSkripsi', title: 'Hasil Skripsi Mahasiswa', width: 70 },
      { id: 'jadwalSeminarHasil', title: 'Jadwal Seminar Hasil', width: 20 },
      { id: 'statusHasilSkripsi', title: 'StatusHasilSkripsi', width: 20 }
    ],
    alwaysQuote: true, 
  });
  
  const filteredData = data
  .filter(hasilSelesai => hasilSelesai.statusHasilSkripsi === 'Selesai');

  const csvData = filteredData.map((hasilSelesai, index) => {
    const judulValue = hasilSelesai.TitleSubmission
    ? hasilSelesai.TitleSubmission.statusPersetujuan === 'Judul 1 Diterima'
      ? hasilSelesai.TitleSubmission.judul1
      : hasilSelesai.TitleSubmission.statusPersetujuan === 'Judul 2 Diterima'
      ? hasilSelesai.TitleSubmission2.judul2
      : '-'
    : '-';
    return {
      s_no: index + 1,
      npm: hasilSelesai.npm,
      nama: hasilSelesai.nama,
      judul: judulValue,
      hasilSkripsi: hasilSelesai.hasilSkripsi, 
      jadwalSeminarHasil: hasilSelesai.jadwalSeminarHasil,
      statusHasilSkripsi: hasilSelesai.statusHasilSkripsi,
    };
  });
  
  let counter = 1;
  data.forEach((hasilSelesai) => {
    hasilSelesai.s_no = counter;
    counter++;
  });
  
  try {
    await csvWriter.writeRecords(csvData);
  
    res.download(`${path}/Hasil_Selesai.csv`, 'Hasil_Selesai.csv', (err) => {
      if (err) {
        console.log(err);
      } else {
        fs.unlinkSync(`${path}/Hasil_Selesai.csv`);
      }
    });
  } catch (error) {
    next(
      new Error('controllers/koordinatorController.js:exportTableToCSVHasilSelesai - ' + error.message)
    );
  }
};
  
const exportTableToExcelHasilSelesai  = async (req, res, next) => {
  
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("HasilSelesai");
  const path = "./file-output";

  const data = await HasilSkripsi.findAll({
    include: [
      {
        model: DevisionOfLecturer,
        attributes: ['dosenPembimbing1', 'dosenPembimbing2', 'dosenPembahas'], 
      },
      {
        model: TitleSubmission,
        attributes: ['judul1', 'statusPersetujuan'], 
      },
      {
        model: TitleSubmission2,
        attributes: ['judul2'], 
      },
    ],
});
  
  worksheet.columns = [
    { header: 'No', key: 's_no', width: 5 },
    { header: 'NPM', key: 'npm', width: 20},
    { header: 'Nama', key: 'nama', width: 20 },
    { header: 'Judul', key: 'judul', width: 20 },
    { header: 'Hasil Skripsi', key: 'hasilSkripsi', width: 70 },
    { header: 'Jadwal Seminar Hasil', key: 'jadwalSeminarHasil', width: 30 },
    { header: 'Status Hasil Skripsi', key: 'statusHasilSkripsi', width: 30 }
  ];

  const filteredData = data
  .filter(hasilSelesai => hasilSelesai.statusHasilSkripsi === 'Selesai');
  
  const csvData = filteredData.map((hasilSelesai, index) => {
    const judulValue = hasilSelesai.TitleSubmission
    ? hasilSelesai.TitleSubmission.statusPersetujuan === 'Judul 1 Diterima'
      ? hasilSelesai.TitleSubmission.judul1
      : hasilSelesai.TitleSubmission.statusPersetujuan === 'Judul 2 Diterima'
      ? hasilSelesai.TitleSubmission2.judul2
      : '-'
    : '-';
    return {
      s_no: index + 1,
      npm: hasilSelesai.npm,
      nama: hasilSelesai.nama,
      judul: judulValue,
      hasilSkripsi: hasilSelesai.hasilSkripsi, 
      jadwalSeminarHasil: hasilSelesai.jadwalSeminarHasil,
      statusHasilSkripsi: hasilSelesai.statusHasilSkripsi,
    };
  });
    
  let counter = 1;
  csvData.forEach((hasilSelesai) => {
    hasilSelesai.s_no = counter;
    worksheet.addRow(hasilSelesai);
    counter++;
  });
  let list = ["A", "B", "C", "D", "E", "F", "G"];
  for (let i = 0; i <= counter; i++) {
    list.forEach((item) => {
      worksheet.getCell(item + i).border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      };
    });
  }
  worksheet.getRow(1).eachCell((cell) => {
    cell.font = { bold: true };
  });
  
  try {
    const data2 = await workbook.xlsx
      .writeFile(`${path}/Hasil_Selesai.xlsx`)
      .then(() => {
        res.download(`${path}/Hasil_Selesai.xlsx`, "Hasil_Selesai.xlsx", (err) => {
          if (err) {
            console.log(err);
          } else {
            fs.unlinkSync(`${path}/Hasil_Selesai.xlsx`);
          }
        });
      });
  } catch (error) {
    next(
      new Error(
        "controllers/koordinatorController.js:exportTableToExcelHasilSelesai - " + error.message
      )
    );
  }
};

const exportTableToPDFHasilSelesai = async (req, res, next) => {
  try {
    let pathFile = "./file-output";
    let fileName = "Hasil_Selesai.pdf";
    let fullPath = pathFile + "/" + fileName;
    let html = fs.readFileSync("./templates/templateHasilSelesai.html", "utf-8");
    let options = {
      format: "A4",
      orientation: "landscape",
      border: "10mm",
      header: {
        height: "5mm",
        contents: '<div style="text-align: center;"></div>',
      },
      footer: {
        height: "28mm",
        contents: {
          first: "",
          2: "Second page", 
          default:
            '<span style="color: #444;">{{page}}</span>/<span>{{pages}}</span>', 
          last: "",
        },
      },
    };
    
    const data = await HasilSkripsi.findAll({
      include: [
        {
          model: DevisionOfLecturer,
          attributes: ['dosenPembimbing1', 'dosenPembimbing2', 'dosenPembahas'], 
        },
        {
          model: TitleSubmission,
          attributes: ['judul1', 'statusPersetujuan'], 
        },
        {
          model: TitleSubmission2,
          attributes: ['judul2'], 
        },
      ],
  });

  const filteredData = data
  .filter(hasilSelesai => hasilSelesai.statusHasilSkripsi === 'Selesai');
  
  const hasilSelesais = filteredData.map((hasilSelesai, index) => {
    const judulValue = hasilSelesai.TitleSubmission
      ? hasilSelesai.TitleSubmission.statusPersetujuan === 'Judul 1 Diterima'
        ? hasilSelesai.TitleSubmission.judul1
        : hasilSelesai.TitleSubmission.statusPersetujuan === 'Judul 2 Diterima'
        ? hasilSelesai.TitleSubmission2.judul2
        : '-'
      : '-';
    return {
      s_no: index + 1,
      npm: hasilSelesai.npm || '-',
      nama: hasilSelesai.nama || '-',
      judul: judulValue,
      hasilSkripsi: hasilSelesai.hasilSkripsi || '-',
      jadwalSeminarHasil: hasilSelesai.jadwalSeminarHasil || '-',
      statusHasilSkripsi: hasilSelesai.statusHasilSkripsi || '-',
    };
  });

  const document = {
    html: html,
    data: {
      hasilSelesais: hasilSelesais,
    },
    path: fullPath,
    type: "",
  };

  const process = await pdf.create(document, options);
  if (process) {
    res.download(fullPath, fileName, (err) => {
      if (err) {
        console.log(err);
      } else {
        fs.unlinkSync(fullPath);
      }
    });
  }
} catch (error) {
  next(
    new Error(
      "controllers/koordinatorController.js:exportTableToPDFHasilSelesai - " + error.message
    )
  );
}
};

const getKomprehensif = async (req, res) => {
    try {
        const { id, username } = req.cookies;

        const profile = await StudentUser.findOne({
            where: { id },
        });

        const dataKomprehensif = await Komprehensif.findAll({
            include: [
              {
                model: DevisionOfLecturer,
                attributes: ['dosenPembimbing1', 'dosenPembimbing2', 'dosenPembahas'], 
              },
              {
                model: TitleSubmission,
                attributes: ['judul1', 'statusPersetujuan'], 
              },
              {
                model: TitleSubmission2,
                attributes: ['judul2'], 
              },
            ],
        });

        const warna7 = {};
        dataKomprehensif.forEach((komprehensifStatus) => {
            warna7[komprehensifStatus.id] = colors.getStatusColor7(komprehensifStatus.statusKomprehensif);
        });

        res.render('koordinator/komprehensif', {
            title: 'Komprehensif',
            id,
            username,
            profile,
            dataKomprehensif,
            warna7,
            colors,
            addSuccess1: req.flash('addSuccess1')
        });
    } catch (error) {
        res.status(500).json({
            status: 500,
            msg: error.message
        });
    }
};

const downloadKomprehensif = async (req, res) => {
    try {
        const { id } = req.params;

        const komprehensif = await Komprehensif.findOne({
            where: { id },
        });

        if (!komprehensif) {
            return res.status(404).send('Data bimbingan komprehensif tidak ditemukan.');
        }

        const komprehensifPath = `./uploadKomprehensif/${komprehensif.komprehensif}`;
        res.download(komprehensifPath);
    } catch (error) {
        res.status(500).json({
            status: 500,
            msg: error.message,
        });
    }
};

const editKomprehensif = async (req, res) => {
    try {
        const { id } = req.params;
        const { statusProposal, StudentUserId, jadwalUjianKomprehensif } = req.body;

        const dataKomprehensif = await Komprehensif.findAll({});

        await Komprehensif.update({
            statusProposal,
            StudentUserId,
            dataKomprehensif,
            jadwalUjianKomprehensif
        }, {
            where: {
                id
            }
        });

        return res.redirect('/koordinator-skripsi/komprehensif');
    } catch (error) {
        res.status(500).json({
            status: 500,
            msg: error.message
        });
    }
};

const deleteKomprehensif = async (req, res) => {
    try {
        const { id } = req.params;

        await Komprehensif.destroy({
            where: {
                id
            }
        });

        req.flash('deleteSuccess', 'Data bimbingan komprehensif mahasiswa berhasil DIHAPUS!');
        res.redirect('/koordinator-skripsi/komprehensif');
    } catch (error) {
        res.status(500).json({
            status: 500,
            msg: error.message
        });
    }
};

const downloadKomprehensifRevisi1 = async (req, res) => {
    try {
      const { id } = req.params;
  
      const komprehensifRevisi1 = await Komprehensif.findOne({
        where: { id },
      });
  
      if (!komprehensifRevisi1) {
        return res.status(404).send('Komprehensif tidak ditemukan.');
      }
  
      const komprehensifRevisi1Path = `./uploadRevisi1/${komprehensifRevisi1.komprehensifRevisi1}`;
      res.download(komprehensifRevisi1Path);
    } catch (error) {
      res.status(500).json({
        status: 500,
        msg: error.message,
      });
    }
}; 

const downloadKomprehensifRevisi2 = async (req, res) => {
    try {
      const { id } = req.params;
  
      const komprehensifRevisi2 = await Komprehensif.findOne({
        where: { id },
      });
  
      if (!komprehensifRevisi2) {
        return res.status(404).send('Komprehensif tidak ditemukan.');
      }
  
      const komprehensifRevisi2Path = `./uploadRevisi2/${komprehensifRevisi2.komprehensifRevisi2}`;
      res.download(komprehensifRevisi2Path);
    } catch (error) {
      res.status(500).json({
        status: 500,
        msg: error.message,
      });
    }
  }; 

  const exportTableToClipboardKomprehensif = async (req, res, next) => {
    try {
      const data = await Komprehensif.findAll({
        include: [
          {
            model: DevisionOfLecturer,
            attributes: ['dosenPembimbing1', 'dosenPembimbing2', 'dosenPembahas'], 
          },
          {
            model: TitleSubmission,
            attributes: ['judul1', 'statusPersetujuan'], 
          },
          {
            model: TitleSubmission2,
            attributes: ['judul2'], 
          },
        ],
    });
    
    const csvData = data.map((komprehensif, index) => {
      const judulValue = komprehensif.TitleSubmission
        ? komprehensif.TitleSubmission.statusPersetujuan === 'Judul 1 Diterima'
          ? komprehensif.TitleSubmission.judul1
          : komprehensif.TitleSubmission.statusPersetujuan === 'Judul 2 Diterima'
          ? komprehensif.TitleSubmission2.judul2
          : '-'
        : '-';
      return `${index + 1}\t${komprehensif.npm}\t${komprehensif.nama}\t${judulValue}\t${komprehensif.DevisionOfLecturer.dosenPembimbing1}\t${komprehensif.DevisionOfLecturer.dosenPembimbing2}\t${komprehensif.DevisionOfLecturer.dosenPembahas}\t${komprehensif.tanggalPengajuan}\t${komprehensif.komprehensif}\t${komprehensif.revisi1Komprehensif}\t${komprehensif.revisi2Komprehensif}\t${komprehensif.komprehensifRevisi1}\t${komprehensif.komprehensifRevisi2}\t${komprehensif.statusKomprehensif}\t${komprehensif.jadwalUjianKomprehensif}\n`;
    }).join('');
    
      copyPaste.copy(csvData, () => {
        req.flash('addSuccess1', 'Data bimbingan komprehensif mahasiswa berhasil disalin ke clipboard ')
        res.redirect('/koordinator-skripsi/komprehensif');
      });
    } catch (error) {
      next(new Error('controllers/koordinatorController.js:exportTableToClipboardKomprehensif - ' + error.message));
    }
  };
    
  const exportTableToCSVKomprehensif  = async (req, res, next) => {
    const path = './file-output';
    
    const data = await Komprehensif.findAll({
      include: [
        {
          model: DevisionOfLecturer,
          attributes: ['dosenPembimbing1', 'dosenPembimbing2', 'dosenPembahas'], 
        },
        {
          model: TitleSubmission,
          attributes: ['judul1', 'statusPersetujuan'], 
        },
        {
          model: TitleSubmission2,
          attributes: ['judul2'], 
        },
      ],
  });
    
    const csvWriter = createCsvWriter({
      path: `${path}/Bimbingan_Komprehensif.csv`,
      header: [
        { id: 's_no', title: 'No', width: 5 },
        { id: 'npm', title: 'NPM', width: 20 },
        { id: 'nama', title: 'Nama', width: 20 },
        { id: 'judul', title: 'Judul', width: 20 },
        { id: 'dosenPembimbing1', title: 'Dosen Pembimbing 1', width: 30 },
        { id: 'dosenPembimbing2', title: 'Dosen Pembimbing 2', width: 30 },
        { id: 'dosenPembahas', title: 'Dosen Pembahas', width: 30 },
        { id: 'tanggalPengajuan', title: 'Tanggal Pengajuan', width: 30 },
        { id: 'komprehensif', title: 'Komprehensif', width: 70 },
        { id: 'revisi1Komprehensif', title: 'Revisi Dari Dosen Pb 1', width: 70 },
        { id: 'revisi2Komprehensif', title: 'Revisi Dari Dosen Pb 2', width: 70 },
        { id: 'komprehensifRevisi1', title: 'Revisi Bimbingan Komprehensif Mahasiswa Pb 1', width: 70 },
        { id: 'komprehensifRevisi2', title: 'Revisi Bimbingan Komprehensif Mahasiswa Pb 2', width: 70 },
        { id: 'statusKomprehensif', title: 'Status Komprehensif', width: 20 },
        { id: 'jadwalUjianKomprehensif', title: 'Jadwal Ujian Komprehensif', width: 20 }
      ],
      alwaysQuote: true, 
    });
    
    const csvData = data.map((komprehensif, index) => {
      const judulValue = komprehensif.TitleSubmission
    ? komprehensif.TitleSubmission.statusPersetujuan === 'Judul 1 Diterima'
      ? komprehensif.TitleSubmission.judul1
      : komprehensif.TitleSubmission.statusPersetujuan === 'Judul 2 Diterima'
      ? komprehensif.TitleSubmission2.judul2
      : '-'
    : '-';
      return {
        s_no: index + 1,
        npm: komprehensif.npm,
        nama: komprehensif.nama,
        judul: judulValue,
        dosenPembimbing1: komprehensif.DevisionOfLecturer.dosenPembimbing1,
        dosenPembimbing2: komprehensif.DevisionOfLecturer.dosenPembimbing2,
        dosenPembahas: komprehensif.DevisionOfLecturer.dosenPembahas,
        tanggalPengajuan: komprehensif.tanggalPengajuan, 
        komprehensif: komprehensif.komprehensif, 
        revisi1Komprehensif: komprehensif.revisi1Komprehensif,
        revisi2Komprehensif: komprehensif.revisi2Komprehensif,
        komprehensifRevisi1: komprehensif.komprehensifRevisi1,
        komprehensifRevisi2: komprehensif.komprehensifRevisi2,
        statusKomprehensif: komprehensif.statusKomprehensif,
        jadwalUjianKomprehensif: komprehensif.jadwalUjianKomprehensif,
      };
    });
    
    let counter = 1;
    data.forEach((komprehensif) => {
      komprehensif.s_no = counter;
      counter++;
    });
    
    try {
      await csvWriter.writeRecords(csvData);
    
      res.download(`${path}/Bimbingan_Komprehensif.csv`, 'Bimbingan_Komprehensif.csv', (err) => {
        if (err) {
          console.log(err);
        } else {
          fs.unlinkSync(`${path}/Bimbingan_Komprehensif.csv`);
        }
      });
    } catch (error) {
      next(
        new Error('controllers/koordinatorController.js:exportTableToCSVKomprehensif - ' + error.message)
      );
    }
  };
    
  const exportTableToExcelKomprehensif  = async (req, res, next) => {
    
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("BimbinganKomprehensif");
    const path = "./file-output";
  
    const data = await Komprehensif.findAll({
      include: [
        {
          model: DevisionOfLecturer,
          attributes: ['dosenPembimbing1', 'dosenPembimbing2', 'dosenPembahas'], 
        },
        {
          model: TitleSubmission,
          attributes: ['judul1', 'statusPersetujuan'], 
        },
        {
          model: TitleSubmission2,
          attributes: ['judul2'], 
        },
      ],
  });
    
    worksheet.columns = [
      { header: 'No', key: 's_no', width: 5 },
      { header: 'NPM', key: 'npm', width: 20},
      { header: 'Nama', key: 'nama', width: 20 },
      { header: 'Judul', key: 'judul', width: 20 },
      { header: 'Dosen Pembimbing 1', key: 'dosenPembimbing1', width: 30  },
      { header: 'Dosen Pembimbing 2', key: 'dosenPembimbing2', width: 30  },
      { header: 'Dosen Pembahas', key: 'dosenPembahas', width: 30  },
      { header: 'Tanggal Pengajuan', key: 'tanggalPengajuan', width: 70 },
      { header: 'Komprehensif', key: 'komprehensif', width: 70 },
      { header: 'Revisi Komprehensif Pb 1', key: 'revisi1Komprehensif', width: 70 },
      { header: 'Revisi Komprehensif Pb 2', key: 'revisi2Komprehensif', width: 70 },
      { header: 'Revisi Komprehensif Mahasiswa Pb 1', key: 'komprehensifRevisi1', width: 70 },
      { header: 'Revisi Komprehensif Mahasiswa Pb 2', key: 'komprehensifRevisi2', width: 30 },
      { header: 'Status Komprehensif', key: 'statusKomprehensif', width: 30 },
      { header: 'Jadwal Ujian Komprehensif', key: 'jadwalUjianKomprehensif', width: 30 }
    ];
    
    const csvData = data.map((komprehensif, index) => {
      const judulValue = komprehensif.TitleSubmission
      ? komprehensif.TitleSubmission.statusPersetujuan === 'Judul 1 Diterima'
        ? komprehensif.TitleSubmission.judul1
        : komprehensif.TitleSubmission.statusPersetujuan === 'Judul 2 Diterima'
        ? komprehensif.TitleSubmission2.judul2
        : '-'
      : '-';
      return {
        s_no: index + 1,
        npm: komprehensif.npm,
        nama: komprehensif.nama,
        judul: judulValue,
        dosenPembimbing1: komprehensif.DevisionOfLecturer.dosenPembimbing1,
        dosenPembimbing2: komprehensif.DevisionOfLecturer.dosenPembimbing2,
        dosenPembahas: komprehensif.DevisionOfLecturer.dosenPembahas,
        tanggalPengajuan: komprehensif.tanggalPengajuan, 
        komprehensif: komprehensif.komprehensif, 
        revisi1Komprehensif: komprehensif.revisi1Komprehensif,
        revisi2Komprehensif: komprehensif.revisi2Komprehensif,
        komprehensifRevisi1: komprehensif.komprehensifRevisi1,
        komprehensifRevisi2: komprehensif.komprehensifRevisi2,
        statusKomprehensif: komprehensif.statusKomprehensif,
        jadwalUjianKomprehensif: komprehensif.jadwalUjianKomprehensif,
      };
    });
      
    
    let counter = 1;
    csvData.forEach((komprehensif) => {
      komprehensif.s_no = counter;
      worksheet.addRow(komprehensif);
      counter++;
    });
    let list = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O" ];
    for (let i = 0; i <= counter; i++) {
      list.forEach((item) => {
        worksheet.getCell(item + i).border = {
          top: { style: "thin" },
          left: { style: "thin" },
          bottom: { style: "thin" },
          right: { style: "thin" },
        };
      });
    }
    worksheet.getRow(1).eachCell((cell) => {
      cell.font = { bold: true };
    });
    
    try {
      const data2 = await workbook.xlsx
        .writeFile(`${path}/Bimbingan_Komprehensif.xlsx`)
        .then(() => {
          res.download(`${path}/Bimbingan_Komprehensif.xlsx`, "Bimbingan_Komprehensif.xlsx", (err) => {
            if (err) {
              console.log(err);
            } else {
              fs.unlinkSync(`${path}/Bimbingan_Komprehensif.xlsx`);
            }
          });
        });
    } catch (error) {
      next(
        new Error(
          "controllers/koordinatorController.js:exportTableToExcelKomprehensif- " + error.message
        )
      );
    }
  };
    
  const exportTableToPDFKomprehensif  = async (req, res, next) => {
      try {
        let pathFile = "./file-output";
        let fileName = "Bimbingan_Komprehensif.pdf";
        let fullPath = pathFile + "/" + fileName;
        let html = fs.readFileSync("./templates/templateKomprehensif.html", "utf-8");
        let options = {
          format: "A4",
          orientation: "landscape",
          border: "10mm",
          header: {
            height: "5mm",
            contents: '<div style="text-align: center;"></div>',
          },
          footer: {
            height: "28mm",
            contents: {
              first: "",
              2: "Second page", 
              default:
                '<span style="color: #444;">{{page}}</span>/<span>{{pages}}</span>', 
              last: "",
            },
          },
        };
        
        const data = await Komprehensif.findAll({
          include: [
            {
              model: DevisionOfLecturer,
              attributes: ['dosenPembimbing1', 'dosenPembimbing2', 'dosenPembahas'], 
            },
            {
              model: TitleSubmission,
              attributes: ['judul1', 'statusPersetujuan'], 
            },
            {
              model: TitleSubmission2,
              attributes: ['judul2'], 
            },
          ],
      });
  
      const komprehensifs = data.map((komprehensif, no) => {
        const judulValue = komprehensif.TitleSubmission
          ? komprehensif.TitleSubmission.statusPersetujuan === 'Judul 1 Diterima'
            ? komprehensif.TitleSubmission.judul1
            : komprehensif.TitleSubmission.statusPersetujuan === 'Judul 2 Diterima'
            ? komprehensif.TitleSubmission2.judul2
            : '-'
          : '-';
        const dosenPembimbing1 = komprehensif.DevisionOfLecturer?.dosenPembimbing1 || '-';
        const dosenPembimbing2 = komprehensif.DevisionOfLecturer?.dosenPembimbing2 || '-';
        const dosenPembahas = komprehensif.DevisionOfLecturer?.dosenPembahas || '-';
  
        return {
          s_no: no + 1,
          npm: komprehensif.npm || '-',
          nama: komprehensif.nama || '-',
          judul: judulValue,
          dosenPembimbing1,
          dosenPembimbing2,
          dosenPembahas,
          tanggalPengajuan: komprehensif.tanggalPengajuan || '-',
          komprehensif: komprehensif.komprehensif|| '-',
          statusKomprehensif: komprehensif.statusKomprehensif || '-',
          jadwalUjianKomprehensif: komprehensif.jadwalUjianKomprehensif || '-',
        };
      });
  
      const document = {
        html: html,
        data: {
          komprehensifs: komprehensifs,
        },
        path: fullPath,
        type: "",
      };
  
      const process = await pdf.create(document, options);
      if (process) {
        res.download(fullPath, fileName, (err) => {
          if (err) {
            console.log(err);
          } else {
            fs.unlinkSync(fullPath);
          }
        });
      }
    } catch (error) {
      next(
        new Error(
          "controllers/koordinatorController.js:exportTableToPDFKomprehensif - " + error.message
        )
      );
    }
  };

const getKomprehensifMasuk = async (req, res) => {
    try {
        const { id, username } = req.cookies;

        const profile = await StudentUser.findOne({
            where: { id },
        });

        const dataKomprehensif = await Komprehensif.findAll({
            include: [
              {
                model: DevisionOfLecturer,
                attributes: ['dosenPembimbing1', 'dosenPembimbing2', 'dosenPembahas'], 
              },
              {
                model: TitleSubmission,
                attributes: ['judul1', 'statusPersetujuan'], 
              },
              {
                model: TitleSubmission2,
                attributes: ['judul2'], 
              },
            ],
        });

        res.render('koordinator/komprehensifMasuk', {
            title: 'Bimbingan Komprehensif Masuk',
            id,
            username,
            profile,
            dataKomprehensif,
            addSuccess1: req.flash('addSuccess1')
        });
    } catch (error) {
        res.status(500).json({
            status: 500,
            msg: error.message
        });
    }
};

const editKomprehensifMasuk = async (req, res) => {
    try {
        const { id } = req.params;
        const { statusKomprehensif, StudentUserId, jadwalUjianKomprehensif } = req.body;

        const dataKomprehensif = await Komprehensif.findAll({});

        await Komprehensif.update({
            statusKomprehensif,
            StudentUserId,
            dataKomprehensif,
            jadwalUjianKomprehensif
        }, {
            where: {
                id
            }
        });

        return res.redirect('/koordinator-skripsi/komprehensif-masuk');
    } catch (error) {
        res.status(500).json({
            status: 500,
            msg: error.message
        });
    }
};

const exportTableToClipboardKomprehensifMasuk = async (req, res, next) => {
  try {
    const data = await Komprehensif.findAll({
      include: [
        {
          model: DevisionOfLecturer,
          attributes: ['dosenPembimbing1', 'dosenPembimbing2', 'dosenPembahas'], 
        },
        {
          model: TitleSubmission,
          attributes: ['judul1', 'statusPersetujuan'], 
        },
        {
          model: TitleSubmission2,
          attributes: ['judul2'], 
        },
      ],
  });

  const csvData = data
  .filter(komprehensifMasuk => !komprehensifMasuk.jadwalUjianKomprehensif) 
  .map((komprehensifMasuk, index) => {
    const judulValue = komprehensifMasuk.TitleSubmission
      ? komprehensifMasuk.TitleSubmission.statusPersetujuan === 'Judul 1 Diterima'
        ? komprehensifMasuk.TitleSubmission.judul1
        : komprehensifMasuk.TitleSubmission.statusPersetujuan === 'Judul 2 Diterima'
        ? komprehensifMasuk.TitleSubmission2.judul2
        : '-'
      : '-';
    return `${index + 1}\t${komprehensifMasuk.npm}\t${komprehensifMasuk.nama}\t${judulValue}\t${komprehensifMasuk.DevisionOfLecturer.dosenPembimbing1}\t${komprehensifMasuk.DevisionOfLecturer.dosenPembimbing2}\t${komprehensifMasuk.DevisionOfLecturer.dosenPembahas}\t${komprehensifMasuk.tanggalPengajuan}\t${komprehensifMasuk.komprehensif}\t${komprehensifMasuk.jadwalUjianKomprehensif}\n`;
  })
  .join('');

  
    copyPaste.copy(csvData, () => {
      req.flash('addSuccess1', 'Data komprehensif masuk berhasil disalin ke clipboard ')
      res.redirect('/koordinator-skripsi/komprehensif-masuk');
    });
  } catch (error) {
    next(new Error('controllers/koordinatorController.js:exportTableToClipboardKomprehensifMasuk - ' + error.message));
  }
};
  
const exportTableToCSVKomprehensifMasuk  = async (req, res, next) => {
  const path = './file-output';
  
  const data = await Komprehensif.findAll({
    include: [
      {
        model: DevisionOfLecturer,
        attributes: ['dosenPembimbing1', 'dosenPembimbing2', 'dosenPembahas'], 
      },
      {
        model: TitleSubmission,
        attributes: ['judul1', 'statusPersetujuan'], 
      },
      {
        model: TitleSubmission2,
        attributes: ['judul2'], 
      },
    ],
});
  
  const csvWriter = createCsvWriter({
    path: `${path}/Komprehensif_Masuk.csv`,
    header: [
      { id: 's_no', title: 'No', width: 5 },
      { id: 'npm', title: 'NPM', width: 20 },
      { id: 'nama', title: 'Nama', width: 20 },
      { id: 'judul', title: 'Judul', width: 20 },
      { id: 'dosenPembimbing1', title: 'Dosen Pembimbing 1', width: 30 },
      { id: 'dosenPembimbing2', title: 'Dosen Pembimbing 2', width: 30 },
      { id: 'dosenPembahas', title: 'Dosen Pembahas', width: 30 },
      { id: 'tanggalPengajuan', title: 'Tanggal Pengajuan', width: 30 },
      { id: 'komprehensif', title: 'Komprehensif Mahasiswa', width: 70 },
      { id: 'jadwalUjianKomprehensif', title: 'Jadwal Ujian Komprehensif', width: 20 }
    ],
    alwaysQuote: true, 
  });
  
  const filteredData = data
  .filter(komprehensifMasuk => !komprehensifMasuk.jadwalUjianKomprehensif);

  const csvData = filteredData.map((komprehensifMasuk, index) => {
    const judulValue = komprehensifMasuk.TitleSubmission
  ? komprehensifMasuk.TitleSubmission.statusPersetujuan === 'Judul 1 Diterima'
    ? komprehensifMasuk.TitleSubmission.judul1
    : komprehensifMasuk.TitleSubmission.statusPersetujuan === 'Judul 2 Diterima'
    ? komprehensifMasuk.TitleSubmission2.judul2
    : '-'
  : '-';
    return {
      s_no: index + 1,
      npm: komprehensifMasuk.npm,
      nama: komprehensifMasuk.nama,
      judul: judulValue,
      dosenPembimbing1: komprehensifMasuk.DevisionOfLecturer.dosenPembimbing1,
      dosenPembimbing2: komprehensifMasuk.DevisionOfLecturer.dosenPembimbing2,
      dosenPembahas: komprehensifMasuk.DevisionOfLecturer.dosenPembahas,
      tanggalPengajuan: komprehensifMasuk.tanggalPengajuan, 
      komprehensif: komprehensifMasuk.komprehensif, 
      jadwalUjianKomprehensif: komprehensifMasuk.jadwalUjianKomprehensif,
    };
  });
  
  let counter = 1;
  data.forEach((komprehensifMasuk) => {
    komprehensifMasuk.s_no = counter;
    counter++;
  });
  
  try {
    await csvWriter.writeRecords(csvData);
  
    res.download(`${path}/Komprehensif_Masuk.csv`, 'Komprehensif_Masuk.csv', (err) => {
      if (err) {
        console.log(err);
      } else {
        fs.unlinkSync(`${path}/Komprehensif_Masuk.csv`);
      }
    });
  } catch (error) {
    next(
      new Error('controllers/koordinatorController.js:exportTableToCSVKomprehensifMasuk - ' + error.message)
    );
  }
};
  
const exportTableToExcelKomprehensifMasuk  = async (req, res, next) => {
  
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("KomprehensifMasuk");
  const path = "./file-output";

  const data = await Komprehensif.findAll({
    include: [
      {
        model: DevisionOfLecturer,
        attributes: ['dosenPembimbing1', 'dosenPembimbing2', 'dosenPembahas'], 
      },
      {
        model: TitleSubmission,
        attributes: ['judul1', 'statusPersetujuan'], 
      },
      {
        model: TitleSubmission2,
        attributes: ['judul2'], 
      },
    ],
});
  
  worksheet.columns = [
    { header: 'No', key: 's_no', width: 5 },
    { header: 'NPM', key: 'npm', width: 20},
    { header: 'Nama', key: 'nama', width: 20 },
    { header: 'Judul', key: 'judul', width: 20 },
    { header: 'Dosen Pembimbing 1', key: 'dosenPembimbing1', width: 30  },
    { header: 'Dosen Pembimbing 2', key: 'dosenPembimbing2', width: 30  },
    { header: 'Dosen Pembahas', key: 'dosenPembahas', width: 30  },
    { header: 'Tanggal Pengajuan', key: 'tanggalPengajuan', width: 70 },
    { header: 'komprehensif', key: 'komprehensif', width: 70 },
    { header: 'Jadwal Ujian Komprehensif', key: 'jadwalUjianKomprehensif', width: 30 }
  ];

  const filteredData = data
.filter(komprehensifMasuk => !komprehensifMasuk.jadwalUjianKomprehensif);
  
  const csvData = filteredData.map((komprehensifMasuk, index) => {
    const judulValue = komprehensifMasuk.TitleSubmission
    ? komprehensifMasuk.TitleSubmission.statusPersetujuan === 'Judul 1 Diterima'
      ? komprehensifMasuk.TitleSubmission.judul1
      : komprehensifMasuk.TitleSubmission.statusPersetujuan === 'Judul 2 Diterima'
      ? komprehensifMasuk.TitleSubmission2.judul2
      : '-'
    : '-';
    return {
      s_no: index + 1,
      npm: komprehensifMasuk.npm,
      nama: komprehensifMasuk.nama,
      judul: judulValue,
      dosenPembimbing1: komprehensifMasuk.DevisionOfLecturer.dosenPembimbing1,
      dosenPembimbing2: komprehensifMasuk.DevisionOfLecturer.dosenPembimbing2,
      dosenPembahas: komprehensifMasuk.DevisionOfLecturer.dosenPembahas,
      tanggalPengajuan: komprehensifMasuk.tanggalPengajuan, 
      komprehensif: komprehensifMasuk.komprehensif, 
      jadwalUjianKomprehensif: komprehensifMasuk.jadwalUjianKomprehensif,
    };
  });
    
  
  let counter = 1;
  csvData.forEach((komprehensifMasuk) => {
    komprehensifMasuk.s_no = counter;
    worksheet.addRow(komprehensifMasuk);
    counter++;
  });
  let list = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J"];
  for (let i = 0; i <= counter; i++) {
    list.forEach((item) => {
      worksheet.getCell(item + i).border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      };
    });
  }
  worksheet.getRow(1).eachCell((cell) => {
    cell.font = { bold: true };
  });
  
  try {
    const data2 = await workbook.xlsx
      .writeFile(`${path}/Komprehensif_Masuk.xlsx`)
      .then(() => {
        res.download(`${path}/Komprehensif_Masuk.xlsx`, "Komprehensif_Masuk.xlsx", (err) => {
          if (err) {
            console.log(err);
          } else {
            fs.unlinkSync(`${path}/Komprehensif_Masuk.xlsx`);
          }
        });
      });
  } catch (error) {
    next(
      new Error(
        "controllers/koordinatorController.js:exportTableToExcelKomprehensifMasuk - " + error.message
      )
    );
  }
};

const exportTableToPDFKomprehensifMasuk = async (req, res, next) => {
  try {
    let pathFile = "./file-output";
    let fileName = "Komprehensif_Masuk.pdf";
    let fullPath = pathFile + "/" + fileName;
    let html = fs.readFileSync("./templates/templateKomprehensifMasuk.html", "utf-8");
    let options = {
      format: "A4",
      orientation: "landscape",
      border: "10mm",
      header: {
        height: "5mm",
        contents: '<div style="text-align: center;"></div>',
      },
      footer: {
        height: "28mm",
        contents: {
          first: "",
          2: "Second page", 
          default:
            '<span style="color: #444;">{{page}}</span>/<span>{{pages}}</span>', 
          last: "",
        },
      },
    };
    
    const data = await Komprehensif.findAll({
      include: [
        {
          model: DevisionOfLecturer,
          attributes: ['dosenPembimbing1', 'dosenPembimbing2', 'dosenPembahas'], 
        },
        {
          model: TitleSubmission,
          attributes: ['judul1', 'statusPersetujuan'], 
        },
        {
          model: TitleSubmission2,
          attributes: ['judul2'], 
        },
      ],
  });

  const filteredData = data
  .filter(komprehensifMasuk => !komprehensifMasuk.jadwalUjianKomprehensif);

  const komprehensifMasuks = filteredData.map((komprehensifMasuk, index) => {
    const judulValue = komprehensifMasuk.TitleSubmission
      ? komprehensifMasuk.TitleSubmission.statusPersetujuan === 'Judul 1 Diterima'
        ? komprehensifMasuk.TitleSubmission.judul1
        : komprehensifMasuk.TitleSubmission.statusPersetujuan === 'Judul 2 Diterima'
        ? komprehensifMasuk.TitleSubmission2.judul2
        : '-'
      : '-';
    const dosenPembimbing1 = komprehensifMasuk.DevisionOfLecturer?.dosenPembimbing1 || '-';
    const dosenPembimbing2 = komprehensifMasuk.DevisionOfLecturer?.dosenPembimbing2 || '-';
    const dosenPembahas = komprehensifMasuk.DevisionOfLecturer?.dosenPembahas || '-';

    return {
      s_no: index + 1,
      npm: komprehensifMasuk.npm || '-',
      nama: komprehensifMasuk.nama || '-',
      judul: judulValue,
      dosenPembimbing1,
      dosenPembimbing2,
      dosenPembahas,
      tanggalPengajuan: komprehensifMasuk.tanggalPengajuan || '-',
      komprehensif: komprehensifMasuk.komprehensif || '-',
      jadwalUjianKomprehensif: komprehensifMasuk.jadwalUjianKomprehensif || '-',
    };
  });

  const document = {
    html: html,
    data: {
      komprehensifMasuks: komprehensifMasuks,
    },
    path: fullPath,
    type: "",
  };

  const process = await pdf.create(document, options);
  if (process) {
    res.download(fullPath, fileName, (err) => {
      if (err) {
        console.log(err);
      } else {
        fs.unlinkSync(fullPath);
      }
    });
  }
} catch (error) {
  next(
    new Error(
      "controllers/koordinatorController.js:exportTableToPDFKomprehensifMasuk - " + error.message
    )
  );
 }
};

const getKomprehensifTerjadwal = async (req, res) => {
    try {
        const { id, username } = req.cookies;

        const profile = await StudentUser.findOne({
            where: { id },
        });

        const dataKomprehensif = await Komprehensif.findAll({
            include: [
              {
                model: DevisionOfLecturer,
                attributes: ['dosenPembimbing1', 'dosenPembimbing2', 'dosenPembahas'], 
              },
              {
                model: TitleSubmission,
                attributes: ['judul1', 'statusPersetujuan'], 
              },
              {
                model: TitleSubmission2,
                attributes: ['judul2'], 
              },
            ],
        });

        const warna7 = {};

        dataKomprehensif.forEach((komprehensifStatus) => {
            warna7[komprehensifStatus.id] = colors.getStatusColor7(komprehensifStatus.statusKomprehensif);
        });

        res.render('koordinator/komprehensifTerjadwal', {
            title: 'Komprehensif Terjadwal',
            id,
            username,
            profile,
            dataKomprehensif,
            warna7,
            colors,
            addSuccess1: req.flash('addSuccess1')
        });
    } catch (error) {
        res.status(500).json({
            status: 500,
            msg: error.message
        });
    }
};

const editKomprehensifTerjadwal = async (req, res) => {
    try {
        const { id } = req.params;
        const { statusKomprehensif, StudentUserId, jadwalUjianKomprehensif } = req.body;

        const dataKomprehensif = await Komprehensif.findAll({});

        await Komprehensif.update({
            statusKomprehensif,
            StudentUserId,
            dataKomprehensif,
            jadwalUjianKomprehensif
        }, {
            where: {
                id
            }
        });

        return res.redirect('/koordinator-skripsi/komprehensif-terjadwal');
    } catch (error) {
        res.status(500).json({
            status: 500,
            msg: error.message
        });
    }
};

const editKomprehensifTerjadwalSelesai = async (req, res) => {
    try {
        const { id } = req.params;
        const { statusKomprehensif, StudentUserId, JadwalUjianKomprehensif } = req.body;

        const dataKomprehensif = await Komprehensif.findAll({});

        await Komprehensif.update({
            statusKomprehensif,
            StudentUserId,
            dataKomprehensif,
            JadwalUjianKomprehensif
        }, {
            where: {
                id
            }
        });

        return res.redirect('/koordinator-skripsi/komprehensif-terjadwal');
    } catch (error) {
        res.status(500).json({
            status: 500,
            msg: error.message
        });
    }
};

const exportTableToClipboardKomprehensifTerjadwal = async (req, res, next) => {
  try {
    const data = await Komprehensif.findAll({
      include: [
        {
          model: DevisionOfLecturer,
          attributes: ['dosenPembimbing1', 'dosenPembimbing2', 'dosenPembahas'], 
        },
        {
          model: TitleSubmission,
          attributes: ['judul1', 'statusPersetujuan'], 
        },
        {
          model: TitleSubmission2,
          attributes: ['judul2'], 
        },
      ],
  });

  const csvData = data
  .filter(komprehensifTerjadwal => komprehensifTerjadwal.jadwalUjianKomprehensif && komprehensifTerjadwal.statusKomprehensif !== 'Selesai') 
  .map((komprehensifTerjadwal, index) => {
    return `${index + 1}\t${komprehensifTerjadwal.npm}\t${komprehensifTerjadwal.nama}\t${komprehensifTerjadwal.komprehensif}\t${komprehensifTerjadwal.jadwalUjianKomprehensif}\t${komprehensifTerjadwal.statusKomprehensif}\n`;
  })
  .join('');

    copyPaste.copy(csvData, () => {
      req.flash('addSuccess1', 'Data komprehensif terjadwal berhasil disalin ke clipboard ')
      res.redirect('/koordinator-skripsi/komprehensif-terjadwal');
    });
  } catch (error) {
    next(new Error('controllers/koordinatorController.js:exportTableToClipboardKomprehensifTerjadwal - ' + error.
message));
  }
};
  
const exportTableToCSVKomprehensifTerjadwal  = async (req, res, next) => {
  const path = './file-output';
  
  const data = await Komprehensif.findAll({
    include: [
      {
        model: DevisionOfLecturer,
        attributes: ['dosenPembimbing1', 'dosenPembimbing2', 'dosenPembahas'], 
      },
      {
        model: TitleSubmission,
        attributes: ['judul1', 'statusPersetujuan'], 
      },
      {
        model: TitleSubmission2,
        attributes: ['judul2'], 
      },
    ],
});
  
  const csvWriter = createCsvWriter({
    path: `${path}/Komprehensif_Terjadwal.csv`,
    header: [
      { id: 's_no', title: 'No', width: 5 },
      { id: 'npm', title: 'NPM', width: 20 },
      { id: 'nama', title: 'Nama', width: 20 },
      { id: 'komprehensif', title: 'komprehensif Mahasiswa', width: 70 },
      { id: 'jadwalUjianKomprehensif', title: 'Jadwal Ujian Komprehensif', width: 20 },
      { id: 'statusKomprehensif', title: 'StatusKomprehensif', width: 20 }
    ],
    alwaysQuote: true, 
  });

  const filteredData = data
.filter(komprehensifTerjadwal => komprehensifTerjadwal.jadwalUjianKomprehensif && komprehensifTerjadwal.
statusKomprehensif !== 'Selesai');

  const csvData = filteredData.map((komprehensifTerjadwal, index) => {
    return {
      s_no: index + 1,
      npm: komprehensifTerjadwal.npm,
      nama: komprehensifTerjadwal.nama,
      komprehensif: komprehensifTerjadwal.komprehensif, 
      jadwalUjianKomprehensif: komprehensifTerjadwal.jadwalUjianKomprehensif,
      statusKomprehensif: komprehensifTerjadwal.statusKomprehensif,
    };
  });
  
  let counter = 1;
  data.forEach((komprehensifTerjadwal) => {
    komprehensifTerjadwal.s_no = counter;
    counter++;
  });
  
  try {
    await csvWriter.writeRecords(csvData);
  
    res.download(`${path}/Komprehensif_Terjadwal.csv`, 'Komprehensif_Terjadwal.csv', (err) => {
      if (err) {
        console.log(err);
      } else {
        fs.unlinkSync(`${path}/Komprehensif_Terjadwal.csv`);
      }
    });
  } catch (error) {
    next(
      new Error('controllers/koordinatorController.js:exportTableToCSVKomprehensifTerjadwal - ' + error.message)
    );
  }
};
  
const exportTableToExcelKomprehensifTerjadwal  = async (req, res, next) => {
  
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("KomprehensifTerjadwal");
  const path = "./file-output";

  const data = await Komprehensif.findAll({
    include: [
      {
        model: DevisionOfLecturer,
        attributes: ['dosenPembimbing1', 'dosenPembimbing2', 'dosenPembahas'], 
      },
      {
        model: TitleSubmission,
        attributes: ['judul1', 'statusPersetujuan'], 
      },
      {
        model: TitleSubmission2,
        attributes: ['judul2'], 
      },
    ],
});
  
  worksheet.columns = [
    { header: 'No', key: 's_no', width: 5 },
    { header: 'NPM', key: 'npm', width: 20},
    { header: 'Nama', key: 'nama', width: 20 },
    { header: 'komprehensif', key: 'komprehensif', width: 70 },
    { header: 'Jadwal Ujian Komprehensif', key: 'jadwalUjianKomprehensif', width: 30 },
    { header: 'Status Komprehensif', key: 'statusKomprehensif', width: 30 }
  ];

  const filteredData = data
.filter(komprehensifTerjadwal => komprehensifTerjadwal.jadwalUjianKomprehensif && komprehensifTerjadwal.
statusKomprehensif !== 'Selesai');
  
  const csvData = filteredData.map((komprehensifTerjadwal, index) => {
    return {
      s_no: index + 1,
      npm: komprehensifTerjadwal.npm,
      nama: komprehensifTerjadwal.nama,
      komprehensif: komprehensifTerjadwal.komprehensif, 
      jadwalUjianKomprehensif: komprehensifTerjadwal.jadwalUjianKomprehensif,
      statusKomprehensif: komprehensifTerjadwal.statusKomprehensif,
    };
  });
    
  
  let counter = 1;
  csvData.forEach((komprehensifTerjadwal) => {
    komprehensifTerjadwal.s_no = counter;
    worksheet.addRow(komprehensifTerjadwal);
    counter++;
  });
  let list = ["A", "B", "C", "D", "E", "F"];
  for (let i = 0; i <= counter; i++) {
    list.forEach((item) => {
      worksheet.getCell(item + i).border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      };
    });
  }
  worksheet.getRow(1).eachCell((cell) => {
    cell.font = { bold: true };
  });
  
  try {
    const data2 = await workbook.xlsx
      .writeFile(`${path}/Komprehensif_Terjadwal.xlsx`)
      .then(() => {
        res.download(`${path}/Komprehensif_Terjadwal.xlsx`, "Komprehensif_Terjadwal.xlsx", (err) => {
          if (err) {
            console.log(err);
          } else {
            fs.unlinkSync(`${path}/Komprehensif_Terjadwal.xlsx`);
          }
        });
      });
  } catch (error) {
    next(
      new Error(
        "controllers/koordinatorController.js:exportTableToExcelKomprehensifTerjadwal - " + error.message
      )
    );
  }
};

const exportTableToPDFKomprehensifTerjadwal = async (req, res, next) => {
  try {
    let pathFile = "./file-output";
    let fileName = "Komprehensif_Terjadwal.pdf";
    let fullPath = pathFile + "/" + fileName;
    let html = fs.readFileSync("./templates/templateKomprehensifTerjadwal.html", "utf-8");
    let options = {
      format: "A4",
      orientation: "landscape",
      border: "10mm",
      header: {
        height: "5mm",
        contents: '<div style="text-align: center;"></div>',
      },
      footer: {
        height: "28mm",
        contents: {
          first: "",
          2: "Second page", 
          default:
            '<span style="color: #444;">{{page}}</span>/<span>{{pages}}</span>', 
          last: "",
        },
      },
    };
    
    const data = await Komprehensif.findAll({
      include: [
        {
          model: DevisionOfLecturer,
          attributes: ['dosenPembimbing1', 'dosenPembimbing2', 'dosenPembahas'], 
        },
        {
          model: TitleSubmission,
          attributes: ['judul1', 'statusPersetujuan'], 
        },
        {
          model: TitleSubmission2,
          attributes: ['judul2'], 
        },
      ],
  });

  const filteredData = data
  .filter(komprehensifTerjadwal => komprehensifTerjadwal.jadwalUjianKomprehensif && komprehensifTerjadwal.
statusKomprehensif !== 'Selesai');


  const komprehensifTerjadwals = filteredData.map((komprehensifTerjadwal, index) => {
    return {
      s_no: index + 1,
      npm: komprehensifTerjadwal.npm || '-',
      nama: komprehensifTerjadwal.nama || '-',
      komprehensif: komprehensifTerjadwal.komprehensif || '-',
      jadwalUjianKomprehensif: komprehensifTerjadwal.jadwalUjianKomprehensif || '-',
      statusKomprehensif: komprehensifTerjadwal.statusKomprehensif || '-',
    };
  });

  const document = {
    html: html,
    data: {
      komprehensifTerjadwals: komprehensifTerjadwals,
    },
    path: fullPath,
    type: "",
  };

  const process = await pdf.create(document, options);
  if (process) {
    res.download(fullPath, fileName, (err) => {
      if (err) {
        console.log(err);
      } else {
        fs.unlinkSync(fullPath);
      }
    });
  }
} catch (error) {
  next(
    new Error(
      "controllers/koordinatorController.js:exportTableToPDFKomprehensifTerjadwal - " + error.message
    )
  );
 }
};

const getKomprehensifSelesai = async (req, res) => {
    try {
        const { id, username } = req.cookies;

        const profile = await StudentUser.findOne({
            where: { id },
        });

        const dataKomprehensif = await Komprehensif.findAll({
            include: [
              {
                model: DevisionOfLecturer,
                attributes: ['dosenPembimbing1', 'dosenPembimbing2', 'dosenPembahas'], 
              },
              {
                model: TitleSubmission,
                attributes: ['judul1', 'statusPersetujuan'], 
              },
              {
                model: TitleSubmission2,
                attributes: ['judul2'], 
              },
            ],
        });

        const warna7 = {};

        dataKomprehensif.forEach((komprehensifStatus) => {
            warna7[komprehensifStatus.id] = colors.getStatusColor5(komprehensifStatus.statusKomprehensif);
        });

        res.render('koordinator/komprehensifSelesai', {
            title: 'Komprehensif Selesai',
            id,
            username,
            profile,
            dataKomprehensif,
            warna7,
            colors,
            addSuccess1: req.flash('addSuccess1')
        });
    } catch (error) {
        res.status(500).json({
            status: 500,
            msg: error.message
        });
    }
};

const editKomprehensifSelesai = async (req, res) => {
    try {
        const { id } = req.params;
        const { statusKomprehensif, StudentUserId, jadwalUjianKomprehensif } = req.body;

        const dataKomprehensif = await Komprehensif.findAll({});

        await Komprehensif.update({
            statusKomprehensif,
            StudentUserId,
            dataKomprehensif,
            jadwalUjianKomprehensif
        }, {
            where: {
                id
            }
        });

        return res.redirect('/koordinator-skripsi/komprehensif-selesai');
    } catch (error) {
        res.status(500).json({
            status: 500,
            msg: error.message
        });
    }
};

const exportTableToClipboardKomprehensifSelesai = async (req, res, next) => {
  try {
    const data = await Komprehensif.findAll({
      include: [
        {
          model: DevisionOfLecturer,
          attributes: ['dosenPembimbing1', 'dosenPembimbing2', 'dosenPembahas'], 
        },
        {
          model: TitleSubmission,
          attributes: ['judul1', 'statusPersetujuan'], 
        },
        {
          model: TitleSubmission2,
          attributes: ['judul2'], 
        },
      ],
  });

  const csvData = data
  .filter(komprehensifSelesai => komprehensifSelesai.statusKomprehensif === 'Selesai') 
  .map((komprehensifSelesai, index) => {
    const judulValue = komprehensifSelesai.TitleSubmission
    ? komprehensifSelesai.TitleSubmission.statusPersetujuan === 'Judul 1 Diterima'
      ? komprehensifSelesai.TitleSubmission.judul1
      : komprehensifSelesai.TitleSubmission.statusPersetujuan === 'Judul 2 Diterima'
      ? komprehensifSelesai.TitleSubmission2.judul2
      : '-'
    : '-';
    return `${index + 1}\t${komprehensifSelesai.npm}\t${komprehensifSelesai.nama}\t${judulValue}\t${komprehensifSelesai.komprehensif}\t${komprehensifSelesai.jadwalUjianKomprehensif}\t${komprehensifSelesai.statusKomprehensif}\n`;
  })
  .join('');

    copyPaste.copy(csvData, () => {
      req.flash('addSuccess1', 'Data komprehensif selesai berhasil disalin ke clipboard ')
      res.redirect('/koordinator-skripsi/komprehensif-selesai');
    });
  } catch (error) {
    next(new Error('controllers/koordinatorController.js:exportTableToClipboardKomprehensifSelesai - ' + error.message));
  }
};
  
const exportTableToCSVKomprehensifSelesai  = async (req, res, next) => {
  const path = './file-output';
  
  const data = await Komprehensif.findAll({
    include: [
      {
        model: DevisionOfLecturer,
        attributes: ['dosenPembimbing1', 'dosenPembimbing2', 'dosenPembahas'], 
      },
      {
        model: TitleSubmission,
        attributes: ['judul1', 'statusPersetujuan'], 
      },
      {
        model: TitleSubmission2,
        attributes: ['judul2'], 
      },
    ],
});
  
  const csvWriter = createCsvWriter({
    path: `${path}/Komprehensif_Selesai.csv`,
    header: [
      { id: 's_no', title: 'No', width: 5 },
      { id: 'npm', title: 'NPM', width: 20 },
      { id: 'judul', title: 'Judul', width: 20 },
      { id: 'nama', title: 'Nama', width: 20 },
      { id: 'komprehensif', title: 'Komprehensif Mahasiswa', width: 70 },
      { id: 'jadwalUjianKomprehensif', title: 'Jadwal Ujian Komprehensif', width: 20 },
      { id: 'statusKomprehensif', title: 'StatusKomprehensif', width: 20 }
    ],
    alwaysQuote: true, 
  });
  
  const filteredData = data
  .filter(komprehensifSelesai => komprehensifSelesai.statusKomprehensif === 'Selesai');

  const csvData = filteredData.map((komprehensifSelesai, index) => {
    const judulValue = komprehensifSelesai.TitleSubmission
    ? komprehensifSelesai.TitleSubmission.statusPersetujuan === 'Judul 1 Diterima'
      ? komprehensifSelesai.TitleSubmission.judul1
      : komprehensifSelesai.TitleSubmission.statusPersetujuan === 'Judul 2 Diterima'
      ? komprehensifSelesai.TitleSubmission2.judul2
      : '-'
    : '-';
    return {
      s_no: index + 1,
      npm: komprehensifSelesai.npm,
      nama: komprehensifSelesai.nama,
      judul: judulValue,
      komprehensif: komprehensifSelesai.komprehensif, 
      jadwalUjianKomprehensif: komprehensifSelesai.jadwalUjianKomprehensif,
      statusKomprehensif: komprehensifSelesai.statusKomprehensif,
    };
  });
  
  let counter = 1;
  data.forEach((komprehensifSelesai) => {
    komprehensifSelesai.s_no = counter;
    counter++;
  });
  
  try {
    await csvWriter.writeRecords(csvData);
  
    res.download(`${path}/Komprehensif_Selesai.csv`, 'Komprehensif_Selesai.csv', (err) => {
      if (err) {
        console.log(err);
      } else {
        fs.unlinkSync(`${path}/Komprehensif_Selesai.csv`);
      }
    });
  } catch (error) {
    next(
      new Error('controllers/koordinatorController.js:exportTableToCSVKomprehensifSelesai - ' + error.message)
    );
  }
};
  
const exportTableToExcelKomprehensifSelesai  = async (req, res, next) => {
  
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("KomprehensifSelesai");
  const path = "./file-output";

  const data = await Komprehensif.findAll({
    include: [
      {
        model: DevisionOfLecturer,
        attributes: ['dosenPembimbing1', 'dosenPembimbing2', 'dosenPembahas'], 
      },
      {
        model: TitleSubmission,
        attributes: ['judul1', 'statusPersetujuan'], 
      },
      {
        model: TitleSubmission2,
        attributes: ['judul2'], 
      },
    ],
});
  
  worksheet.columns = [
    { header: 'No', key: 's_no', width: 5 },
    { header: 'NPM', key: 'npm', width: 20},
    { header: 'Nama', key: 'nama', width: 20 },
    { header: 'Judul', key: 'judul', width: 20 },
    { header: 'Komprehensif', key: 'komprehensif', width: 70 },
    { header: 'Jadwal Ujian Komprehensif', key: 'jadwalUjianKomprehensif', width: 30 },
    { header: 'Status Komprehensif', key: 'statusKomprehensif', width: 30 }
  ];

  const filteredData = data
  .filter(komprehensifSelesai => komprehensifSelesai.statusKomprehensif === 'Selesai');
  
  const csvData = filteredData.map((komprehensifSelesai, index) => {
    const judulValue = komprehensifSelesai.TitleSubmission
    ? komprehensifSelesai.TitleSubmission.statusPersetujuan === 'Judul 1 Diterima'
      ? komprehensifSelesai.TitleSubmission.judul1
      : komprehensifSelesai.TitleSubmission.statusPersetujuan === 'Judul 2 Diterima'
      ? komprehensifSelesai.TitleSubmission2.judul2
      : '-'
    : '-';
    return {
      s_no: index + 1,
      npm: komprehensifSelesai.npm,
      nama: komprehensifSelesai.nama,
      judul: judulValue,
      komprehensif: komprehensifSelesai.komprehensif, 
      jadwalUjianKomprehensif: komprehensifSelesai.jadwalUjianKomprehensif,
      statusKomprehensif: komprehensifSelesai.statusKomprehensif,
    };
  });
    
  
  let counter = 1;
  csvData.forEach((komprehensifSelesai) => {
    komprehensifSelesai.s_no = counter;
    worksheet.addRow(komprehensifSelesai);
    counter++;
  });
  let list = ["A", "B", "C", "D", "E", "F", "G"];
  for (let i = 0; i <= counter; i++) {
    list.forEach((item) => {
      worksheet.getCell(item + i).border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      };
    });
  }
  worksheet.getRow(1).eachCell((cell) => {
    cell.font = { bold: true };
  });
  
  try {
    const data2 = await workbook.xlsx
      .writeFile(`${path}/Komprehensif_Selesai.xlsx`)
      .then(() => {
        res.download(`${path}/Komprehensif_Selesai.xlsx`, "Komprehensif_Selesai.xlsx", (err) => {
          if (err) {
            console.log(err);
          } else {
            fs.unlinkSync(`${path}/Komprehensif_Selesai.xlsx`);
          }
        });
      });
  } catch (error) {
    next(
      new Error(
        "controllers/koordinatorController.js:exportTableToExcelKomprehensifSelesai - " + error.message
      )
    );
  }
};

const exportTableToPDFKomprehensifSelesai = async (req, res, next) => {
  try {
    let pathFile = "./file-output";
    let fileName = "Komprehensif_Selesai.pdf";
    let fullPath = pathFile + "/" + fileName;
    let html = fs.readFileSync("./templates/templateKomprehensifSelesai.html", "utf-8");
    let options = {
      format: "A4",
      orientation: "landscape",
      border: "10mm",
      header: {
        height: "5mm",
        contents: '<div style="text-align: center;"></div>',
      },
      footer: {
        height: "28mm",
        contents: {
          first: "",
          2: "Second page", 
          default:
            '<span style="color: #444;">{{page}}</span>/<span>{{pages}}</span>', 
          last: "",
        },
      },
    };
    
    const data = await Komprehensif.findAll({
      include: [
        {
          model: DevisionOfLecturer,
          attributes: ['dosenPembimbing1', 'dosenPembimbing2', 'dosenPembahas'], 
        },
        {
          model: TitleSubmission,
          attributes: ['judul1', 'statusPersetujuan'], 
        },
        {
          model: TitleSubmission2,
          attributes: ['judul2'], 
        },
      ],
  });

  const filteredData = data
  .filter(komprehensifSelesai => komprehensifSelesai.statusKomprehensif === 'Selesai');
  
  const komprehensifSelesais = filteredData.map((komprehensifSelesai, index) => {
    const judulValue = komprehensifSelesai.TitleSubmission
      ? komprehensifSelesai.TitleSubmission.statusPersetujuan === 'Judul 1 Diterima'
        ? komprehensifSelesai.TitleSubmission.judul1
        : komprehensifSelesai.TitleSubmission.statusPersetujuan === 'Judul 2 Diterima'
        ? komprehensifSelesai.TitleSubmission2.judul2
        : '-'
      : '-';
    return {
      s_no: index + 1,
      npm: komprehensifSelesai.npm || '-',
      nama: komprehensifSelesai.nama || '-',
      judul: judulValue,
      komprehensif: komprehensifSelesai.komprehensif || '-',
      jadwalUjianKomprehensif: komprehensifSelesai.jadwalUjianKomprehensif || '-',
      statusKomprehensif: komprehensifSelesai.statusKomprehensif || '-',
    };
  });

  const document = {
    html: html,
    data: {
      komprehensifSelesais: komprehensifSelesais,
    },
    path: fullPath,
    type: "",
  };

  const process = await pdf.create(document, options);
  if (process) {
    res.download(fullPath, fileName, (err) => {
      if (err) {
        console.log(err);
      } else {
        fs.unlinkSync(fullPath);
      }
    });
  }
} catch (error) {
  next(
    new Error(
      "controllers/koordinatorController.js:exportTableToPDFKomprehensifSelesai - " + error.message
    )
  );
 }
};

const profile = async (req, res) => {
    try {
        const { id, username } = req.cookies;

        const profile = await CoordinatorUser.findOne({
            where: { id },
        });

        if (!profile) {
            return res.status(404).json({ message: 'Profile koordinator tidak ditemukan' });
        }

        return res.render('koordinator/profile', {
            title: 'Edit Profile Koordinator',
            id,
            username,
            profile,
            editSuccess: req.flash('editSuccess')
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Terjadi kesalahan dalam mengambil data profile' });
    }
};

const profilePost = async (req, res) => {
    try {
        const { id } = req.params;

        const { npm, nama, password, gender, foto } = req.body;

        const koorProfile = {
            npm,
            nama,
            password,
            gender,
            foto
        };

        await CoordinatorUser.update(koorProfile, {
            where: {
                id
            }
        });

        req.flash('editSuccess', 'Profile Koordinator berhasil DIUBAH!');
        return res.redirect(`/koordinator-skripsi/${id}/profile?success=true`);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Terjadi kesalahan dalam mengedit data profile' });
    }
};

const ubahPassword = async (req, res) => {
    try {
        const { id, username } = req.cookies;

        const profile = await CoordinatorUser.findOne({
            where: { id },
        });

        if (!profile) {
            return res.status(404).json({ message: 'Akun koordinator tidak ditemukan' });
        }

        return res.render('koordinator/ubahPassword', {
            title: 'Ubah Password Koordinator',
            id,
            username,
            profile,
            editSuccess: req.flash('editSuccess')
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Terjadi kesalahan dalam mengubah password' });
    }
};

const passwordPost = async (req, res) => {
    try {
        const { id } = req.params;

        const { username, email, password } = req.body;

        const userProfile = {
            username,
            email,
            password: encryptPass(password)
        };

        await CoordinatorUser.update(userProfile, {
            where: {
                id
            }
        });

        req.flash('editSuccess', 'Password mahasiswa berhasil DIUBAH!')
        return res.redirect(`/koordinator-skripsi/${id}/ubah-password?success=true`);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Terjadi kesalahan dalam mengubah password' });
    }
};

const logout = async (req, res) => {
    try {
        res.clearCookie('token').redirect('/')
    } catch (error) {
        res.status(500).json({
            status: 500,
            msg: error.message
        })
    }
}

module.exports = {
    getLogin,
    login,
    getDashboardKoor, 
    getPembagianDosen,
    editPembagianDosen,
    ubahPembagianDosen,
    exportTableToClipboardPembagianDosen, 
    exportTableToCSVPembagianDosen, 
    exportTableToExcelPembagianDosen, 
    exportTableToPDFPembagianDosen,
    getPermintaanBimbingan,
    editPermintaanBimbingan,
    exportTableToClipboardPermintaanBimbingan, 
    exportTableToCSVPermintaanBimbingan, 
    exportTableToExcelPermintaanBimbingan, 
    exportTableToPDFPermintaanBimbingan,
    getDaftarDosen,
    addDosenToDaftar,
    deleteDaftarDosen,
    exportTableToClipboardDaftarDosen1, 
    exportTableToCSVDaftarDosen1, 
    exportTableToExcelDaftarDosen1, 
    exportTableToPDFDaftarDosen1,
    getDaftarDosen2,
    addDosenToDaftar2,
    deleteDaftarDosen2,
    exportTableToClipboardDaftarDosen2, 
    exportTableToCSVDaftarDosen2, 
    exportTableToExcelDaftarDosen2, 
    exportTableToPDFDaftarDosen2,
    getDaftarDosen3,
    addDosenToDaftar3,
    deleteDaftarDosen3,
    exportTableToClipboardDaftarDosen3, 
    exportTableToCSVDaftarDosen3, 
    exportTableToExcelDaftarDosen3, 
    exportTableToPDFDaftarDosen3,
    getPengajuanJudul,
    editPengajuanJudul,
    deletePengajuanJudul,
    exportTableToClipboardPengajuanJudul, 
    exportTableToCSVPengajuanJudul, 
    exportTableToExcelPengajuanJudul, 
    exportTableToPDFPengajuanJudul,
    getJudulDiterima,
    exportTableToClipboardJudulDiterima, 
    exportTableToCSVJudulDiterima, 
    exportTableToExcelJudulDiterima, 
    exportTableToPDFJudulDiterima,
    getProposal,
    downloadProposal,
    editProposal,
    deleteProposal,
    downloadProposalRevisi1,
    downloadProposalRevisi2,
    downloadProposalRevisiDosen1,
    downloadProposalRevisiDosen2,
    exportTableToClipboardProposal, 
    exportTableToCSVProposal, 
    exportTableToExcelProposal, 
    exportTableToPDFProposal,
    getProposalMasuk,
    editProposalMasuk,
    exportTableToClipboardProposalMasuk, 
    exportTableToCSVProposalMasuk, 
    exportTableToExcelProposalMasuk, 
    exportTableToPDFProposalMasuk,
    getProposalTerjadwal,
    editProposalTerjadwal,
    editProposalTerjadwalSelesai,
    exportTableToClipboardProposalTerjadwal,
    exportTableToCSVProposalTerjadwal, 
    exportTableToExcelProposalTerjadwal, 
    exportTableToPDFProposalTerjadwal,
    getProposalSelesai,
    editProposalSelesai,
    exportTableToClipboardProposalSelesai, 
    exportTableToCSVProposalSelesai, 
    exportTableToExcelProposalSelesai, 
    exportTableToPDFProposalSelesai,
    getHasilSkripsi,
    downloadHasilSkripsi,
    editHasilSkripsi,
    deleteHasilSkripsi,
    downloadHasilSkripsiRevisi1,
    downloadHasilSkripsiRevisi2,
    downloadHasilSkripsiRevisiDosen1,
    downloadHasilSkripsiRevisiDosen2,
    exportTableToClipboardHasil, 
    exportTableToCSVHasil, 
    exportTableToExcelHasil, 
    exportTableToPDFHasil,
    getHasilMasuk,
    editHasilMasuk,
    exportTableToClipboardHasilMasuk, 
    exportTableToCSVHasilMasuk, 
    exportTableToExcelHasilMasuk, 
    exportTableToPDFHasilMasuk,
    getHasilTerjadwal,
    editHasilTerjadwal,
    editHasilTerjadwalSelesai,
    exportTableToClipboardHasilTerjadwal, 
    exportTableToCSVHasilTerjadwal, 
    exportTableToExcelHasilTerjadwal, 
    exportTableToPDFHasilTerjadwal,
    getHasilSelesai,
    editHasilSelesai,
    exportTableToClipboardHasilSelesai, 
    exportTableToCSVHasilSelesai, 
    exportTableToExcelHasilSelesai, 
    exportTableToPDFHasilSelesai,
    getKomprehensif,
    downloadKomprehensif,
    editKomprehensif,
    deleteKomprehensif,
    downloadKomprehensifRevisi1,
    downloadKomprehensifRevisi2,
    exportTableToClipboardKomprehensif, 
    exportTableToCSVKomprehensif, 
    exportTableToExcelKomprehensif, 
    exportTableToPDFKomprehensif,
    getKomprehensifMasuk,
    editKomprehensifMasuk,
    exportTableToClipboardKomprehensifMasuk,
    exportTableToCSVKomprehensifMasuk, 
    exportTableToExcelKomprehensifMasuk, 
    exportTableToPDFKomprehensifMasuk,
    getKomprehensifTerjadwal,
    editKomprehensifTerjadwal,
    editKomprehensifTerjadwalSelesai,
    exportTableToClipboardKomprehensifTerjadwal,
    exportTableToCSVKomprehensifTerjadwal, 
    exportTableToExcelKomprehensifTerjadwal, 
    exportTableToPDFKomprehensifTerjadwal,
    getKomprehensifSelesai,
    editKomprehensifSelesai,
    exportTableToClipboardKomprehensifSelesai,
    exportTableToCSVKomprehensifSelesai, 
    exportTableToExcelKomprehensifSelesai, 
    exportTableToPDFKomprehensifSelesai,
    profile,
    profilePost, 
    ubahPassword,
    passwordPost,
    logout
}