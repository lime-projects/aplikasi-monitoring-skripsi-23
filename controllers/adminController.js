const { User, ThesisRegistration, StudentUser, LecturerUser, CoordinatorUser, DevisionOfLecturer, ListOfLecturer1, ListOfLecturer2, ListOfLecturer3, TitleSubmission, TitleSubmission2, Proposal, HasilSkripsi, Komprehensif, PresensiBimbingan } = require('../models')


const { generateToken } = require('../helpers/jwt')
const { encryptPass, decryptPass } = require('../helpers/bcrypt')
const colors = require('../helpers/colors');
const excelToJson = require("convert-excel-to-json");
const path = require('path');
const copyPaste = require('copy-paste');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;
const ExcelJS = require('exceljs');
const pdf = require('pdf-creator-node');
const puppeteer = require('puppeteer');
const fs = require('fs');

const registerAPI = async (req, res) => {
    try {
        const { username, password, role } = req.body;

        const usernameExist = await User.findOne({
            where: {
                username
            }
        });

        if (usernameExist) {
            return res.status(400).json({
                status: 400,
                msg: `Username ${username} already exists`
            });
        }

        const result = await User.create({
            username,
            password: encryptPass(password), 
            role: 'Admin' 
        });

        res.status(201).json({
            status: 201,
            data: result
        });
    } catch (error) {
        res.status(500).json({
            status: 500,
            msg: error.message
        });
    }
};

const getLogin = async (req, res) => {
    try {
        if (req.cookies.token) {
            return res.redirect('/admin/dashboard');
        }

        res.render('admin/loginAdmin');
    } catch (error) {
        res.status(500).json({
            status: 500,
            msg: error.message
        });
    }
};

const login = async (req, res) => {
    const { username, password } = req.body;

    try {
        const usernameExist = await User.findOne({
            where: {
                username
            }
        });

        if (!usernameExist) {
            console.log('Username belum terdaftar');
            return res.status(404).redirect('/admin/login');
        }

        if (usernameExist.role !== 'Admin') {
            console.log('Role bukan admin');
            return res.status(400).redirect('/admin/login');
        }

        if (!decryptPass(password, usernameExist.password)) {
            console.log('Username dan password salah');
            return res.status(400).redirect('/admin/login');
        }

        res.status(201)
            .cookie('token', generateToken(usernameExist))
            .cookie('id', usernameExist.id)
            .cookie('username', usernameExist.username)
            .redirect('/admin/dashboard');
    } catch (error) {
        res.status(500).json({
            status: 500,
            msg: error.message
        });
    }
};

const getDashboardAdmin = async (req, res) => {
    try {
        const { id, username } = req.cookies;

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

        res.render('admin/dashboardAdmin', {
            title: 'Selamat Datang di Aplikasi Monitoring Skripsi',
            id,
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

const getThesisRegistrations = async (req, res) => {
    try {
        const { id, username } = req.cookies;

        const result = await ThesisRegistration.findAll({});

        res.render('admin/list-akademik', {
            title: 'List Tahun Akademik',
            id,
            username,
            addSuccess: req.flash('addSuccess'),
            editSuccess: req.flash('editSuccess'),
            editStatus: req.flash('editStatus'),
            deleteSuccess: req.flash('deleteSuccess'),
            result,
        });
    } catch (error) {
        res.status(500).json({
            status: 500,
            msg: error.message
        });
    }
};

const addThesis = async (req, res) => {
    try {
        const { tahunAkademik, semester, angkatan, tanggalMulai, tanggalAkhir, status } = req.body;

        await ThesisRegistration.create({
            tahunAkademik,
            semester,
            angkatan,
            tanggalMulai,
            tanggalAkhir,
            status
        });

        req.flash('addSuccess', 'Data Tahun Akademik berhasil DITAMBAH!');
        res.status(201).redirect('/admin/list-tahun-akademik');
    } catch (error) {
        res.status(500).json({
            status: 500,
            msg: error.message
        });
    }
};

const editThesis = async (req, res) => {
    try {
        const { id } = req.params;

        const { tahunAkademik, semester, angkatan, tanggalMulai, tanggalAkhir, status } = req.body;

        await ThesisRegistration.update({
            tahunAkademik,
            semester,
            angkatan,
            tanggalMulai,
            tanggalAkhir,
            status
        }, {
            where: {
                id
            }
        });

        req.flash('editSuccess', 'Data Tahun Akademik berhasil DIUBAH!');
        res.redirect('/admin/list-tahun-akademik');
    } catch (error) {
        res.status(500).json({
            status: 500,
            msg: error.message
        });
    }
};

const editStatus = async (req, res) => {
    try {
        const { id } = req.params;

        await ThesisRegistration.update({
            status: false
        }, {
            where: {}
        });

        await ThesisRegistration.update({
            status: true
        }, {
            where: {
                id
            }
        });

        req.flash('editStatus', 'Data Status Tahun Akademik berhasil DIUBAH!')
        res.redirect('/admin/list-tahun-akademik');
    } catch (error) {
        console.log(error);
        res.status(500).json({
            status: 500,
            msg: error.message
        });
    }
};

const deleteThesis = async (req, res) => {
    try {
        const { id } = req.params;

        await ThesisRegistration.destroy({
            where: {
                id
            }
        });

        req.flash('deleteSuccess', 'Data Tahun Akademik berhasil DIHAPUS!')
        res.redirect('/admin/list-tahun-akademik');
    } catch (error) {
        res.status(500).json({
            status: 500,
            msg: error.message1
        });
    }
};

const getMahasiswa = async (req, res) => {
    try {
        const { id, username } = req.cookies;

        const masterMahasiswa = await StudentUser.findAll({});

        res.render('admin/masterMahasiswa', {
            title: 'Data Mahasiswa',
            id,
            username,
            masterMahasiswa,
            addSuccess: req.flash('addSuccess'),
            addSuccess1: req.flash('addSuccess1'),
            addSuccess2: req.flash('addSuccess2'),
            editSuccess: req.flash('editSuccess'),
            deleteSuccess: req.flash('deleteSuccess'),
            importError: req.flash('importError')
        });
    } catch (error) {
        res.status(500).json({
            status: 500,
            msg: error.message
        });
    }
};

const addMahasiswa = async (req, res) => {
    try {
        const { npm, nama, gender, angkatan} = req.body;
        let foto =''

        if (req.file) {
            foto = req.file.filename; 
        }

        await StudentUser.create({
            npm,
            nama,
            gender,
            angkatan,
            foto,
            username: nama,
            email: npm,
            password: encryptPass(npm), 
            role: 'Mahasiswa'
        });

        req.flash('addSuccess', 'Data Mahasiswa berhasil DITAMBAH!')
        res.status(201).redirect('/admin/mahasiswa');
    } catch (error) {
        res.status(500).json({
            status: 500,
            msg: error.message
        });
    }
}

const editMahasiswa = async (req, res) => {
    try {
        const { id } = req.params;

        const { npm, nama, gender, angkatan} = req.body
        let foto = '';

        if (req.file) {
            foto = req.file.filename;
        }
    
        await StudentUser.update({
            npm,
            nama,
            gender,
            angkatan,
            foto,
        }, {
            where: {
                id
            }
        });

        req.flash('editSuccess', 'Data Mahasiswa berhasil DIUBAH!')
        res.redirect('/admin/mahasiswa');
        res.render('admin/modals/editMahasiswa', { foto });
    } catch (error) {
        res.status(500).json({
            status: 500,
            msg: error.message
        });
    }
};

const displayStudentPhoto = async (req, res) => {
    try {
        const { id } = req.cookies;

        const student = await StudentUser.findOne({
            where: { id },
        });

        if (!student ) {
            return res.status(404).send('Foto mahasiswa tidak ditemukan.');
        }

        const photoPath = path.join(__dirname, './uploads', student.foto);

        if (fs.existsSync(photoPath)) {
            res.sendFile(photoPath);
        } else {
            const defaultImagePath = path.join(__dirname, './uploads', 'default.png');
            res.sendFile(defaultImagePath);
        }
    } catch (error) {
        res.status(500).json({
            status: 500,
            msg: error.message,
        });
    }
};

const deleteMahasiswa = async (req, res) => {
    try {
        const { id } = req.params;

        await StudentUser.destroy({
            where: {
                id
            }
        });

        req.flash('deleteSuccess', 'Data Mahasiswa berhasil DIHAPUS!');
        res.redirect('/admin/mahasiswa');
    } catch (error) {
        res.status(500).json({
            status: 500,
            msg: error.message
        });
    }
};

const exportTableToClipboardMahasiswa = async (req, res, next) => {
    try {
      const data = await StudentUser.findAll({}); 
  
      const csvData = data.map((mahasiswa, index) => {
        return `${index + 1}\t${mahasiswa.npm}\t${mahasiswa.nama}\t${mahasiswa.gender}\t${mahasiswa.angkatan}\t${mahasiswa.foto}\n`;
      }).join('');
  
      copyPaste.copy(csvData, () => {
        req.flash('addSuccess1', 'Data mahasiswa berhasil disalin ke clipboard ')
        res.redirect('/admin/mahasiswa');
      });
    } catch (error) {
      next(new Error('controllers/adminController.js:exportTableToClipboardMahasiswa - ' + error.message));
    }
  };
  
  const exportTableToCSVMahasiswa  = async (req, res, next) => {
    const path = './file-output';
  
    const data = await StudentUser.findAll({});
  
  
    const csvWriter = createCsvWriter({
      path: `${path}/Mahasiswa.csv`,
      header: [
        { id: 's_no', title: 'No', width: 5 },
        { id: 'npm', title: 'NPM', width: 20 },
        { id: 'nama', title: 'Nama', width: 20 },
        { id: 'gender', title: 'Jenis Kelamin', width: 30 },
        { id: 'angkatan', title: 'angkatan', width: 70 },
        { id: 'foto', title: 'Foto', width: 10 },
      ],
      alwaysQuote: true, 
    });
    
  
    let counter = 1;
    data.forEach((mahasiswa) => {
      mahasiswa.s_no = counter;
      counter++;
    });
  
    try {
      await csvWriter.writeRecords(data);
  
      res.download(`${path}/Mahasiswa.csv`, 'Mahasiswa.csv', (err) => {
        if (err) {
          console.log(err);
        } else {
          fs.unlinkSync(`${path}/Mahasiswa.csv`);
        }
      });
    } catch (error) {
      next(
        new Error('controllers/adminController.js:exportTableToCSVMahasiswa - ' + error.message)
      );
    }
  };
  
  const exportTableToExcelMahasiswa  = async (req, res, next) => {
  
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Mahasiswa");
    const path = "./file-output";
  
    const data = await StudentUser.findAll({});
  
    worksheet.columns = [
      { header: 'No', key: 's_no', width: 5 },
      { header: 'NPM', key: 'npm', width: 20},
      { header: 'Nama', key: 'nama', width: 20 },
      { header: 'Jenis Kelamin', key: 'gender', width: 10  },
      { header: 'Angkatan', key: 'angkatan', width: 70 },
      { header: 'Foto', key: 'foto', width: 10 },
    ];
  
    let counter = 1;
    data.forEach((mahasiswa) => {
      mahasiswa.s_no = counter;
      worksheet.addRow(mahasiswa);
      counter++;
    });
    let list = ["A", "B", "C", "D", "E", "F" ];
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
        .writeFile(`${path}/Mahasiswa.xlsx`)
        .then(() => {
          res.download(`${path}/Mahasiswa.xlsx`, "Mahasiswa.xlsx", (err) => {
            if (err) {
              console.log(err);
            } else {
              fs.unlinkSync(`${path}/Mahasiswa.xlsx`);
            }
          });
        });
    } catch (error) {
      next(
        new Error(
          "controllers/adminController.js:exportTableToExcelMahasiswa - " + error.message
        )
      );
    }
  };
  
  
  const exportTableToPDFMahasiswa  = async (req, res, next) => {
      try {
        let pathFile = "./file-output";
        let fileName = "dataMahasiswa.pdf";
        let fullPath = pathFile + "/" + fileName;
        let html = fs.readFileSync("./templates/templateMahasiswa.html", "utf-8");
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
        const data = await StudentUser.findAll({});
        let students = [];
        data.forEach((mahasiswa, no) => {
          students.push({
            no: no + 1,
            id: mahasiswa._id,
            npm: mahasiswa.npm,
            nama: mahasiswa.nama,
            gender: mahasiswa.gender,
            angkatan: mahasiswa.angkatan,
            foto: mahasiswa.foto
          });
        });
        let document = {
          html: html,
          data: {
            students: students,
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
            "controllers/adminController.js:exportTableToPDFMahasiswa - " + err.message
          )
        );
      }
    };
    
    const printTableMahasiswa  = async (req, res, next) => {
      try {
        const pathFile = './file-output';
        const fileName = 'dataDosen.pdf';
        const fullPath = path.join(pathFile, fileName);
    
        const browser = await puppeteer.launch();
        const page = await browser.newPage();
  
        let htmlTemplate = fs.readFileSync('./templates/templatePrint.html', 'utf-8');
  
        const data = await LecturerUser.findAll({});
    
        const lecturers = data.map((dosen, index) => {
          return {
            no: index + 1,
            id: dosen._id,
            nip: dosen.nip,
            nama: dosen.nama,
            gender: dosen.gender,
            password: dosen.password,
            foto: dosen.foto
          };
        });
    
        const tableRows = lecturers.map(dosen => `
          <tr>
            <td>${dosen.no}</td>
            <td>${dosen.id}</td>
            <td>${dosen.nip}</td>
            <td>${dosen.nama}</td>
            <td>${dosen.gender}</td>
            <td>${dosen.password}</td>
            <td>${dosen.foto}</td>
          </tr>
        `).join('');
    
        const content = htmlTemplate.replace('<!-- Data will be dynamically inserted here -->', tableRows);
    
        await page.setContent(content, { waitUntil: 'networkidle0' });
    
        const pdfOptions = {
          path: fullPath,
          format: 'A4',
          printBackground: true
        };
    
        await page.pdf(pdfOptions);
    
        await browser.close();
    
        res.download(fullPath, fileName, (downloadErr) => {
          if (downloadErr) {
            console.error(downloadErr);
          } else {
            fs.unlinkSync(fullPath);
          }
        });
    
      } catch (error) {
        next(new Error('controllers/adminController.js:printTable - ' + error.message));
      }
    };

const getDosen = async (req, res) => {
    try {
        const { id, username } = req.cookies;

        const masterDosen = await LecturerUser.findAll({});

        res.render('admin/masterDosen', {
            title: 'Data Dosen',
            id,
            username,
            masterDosen,
            addSuccess: req.flash('addSuccess'),
            addSuccess1: req.flash('addSuccess1'),
            editSuccess: req.flash('editSuccess'),
            deleteSuccess: req.flash('deleteSuccess'),
            validateError: req.flash('validateError'),
        });
    } catch (error) {
        res.status(500).json({
            status: 500,
            msg: error.message
        });
    }
};

const addDosen = async (req, res) => {
    try {
        const { nip, nama, password, gender, foto } = req.body;

        await LecturerUser.create({
            nip,
            nama,
            gender,
            foto,
            username: nama,
            email: nip,
            password: encryptPass(password), 
            role: 'Dosen'
        });

        req.flash('addSuccess', 'Data Dosen berhasil DITAMBAH!')
        res.status(201).redirect('/admin/dosen');
    } catch (error) {
        if (error.message === "Validation error: Validation len on nip failed") {
            req.flash('validateError', 'Data Dosen gagal DITAMBAH! Silakan input ulang dengan NIP maksimal digit 15.');
            return res.status(400).redirect('/admin/dosen');
        }

        res.status(500).json({
            status: 500,
            msg: error.message
        });
    }
};

const editDosen = async (req, res) => {
    try {
        const { id } = req.params;

        const { nip, nama, gender, foto } = req.body;

        await LecturerUser.update({
            nip,
            nama,
            gender,
            foto
        }, {
            where: {
                id
            }
        });

        req.flash('editSuccess', 'Data Dosen berhasil DIUBAH!')
        res.redirect('/admin/dosen');
    } catch (error) {
        if (error.message === "Validation error: Validation len on nip failed") {
            req.flash('validateError', 'Data Dosen gagal DIUBAH! Silakan ubah ulang dengan NIP maksimal digit 15.');
            return res.status(400).redirect('/admin/dosen');
        }

        res.status(500).json({
            status: 500,
            msg: error.message
        });
    }
};

const deleteDosen = async (req, res) => {
    try {
        const { id } = req.params;

        await LecturerUser.destroy({
            where: {
                id
            }
        });

        req.flash('deleteSuccess', 'Data Dosen berhasil DIHAPUS!')
        res.redirect('/admin/dosen');
    } catch (error) {
        res.status(500).json({
            status: 500,
            msg: error.message
        });
    }
};

const exportTableToClipboard = async (req, res, next) => {
  try {
    const data = await LecturerUser.findAll({}); 

    const csvData = data.map((dosen, index) => {
      return `${index + 1}\t${dosen.nip}\t${dosen.nama}\t${dosen.gender}\t${dosen.password}\t${dosen.foto}\n`;
    }).join('');

    copyPaste.copy(csvData, () => {
      req.flash('addSuccess1', 'Data dosen berhasil disalin ke clipboard ')
      res.redirect('/admin/dosen');
    });
  } catch (error) {
    next(new Error('controllers/adminController.js:exportTableToClipboard - ' + error.message));
  }
};

const exportTableToCSV = async (req, res, next) => {
  const path = './file-output';

  const data = await LecturerUser.findAll({});


  const csvWriter = createCsvWriter({
    path: `${path}/Dosen.csv`,
    header: [
      { id: 's_no', title: 'No', width: 5 },
      { id: 'nip', title: 'NIP', width: 20 },
      { id: 'nama', title: 'Nama', width: 20 },
      { id: 'gender', title: 'Jenis Kelamin', width: 10 },
      { id: 'password', title: 'Password', width: 70 },
      { id: 'foto', title: 'Foto', width: 10 },
    ],
    alwaysQuote: true, 
  });
  

  let counter = 1;
  data.forEach((dosen) => {
    dosen.s_no = counter;
    counter++;
  });

  try {
    await csvWriter.writeRecords(data);

    res.download(`${path}/Dosen.csv`, 'Dosen.csv', (err) => {
      if (err) {
        console.log(err);
      } else {
        fs.unlinkSync(`${path}/Dosen.csv`);
      }
    });
  } catch (error) {
    next(
      new Error('controllers/adminController.js:exportTableToCSV - ' + error.message)
    );
  }
};

const exportTableToExcel = async (req, res, next) => {

  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Dosen");
  const path = "./file-output";

  const data = await LecturerUser.findAll({});

  worksheet.columns = [
    { header: 'No', key: 's_no', width: 5 },
    { header: 'NIP', key: 'nip', width: 20},
    { header: 'Nama', key: 'nama', width: 20 },
    { header: 'Jenis Kelamin', key: 'gender', width: 10  },
    { header: 'Password', key: 'password', width: 70 },
    { header: 'Foto', key: 'foto', width: 30 },
  ];

  let counter = 1;
  data.forEach((dosen) => {
    dosen.s_no = counter;
    worksheet.addRow(dosen);
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
      .writeFile(`${path}/Dosen.xlsx`)
      .then(() => {
        res.download(`${path}/Dosen.xlsx`, "Dosen.xlsx", (err) => {
          if (err) {
            console.log(err);
          } else {
            fs.unlinkSync(`${path}/Dosen.xlsx`);
          }
        });
      });
  } catch (error) {
    next(
      new Error(
        "controllers/adminController.js:exportTableToExcel - " + error.message
      )
    );
  }
};


const exportTableToPDF = async (req, res, next) => {
    try {
      let pathFile = "./file-output";
      let fileName = "dataDosen.pdf";
      let fullPath = pathFile + "/" + fileName;
      let html = fs.readFileSync("./templates/template.html", "utf-8");
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
      const data = await LecturerUser.findAll({});
      let lecturers = [];
      data.forEach((dosen, no) => {
        lecturers.push({
          no: no + 1,
          id: dosen._id,
          nip: dosen.nip,
          nama: dosen.nama,
          gender: dosen.gender,
          password: dosen.password,
          foto: dosen.foto
        });
      });
      let document = {
        html: html,
        data: {
          lecturers: lecturers,
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
          "controllers/adminController.js:exportTableToPDF - " + err.message
        )
      );
    }
  };
  
  const printTable = async (req, res, next) => {
    try {
      const pathFile = './file-output';
      const fileName = 'dataDosen.pdf';
      const fullPath = path.join(pathFile, fileName);
  
      const browser = await puppeteer.launch();
      const page = await browser.newPage();

      let htmlTemplate = fs.readFileSync('./templates/templatePrint.html', 'utf-8');

      const data = await LecturerUser.findAll({});
  
      const lecturers = data.map((dosen, index) => {
        return {
          no: index + 1,
          id: dosen._id,
          nip: dosen.nip,
          nama: dosen.nama,
          gender: dosen.gender,
          password: dosen.password,
          foto: dosen.foto
        };
      });
  
      const tableRows = lecturers.map(dosen => `
        <tr>
          <td>${dosen.no}</td>
          <td>${dosen.id}</td>
          <td>${dosen.nip}</td>
          <td>${dosen.nama}</td>
          <td>${dosen.gender}</td>
          <td>${dosen.password}</td>
          <td>${dosen.foto}</td>
        </tr>
      `).join('');
  
      const content = htmlTemplate.replace('<!-- Data will be dynamically inserted here -->', tableRows);
  
      await page.setContent(content, { waitUntil: 'networkidle0' });
  
      const pdfOptions = {
        path: fullPath,
        format: 'A4',
        printBackground: true
      };
  
      await page.pdf(pdfOptions);
  
      await browser.close();
  
      res.download(fullPath, fileName, (downloadErr) => {
        if (downloadErr) {
          console.error(downloadErr);
        } else {
          fs.unlinkSync(fullPath);
        }
      });
  
    } catch (error) {
      next(new Error('controllers/adminController.js:printTable - ' + error.message));
    }
  };
  

const getKoorSkripsi = async (req, res) => {
    try {
        const { id, username } = req.cookies;

        const masterKoor = await CoordinatorUser.findAll({});

        res.render('admin/masterKoor', {
            title: 'Data Koordinator Skripsi',
            id,
            username,
            masterKoor,
            addSuccess: req.flash('addSuccess'),
            addSuccess1: req.flash('addSuccess1'),
            editSuccess: req.flash('editSuccess'),
            deleteSuccess: req.flash('deleteSuccess'),
            validateError: req.flash('validateError'),
        });
    } catch (error) {
        res.status(500).json({
            status: 500,
            msg: error.message
        });
    }
};

const addKoor = async (req, res) => {
    try {
        const { nip, nama, password, gender, foto } = req.body;

        await CoordinatorUser.create({
            nip,
            nama,
            gender,
            foto,
            username: nama,
            email: nip,
            password: encryptPass(password), 
            role: 'Koordinator',
        });

        req.flash('addSuccess', 'Data Koordinator berhasil DITAMBAH!')
        res.status(201).redirect('/admin/koordinator-skripsi');
    } catch (error) {
        if (error.message === "Validation error: Validation len on nip failed") {
            req.flash('validateError', 'Data Koordinator Skripsi gagal DITAMBAH! Silakan input ulang dengan NIP maksimal digit 15.');
            return res.status(400).redirect('/admin/koordinator-skripsi');
        }

        res.status(500).json({
            status: 500,
            msg: error.message,
        });
    }
};

const editKoor = async (req, res) => {
    try {
        const { id } = req.params;

        const { nip, nama, gender, foto } = req.body;

        await CoordinatorUser.update({
            nip,
            nama,
            gender,
            foto
        }, {
            where: {
                id
            }
        });

        req.flash('editSuccess', 'Data Koordinator Skripsi berhasil DIUBAH!');
        res.redirect('/admin/koordinator-skripsi');
    } catch (error) {
        if (error.message === "Validation error: Validation len on nip failed") {
            req.flash('validateError', 'Data Koordinator Skripsi gagal DIUBAH! Silakan ubah ulang dengan NIP maksimal digit 15.');
            return res.status(400).redirect('/admin/koordinator-skripsi');
        }

        res.status(500).json({
            status: 500,
            msg: error.message,
        });
    }
};

const deleteKoor = async (req, res) => {
    try {
        const { id } = req.params;

        await CoordinatorUser.destroy({
            where: {
                id
            }
        });

        req.flash('deleteSuccess', 'Data Koordinator Skripsi berhasil DIHAPUS!');
        res.redirect('/admin/koordinator-skripsi');
    } catch (error) {
        res.status(500).json({
            status: 500,
            msg: error.message
        });
    }
};

const exportTableToClipboardKoor = async (req, res, next) => {
    try {
      const data = await CoordinatorUser.findAll({}); 
  
      const csvData = data.map((koor, index) => {
        return `${index + 1}\t${koor.nip}\t${koor.nama}\t${koor.gender}\t${koor.password}\t${koor.foto}\n`;
      }).join('');
  
      copyPaste.copy(csvData, () => {
        req.flash('addSuccess1', 'Data koordinator berhasil disalin ke clipboard ')
        res.redirect('/admin/koordinator-skripsi');
      });
    } catch (error) {
      next(new Error('controllers/adminController.js:exportTableToClipboardKoor - ' + error.message));
    }
  };
  
  const exportTableToCSVKoor  = async (req, res, next) => {
    const path = './file-output';
  
    const data = await CoordinatorUser.findAll({});
  
    const csvWriter = createCsvWriter({
      path: `${path}/Koordinator.csv`,
      header: [
        { id: 's_no', title: 'No', width: 5 },
        { id: 'nip', title: 'NIP', width: 20 },
        { id: 'nama', title: 'Nama', width: 20 },
        { id: 'gender', title: 'Jenis Kelamin', width: 30 },
        { id: 'password', title: 'Password', width: 70 },
        { id: 'foto', title: 'Foto', width: 10 },
      ],
      alwaysQuote: true, 
    });
    
  
    let counter = 1;
    data.forEach((koor) => {
      koor.s_no = counter;
      counter++;
    });
  
    try {
      await csvWriter.writeRecords(data);
  
      res.download(`${path}/Koordinator.csv`, 'Koordinator.csv', (err) => {
        if (err) {
          console.log(err);
        } else {
          fs.unlinkSync(`${path}/Koordinator.csv`);
        }
      });
    } catch (error) {
      next(
        new Error('controllers/adminController.js:exportTableToCSVKoor - ' + error.message)
      );
    }
  };
  
  const exportTableToExcelKoor  = async (req, res, next) => {
  
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Koor");
    const path = "./file-output";
  
    const data = await CoordinatorUser.findAll({});
  
    worksheet.columns = [
      { header: 'No', key: 's_no', width: 5 },
      { header: 'NIP', key: 'nip', width: 20},
      { header: 'Nama', key: 'nama', width: 20 },
      { header: 'Jenis Kelamin', key: 'gender', width: 30  },
      { header: 'Password', key: 'password', width: 70 },
      { header: 'Foto', key: 'foto', width: 10 },
    ];
  
    let counter = 1;
    data.forEach((koor) => {
      koor.s_no = counter;
      worksheet.addRow(koor);
      counter++;
    });
    let list = ["A", "B", "C", "D", "E", "F" ];
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
        .writeFile(`${path}/Koordinator.xlsx`)
        .then(() => {
          res.download(`${path}/Koordinator.xlsx`, "Koordinator.xlsx", (err) => {
            if (err) {
              console.log(err);
            } else {
              fs.unlinkSync(`${path}/Koordinator.xlsx`);
            }
          });
        });
    } catch (error) {
      next(
        new Error(
          "controllers/adminController.js:exportTableToExcelKoor - " + error.message
        )
      );
    }
  };
  
  const exportTableToPDFKoor  = async (req, res, next) => {
      try {
        let pathFile = "./file-output";
        let fileName = "dataKoordinator.pdf";
        let fullPath = pathFile + "/" + fileName;
        let html = fs.readFileSync("./templates/templateKoor.html", "utf-8");
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
        const data = await CoordinatorUser.findAll({});
        let coors = [];
        data.forEach((koor, no) => {
          coors.push({
            no: no + 1,
            id: koor._id,
            nip: koor.nip,
            nama: koor.nama,
            gender: koor.gender,
            password: koor.password,
            foto: koor.foto
          });
        });
        let document = {
          html: html,
          data: {
            coors: coors,
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
            "controllers/adminController.js:exportTableToPDFKoor - " + err.message
          )
        );
      }
    };

const getPembagianDosen = async (req, res) => {
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

        const warna1 = {};
        const warna2 = {};
        const warna3 = {};

        dataPembagianDosen.forEach((pembagianDosen) => {
            warna1[pembagianDosen.id] = colors.getStatusColor1(pembagianDosen.statusPembimbing1);
            warna2[pembagianDosen.id] = colors.getStatusColor2(pembagianDosen.statusPembimbing2);
            warna3[pembagianDosen.id] = colors.getStatusColor3(pembagianDosen.statusPembahas);
        });

        res.render('admin/pembagianDosen', {
            title: 'Pembagian Dosen',
            id,
            username,
            profile,
            daftarPb1,
            daftarPb2,
            daftarPb3,
            warna1,
            warna2,
            warna3,
            colors,
            dataPembagianDosen,
            addSuccess1: req.flash('addSuccess1'),
            editSuccess: req.flash('editSuccess'),
        });

    } catch (error) {
        res.status(500).json({
            status: 500,
            msg: error.message
        });
    }
};

const addPembagianDosen = async (req, res) => {
    try {
        const { nama, dosenPembimbing1, dosenPembimbing2, dosenPembahas, tanggalPengajuan } = req.body;

        await DevisionOfLecturer.create({
            nama,
            dosenPembimbing1,
            dosenPembimbing2,
            dosenPembahas,
            tanggalPengajuan
        });

        res.status(201).redirect('/admin/pembagian-dosen');
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

        const {nama, npm, statusPembimbing1, statusPembimbing2, statusPembahas, tanggalPengajuan, StudentUserId
        } = req.body;

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

        return res.redirect('/admin/pembagian-dosen');
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
            const dosenPembimbing1Id = await LecturerUser.findOne({ where: { nama: newDosenPembimbing1 } });
            pembagianDosen.dosenPembimbing1 = newDosenPembimbing1;
            pembagianDosen.dosenPembimbing1Id = dosenPembimbing1Id.id;
            req.flash('editSuccess', 'Dosen pembimbing 1 berhasil DIUBAH!');
        }
        if (newDosenPembimbing2 !== undefined) {
            const dosenPembimbing2Id = await LecturerUser.findOne({ where: { nama: newDosenPembimbing2 } });
            pembagianDosen.dosenPembimbing2 = newDosenPembimbing2;
            pembagianDosen.dosenPembimbing2Id = dosenPembimbing2Id.id;
            req.flash('editSuccess', 'Dosen pembimbing 2 berhasil DIUBAH!');
        }
        if (newDosenPembahas !== undefined) {
            const dosenPembahasId = await LecturerUser.findOne({ where: { nama: newDosenPembahas } });
            pembagianDosen.dosenPembahas = newDosenPembahas;
            pembagianDosen.dosenPembahasId = dosenPembahasId .id;
            req.flash('editSuccess', 'Dosen pembahas berhasil DIUBAH!');
        }

        await pembagianDosen.save();

        return res.redirect('/admin/pembagian-dosen');
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
      res.redirect('/admin/pembagian-dosen');
    });
  } catch (error) {
    next(new Error('controllers/adminController.js:exportTableToClipboardPembagianDosen - ' + error.message));
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
      new Error('controllers/adminController.js:exportTableToCSVPembagianDosen - ' + error.message)
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
        "controllers/adminController.js:exportTableToExcelPembagianDosen - " + error.message
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
        "controllers/adminController.js:exportTableToPDFPembagianDosen - " + error.message
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

      res.render('admin/permintaanBimbingan', {
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
          editSuccess: req.flash('editSuccess'),
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

      return res.redirect('/admin/permintaan-bimbingan');
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
      res.redirect('/admin/permintaan-bimbingan');
    });
  } catch (error) {
    next(new Error('controllers/adminController.js:exportTableToClipboardPermintaanBimbingan - ' + error.message));
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
      new Error('controllers/adminController.js:exportTableToCSVPermintaanBimbingan - ' + error.message)
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
        "controllers/adminController.js:exportTableToExcelPermintaanBimbingan - " + error.message
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
        "controllers/adminController.js:exportTableToPDFPermintaanBimbingan - " + error.message
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
  
      return res.render('admin/daftarDosen', {
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
      res.status(500).json({ error: 'Terjadi kesalahan saat mengambil daftar dosen.' });
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
        return res.redirect('/admin/daftar-dosen');
      }
  
      await ListOfLecturer1.create({
        dosenPembimbing1
      });
  
      req.flash('addSuccess', 'Daftar dosen pembimbing 1 berhasil DITAMBAH!');
      return res.redirect('/admin/daftar-dosen');
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
        res.redirect('/admin/daftar-dosen');
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
      res.redirect('/admin/daftar-dosen');
    });
  } catch (error) {
    next(new Error('controllers/adminController.js:exportTableToClipboardDaftarDosen1 - ' + error.message));
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
      new Error('controllers/adminController.js:exportTableToCSVDaftarDosen1 - ' + error.message)
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
        "controllers/adminController.js:exportTableToExcelDaftarDosen1 - " + error.message
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
          "controllers/adminController.js:exportTableToPDFDaftarDosen1 - " + err.message
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
  
      return res.render('admin/daftarDosen2', {
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
      res.status(500).json({ error: 'Terjadi kesalahan saat mengambil daftar dosen.' });
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
      return res.redirect('/admin/daftar-dosen2');
    }

    await ListOfLecturer2.create({
      dosenPembimbing2
    });

    req.flash('addSuccess2', 'Daftar dosen pembimbing 2 berhasil DITAMBAH!');
    return res.redirect('/admin/daftar-dosen2');
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
    res.redirect('/admin/daftar-dosen2');
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
      res.redirect('/admin/daftar-dosen2');
    });
  } catch (error) {
    next(new Error('controllers/adminController.js:exportTableToClipboardDaftarDosen2 - ' + error.message));
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
      new Error('controllers/adminController.js:exportTableToCSVDaftarDosen2 - ' + error.message)
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
        "controllers/adminController.js:exportTableToExcelDaftarDosen2 - " + error.message
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
          "controllers/adminController.js:exportTableToPDFDaftarDosen2 - " + err.message
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
  
      return res.render('admin/daftarDosen3', {
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
      res.status(500).json({ error: 'Terjadi kesalahan saat mengambil daftar dosen.' });
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
      return res.redirect('/admin/daftar-dosen3');
    }

    await ListOfLecturer3.create({
      dosenPembahas
    });

    req.flash('addSuccess3', 'Daftar dosen pembahas berhasil DITAMBAH!');
    return res.redirect('/admin/daftar-dosen3');
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
    res.redirect('/admin/daftar-dosen3');
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
      res.redirect('/admin/daftar-dosen3');
    });
  } catch (error) {
    next(new Error('controllers/adminController.js:exportTableToClipboardDaftarDosen3 - ' + error.message));
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
      new Error('controllers/adminController.js:exportTableToCSVDaftarDosen3 - ' + error.message)
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
        "controllers/adminController.js:exportTableToExcelDaftarDosen3 - " + error.message
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
          "controllers/adminController.js:exportTableToPDFDaftarDosen3 - " + err.message
        )
      );
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

        res.render('admin/pengajuanJudul', {
            title: 'Pengajuan Judul',
            id,
            username,
            profile,
            dataPengajuanJudul,
            dataPengajuanJudul2,
            warna,
            colors,
            warna,
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

        return res.redirect('/admin/pengajuan-judul');
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

        res.redirect('/admin/pengajuan-judul');
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
      res.redirect('/admin/pengajuan-judul');
    });
  } catch (error) {
    next(new Error('controllers/adminController.js:exportTableToClipboardPengajuanJudul - ' + error.message));
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
      new Error('controllers/adminController.js:exportTableToCSVPengajuanJudul - ' + error.message)
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
        "controllers/adminController.js:exportTableToExcelPengajuanJudul - " + error.message
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
          "controllers/adminController.js:exportTableToPDFPengajuanJudul - " + err.message
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

        res.render('admin/judulDiterima', {
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
      res.redirect('/admin/judul-diterima');
    });
  } catch (error) {
    next(new Error('controllers/adminController.js:exportTableToClipboardJudulDiterima - ' + error.message));
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
      new Error('controllers/adminController.js:exportTableToCSVJudulDiterima - ' + error.message)
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
        "controllers/adminController.js:exportTableToExcelJudulDiterima - " + error.message
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
      return pengajuanJudul.statusPersetujuan === 'Judul 1 Diterima' || pengajuanJudul.statusPersetujuan === 'Judul 2 Diterima';
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
          "controllers/adminController.js:exportTableToPDFJudulDiterima - " + err.message
        )
      );
    }
  };

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

        res.render('admin/proposal', {
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

        return res.redirect('/admin/proposal');
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
        res.redirect('/admin/proposal');
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
        res.redirect('/admin/proposal');
      });
    } catch (error) {
      next(new Error('controllers/adminController.js:exportTableToClipboardProposal - ' + error.message));
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
        new Error('controllers/adminController.js:exportTableToCSVProposal - ' + error.message)
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
          "controllers/adminController.js:exportTableToExcelProposal - " + error.message
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
        "controllers/adminController.js:exportTableToPDFProposal - " + error.message
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

        res.render('admin/proposalMasuk', {
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

        return res.redirect('/admin/proposal-masuk');
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
      res.redirect('/admin/proposal-masuk');
    });
  } catch (error) {
    next(new Error('controllers/adminController.js:exportTableToClipboardProposalMasuk - ' + error.message));
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
      new Error('controllers/adminController.js:exportTableToCSVProposalMasuk - ' + error.message)
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
        "controllers/adminController.js:exportTableToExcelProposalMasuk - " + error.message
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
      "controllers/adminController.js:exportTableToPDFProposalMasuk - " + error.message
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

        res.render('admin/proposalTerjadwal', {
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

        return res.redirect('/admin/proposal-terjadwal');
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

        return res.redirect('/admin/proposal-terjadwal');
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
      res.redirect('/admin/proposal-terjadwal');
    });
  } catch (error) {
    next(new Error('controllers/adminController.js:exportTableToClipboardProposalTerjadwal - ' + error.message));
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
      new Error('controllers/adminController.js:exportTableToCSVProposalTerjadwal - ' + error.message)
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
        "controllers/adminController.js:exportTableToExcelProposalTerjadwal - " + error.message
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
  .filter(proposalTerjadwal => proposalTerjadwal.jadwalSeminarProposal && proposalTerjadwal.statusProposal !== 'Selesai');


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
      "controllers/adminController.js:exportTableToPDFProposalTerjadwal - " + error.message
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

        res.render('admin/proposalSelesai', {
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

        return res.redirect('/admin/proposal-selesai');
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
      res.redirect('/admin/proposal-selesai');
    });
  } catch (error) {
    next(new Error('controllers/adminController.js:exportTableToClipboardProposalSelesai - ' + error.message));
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
      new Error('controllers/adminController.js:exportTableToCSVProposalSelesai - ' + error.message)
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
        "controllers/adminController.js:exportTableToExcelProposalSelesai - " + error.message
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
      "controllers/adminController.js:exportTableToPDFProposalSelesai - " + error.message
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

        res.render('admin/hasil', {
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
        const { statusHasilSkripsi, StudentUserId, jadwalSeminarHasil } = req.body;

        const dataHasilSkripsi = await HasilSkripsi.findAll({});

        await HasilSkripsi.update({
            statusHasilSkripsi,
            StudentUserId,
            dataHasilSkripsi,
            jadwalSeminarHasil
        }, {
            where: {
                id
            }
        });

        return res.redirect('/admin/hasil-skripsi');
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
        res.redirect('/admin/proposal');
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
      return res.status(404).send('Proposal tidak ditemukan.');
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

    const proposalRevisi2Path = `./uploadRevisi2/${hasilSkripsiRevisi2.hasilSkripsiRevisi2}`;
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
      res.redirect('/admin/hasil-skripsi');
    });
  } catch (error) {
    next(new Error('controllers/adminController.js:exportTableToClipboardHasil - ' + error.message));
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
      new Error('controllers/adminController.js:exportTableToCSVHasil - ' + error.message)
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
        "controllers/adminController.js:exportTableToExcelHasil- " + error.message
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
        "controllers/adminController.js:exportTableToPDFHasil - " + error.message
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

        res.render('admin/hasilMasuk', {
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

        return res.redirect('/admin/hasil-masuk');
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
      res.redirect('/admin/hasil-masuk');
    });
  } catch (error) {
    next(new Error('controllers/adminController.js:exportTableToClipboardHasilMasuk - ' + error.message));
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
      new Error('controllers/adminController.js:exportTableToCSVHasilMasuk - ' + error.message)
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
        "controllers/adminController.js:exportTableToExcelHasilMasuk - " + error.message
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
      "controllers/adminController.js:exportTableToPDFHasilMasuk - " + error.message
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

        res.render('admin/hasilTerjadwal', {
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

        return res.redirect('/admin/hasil-terjadwal');
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

        return res.redirect('/admin/hasil-terjadwal');
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
      res.redirect('/admin/hasil-terjadwal');
    });
  } catch (error) {
    next(new Error('controllers/adminController.js:exportTableToClipboardHasilTerjadwal - ' + error.message));
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
      new Error('controllers/adminController.js:exportTableToCSVHasilTerjadwal - ' + error.message)
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
        "controllers/adminController.js:exportTableToExcelHasilTerjadwal - " + error.message
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
      "controllers/adminController.js:exportTableToPDFHasilTerjadwal - " + error.message
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

        res.render('admin/hasilSelesai', {
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

        return res.redirect('/admin/hasil-selesai');
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
      res.redirect('/admin/hasil-selesai');
    });
  } catch (error) {
    next(new Error('controllers/adminController.js:exportTableToClipboardHasilSelesai - ' + error.message));
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
      new Error('controllers/adminController.js:exportTableToCSVHasilSelesai - ' + error.message)
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
        "controllers/adminController.js:exportTableToExcelHasilSelesai - " + error.message
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
      "controllers/adminController.js:exportTableToPDFHasilSelesai - " + error.message
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

        res.render('admin/komprehensif', {
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
        const { statusProposal, StudentUserId, jadwalUjianKomprehensif  } = req.body;

        const dataKomprehensif = await Komprehensif.findAll({});

        await HasilSkripsi.update({
            statusProposal,
            StudentUserId,
            dataKomprehensif,
            jadwalUjianKomprehensif 
        }, {
            where: {
                id
            }
        });

        return res.redirect('/admin/komprehensif');
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
        res.redirect('/admin/komprehensif');
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
        res.redirect('/admin/komprehensif');
      });
    } catch (error) {
      next(new Error('controllers/adminController.js:exportTableToClipboardKomprehensif - ' + error.message));
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
        new Error('controllers/adminController.js:exportTableToCSVKomprehensif - ' + error.message)
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
          "controllers/adminController.js:exportTableToExcelKomprehensif- " + error.message
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
          "controllers/adminController.js:exportTableToPDFKomprehensif - " + error.message
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

        res.render('admin/komprehensifMasuk', {
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

        return res.redirect('/admin/komprehensif-masuk');
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
      res.redirect('/admin/komprehensif-masuk');
    });
  } catch (error) {
    next(new Error('controllers/adminController.js:exportTableToClipboardKomprehensifMasuk - ' + error.message));
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
      new Error('controllers/adminController.js:exportTableToCSVKomprehensifMasuk - ' + error.message)
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
        "controllers/adminController.js:exportTableToExcelKomprehensifMasuk - " + error.message
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
      "controllers/adminController.js:exportTableToPDFKomprehensifMasuk - " + error.message
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

        res.render('admin/komprehensifTerjadwal', {
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

        return res.redirect('/admin/komprehensif-terjadwal');
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

        return res.redirect('/admin/komprehensif-terjadwal');
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
      res.redirect('/admin/komprehensif-terjadwal');
    });
  } catch (error) {
    next(new Error('controllers/adminController.js:exportTableToClipboardKomprehensifTerjadwal - ' + error.message));
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
.filter(komprehensifTerjadwal => komprehensifTerjadwal.jadwalUjianKomprehensif && komprehensifTerjadwal.statusKomprehensif !== 'Selesai');

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
      new Error('controllers/adminController.js:exportTableToCSVKomprehensifTerjadwal - ' + error.message)
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
.filter(komprehensifTerjadwal => komprehensifTerjadwal.jadwalUjianKomprehensif && komprehensifTerjadwal.statusKomprehensif !== 'Selesai');
  
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
        "controllers/adminController.js:exportTableToExcelKomprehensifTerjadwal - " + error.message
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
  .filter(komprehensifTerjadwal => komprehensifTerjadwal.jadwalUjianKomprehensif && komprehensifTerjadwal.statusKomprehensif !== 'Selesai');


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
      "controllers/adminController.js:exportTableToPDFKomprehensifTerjadwal - " + error.message
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

        res.render('admin/komprehensifSelesai', {
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

        return res.redirect('/admin/komprehensif-selesai');
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
      res.redirect('/admin/komprehensif-selesai');
    });
  } catch (error) {
    next(new Error('controllers/adminController.js:exportTableToClipboardKomprehensifSelesai - ' + error.message));
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
      new Error('controllers/adminController.js:exportTableToCSVKomprehensifSelesai - ' + error.message)
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
        "controllers/adminController.js:exportTableToExcelKomprehensifSelesai - " + error.message
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
      "controllers/adminController.js:exportTableToPDFKomprehensifSelesai - " + error.message
    )
  );
}
};

const profile = async (req, res) => {
    try {
        const { username } = req.cookies;
        const { id } = req.cookies || req.params;

        const profile = await User.findOne({
            where: { id }
        });

        if (!profile) {
            return res.status(404).json({ message: 'Profile admin tidak ditemukan' });
        }

        return res.render('admin/profile', {
            title: 'Edit Profile Admin',
            id,
            username,
            profile,
            editSuccess: req.flash('editSuccess'),
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: error.message });
    }
};

const profilePost = async (req, res) => {
    try {
        const { id } = req.params;
        const { username } = req.body;

        const adminProfile = {
            username,
        };

        await User.update(adminProfile, {
            where: {
                id
            }
        });

        req.flash('editSuccess', 'Profile Admin berhasil DIUBAH!');
        return res.redirect(`/admin/${id}/profile?success=true`);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Terjadi kesalahan dalam mengedit data profile' });
    }
};

const ubahPassword = async (req, res) => {
    try {
        const { id, username } = req.cookies;

        const profile = await User.findOne({
            where: { id },
        });

        if (!profile) {
            return res.status(404).json({ message: 'Akun admin tidak ditemukan' });
        }

        return res.render('admin/ubahPassword', {
            title: 'Ubah Password Admin',
            id,
            username,
            profile,
            editSuccess: req.flash('editSuccess'),
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Terjadi kesalahan dalam mengubah password' });
    }
};

const passwordPost = async (req, res) => {
    try {
        const { id } = req.params;
        const { password } = req.body;

        const userProfile = {
            password: encryptPass(password)
        };

        await User.update(userProfile, {
            where: {
                id
            }
        });

        req.flash('editSuccess', 'Password admin berhasil DIUBAH!');
        return res.redirect(`/admin/${id}/ubah-password?success=true`);
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
    registerAPI,
    getLogin,
    login,
    getDashboardAdmin,
    getThesisRegistrations,
    addThesis,
    editThesis,
    editStatus,
    deleteThesis,
    getMahasiswa,
    addMahasiswa,
    // importMahasiswa,
    editMahasiswa,
    displayStudentPhoto,
    deleteMahasiswa,
    exportTableToClipboardMahasiswa, 
    exportTableToCSVMahasiswa, 
    exportTableToExcelMahasiswa, 
    exportTableToPDFMahasiswa,
    printTableMahasiswa, 
    getDosen,
    addDosen,
    editDosen,
    deleteDosen,
    exportTableToClipboard, 
    exportTableToCSV, 
    exportTableToExcel, 
    exportTableToPDF, 
    printTable,
    getKoorSkripsi,
    addKoor,
    editKoor,
    deleteKoor,
    exportTableToClipboardKoor, 
    exportTableToCSVKoor, 
    exportTableToExcelKoor, 
    exportTableToPDFKoor, 
    getPembagianDosen,
    addPembagianDosen,
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
    downloadKomprehensifRevisiDosen1,
    downloadKomprehensifRevisiDosen2,
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