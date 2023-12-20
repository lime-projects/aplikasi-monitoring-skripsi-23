require('dotenv').config()
const nodemailer = require('nodemailer')
const Transport = require('nodemailer-sendinblue-transport')
const { DateTime } = require('luxon');
const {sendResetPasswordEmail} = require('../utils/email'); 
const { encryptPass, decryptPass } = require('../helpers/bcrypt')
const { generateToken } = require('../helpers/jwt')
const colors = require('../helpers/colors')
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');


const {  User, ThesisRegistration, ListOfLecturer1, ListOfLecturer2, ListOfLecturer3, TitleSubmission, TitleSubmission2, DevisionOfLecturer, StudentUser, LecturerUser, Proposal, HasilSkripsi, Komprehensif } = require('../models');

const getRegisterPage = async (req, res) => {
    try {
        if (req.cookies.token) {
            return res.redirect('/mahasiswa/dashboard');
        }

        const dataAkademik = await ThesisRegistration.findAll({});

        res.render('mahasiswa/registerMahasiswa', {
            existsAlert: req.flash('existsAlert'),
            dataAkademik
        });
    } catch (error) {
        res.status(500).json({
            status: 500,
            msg: error.message
        });
    }
};

const register = async (req, res) => {
    const {npm, nama, gender, angkatan, email, password, role} = req.body;

    try {
        const npmExist = await StudentUser.findOne({
            where: {
                npm
            }
        });

        const usernameExist = await StudentUser.findOne({
            where: {
                username: nama
            }
        });

        const emailExist = await StudentUser.findOne({
            where: {
                email
            }
        });

        if (npmExist || usernameExist || emailExist) {
            req.flash('existsAlert', 'NPM/Username/Email sudah terdaftar!');
            console.log('NPM/Username/Email sudah terdaftar!');
            return res.status(400).redirect('/mahasiswa/register');
        }

        const daftarTahunAkademik = await ThesisRegistration.findAll({
        });

        await StudentUser.create({
            npm,
            nama,
            gender,
            angkatan,
            username: nama,
            email,
            password: encryptPass(password),
            role,
        });

        const transporter = nodemailer.createTransport(
            new Transport({
                apiKey: "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" || process.env.EMAIL_API_KEY
            })
        );

        transporter.sendMail({
          from: 'aplikasimonitoringskripsi@gmail.com',
          to: email,
          subject: `Konfirmasi Email ${nama}`,
          html: `<h1>Hi ${nama}</h1>
                  <p>Silakan klik <a href="http://127.0.0.1:${process.env.PORT}/mahasiswa/login"> ==DISINI== </a> untuk konfirmasi login.</p>
                  <br><br>
                  <b><p>Salam Hormat,</p>
                  <p>Aplikasi Monitoring Skripsi Developer</p></b>
                  <br>
                  <p>Anda menerima email ini karena untuk mengkonfirmasi login di Aplikasi Monitoring Skripsi.</p>
                  <p>Indonesia,</p>
                  <p>Copyright @ Aplikasi Monitoring Skripsi 2023</p>
                 <br>
                  <b><p>ini adalah email otomatis, tolong jangan balas email ini!</p></b>`
      })

        res.status(201).render('emailConfirm', {daftarTahunAkademik});
    } catch (error) {
        res.status(500).json({
            status: 500,
            msg: error.message
        });
    }
};

const getLogin = async (req, res) => {
    try {
        if (req.cookies.token) return res.redirect('/')

        res.render('mahasiswa/loginMahasiswa')
    } catch (error) {
        res.status(500).json({
            status: 500,
            msg: error.message
        })
    }
}

const getPassword = async (req, res) => {
  res.render('mahasiswa/forgotPassword'); 
};

const generateRandomToken = () => {
  return new Promise((resolve, reject) => {
    try {
      const token = crypto.randomBytes(20).toString('hex');
      resolve(token);
    } catch (error) {
      reject(error);
    }
  });
};

const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await StudentUser.findOne({ where: { email } });

    if (!user) {
      res.status(200).render('userNot') ;
    }

    const resetToken = await generateRandomToken();
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = Date.now() + 3600000; 
    await user.save();

    const resetLink = `http://127.0.0.1:5001/mahasiswa/reset/${resetToken}`;

    sendResetPasswordEmail(email, resetLink);

    res.status(200).render('forgotEmailConfirm') ;
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const showResetPasswordForm = async (req, res) => {
  const token = req.params.token; 
  res.render('mahasiswa/resetPasswordForm', { token });
};

const resetPassword = async (req, res) => {
  try {
    const { resetToken, newPassword } = req.body;
    const user = await StudentUser.findOne({ where: { resetPasswordToken: resetToken } });

    if (!user || user.resetPasswordExpires < Date.now()) {
      return res.status(400).json({ message: 'Invalid or expired token' });
    }

    const newResetToken = await generateRandomToken();
    const resetTokenExpires = Date.now() + 3600000;

    user.password = encryptPass(newPassword); 
    user.resetPasswordToken = newResetToken;
    user.resetPasswordExpires = resetTokenExpires;
    await user.save();

    res.status(200).render('successResetPassword');
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const login = async (req, res) => {
  const { email, password, newPassword } = req.body;

  try {
    const user = await StudentUser.findOne({
      where: {
        email,
      },
    });

    if (!user) {
      console.log('User not found');
      return res.status(404).redirect('/mahasiswa/login');
    }

    let isPasswordCorrect = false;

    if (password) {
      isPasswordCorrect =  decryptPass(password, user.password);
    }

    let isNewPasswordCorrect = true;
    if (newPassword) {
      isNewPasswordCorrect = decryptPass(newPassword, user.password);
    }

    if (!isPasswordCorrect && !isNewPasswordCorrect) {
      console.log('Incorrect password');
      return res.status(400).redirect('/mahasiswa/login');
    }

    res.status(201)
      .cookie('token', generateToken(user))
      .cookie('id', user.id)
      .cookie('username', user.username)
      .redirect('/mahasiswa/dashboard');
  } catch (error) {
    console.error(error);
    res.status(500).json({
      status: 500,
      msg: 'Internal server error',
    });
  }
};


const getDashboardMahasiswa = async (req, res) => {
    try {
        const { id, username } = req.cookies

        const profile = await StudentUser.findOne({
            where: { id }
        })

        const jmlMhs = await StudentUser.findAll({})

        const judul = await Proposal.findAll({
          include: [
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

        const pembimbing1 = await DevisionOfLecturer.findOne({
          where: { id }, 
          attributes: ['dosenPembimbing1']
        });

        const pembimbing2 = await DevisionOfLecturer.findOne({
          where: { id }, 
          attributes: ['dosenPembimbing2']
        });

        const pembahas = await DevisionOfLecturer.findOne({
          where: { id }, 
          attributes: ['dosenPembahas']
        });

        res.render('mahasiswa/dashboardMahasiswa', {
            title: 'Selamat Datang di Aplikasi Monitoring Skripsi',
            id,
            username,
            profile,
            jmlMhs,
            judul,
            pembimbing1,
            pembimbing2,
            pembahas,
        })
    } catch (error) {
        res.status(500).json({
            status: 500,
            msg: error.message
        })
    }
}

const getDaftarJudul = async (req, res) => {
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

      res.render('mahasiswa/daftarJudul', {
          title: 'Daftar Judul Mahasiswa',
          id,
          username,
          profile,
          dataPengajuanJudul,
          dataPengajuanJudul2,
          warna,
          colors
      });
  } catch (error) {
      res.status(500).json({
          status: 500,
          msg: error.message
      });
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

      res.render('mahasiswa/judulDiterima', {
          title: 'Judul Diterima',
          id,
          username,
          profile,
          dataPengajuanJudul,
          dataPengajuanJudul2,
          warna,
          colors,
          dataJudul1Diterima,
          dataJudul2Diterima
      });
  } catch (error) {
      res.status(500).json({
          status: 500,
          msg: error.message
      });
  }
};

const pengajuanDosen = async (req, res) => {
    try {
        const { id, username } = req.cookies;

        const profile = await StudentUser.findOne({
            where: { id },
        });

        if (!profile) {
            return res.status(404).json({ message: 'Profile mahasiswa tidak ditemukan' });
        }

        const pengajuanDosen = await DevisionOfLecturer.findOne({
            where: {
                npm: profile.npm,
            },
        });

        const daftarPb1 = await ListOfLecturer1.findAll({}); 
        const daftarPb2 = await ListOfLecturer2.findAll({}); 
        const daftarPb3 = await ListOfLecturer3.findAll({}); 

        const warna1 = colors.getStatusColor();
        const warna2 = colors.getStatusColor();
        const warna3 = colors.getStatusColor();

        res.render('mahasiswa/pengajuanDosen', {
            title: 'Pengajuan Dosen',
            id,
            username,
            profile,
            colors,
            warna1,
            warna2,
            warna3,
            pengajuanDosen,
            daftarPb1,
            daftarPb2,
            daftarPb3,
            telahMengajukan: req.flash('telahMengajukan'),
            addSuccess: req.flash('addSuccess'),
            tahunAkademikMati: req.flash('tahunAkademikMati'),
            tahunAkademikMati1: req.flash('tahunAkademikMati1')
        });
    } catch (error) {
        res.status(500).json({
            status: 500,
            msg: error.message,
        });
    }
};

const postPengajuanDosen = async (req, res) => {
    try {
        const { id, username } = req.cookies;

        const { dosenPembimbing1, dosenPembimbing2, dosenPembahas } = req.body;

        const profile = await StudentUser.findOne({
            where: {
                id
            },
        });

        if (!profile) {
            return res.status(404).json({ message: 'Profile mahasiswa tidak ditemukan' });
        }

        const existingSubmission = await DevisionOfLecturer.findOne({
            where: {
                npm: profile.npm
            },
        });

        if (existingSubmission) {
            req.flash('telahMengajukan', 'Mahasiswa sudah mengajukan dosen pembimbing sebelumnya.')
            return res.redirect('/mahasiswa/pengajuan-dosen');
        }

        const activeThesisRegistration = await ThesisRegistration.findOne({   
          where: { angkatan: profile.angkatan, status: true },
      });
          
      if (!activeThesisRegistration) {
          req.flash('tahunAkademikMati', 'Tidak dapat mengajukan dosen. Tahun akademik nonaktif.');
          return res.redirect('/mahasiswa/pengajuan-dosen');
      }
      const activeThesisRegistrationDate = await ThesisRegistration.findOne({   
        where: { angkatan: profile.angkatan, status: true },
      });
      if (activeThesisRegistrationDate && activeThesisRegistrationDate.tanggalAkhir <= new Date()) {
        req.flash('tahunAkademikMati1', 'Tidak dapat mengajukan dosen. Jadwal sudah berakhir.');
        return res.redirect('/mahasiswa/pengajuan-dosen');
      }

        const jakartaTime = DateTime.now().setZone('Asia/Jakarta');
        const formattedDateTime = jakartaTime.toFormat('yyyy-MM-dd HH:mm:ss');

        const dosenPembimbing1Id = await LecturerUser.findOne({ where: { nama: dosenPembimbing1 } });
        const dosenPembimbing2Id = await LecturerUser.findOne({ where: { nama: dosenPembimbing2 } });
        const dosenPembahasId = await LecturerUser.findOne({ where: { nama: dosenPembahas } });

        await DevisionOfLecturer.create({
            id,
            username,
            npm: profile.npm,
            nama: profile.nama,
            dosenPembimbing1,
            dosenPembimbing2,
            dosenPembahas,
            tanggalPengajuan: formattedDateTime,
            StudentUserId: id,
            dosenPembimbing1Id: dosenPembimbing1Id.id,
            dosenPembimbing2Id: dosenPembimbing2Id.id,
            dosenPembahasId: dosenPembahasId.id,
        });

        req.flash('addSuccess', 'Dosen Pembimbing dan pembahas berhasil diajukan');
        return res.redirect('/mahasiswa/pengajuan-dosen');
    } catch (error) {
        res.status(500).json({
            status: 500,
            msg: error.message
        });
    }
};

const getPengajuanJudul = async (req, res) => {
    try {
        const { id, username } = req.cookies

        const profile = await StudentUser.findOne({
            where: { id },
        })

        if (!profile) {
            return res.status(404).json({ message: 'Profile mahasiswa tidak ditemukan' });
        }

        const pengajuanJudul = await TitleSubmission.findOne({
            where: { id },
        });

        const pengajuanJudul2 = await TitleSubmission2.findOne({
            where: { id },
        });

        const pengajuanDosen = await DevisionOfLecturer.findOne({
            where: { id },
        });

        const warna = colors.getStatusColor();

        const hasSubmitted1 = pengajuanJudul !== null;
        const hasSubmitted2 = pengajuanJudul2 !== null;

        res.render('mahasiswa/pengajuanJudul', {
            title: 'Pengajuan Judul',
            id,
            username,
            profile,
            pengajuanJudul,
            pengajuanJudul2,
            pengajuanDosen,
            warna,
            colors,
            hasSubmitted1,
            hasSubmitted2,
            telahMengajukan: req.flash('telahMengajukan'),
            telahMengajukan2: req.flash('telahMengajukan2'),
            tahunAkademikMati: req.flash('tahunAkademikMati'),
            tahunAkademikMati1: req.flash('tahunAkademikMati1'),
            addSuccess1: req.flash('addSuccess1'),
            addSuccess2: req.flash('addSuccess2'),
            editSuccess1: req.flash('editSuccess1'),
            editSuccess2: req.flash('editSuccess2'),

        })
    } catch (error) {
        res.status(500).json({
            status: 500,
            msg: error.message
        })
    }
}

const postPengajuanJudul1 = async (req, res) => {
    try {
        const { id, username } = req.cookies;

        const {npm, nama, dosenPembimbing1, dosenPembimbing2, judul1, latarBelakang, metode, gambaran, referensiJurnal1, referensiJurnal2,referensiJurnal3, tanggalPengajuan, statusPengajuan,} = req.body;

        const profile = await StudentUser.findOne({
            where: { id },
        });

        if (!profile) {
            return res.status(404).json({ message: 'Profile mahasiswa tidak ditemukan' });
        }

        const existingSubmission = await TitleSubmission.findOne({
            where: {
                npm: profile.npm,
                judul1,
            },
        });

        if (existingSubmission) {
            req.flash('telahMengajukan', 'Mahasiswa sudah mengajukan judul 1');
            return res.redirect('/mahasiswa/pengajuan-judul');
        }

      const activeThesisRegistration = await ThesisRegistration.findOne({   
          where: { angkatan: profile.angkatan, status: true },
      });
          
      if (!activeThesisRegistration) {
          req.flash('tahunAkademikMati', 'Tidak dapat mengajukan judul 1. Tahun akademik nonaktif.');
          return res.redirect('/mahasiswa/pengajuan-judul');
      }
      const activeThesisRegistrationDate = await ThesisRegistration.findOne({   
        where: { angkatan: profile.angkatan, status: true },
      });
      if (activeThesisRegistrationDate && activeThesisRegistrationDate.tanggalAkhir <= new Date()) {
        req.flash('tahunAkademikMati1', 'Tidak dapat mengajukan judul 1. Jadwal sudah berakhir.');
        return res.redirect('/mahasiswa/pengajuan-judul');
      }

        const jakartaTime = DateTime.now().setZone('Asia/Jakarta');
        const formattedDateTime = jakartaTime.toFormat('yyyy-MM-dd HH:mm:ss');

        await TitleSubmission.create({
            id,
            username,
            npm: profile.npm,
            nama: profile.nama,
            dosenPembimbing1,
            dosenPembimbing2,
            judul1,
            latarBelakang,
            metode,
            gambaran,
            referensiJurnal1,
            referensiJurnal2,
            referensiJurnal3,
            tanggalPengajuan: formattedDateTime,
            statusPengajuan,
            StudentUserId: id,
        });

        req.flash('addSuccess1', 'Judul 1 berhasil diajukan');
        res.redirect('/mahasiswa/pengajuan-judul');
    } catch (error) {
        res.status(500).json({
            status: 500,
            msg: error.message,
        });
    }
};

const postPengajuanJudul2 = async (req, res) => {
    try {
        const { id, username } = req.cookies;

        const {npm, nama, dosenPembimbing1, dosenPembimbing2, judul2, latarBelakang, metode, gambaran, referensiJurnal1, referensiJurnal2,referensiJurnal3, tanggalPengajuan, statusPengajuan} = req.body;

        const profile = await StudentUser.findOne({
            where: { id },
        });

        if (!profile) {
            return res.status(404).json({ message: 'Profile mahasiswa tidak ditemukan' });
        }

        const existingSubmission = await TitleSubmission2.findOne({
            where: {
                npm: profile.npm,
                judul2,
            },
        });

        if (existingSubmission) {
            req.flash('telahMengajukan2', 'Mahasiswa sudah mengajukan judul 2');
            return res.redirect('/mahasiswa/pengajuan-judul');
        }

        const activeThesisRegistration = await ThesisRegistration.findOne({   
          where: { angkatan: profile.angkatan, status: true },
      });
          
      if (!activeThesisRegistration) {
          req.flash('tahunAkademikMati', 'Tidak dapat mengajukan judul 2. Tahun akademik nonaktif.');
          return res.redirect('/mahasiswa/pengajuan-judul');
      }
      const activeThesisRegistrationDate = await ThesisRegistration.findOne({   
        where: { angkatan: profile.angkatan, status: true },
      });
      if (activeThesisRegistrationDate && activeThesisRegistrationDate.tanggalAkhir <= new Date()) {
        req.flash('tahunAkademikMati1', 'Tidak dapat mengajukan judul 2. Jadwal sudah berakhir.');
        return res.redirect('/mahasiswa/pengajuan-judul');
      }

        const jakartaTime = DateTime.now().setZone('Asia/Jakarta');
        const formattedDateTime = jakartaTime.toFormat('yyyy-MM-dd HH:mm:ss');

        await TitleSubmission2.create({
            id,
            username,
            npm: profile.npm,
            nama: profile.nama,
            dosenPembimbing1,
            dosenPembimbing2,
            judul2,
            latarBelakang,
            metode,
            gambaran,
            referensiJurnal1,
            referensiJurnal2,
            referensiJurnal3,
            tanggalPengajuan: formattedDateTime,
            statusPengajuan,
            StudentUserId: id,
        });

        req.flash('addSuccess2', 'Judul 2 berhasil diajukan');
        res.redirect('/mahasiswa/pengajuan-judul');
    } catch (error) {
        res.status(500).json({
            status: 500,
            msg: error.message,
        });
    }
};

const editPengajuanJudul1 = async (req, res) => {
    try {
        const { id, username } = req.cookies;

        const {npm, nama, dosenPembimbing1, dosenPembimbing2, judul1, latarBelakang, metode, gambaran, referensiJurnal1, referensiJurnal2,referensiJurnal3, tanggalPengajuan, statusPengajuan} = req.body;

        const profile = await StudentUser.findOne({
            where: {
                id
            },
        });

        if (!profile) {
            return res.status(404).json({
                message: 'Profile mahasiswa tidak ditemukan'
            });
        }

      const existingSubmission = await TitleSubmission2.findOne({
      where: { npm: profile.npm},
      });

        if (!existingSubmission) {
            return res.status(404).json({
                message: 'Pengajuan judul 1 tidak ditemukan'
            });
        }

      const activeThesisRegistration = await ThesisRegistration.findOne({   
          where: { angkatan: profile.angkatan, status: true },
      });
          
      if (!activeThesisRegistration) {
          req.flash('tahunAkademikMati', 'Tidak dapat mengedit judul 1. Tahun akademik nonaktif.');
          return res.redirect('/mahasiswa/pengajuan-judul');
      }

      const activeThesisRegistrationDate = await ThesisRegistration.findOne({   
        where: { angkatan: profile.angkatan, status: true },
      });

      if (activeThesisRegistrationDate && activeThesisRegistrationDate.tanggalAkhir <= new Date()) {
        req.flash('tahunAkademikMati1', 'Tidak dapat mengedit judul 1. Jadwal sudah berakhir.');
        return res.redirect('/mahasiswa/pengajuan-judul');
      }

        await TitleSubmission.update({
            id,
            username,
            npm: profile.npm,
            nama: profile.nama,
            dosenPembimbing1,
            dosenPembimbing2,
            judul1,
            latarBelakang,
            metode,
            gambaran,
            referensiJurnal1,
            referensiJurnal2,
            referensiJurnal3,
            tanggalPengajuan,
            statusPengajuan,
        }, {
            where: {
                npm: profile.npm,
            },
        });

        req.flash('editSuccess1', 'Judul 1 berhasil diubah');
        res.redirect('/mahasiswa/pengajuan-judul');
    } catch (error) {
        res.status(500).json({
            status: 500,
            msg: error.message,
        });
    }
};

const editPengajuanJudul2 = async (req, res) => {
    try {
        const { id, username } = req.cookies;

        const {npm, nama, dosenPembimbing1, dosenPembimbing2,judul2, latarBelakang, metode, gambaran, referensiJurnal1, referensiJurnal2,referensiJurnal3, tanggalPengajuan, statusPengajuan} = req.body;

        const profile = await StudentUser.findOne({
            where: {
                id
            },
        });

        if (!profile) {
            return res.status(404).json({ message: 'Profile mahasiswa tidak ditemukan' });
        }

        const existingSubmission = await TitleSubmission2.findOne({
            where: { npm: profile.npm},
        });

        if (!existingSubmission) {
            return res.status(404).json({ message: 'Pengajuan judul 2 tidak ditemukan' });
        }

        const activeThesisRegistration = await ThesisRegistration.findOne({   
          where: { angkatan: profile.angkatan, status: true },
      });
          
      if (!activeThesisRegistration) {
          req.flash('tahunAkademikMati', 'Tidak dapat mengedit judul 2. Tahun akademik nonaktif.');
          return res.redirect('/mahasiswa/pengajuan-judul');
      }
      const activeThesisRegistrationDate = await ThesisRegistration.findOne({   
        where: { angkatan: profile.angkatan, status: true },
      });
      if (activeThesisRegistrationDate && activeThesisRegistrationDate.tanggalAkhir <= new Date()) {
        req.flash('tahunAkademikMati1', 'Tidak dapat mengedit judul 2. Jadwal sudah berakhir.');
        return res.redirect('/mahasiswa/pengajuan-judul');
      }

        await TitleSubmission2.update(
            {
                id,
                username,
                npm: profile.npm,
                nama: profile.nama,
                dosenPembimbing1,
                dosenPembimbing2,
                judul2,
                latarBelakang,
                metode,
                gambaran,
                referensiJurnal1,
                referensiJurnal2,
                referensiJurnal3,
                tanggalPengajuan,
                statusPengajuan,
            },
            {
                where: { npm: profile.npm},
            }
        );

        req.flash('editSuccess2', 'Judul 2 berhasil diubah');
        res.redirect('/mahasiswa/pengajuan-judul');
    } catch (error) {
        res.status(500).json({
            status: 500,
            msg: error.message,
        });
    }
};

const getProposalPage = async (req, res) => {
    try {
        const { id, username } = req.cookies;

        const profile = await StudentUser.findOne({
            where: { id },
        });

        const proposal = await Proposal.findOne({
            where: {
                npm: profile.npm,
            },
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
          where: { npm: profile.npm }
        });
        
        res.render('mahasiswa/proposal', {
            title: 'Proposal',
            id,
            username,
            profile,
            proposal,
            dataProposal,
            addSuccess: req.flash('addSuccess'),
            addSuccess2: req.flash('addSuccess2'),
            addSuccess3: req.flash('addSuccess3'),
            addSuccess4: req.flash('addSuccess4'),
            errorUploadProposal: req.flash('errorUploadProposal')
        });
    } catch (error) {
        res.status(500).json({
          status: 500,
          msg: error.message,
        });
    }      
};

const postProposalPage = async (req, res) => {
  try {
    const { id, username } = req.cookies;

    const { npm, nama, revisi, proposalRevisi, statusProposal, jadwalSeminarProposal,
    } = req.body;

    const profile = await StudentUser.findOne({
      where: { id },
    });

    if (!profile) {
      return res.status(404).json({ message: 'Profile mahasiswa tidak ditemukan' });
    }

    const existingDosen = await DevisionOfLecturer.findOne({
      where: { npm: profile.npm }
    });
    
    if (!existingDosen || !existingDosen.dosenPembimbing1 || !existingDosen.dosenPembimbing2 || !existingDosen.dosenPembahas) {
      req.flash('errorUploadProposal', 'Anda belum mengajukan dosen pembimbing dan pembahas');
      return res.redirect('/mahasiswa/proposal');
    }

    const { filename } = req.file;
    const jakartaTime = DateTime.now().setZone('Asia/Jakarta');
    const formattedDateTime = jakartaTime.toFormat('yyyy-MM-dd HH:mm:ss');

    await Proposal.create({
      id,
      username,
      npm: profile.npm,
      nama: profile.nama,
      dosenPembimbing1: profile.dosenPembimbing1,
      dosenPembimbing2: profile.dosenPembimbing2,
      dosenPembahas: profile.dosenPembahas,
      tanggalPengajuan: formattedDateTime,
      proposal: filename,
      revisi,
      proposalRevisi,
      statusProposal,
      jadwalSeminarProposal,
    });

    req.flash('addSuccess', 'Proposal berhasil diajukan');
    res.redirect('/mahasiswa/proposal');
  } catch (error) {
    res.status(500).json({
      status: 500,
      msg: error.message,
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

const updateProposal = async (req, res) => {
  try {
    const { id } = req.cookies;

    const existingProposal = await Proposal.findByPk(id);

    if (!existingProposal) {
      return res.status(404).json({ message: 'Proposal tidak ditemukan.' });
    }

    const { filename } = req.file;
    const jakartaTime = DateTime.now().setZone('Asia/Jakarta');
    const formattedDateTime = jakartaTime.toFormat('yyyy-MM-dd HH:mm:ss');

    await existingProposal.update({
      proposal: filename,
      tanggalPengajuan: formattedDateTime,
      
    });

    req.flash('addSuccess2', 'Proposal berhasil diajukan ulang');
    res.redirect('/mahasiswa/proposal');
  } catch (error) {
    console.error("Validator Error:", error.errors);
    res.status(500).json({
      status: 500,
      msg: "Validation error: " + error.message,
    });
  }
};

const editStatusJadwalProposal = async (req, res) => {
  try {
    const { id } = req.cookies;

    const existingProposal = await Proposal.findByPk(id);

    if (!existingProposal) {
      return res.status(404).json({ message: 'Proposal tidak ditemukan.' });
    }

    const { jadwalSeminarProposal } = req.body

    await existingProposal.update({
      jadwalSeminarProposal,
    });

    req.flash('addSuccess3', 'Jadwal seminar proposal berhasil diperbaharui');
    res.redirect('/mahasiswa/proposal');
  } catch (error) {
    console.error("Validator Error:", error.errors);
    res.status(500).json({
      status: 500,
      msg: "Validation error: " + error.message,
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
      return res.status(404).send('Proposal Revisi Dosen 1 tidak ditemukan.');
    }

    const proposalRevisiDosen1Path = path.join(__dirname, `./uploadProposalRevisiDosen1/${proposalRevisiDosen1.proposalRevisiDosen1}`);
    res.download(proposalRevisiDosen1Path);
  } catch (error) {
    res.status(500).json({
      status: 500,
      msg: error.message,
    });
  }
};

const postProposalRevisi1Page = async (req, res) => {
  try {
    const { id, username} = req.cookies;

    const { filename } = req.file;
    const jakartaTime = DateTime.now().setZone('Asia/Jakarta');
    const formattedDateTime = jakartaTime.toFormat('yyyy-MM-dd HH:mm:ss');
  
    await Proposal.update({
      id,
      username,
      proposalRevisi1: filename,
      tanggalRevisiMahasiswa1: formattedDateTime,
    },

    {
      where: { id }
    }
    );

    req.flash('addSuccess4', 'Revisi proposal bimbingan dengan pembimbing 1 berhasil dikirim');
    res.redirect('/mahasiswa/proposal');
  } catch (error) {
    res.status(500).json({
      status: 500,
      msg: error.message,
    });
  }
};

const downloadProposalRevisi = async (req, res) => {
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

const postProposalRevisi2Page = async (req, res) => {
  try {
    const { id, username} = req.cookies;

    const { filename } = req.file;
    const jakartaTime = DateTime.now().setZone('Asia/Jakarta');
    const formattedDateTime = jakartaTime.toFormat('yyyy-MM-dd HH:mm:ss');
  
    await Proposal.update({
      id,
      username,
      proposalRevisi2: filename,
      tanggalRevisiMahasiswa2: formattedDateTime,
    },

    {
      where: { id }
    }
    );

    req.flash('addSuccess4', 'Revisi proposal bimbingan dengan pembimbing 2 berhasil dikirim');
    res.redirect('/mahasiswa/proposal');
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

const getHasilSkripsiPage = async (req, res) => {
    try {
        const { id, username } = req.cookies;

        const profile = await StudentUser.findOne({
            where: { id },
        });

        const hasilSkripsi = await HasilSkripsi.findOne({
          where: {
              npm: profile.npm,
          },
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

        res.render('mahasiswa/hasil', {
            title: 'Hasil Skripsi',
            id,
            username,
            profile,
            hasilSkripsi,
            dataHasilSkripsi,
            addSuccess: req.flash('addSuccess'),
            addSuccess2: req.flash('addSuccess2'),
            addSuccess3: req.flash('addSuccess3'),
            addSuccess4: req.flash('addSuccess4'),
            errorUploadHasil: req.flash('errorUploadHasil')
            
        });
    } catch (error) {
        res.status(500).json({
          status: 500,
          msg: error.message,
        });
    }      
};

const postHasilPage = async (req, res) => {
    try {
      const { id, username} = req.cookies;

      const {npm, nama, dosenPembimbing1, dosenPembimbing2, dosenPembahas, revisi, revisiHasilSkripsi, statusHasilSkripsi, jadwalSeminarHasil,
      } = req.body;
      
      const profile = await StudentUser.findOne({
        where:  
        {id}
      });

      if (!profile) {
        return res.status(404).json({ message: 'Profile mahasiswa tidak ditemukan' });
      }

      const existingDosen = await DevisionOfLecturer.findOne({
        where: { npm: profile.npm }
      });
          
      if (!existingDosen || !existingDosen.dosenPembimbing1 || !existingDosen.dosenPembimbing2 || !existingDosen.
      dosenPembahas) {
        req.flash('errorUploadHasil', 'Anda belum mengajukan dosen pembimbing dan pembahas');
        return res.redirect('/mahasiswa/hasil-skripsi');
      }
  
      const { filename } = req.file;
      const jakartaTime = DateTime.now().setZone('Asia/Jakarta');
      const formattedDateTime = jakartaTime.toFormat('yyyy-MM-dd HH:mm:ss');
    
      await HasilSkripsi.create({
        id,
        username,
        npm: profile.npm,
        nama: profile.nama,
        dosenPembimbing1,
        dosenPembimbing2,
        dosenPembahas,
        tanggalPengajuan: formattedDateTime,
        hasilSkripsi: filename,
        revisi,
        revisiHasilSkripsi,
        statusHasilSkripsi,
        jadwalSeminarHasil,
        LecturerUserId: id, 
        LecturerUserId2: id
      });
  
      req.flash('addSuccess', 'Hasil skripsi berhasil diajukan');
      res.redirect('/mahasiswa/hasil-skripsi');
    } catch (error) {
      res.status(500).json({
        status: 500,
        msg: error.message,
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
      return res.status(404).send('Proposal tidak ditemukan.');
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

const updateHasil = async (req, res) => {
  try {
    const { id } = req.cookies;

    const existingHasil= await HasilSkripsi.findByPk(id);

    if (!existingHasil) {
      return res.status(404).json({ message: 'Bimbingan hasil tidak ditemukan.' });
    }

    const { filename } = req.file;
    const jakartaTime = DateTime.now().setZone('Asia/Jakarta');
    const formattedDateTime = jakartaTime.toFormat('yyyy-MM-dd HH:mm:ss');

    await existingHasil.update({
      hasilSkripsi: filename,
      tanggalPengajuan: formattedDateTime,
    });

    req.flash('addSuccess2', 'Bimbingan Hasil berhasil diajukan ulang');
    res.redirect('/mahasiswa/hasil-skripsi');
  } catch (error) {
    console.error("Validator Error:", error.errors);
    res.status(500).json({
      status: 500,
      msg: "Validation error: " + error.message,
    });
  }
};

const editStatusJadwalHasil = async (req, res) => {
  try {
    const { id } = req.cookies;

    const existingHasil = await HasilSkripsi.findByPk(id);

    if (!existingHasil) {
      return res.status(404).json({ message: 'Hasil skripsi tidak ditemukan.' });
    }

    const { jadwalSeminarHasil } = req.body

    await existingHasil.update({
      jadwalSeminarHasil,
    });

    req.flash('addSuccess3', 'Jadwal seminar hasil berhasil diperbaharui');
    res.redirect('/mahasiswa/hasil-skripsi');
  } catch (error) {
    console.error("Validator Error:", error.errors);
    res.status(500).json({
      status: 500,
      msg: "Validation error: " + error.message,
    });
  }
};

const postHasilSkripsiRevisi1Page = async (req, res) => {
  try {
    const { id, username} = req.cookies;

    const { filename } = req.file;
    const jakartaTime = DateTime.now().setZone('Asia/Jakarta');
    const formattedDateTime = jakartaTime.toFormat('yyyy-MM-dd HH:mm:ss');
  
    await HasilSkripsi.update({
      id,
      username,
      hasilSkripsiRevisi1: filename,
      tanggalRevisiMahasiswa1: formattedDateTime,
    },

    {
      where: { id }
    }
    );

    req.flash('addSuccess4', 'Revisi bimbingan hasil skripsi dengan pembimbing 1 berhasil dikirim');
    res.redirect('/mahasiswa/hasil-skripsi');
  } catch (error) {
    res.status(500).json({
      status: 500,
      msg: error.message,
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

const postHasilSkripsiRevisi2Page = async (req, res) => {
  try {
    const { id, username} = req.cookies;

    const { filename } = req.file;
    const jakartaTime = DateTime.now().setZone('Asia/Jakarta');
    const formattedDateTime = jakartaTime.toFormat('yyyy-MM-dd HH:mm:ss');
  
    await HasilSkripsi.update({
      id,
      username,
      hasilSkripsiRevisi2: filename,
      tanggalRevisiMahasiswa2: formattedDateTime,
    },

    {
      where: { id }
    }
    );

    req.flash('addSuccess4', 'Revisi bimbingan hasil skripsi dengan pembimbing 2 berhasil dikirim');
    res.redirect('/mahasiswa/hasil-skripsi');
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
      return res.status(404).send('Hasil skripsi tidak ditemukan.');
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

const downloadHasilRevisiDosen1 = async (req, res) => {
  try {
    const { id } = req.params;

    const hasilSkripsiRevisiDosen1 = await HasilSkripsi.findOne({
      where: { id },
    });

    if (!hasilSkripsiRevisiDosen1) {
      return res.status(404).send('Hasil skripsi tidak ditemukan.');
    }

    const hasilSkripsiRevisiDosen1Path = `./uploadHasilRevisiDosen1/${hasilSkripsiRevisiDosen1.
hasilSkripsiRevisiDosen1}`;
    res.download(hasilSkripsiRevisiDosen1Path);
  } catch (error) {
    res.status(500).json({
      status: 500,
      msg: error.message,
    });
  }
};

const downloadHasilRevisiDosen2 = async (req, res) => {
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

const getKomprehensifPage = async (req, res) => {
    try {
        const { id, username } = req.cookies;

        const profile = await StudentUser.findOne({
            where: { id },
        });

        const komprehensif = await Komprehensif.findOne({
            where: {
                npm: profile.npm,
            },
        });

        const dataKomprehensif = await Proposal.findAll({
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

        res.render('mahasiswa/komprehensif', {
            title: 'Komprehensif',
            id,
            username,
            profile,
            komprehensif,
            dataKomprehensif,
            addSuccess: req.flash('addSuccess'),
            addSuccess2: req.flash('addSuccess2'),
            addSuccess3: req.flash('addSuccess3'),
            addSuccess4: req.flash('addSuccess4'),
            errorUploadKomprehensif: req.flash('errorUploadKomprehensif')
        });
    } catch (error) {
        res.status(500).json({
          status: 500,
          msg: error.message,
        });
    }      
};

const postKomprehensifPage = async (req, res) => {
    try {
      const { id, username} = req.cookies;

      const {npm, nama, dosenPembimbing1, dosenPembimbing2, dosenPembahas, revisi, komprehensifRevisi, statusKomprehensif, jadwalUjianKomprehensif,
      } = req.body;
      
      const profile = await StudentUser.findOne({
        where:  
        {id}
      });

      if (!profile) {
        return res.status(404).json({ message: 'Profile mahasiswa tidak ditemukan' });
      }

      const existingDosen = await DevisionOfLecturer.findOne({
        where: { npm: profile.npm }
      });
          
      if (!existingDosen || !existingDosen.dosenPembimbing1 || !existingDosen.dosenPembimbing2 || !existingDosen.
      dosenPembahas) {
        req.flash('errorUploadKomprehensif', 'Anda belum mengajukan dosen pembimbing dan pembahas');
        return res.redirect('/mahasiswa/komprehensif');
      }
  
      const { filename } = req.file;
      const jakartaTime = DateTime.now().setZone('Asia/Jakarta');
      const formattedDateTime = jakartaTime.toFormat('yyyy-MM-dd HH:mm:ss');
    
      await Komprehensif.create({
        id,
        username,
        npm: profile.npm,
        nama: profile.nama,
        dosenPembimbing1,
        dosenPembimbing2,
        dosenPembahas,
        tanggalPengajuan: formattedDateTime,
        komprehensif: filename,
        revisi,
        komprehensifRevisi,
        statusKomprehensif,
        jadwalUjianKomprehensif
      });
  
      req.flash('addSuccess', 'Komprehensif berhasil diajukan');
      res.redirect('/mahasiswa/komprehensif');
    } catch (error) {
      res.status(500).json({
        status: 500,
        msg: error.message,
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
      return res.status(404).send('Komprehensif tidak ditemukan.');
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

const updateKomprehensif = async (req, res) => {
  try {
    const { id } = req.cookies;

    const existingKomprehensif = await Komprehensif.findByPk(id);

    if (!existingKomprehensif) {
      return res.status(404).json({ message: 'Bimbingan kompre tidak ditemukan.' });
    }

    const { filename } = req.file;
    const jakartaTime = DateTime.now().setZone('Asia/Jakarta');
    const formattedDateTime = jakartaTime.toFormat('yyyy-MM-dd HH:mm:ss');

    await existingKomprehensif.update({
      komprehensif: filename,
      tanggalPengajuan: formattedDateTime,
    });

    req.flash('addSuccess2', 'Bimbingan kompre berhasil diajukan ulang');
    res.redirect('/mahasiswa/komprehensif');
  } catch (error) {
    console.error("Validator Error:", error.errors);
    res.status(500).json({
      status: 500,
      msg: "Validation error: " + error.message,
    });
  }
};

const editStatusJadwalKomprehensif = async (req, res) => {
  try {
    const { id } = req.cookies;

    const existingKomprehensif = await Komprehensif.findByPk(id);

    if (!existingKomprehensif) {
      return res.status(404).json({ message: 'Komprehensif skripsi tidak ditemukan.' });
    }

    const { jadwalUjianKomprehensif } = req.body

    await existingKomprehensif.update({
      jadwalUjianKomprehensif ,
    });

    req.flash('addSuccess3', 'Jadwal ujian komprehensif berhasil diperbaharui');
    res.redirect('/mahasiswa/komprehensif');
  } catch (error) {
    console.error("Validator Error:", error.errors);
    res.status(500).json({
      status: 500,
      msg: "Validation error: " + error.message,
    });
  }
};

const postKomprehensifRevisi1Page = async (req, res) => {
  try {
    const { id, username} = req.cookies;

    const { filename } = req.file;
    const jakartaTime = DateTime.now().setZone('Asia/Jakarta');
    const formattedDateTime = jakartaTime.toFormat('yyyy-MM-dd HH:mm:ss');
  
    await Komprehensif.update({
      id,
      username,
      komprehensifRevisi1: filename,
      tanggalRevisiMahasiswa1Komprehensif: formattedDateTime,
    },

    {
      where: { id }
    }
    );

    req.flash('addSuccess4', 'Revisi bimbingan komprehensif dengan pembimbing 1 berhasil dikirim');
    res.redirect('/mahasiswa/komprehensif');
  } catch (error) {
    res.status(500).json({
      status: 500,
      msg: error.message,
    });
  }
};

const downloadKomprehensifRevisi = async (req, res) => {
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

const postKomprehensifRevisi2Page = async (req, res) => {
  try {
    const { id, username} = req.cookies;

    const { filename } = req.file;
    const jakartaTime = DateTime.now().setZone('Asia/Jakarta');
    const formattedDateTime = jakartaTime.toFormat('yyyy-MM-dd HH:mm:ss');
  
    await Komprehensif.update({
      id,
      username,
      komprehensifRevisi2: filename,
      tanggalRevisiMahasiswa2Komprehensif: formattedDateTime,
    },

    {
      where: { id }
    }
    );

    req.flash('addSuccess4', 'Revisi bimbingan komprehensif dengan pembimbing 2 berhasil dikirim');
    res.redirect('/mahasiswa/komprehensif');
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

const profile = async (req, res) => {
    try {
      const { id, username } = req.cookies;
  
      const profile = await StudentUser.findOne({
        where: { 
            id,
        },
      });
  
      if (!profile) {
        return res.status(404).json({ message: 'Profile mahasiswa tidak ditemukan' });
      }
  
      res.render('mahasiswa/profile', {
        title: 'Edit Profile Mahasiswa',
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

      const { npm, nama, gender, angkatan, foto } = req.body;
  
      const studentProfile = {
        npm,
        nama,
        gender,
        angkatan,
        foto,
      };
  
      await StudentUser.update(studentProfile, {
        where: {
          id,
        },
      });
  
      req.flash('editSuccess', 'Profile Mahasiswa berhasil DIUBAH!');
      return res.redirect(`/mahasiswa/${id}/profile?success=true`);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Terjadi kesalahan dalam mengedit data profile' });
    }
  };

const ubahPassword = async (req, res) => {
    try {
      const { id, username } = req.cookies;
  
      const profile = await StudentUser.findOne({
        where: {
          id,
        },
      });
  
      if (!profile) {
        return res.status(404).json({ message: 'Akun mahasiswa tidak ditemukan' });
      }
  
      return res.render('mahasiswa/ubahPassword', {
        title: 'Ubah Password Mahasiswa',
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

      const { username, email, password } = req.body;
  
      const userProfile = {
        username,
        email,
        password: encryptPass(password),
      };
  
      await StudentUser.update(userProfile, {
        where: {
          id,
        },
      });
  
      req.flash('editSuccess', 'Password mahasiswa berhasil DIUBAH!');
      return res.redirect(`/mahasiswa/${id}/ubah-password?success=true`);
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
    getRegisterPage,
    register,
    getLogin,
    login,
    getDashboardMahasiswa,
    getDaftarJudul,
    getJudulDiterima,
    getPengajuanJudul,
    postPengajuanJudul1,
    postPengajuanJudul2,
    editPengajuanJudul1,
    editPengajuanJudul2,
    pengajuanDosen,
    postPengajuanDosen,
    getProposalPage,
    postProposalPage,
    downloadProposal,
    updateProposal,
    editStatusJadwalProposal,
    downloadProposalRevisiDosen1,
    postProposalRevisi1Page,
    downloadProposalRevisi,
    postProposalRevisi2Page,
    downloadProposalRevisi2,
    getHasilSkripsiPage,
    postHasilPage,
    downloadHasil,
    updateHasil,
    editStatusJadwalHasil,
    postHasilSkripsiRevisi1Page,
    downloadHasilSkripsiRevisi1,
    postHasilSkripsiRevisi2Page,
    downloadHasilSkripsiRevisi2,
    downloadHasilRevisiDosen1,
    downloadHasilRevisiDosen2,
    getKomprehensifPage,
    postKomprehensifPage,
    downloadKomprehensif,
    updateKomprehensif,
    editStatusJadwalKomprehensif,
    postKomprehensifRevisi1Page,
    downloadKomprehensifRevisi,
    postKomprehensifRevisi2Page,
    downloadKomprehensifRevisi2,
    getPassword,
    forgotPassword,
    showResetPasswordForm,
    resetPassword,
    profile,
    profilePost,
    ubahPassword,
    passwordPost,
    logout
}