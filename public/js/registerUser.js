const selectRole = document.querySelector("select")

selectRole.addEventListener('change', function () {
    document.querySelectorAll("option[selected]").forEach(function (option) {
        if (option.value === "Dosen") {
            console.log("Dosen");
        }
        
        if (option.value === "Mahasiswa") {
            console.log("Mahasiswa");
        }
    })
})