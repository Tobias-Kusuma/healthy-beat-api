const AdmZip = require('adm-zip');
const fs = require('fs');

function makeZip(outputFolder, fileFormat) {
    const zip = new AdmZip();

    // Mendapatkan daftar file dalam folder outputFolder
    const files = fs.readdirSync(outputFolder);

    // Seleksi file dengan format nama yang sama
    const filesWithSameName = files.filter(file => {
        const fileNameWithoutExtension = file.split('.').slice(0, -1).join('.');
        return fileNameWithoutExtension.startsWith(fileFormat);
    });

    // Menambahkan file-file dengan format nama yang sama ke dalam ZIP
    filesWithSameName.forEach(file => {
        const filePath = `${outputFolder}/${file}`;
        zip.addLocalFile(filePath, file);
    });

    // Simpan file ZIP
    const zipFilePath = `./${fileFormat}.zip`;
    zip.writeZip(zipFilePath);

    console.log('File ZIP berhasil dibuat: ' + zipFilePath);
    return zipFilePath;
};

module.exports = {
    makeZip
};

// Contoh penggunaan
// makeZip('uploads', 'tobias_12-12', 'tobias_12-12_2012_08-12');
