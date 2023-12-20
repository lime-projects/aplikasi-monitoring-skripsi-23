const getStatusColor = function (statusPersetujuan) {
  if (statusPersetujuan === 'Judul 1 Diterima') {
      return 'blue-text';
  } else if (statusPersetujuan === 'Judul 2 Diterima') {
      return 'green-text';
  } else if (statusPersetujuan === 'Judul Ditolak') {
      return 'red-text';
  } else {
      return '';
  }
};

const getStatusColor1 = function (statusPembimbing1) {
  if (statusPembimbing1 === 'Diterima') {
      return 'blue-text';
  } else if (statusPembimbing1 === 'Pending') {
      return 'green-text';
  } else if (statusPembimbing1 === 'Ditolak') {
      return 'red-text';
  } else {
      return '';
  }
};

const getStatusColor2 = function (statusPembimbing2) {
    if (statusPembimbing2 === 'Diterima') {
        return 'blue-text';
    } else if (statusPembimbing2 === 'Pending') {
        return 'green-text';
    } else if (statusPembimbing2 === 'Ditolak') {
        return 'red-text';
    } else {
        return '';
    }
  };

  const getStatusColor3 = function (statusPembahas) {
    if (statusPembahas === 'Diterima') {
        return 'blue-text';
    } else if (statusPembahas === 'Pending') {
        return 'green-text';
    } else if (statusPembahas === 'Ditolak') {
        return 'red-text';
    } else {
        return '';
    }
  };

  const getStatusColor4 = function (statusPermintaanBimbingan) {
    if (statusPermintaanBimbingan === 'Diterima') {
        return 'blue-text';
    } else if (statusPermintaanBimbingan === 'Pending') {
        return 'green-text';
    } else if (statusPermintaanBimbingan === 'Ditolak') {
        return 'red-text';
    } else {
        return '';
    }
  };

  const getStatusColor5 = function (statusProposal) {
    if (statusProposal === 'Disetujui') {
        return 'green-text';
    } else if (statusProposal === 'Selesai') {
        return 'blue-text';
    } else if (statusProposal === 'Diproses') {
        return 'orange-text';
    } else {
        return '';
    }
  };

  const getStatusColor6 = function (statusHasilSkripsi) {
    if (statusHasilSkripsi === 'Disetujui') {
        return 'green-text';
    } else if (statusHasilSkripsi === 'Selesai') {
        return 'blue-text';
    } else if (statusHasilSkripsi === 'Diproses') {
        return 'orange-text';
    } else {
        return '';
    }
  };

  const getStatusColor7 = function (statusKomprehensif) {
    if (statusKomprehensif === 'Disetujui') {
        return 'green-text';
    } else if (statusKomprehensif === 'Selesai') {
        return 'blue-text';
    } else if (statusKomprehensif === 'Diproses') {
        return 'orange-text';
    } else {
        return '';
    }
  };

module.exports = {
  getStatusColor, getStatusColor1, getStatusColor2, getStatusColor3, getStatusColor4, getStatusColor5, getStatusColor6, getStatusColor7
};
