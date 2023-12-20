const upload = multer({
  storage: storage,
  limits: {
    fileSize: 1024 * 1024 * 10
  },
  fileFilter: function (req, file, cb) {
    cb(null, true);
  }
});

