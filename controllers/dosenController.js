require('dotenv').config()
const Transport = require('nodemailer-sendinblue-transport')
const colors = require('../helpers/colors')
const { DateTime } = require('luxon');
const path = require('path');
const copyPaste = require('copy-paste');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;
const ExcelJS = require('exceljs');
const pdf = require('pdf-creator-node');
const puppeteer = require('puppeteer');
const fs = require('fs');

const {User, LecturerUser, StudentUser,  CoordinatorUser, ListOfLecturer1, ListOfLecturer2, ListOfLecturer3, TitleSubmission, TitleSubmission2, DevisionOfLecturer, PresensiBimbingan, Proposal, HasilSkripsi, Komprehensif } = require('../models')
const { encryptPass,  decryptPass } = require('../helpers/bcrypt')
const { generateToken } = require('../helpers/jwt')

const getLogin = async (req, res) => {
    try {
        if (req.cookies.token) {
            return res.redirect('/');
        }

        res.render('dosen/loginDosen');
    } catch (error) {
        res.status(500).json({
            status: 500,
            msg: error.message
        });
    }
};

const login = async (req, res) => {
    try {
        const { username, password } = req.body;

        const lecturerUser = await LecturerUser.findOne({
            where: {
                username
            }
        });

        if (!lecturerUser) {
            console.log('username belum terdaftar');
            return res.status(404).redirect('/dosen/login');
        }

        if (!decryptPass(password, lecturerUser.password)) {
            console.log('username dan password salah');
            return res.status(400).redirect('/dosen/login');
        }

        if (lecturerUser.role !== 'Dosen') {
            console.log('Role bukan dosen');
            return res.status(400).redirect('/dosen/login');
        }

        res.status(201)
            .cookie('token', generateToken(lecturerUser))
            .cookie('id', lecturerUser.id)
            .cookie('username', lecturerUser.username)
            .redirect('/dosen/dashboard');
    } catch (error) {
        res.status(500).json({
            status: 500,
            msg: error.message
        });
    }
};

const getDashboardDosen = async (req, res) => {
    try {
        const { id, username } = req.cookies;

        const profile = await LecturerUser.findOne({
            where: { id }
        });

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

        res.render('dosen/dashboardDosen', {
            title: 'Selamat Datang di Aplikasi Monitoring Skripsi',
            id,
            username,
            profile,
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

const getPengajuanJudul = async (req, res) => {
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

        res.render('dosen/pengajuanJudul', {
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
            dataPengajuanJudul,
        }, {
            where: {
                id
            }
        });

        return res.redirect('/dosen/pengajuan-judul');
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
        res.redirect('/dosen/pengajuan-judul');
      });
    } catch (error) {
      next(new Error('controllers/dosenController.js:exportTableToClipboardPengajuanJudul - ' + error.message));
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
        new Error('controllers/dosenController.js:exportTableToCSVPengajuanJudul - ' + error.message)
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
          "controllers/dosenController.js:exportTableToExcelPengajuanJudul - " + error.message
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
            "controllers/dosenController.js:exportTableToPDFPengajuanJudul - " + err.message
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

        res.render('dosen/judulDiterima', {
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
        res.redirect('/dosen/judul-diterima');
      });
    } catch (error) {
      next(new Error('controllers/dosenController.js:exportTableToClipboardJudulDiterima - ' + error.message));
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
        new Error('controllers/dosenController.js:exportTableToCSVJudulDiterima - ' + error.message)
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
          "controllers/dosenController.js:exportTableToExcelJudulDiterima - " + error.message
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
            "controllers/dosenController.js:exportTableToPDFJudulDiterima - " + err.message
          )
        );
      }
    };

const getPermintaanBimbingan = async (req, res) => {
    try {
        const { id, username } = req.cookies;
        const userRole = req.LecturerUser;

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

        const permintaanBimbingan = dataPembagianDosen.filter((item) => {
            return (
                item.dosenPembimbing1 === username ||
                item.dosenPembimbing2 === username ||
                item.dosenPembahas === username
            );
        });

        res.render('dosen/permintaanBimbingan', {
            title: 'Permintaan Bimbingan',
            id,
            userRole,
            username,
            profile,
            daftarPb1,
            daftarPb2,
            daftarPb3,
            warna4,
            colors,
            dataPembagianDosen: permintaanBimbingan,
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

        return res.redirect('/dosen/permintaan-bimbingan');
    } catch (error) {
        res.status(500).json({
            status: 500,
            msg: error.message
        });
    }
};

const getBimbinganProposal = async (req, res) => {
    try {
        const { id, username } = req.cookies;

        const profile = await StudentUser.findOne({
            where: {
                id
            },
        });

        const dataBimbinganProposal = await Proposal.findAll({
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

        const proposalForThisDosen = dataBimbinganProposal.filter((proposal) => {
            const { DevisionOfLecturer } = proposal;
            return (
                DevisionOfLecturer.dosenPembimbing1 === username ||
                DevisionOfLecturer.dosenPembimbing2 === username ||
                DevisionOfLecturer.dosenPembahas === username
            );
        });

        const warna5 = {};
        proposalForThisDosen.forEach((proposalStatus) => {
            warna5[proposalStatus.id] = colors.getStatusColor5(proposalStatus.statusProposal);
        });

        res.render('dosen/bimbinganProposal', {
            title: 'Data Bimbingan Proposal',
            id,
            username,
            profile,
            dataBimbinganProposal: proposalForThisDosen,
            warna5,
            colors,
            addSuccess: req.flash('addSuccess'),
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

const addRevisiProposal = async (req, res) => {
  try {
      const { id } = req.params;
      const { StudentUserId, revisi1, revisi2 } = req.body;
      
      const jakartaTime = DateTime.now().setZone('Asia/Jakarta');
      const formattedDateTime = jakartaTime.toFormat('yyyy-MM-dd HH:mm:ss');

      const dataProposal = await Proposal.findAll({});

      let updateData = {
          StudentUserId,
          dataProposal
      };

      if (revisi1) {
          updateData.revisi1 = revisi1;
          updateData.tanggalRevisiDosen1 = formattedDateTime;
      }

      if (revisi2) {
          updateData.revisi2 = revisi2;
          updateData.tanggalRevisiDosen2 = formattedDateTime;
      }

      await Proposal.update(updateData, {
          where: {
              id
          }
      });

      req.flash('addSuccess', 'Revisi Proposal Berhasil Diperbaharui!');
      return res.redirect('/dosen/bimbingan/proposal');
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

  const addRevisiProposalPb1 = async (req, res) => {
    try {
        const { id } = req.params;
        const { StudentUserId } = req.body;
        const { filename } = req.file;

        const jakartaTime = DateTime.now().setZone('Asia/Jakarta');
        const formattedDateTime = jakartaTime.toFormat('yyyy-MM-dd HH:mm:ss');

        const dataProposal = await Proposal.findByPk(id);

        if (!dataProposal) {
            return res.status(404).json({
                status: 404,
                msg: 'Record not found'
            });
        }

        let updateData = {
            StudentUserId,
        };

        if (filename) {
            updateData.proposalRevisiDosen1 = filename;
            updateData.tanggalRevisiDosen1 = formattedDateTime;
        }

        await dataProposal.update(updateData);

        req.flash('addSuccess1', 'Upload Revisi Bimbingan Proposal Pb 1 Berhasil');
        return res.redirect('/dosen/bimbingan/proposal');
    } catch (error) {
        res.status(500).json({
            status: 500,
            msg: error.message
        });
    }
};

const addRevisiProposalPb2 = async (req, res) => {
  try {
      const { id } = req.params;
      const { StudentUserId } = req.body;
      const { filename } = req.file;

      const jakartaTime = DateTime.now().setZone('Asia/Jakarta');
      const formattedDateTime = jakartaTime.toFormat('yyyy-MM-dd HH:mm:ss');

      const dataProposal = await Proposal.findByPk(id);

      if (!dataProposal) {
          return res.status(404).json({
              status: 404,
              msg: 'Record not found'
          });
      }

      let updateData = {
          StudentUserId,
      };

      if (filename) {
          updateData.proposalRevisiDosen2 = filename;
          updateData.tanggalRevisiDosen2 = formattedDateTime;
      }

      await dataProposal.update(updateData);

      req.flash('addSuccess1', 'Upload Revisi Bimbingan Proposal Pb 2 Berhasil');
      return res.redirect('/dosen/bimbingan/proposal');
  } catch (error) {
      res.status(500).json({
          status: 500,
          msg: error.message
      });
  }
};

const getBimbinganHasilSkripsi = async (req, res) => {
    try {
        const { id, username } = req.cookies;

        const profile = await StudentUser.findOne({
            where: {
                id
            },
        });

        const dataBimbinganHasilSkripsi = await HasilSkripsi.findAll({
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

        const hasillForThisDosen = dataBimbinganHasilSkripsi.filter((hasilSkripsi) => {
            const { DevisionOfLecturer } = hasilSkripsi;
            return (
                DevisionOfLecturer.dosenPembimbing1 === username ||
                DevisionOfLecturer.dosenPembimbing2 === username ||
                DevisionOfLecturer.dosenPembahas === username
            );
        });

        const warna6 = {};
        dataBimbinganHasilSkripsi.forEach((hasilStatus) => {
            warna6[hasilStatus.id] = colors.getStatusColor5(hasilStatus.statusHasilSkripsi);
        });

        res.render('dosen/bimbinganHasilSkripsi', {
            title: 'Data Bimbingan Hasil Skripsi',
            id,
            username,
            profile,
            dataBimbinganHasilSkripsi: hasillForThisDosen,
            warna6,
            colors,
            addSuccess: req.flash('addSuccess'),
            addSuccess1: req.flash('addSuccess1')
        });
    } catch (error) {
        res.status(500).json({
            status: 500,
            msg: error.message
        });
    }
};

const downloadHasil = async (req, res) => {
    try {
        const { id } = req.params;

        const hasilSkripsi = await HasilSkripsi.findOne({
            where: { id },
        });

        if (!hasilSkripsi) {
            return res.status(404).send('Bimbingan hasil tidak ditemukan.');
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

const addRevisiHasil = async (req, res) => {
    try {
        const { id } = req.params;
        const { StudentUserId, revisi1, revisi2 } = req.body;
        
        const jakartaTime = DateTime.now().setZone('Asia/Jakarta');
        const formattedDateTime = jakartaTime.toFormat('yyyy-MM-dd HH:mm:ss');

        const dataHasil = await HasilSkripsi.findAll({});

        let updateData = {
            StudentUserId,
            dataHasil
        };

        if (revisi1) {
            updateData.revisi1 = revisi1;
            updateData.tanggalRevisiDosen1 = formattedDateTime;
        }

        if (revisi2) {
            updateData.revisi2 = revisi2;
            updateData.tanggalRevisiDosen2 = formattedDateTime;
        }

        await HasilSkripsi.update(updateData, {
            where: {
                id
            }
        });

        req.flash('addSuccess', 'Revisi Hasil Skripsi Berhasil Diperbaharui!');
        return res.redirect('/dosen/bimbingan/hasil-skripsi');
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

  const addRevisiHasilPb1 = async (req, res) => {
    try {
        const { id } = req.params;
        const { StudentUserId } = req.body;
        const { filename } = req.file;

        const jakartaTime = DateTime.now().setZone('Asia/Jakarta');
        const formattedDateTime = jakartaTime.toFormat('yyyy-MM-dd HH:mm:ss');

        const dataHasil = await HasilSkripsi.findByPk(id);

        if (!dataHasil) {
            return res.status(404).json({
                status: 404,
                msg: 'Record not found'
            });
        }

        let updateData = {
            StudentUserId,
        };

        if (filename) {
            updateData.hasilSkripsiRevisiDosen1 = filename;
            updateData.tanggalRevisiDosen1 = formattedDateTime;
        }

        await dataHasil.update(updateData);

        req.flash('addSuccess1', 'Upload Revisi Bimbingan Hasil Skripsi Pb 1 Berhasil');
        return res.redirect('/dosen/bimbingan/hasil-skripsi');
    } catch (error) {
        res.status(500).json({
            status: 500,
            msg: error.message
        });
    }
};

const addRevisiHasilPb2 = async (req, res) => {
  try {
      const { id } = req.params;
      const { StudentUserId } = req.body;
      const { filename } = req.file;

      const jakartaTime = DateTime.now().setZone('Asia/Jakarta');
      const formattedDateTime = jakartaTime.toFormat('yyyy-MM-dd HH:mm:ss');

      const dataHasil = await HasilSkripsi.findByPk(id);

      if (!dataHasil) {
          return res.status(404).json({
              status: 404,
              msg: 'Record not found'
          });
      }

      let updateData = {
          StudentUserId,
      };

      if (filename) {
          updateData.hasilSkripsiRevisiDosen2 = filename;
          updateData.tanggalRevisiDosen2 = formattedDateTime;
      }

      await dataHasil.update(updateData);

      req.flash('addSuccess1', 'Upload Revisi Bimbingan Hasil Skripsi Pb 2 Berhasil');
      return res.redirect('/dosen/bimbingan/hasil-skripsi');
  } catch (error) {
      res.status(500).json({
          status: 500,
          msg: error.message
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

const getBimbinganKomprehensif = async (req, res) => {
    try {
        const {id, username} = req.cookies

        const profile = await StudentUser.findOne({
            where: {
                id
            },
        });

        const dataBimbinganKomprehensif = await Komprehensif.findAll({
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

        const kompehensifForThisDosen = dataBimbinganKomprehensif.filter((kompehensif) => {
            const { DevisionOfLecturer } = kompehensif;
            return (
                DevisionOfLecturer.dosenPembimbing1 === username ||
                DevisionOfLecturer.dosenPembimbing2 === username ||
                DevisionOfLecturer.dosenPembahas === username
            );
        });

        const warna7 = {};
        dataBimbinganKomprehensif.forEach((komprehensifStatus) => {
            warna7[komprehensifStatus.id] = colors.getStatusColor7(komprehensifStatus.statusKomprehensif);
        });

        res.render('dosen/bimbinganKomprehensif', {
            title: 'Data Bimbingan Komprehensif',
            id,
            username,
            profile,
            dataBimbinganKomprehensif: kompehensifForThisDosen,
            warna7,
            colors,
            addSuccess: req.flash('addSuccess'),
            addSuccess1: req.flash('addSuccess1')
        })
    } catch (error) {
        res.status(500).json({
            status: 500,
            msg: error.message
        })
    }
}

const downloadKomprehensif = async (req, res) => {
    try {
        const { id } = req.params;

        const komprehensif = await Komprehensif.findOne({
            where: { id },
        });

        if (!komprehensif) {
            return res.status(404).send('Bimbingan komprehensif tidak ditemukan.');
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

const addRevisiKomprehensif = async (req, res) => {
  try {
      const { id } = req.params;
      const { StudentUserId, revisi1Komprehensif, revisi2Komprehensif } = req.body;
      
      const jakartaTime = DateTime.now().setZone('Asia/Jakarta');
      const formattedDateTime = jakartaTime.toFormat('yyyy-MM-dd HH:mm:ss');

      const dataKomprehensif = await Komprehensif.findAll({});

      let updateData = {
          StudentUserId,
          dataKomprehensif
      };

      if (revisi1Komprehensif) {
          updateData.revisi1Komprehensif = revisi1Komprehensif;
          updateData.tanggalRevisiDosen1Komprehensif = formattedDateTime;
      }

      if (revisi2Komprehensif) {
          updateData.revisi2Komprehensif = revisi2Komprehensif;
          updateData.tanggalRevisiDosen2Komprehensif = formattedDateTime;
      }

      await Komprehensif.update(updateData, {
          where: {
              id
          }
      });

      req.flash('addSuccess', 'Revisi Komprehensif Berhasil Diperbaharui!');
      return res.redirect('/dosen/bimbingan/komprehensif');
  } catch (error) {
      res.status(500).json({
          status: 500,
          msg: error.message
      });
  }
};

const addRevisiKomprehensifPb1 = async (req, res) => {
  try {
      const { id } = req.params;
      const { StudentUserId } = req.body;
      const { filename } = req.file;

      const jakartaTime = DateTime.now().setZone('Asia/Jakarta');
      const formattedDateTime = jakartaTime.toFormat('yyyy-MM-dd HH:mm:ss');

      const dataKomprehensif = await Komprehensif.findByPk(id);

      if (!dataKomprehensif) {
          return res.status(404).json({
              status: 404,
              msg: 'Record not found'
          });
      }

      let updateData = {
          StudentUserId,
      };

      if (filename) {
          updateData.komprehensifRevisiDosen1 = filename;
          updateData.tanggalRevisiDosen1Komprehensif = formattedDateTime;
      }

      await dataKomprehensif.update(updateData);

      req.flash('addSuccess1', 'Upload Revisi Bimbingan Komprehensif Pb 1 Berhasil');
      return res.redirect('/dosen/bimbingan/komprehensif');
  } catch (error) {
      res.status(500).json({
          status: 500,
          msg: error.message
      });
  }
};

const addRevisiKomprehensifPb2 = async (req, res) => {
try {
    const { id } = req.params;
    const { StudentUserId } = req.body;
    const { filename } = req.file;

    const jakartaTime = DateTime.now().setZone('Asia/Jakarta');
    const formattedDateTime = jakartaTime.toFormat('yyyy-MM-dd HH:mm:ss');

    const dataKomprehensif = await Komprehensif.findByPk(id);

    if (!dataKomprehensif) {
        return res.status(404).json({
            status: 404,
            msg: 'Record not found'
        });
    }

    let updateData = {
        StudentUserId,
    };

    if (filename) {
        updateData.komprehensifRevisiDosen2 = filename;
        updateData.tanggalRevisiDosen2Komprehensif = formattedDateTime;
    }

    await dataKomprehensif.update(updateData);

    req.flash('addSuccess1', 'Upload Revisi Bimbingan Komprehensif Pb 2 Berhasil');
    return res.redirect('/dosen/bimbingan/komprehensif');
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
        return res.status(404).send('komprehensif tidak ditemukan.');
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

  const downloadKomprehensifRevisiDosen1 = async (req, res) => {
    try {
      const { id } = req.params;
  
      const komprehensifRevisiDosen1 = await Komprehensif.findOne({
        where: { id },
      });
  
      if (!komprehensifRevisiDosen1) {
        return res.status(404).send('Komprehensif tidak ditemukan.');
      }
  
      const komprehensifRevisiDosen1Path = `./uploadKomprehensifRevisiDosen1/${komprehensifRevisiDosen1.komprehensifRevisiDosen1}`;
      res.download(komprehensifRevisiDosen1Path);
    } catch (error) {
      res.status(500).json({
        status: 500,
        msg: error.message,
      });
    }
  }; 
  
  const downloadKomprehensifRevisiDosen2 = async (req, res) => {
    try {
      const { id } = req.params;
  
      const komprehensifRevisiDosen2 = await Komprehensif.findOne({
        where: { id },
      });
  
      if (!komprehensifRevisiDosen2) {
        return res.status(404).send('Komprehensif tidak ditemukan.');
      }
  
      const komprehensifRevisiDosen2Path = `./uploadKomprehensifRevisiDosen2/${komprehensifRevisiDosen2.komprehensifRevisiDosen2}`;
      res.download(komprehensifRevisiDosen2Path);
    } catch (error) {
      res.status(500).json({
        status: 500,
        msg: error.message,
      });
    }
  }; 

const getJadwalProposal = async (req, res) => {
    try {
        const { id, username } = req.cookies;

        const profile = await StudentUser.findOne({
            where: {
                id
            },
        });

        const dataJadwalProposal = await Proposal.findAll({
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

        const proposalForThisDosen = dataJadwalProposal.filter((proposal) => {
            const { DevisionOfLecturer } = proposal;
            return (
                DevisionOfLecturer.dosenPembimbing1 === username ||
                DevisionOfLecturer.dosenPembimbing2 === username ||
                DevisionOfLecturer.dosenPembahas === username
            );
        });

        const dataPembagianDosen = await DevisionOfLecturer.findAll({
            include: [
                {
                    model: StudentUser,
                    attributes: ['npm'],
                },
            ],
        });
        
        const daftarPb1 = await ListOfLecturer1.findAll({});
        const daftarPb2 = await ListOfLecturer2.findAll({});
        const daftarPb3 = await ListOfLecturer3.findAll({});
        
        const dataDosen = {
            dosenPembimbing1: dataPembagianDosen.filter((item) => item.dosenPembimbing1 === username && item.StudentUser.npm === profile.npm),
            dosenPembimbing2: dataPembagianDosen.filter((item) => item.dosenPembimbing2 === username && item.StudentUser.npm === profile.npm),
            dosenPembahas: dataPembagianDosen.filter((item) => item.dosenPembahas === username && item.StudentUser.npm === profile.npm),
        };

        res.render('dosen/jadwalProposal', {
            title: 'Jadwal Seminar Proposal',
            id,
            username,
            profile,
            daftarPb1,
            daftarPb2,
            daftarPb3,
            dataJadwalProposal: proposalForThisDosen,
            dataPembagianDosen: dataDosen,
            editSuccess: req.flash('editSuccess'),
        });
    } catch (error) {
        res.status(500).json({
            status: 500,
            msg: error.message
        });
    }
};

const getJadwalHasilSkripsi = async (req, res) => {
    try {
        const { id, username } = req.cookies;

        const profile = await HasilSkripsi.findOne({
            where: {
                id
            },
        });

        const dataJadwalHasil = await HasilSkripsi.findAll({
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

        const hasilSkripsiForThisDosen = dataJadwalHasil.filter((hasilSkripsi) => {
            const { DevisionOfLecturer } = hasilSkripsi;
            return (
                DevisionOfLecturer.dosenPembimbing1 === username ||
                DevisionOfLecturer.dosenPembimbing2 === username ||
                DevisionOfLecturer.dosenPembahas === username
            );
        });

        const dataPembagianDosen = await DevisionOfLecturer.findAll({
            include: [
                {
                    model: StudentUser,
                    attributes: ['npm'],
                },
            ],
        });
        
        const daftarPb1 = await ListOfLecturer1.findAll({});
        const daftarPb2 = await ListOfLecturer2.findAll({});
        const daftarPb3 = await ListOfLecturer3.findAll({});
        
        const dataDosen = {
            dosenPembimbing1: dataPembagianDosen.filter((item) => item.dosenPembimbing1 === username && item.StudentUser.npm === profile.npm),
            dosenPembimbing2: dataPembagianDosen.filter((item) => item.dosenPembimbing2 === username && item.StudentUser.npm === profile.npm),
            dosenPembahas: dataPembagianDosen.filter((item) => item.dosenPembahas === username && item.StudentUser.npm === profile.npm),
        };

        res.render('dosen/jadwalHasil', {
            title: 'Jadwal Seminar Hasil',
            id,
            username,
            profile,
            daftarPb1,
            daftarPb2,
            daftarPb3,
            dataJadwalHasil: hasilSkripsiForThisDosen,
            dataPembagianDosen: dataDosen,
            editSuccess: req.flash('editSuccess'),
        });
    } catch (error) {
        res.status(500).json({
            status: 500,
            msg: error.message
        });
    }
};

const getJadwalKomprehensif = async (req, res) => {
    try {
        const { id, username } = req.cookies;

        const profile = await Komprehensif.findOne({
            where: {
                id
            },
        });

        const dataJadwalKomprehensif = await Komprehensif.findAll({
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

        const komprehensifSkripsiForThisDosen = dataJadwalKomprehensif.filter((komprehensif) => {
            const { DevisionOfLecturer } = komprehensif;
            return (
                DevisionOfLecturer.dosenPembimbing1 === username ||
                DevisionOfLecturer.dosenPembimbing2 === username ||
                DevisionOfLecturer.dosenPembahas === username
            );
        });

        const dataPembagianDosen = await DevisionOfLecturer.findAll({
            include: [
                {
                    model: StudentUser,
                    attributes: ['npm'],
                },
            ],
        });
        
        const daftarPb1 = await ListOfLecturer1.findAll({});
        const daftarPb2 = await ListOfLecturer2.findAll({});
        const daftarPb3 = await ListOfLecturer3.findAll({});
        
        const dataDosen = {
            dosenPembimbing1: dataPembagianDosen.filter((item) => item.dosenPembimbing1 === username && item.StudentUser.npm === profile.npm),
            dosenPembimbing2: dataPembagianDosen.filter((item) => item.dosenPembimbing2 === username && item.StudentUser.npm === profile.npm),
            dosenPembahas: dataPembagianDosen.filter((item) => item.dosenPembahas === username && item.StudentUser.npm === profile.npm),
        };

        res.render('dosen/jadwalKomprehensif', {
            title: 'Jadwal Ujian Komprehensif',
            id,
            username,
            profile,
            daftarPb1,
            daftarPb2,
            daftarPb3,
            dataJadwalKomprehensif: komprehensifSkripsiForThisDosen,
            dataPembagianDosen: dataDosen,
            editSuccess: req.flash('editSuccess'),
        });
    } catch (error) {
        res.status(500).json({
            status: 500,
            msg: error.message
        });
    }
};

const getRiwayatProposal = async (req, res) => {
    try {
        const { id, username } = req.cookies;

        const profile = await StudentUser.findOne({
            where: {
                id
            },
        });

        const dataRiwayatProposal = await Proposal.findAll({
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

        const proposalForThisDosen = dataRiwayatProposal.filter((proposal) => {
            const { DevisionOfLecturer } = proposal;
            return (
                DevisionOfLecturer.dosenPembimbing1 === username ||
                DevisionOfLecturer.dosenPembimbing2 === username ||
                DevisionOfLecturer.dosenPembahas === username
            );
        });

        const dataPembagianDosen = await DevisionOfLecturer.findAll({
            include: [
                {
                    model: StudentUser,
                    attributes: ['npm'],
                },
            ],
        });
        
        const daftarPb1 = await ListOfLecturer1.findAll({});
        const daftarPb2 = await ListOfLecturer2.findAll({});
        const daftarPb3 = await ListOfLecturer3.findAll({});
        
        const dataDosen = {
            dosenPembimbing1: dataPembagianDosen.filter((item) => item.dosenPembimbing1 === username && item.StudentUser.npm === profile.npm),
            dosenPembimbing2: dataPembagianDosen.filter((item) => item.dosenPembimbing2 === username && item.StudentUser.npm === profile.npm),
            dosenPembahas: dataPembagianDosen.filter((item) => item.dosenPembahas === username && item.StudentUser.npm === profile.npm),
        };

        res.render('dosen/riwayatProposal', {
            title: 'Riwayat Seminar Proposal',
            id,
            username,
            profile,
            daftarPb1,
            daftarPb2,
            daftarPb3,
            dataRiwayatProposal: proposalForThisDosen,
            dataPembagianDosen: dataDosen,
            editSuccess: req.flash('editSuccess'),
        });
    } catch (error) {
        res.status(500).json({
            status: 500,
            msg: error.message
        });
    }
};

const getRiwayatHasilSkripsi = async (req, res) => {
    try {
        const { id, username } = req.cookies;

        const profile = await StudentUser.findOne({
            where: {
                id
            },
        });

        const dataRiwayatHasil = await HasilSkripsi.findAll({
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

        const hasilSkripsiForThisDosen = dataRiwayatHasil.filter((hasilSkripsi) => {
            const { DevisionOfLecturer } = hasilSkripsi;
            return (
                DevisionOfLecturer.dosenPembimbing1 === username ||
                DevisionOfLecturer.dosenPembimbing2 === username ||
                DevisionOfLecturer.dosenPembahas === username
            );
        });

        const dataPembagianDosen = await DevisionOfLecturer.findAll({
            include: [
                {
                    model: StudentUser,
                    attributes: ['npm'],
                },
            ],
        });
        
        const daftarPb1 = await ListOfLecturer1.findAll({});
        const daftarPb2 = await ListOfLecturer2.findAll({});
        const daftarPb3 = await ListOfLecturer3.findAll({});
        
        const dataDosen = {
            dosenPembimbing1: dataPembagianDosen.filter((item) => item.dosenPembimbing1 === username && item.StudentUser.npm === profile.npm),
            dosenPembimbing2: dataPembagianDosen.filter((item) => item.dosenPembimbing2 === username && item.StudentUser.npm === profile.npm),
            dosenPembahas: dataPembagianDosen.filter((item) => item.dosenPembahas === username && item.StudentUser.npm === profile.npm),
        };

        res.render('dosen/riwayatHasil', {
            title: 'Riwayat Seminar Hasil',
            id,
            username,
            profile,
            daftarPb1,
            daftarPb2,
            daftarPb3,
            dataRiwayatHasil: hasilSkripsiForThisDosen,
            dataPembagianDosen: dataDosen,
            editSuccess: req.flash('editSuccess'),
        });
    } catch (error) {
        res.status(500).json({
            status: 500,
            msg: error.message
        });
    }
};

const getRiwayatKomprehensif = async (req, res) => {
    try {
        const { id, username } = req.cookies;

        const profile = await StudentUser.findOne({
            where: {
                id
            },
        });

        const dataRiwayatKomprehensif = await Komprehensif.findAll({
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

        const komprehensifForThisDosen = dataRiwayatKomprehensif.filter((komprehensif) => {
            const { DevisionOfLecturer } = komprehensif;
            return (
                DevisionOfLecturer.dosenPembimbing1 === username ||
                DevisionOfLecturer.dosenPembimbing2 === username ||
                DevisionOfLecturer.dosenPembahas === username
            );
        });

        const dataPembagianDosen = await DevisionOfLecturer.findAll({
            include: [
                {
                    model: StudentUser,
                    attributes: ['npm'],
                },
            ],
        });
        
        const daftarPb1 = await ListOfLecturer1.findAll({});
        const daftarPb2 = await ListOfLecturer2.findAll({});
        const daftarPb3 = await ListOfLecturer3.findAll({});
        
        const dataDosen = {
            dosenPembimbing1: dataPembagianDosen.filter((item) => item.dosenPembimbing1 === username && item.StudentUser.npm === profile.npm),
            dosenPembimbing2: dataPembagianDosen.filter((item) => item.dosenPembimbing2 === username && item.StudentUser.npm === profile.npm),
            dosenPembahas: dataPembagianDosen.filter((item) => item.dosenPembahas === username && item.StudentUser.npm === profile.npm),
        };

        res.render('dosen/riwayatKomprehensif', {
            title: 'Riwayat Ujian Komprehensif',
            id,
            username,
            profile,
            daftarPb1,
            daftarPb2,
            daftarPb3,
            dataRiwayatKomprehensif: komprehensifForThisDosen,
            dataPembagianDosen: dataDosen,
            editSuccess: req.flash('editSuccess'),
        });
    } catch (error) {
        res.status(500).json({
            status: 500,
            msg: error.message
        });
    }
};

const profile = async (req, res) => {
    try {
        const { id, username } = req.cookies;

        const profile = await LecturerUser.findOne({
            where: { id }
        });

        if (!profile) {
            return res.status(404).json({ message: 'Akun dosen tidak ditemukan' });
        }

        res.render('dosen/profile', {
            title: 'Edit Profile Dosen',
            id,
            username,
            profile,
            editSuccess: req.flash('editSuccess')
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: error.message });
    }
};

const profilePost = async (req, res) => {
    try {
        const { id } = req.params;

        const { npm, nama, password, gender, foto } = req.body;

        const lecturerProfile = {
            npm,
            nama,
            password,
            gender,
            foto
        };

        await LecturerUser.update(lecturerProfile, {
            where: {
                id
            }
        });

        req.flash('editSuccess', 'Profile dosen berhasil DIUBAH!');
        return res.redirect(`/dosen/${id}/profile?success=true`);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Terjadi kesalahan dalam mengedit data profile' });
    }
};

const ubahPassword = async (req, res) => {
    try {
        const { id, username } = req.cookies;

        const profile = await LecturerUser.findOne({
            where: { id }
        });

        if (!profile) {
            return res.status(404).json({ message: 'Akun dosen tidak ditemukan' });
        }

        return res.render('dosen/ubahPassword', {
            title: 'Ubah Password Dosen',
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

        await LecturerUser.update(userProfile, {
            where: {
                id
            }
        });

        req.flash('editSuccess', 'Password dosen berhasil DIUBAH!')
        return res.redirect(`/dosen/${id}/ubah-password?success=true`);
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
    getDashboardDosen,
    getPengajuanJudul,
    editPengajuanJudul,
    exportTableToClipboardPengajuanJudul,
    exportTableToCSVPengajuanJudul, 
    exportTableToExcelPengajuanJudul, 
    exportTableToPDFPengajuanJudul,
    getJudulDiterima,
    exportTableToClipboardJudulDiterima, 
    exportTableToCSVJudulDiterima, 
    exportTableToExcelJudulDiterima, 
    exportTableToPDFJudulDiterima,
    getPermintaanBimbingan,
    editPermintaanBimbingan,
    getBimbinganProposal,
    downloadProposal,
    addRevisiProposal,
    addRevisiProposalPb1,
    addRevisiProposalPb2,
    downloadProposalRevisi1,
    downloadProposalRevisi2, 
    downloadProposalRevisiDosen1,
    downloadProposalRevisiDosen2,
    getBimbinganHasilSkripsi,
    downloadHasil,
    addRevisiHasil,
    downloadHasilSkripsiRevisi1,
    downloadHasilSkripsiRevisi2, 
    downloadHasilSkripsiRevisiDosen1,
    downloadHasilSkripsiRevisiDosen2, 
    addRevisiHasilPb1,
    addRevisiHasilPb2,
    getBimbinganKomprehensif,
    downloadKomprehensif,
    addRevisiKomprehensif,
    addRevisiKomprehensifPb1,
    addRevisiKomprehensifPb2,
    downloadKomprehensifRevisi1,
    downloadKomprehensifRevisi2,
    downloadKomprehensifRevisiDosen1,
    downloadKomprehensifRevisiDosen2,
    getJadwalProposal,
    getJadwalHasilSkripsi,
    getJadwalKomprehensif,
    getRiwayatProposal,
    getRiwayatHasilSkripsi,
    getRiwayatKomprehensif,
    profile,
    profilePost,
    ubahPassword, 
    passwordPost,
    logout
}