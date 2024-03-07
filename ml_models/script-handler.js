const { spawn } = require('child_process');
const { error } = require('console');
const fs = require('fs');

async function dataProcess(username, rawData) {
    return new Promise((resolve, reject) => {
        try {
            let tanggal = "";
            let waktu = "";
    
            const regex = /([^_]+)_(\d{2}-\d{2}-\d{4})_(\d{2}-\d{2})/;
            const match = username.match(regex);
            if (match) {
                tanggal = match[2];
                waktu = match[3];
            } else {
                console.log("Format string tidak sesuai");
                throw error;
            }
    
            const filteredData = rawData.replace(/[^\d\n]+/g, '\n');
            fs.writeFile('uploads/new-data.dat', filteredData, (err) => {
                if (err) {
                  console.error(err);
                  throw error;
                }
                console.log('Data berhasil disimpan ke new-data.dat');
            });
    
            let dataFromPythonProcess = '';
            let errorFromPythonProcess = '';
    
            const python = spawn('python', ['./ml_models/final-script.py', `${username}`]);
    
            python.stdout.on('data', function (data) {
                console.log('Pipe data from python script');
                dataFromPythonProcess += data.toString();
            });
              
              python.stderr.on('data', function (data) {
                console.error('Error from python script');
                errorFromPythonProcess += data.toString();
            });
              
            python.on('close', (code) => {
                console.log(`child process close all stdio with code ${code}`);
                    
                if (code === 0) {
                    resolve ({
                        "date": tanggal,
                        "time": waktu,
                        "result": dataFromPythonProcess.replace(/\r?\n|\r/g, '').trim(), 
                        "image": `http://www.saibotsworks.my.id/api/healthybeat/reports/${username}.jpeg`,
                        "pdf": `http://www.saibotsworks.my.id/api/healthybeat/reports/${username}.pdf`
                    });
                    console.log(dataFromPythonProcess);
                } else {
                    console.error(`Error in Python script execution, exit code: ${code}`);
                    console.error(`Python script error output: ${errorFromPythonProcess}`);
                    throw error;
                }
            });
              
            python.on('error', (err) => {
                console.error('Failed to start child process:', err);
                throw error;
            });
    
        } catch (error) {
            reject(error);
        }
    });
}

module.exports = { dataProcess }; 