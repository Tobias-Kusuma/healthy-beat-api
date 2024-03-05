require('dotenv').config();
const nodemailer = require("nodemailer");
const { google } = require("googleapis");
const OAuth2 = google.auth.OAuth2;

function getEmailContent(fullname, telpnum, date) {
    const template = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>HealthyBeat - Medical Report/Rekam Medis</title>
            <style>
                body {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    width: 21cm;
                    height: 29,7cm;
                    padding: 3cm 2,54cm;
                    font-family: 'Times New Roman', Times, serif;
                }
                .report_container {
                    align-items: center;
                    justify-content: center;
                }
                h1 {
                    text-align: center;
                    font-size: 20pt;
                }
                .report_table {
                    align-self: center;
                    font-size: 12pt;
                    width: 70%;
                }
                img {
                    align-content: center;
                    max-width: 14cm;
                    max-height: 10cm;
                }
                p {
                    font-size: 10pt;
                }
            </style>
        </head>
        <body>
            <div class="report_container">
                <h1>HealthyBeat - Medical Report/Rekam Medis</h1>
                <br>
        
                <table class="report_table">
                    <tr>
                        <td>1.</td>
                        <td>Nama Lengkap</td>
                        <td>:</td>
                        <td>{{fullname}}</td>
                    </tr>
                    <tr><td></td><td></td><td></td><td></td></tr>
                    <tr>
                        <td>2.</td>
                        <td>No. Telepon</td>
                        <td>:</td>
                        <td>{{telpnum}}</td>
                    </tr>
                    <tr><td></td><td></td><td></td><td></td></tr>
                    <tr>
                        <td>3.</td>
                        <td>Waktu Pemeriksaan</td>
                        <td>:</td>
                        <td>{{date}}</td>
                    </tr>
                    <tr><td></td><td></td><td></td><td></td></tr>
                    <tr>
                        <td>4.</td>
                        <td>Hasil Diagnosa Awal*</td>
                        <td>:</td>
                        <td>Jantung memiliki kondisi ARITMIA</td>
                    </tr>
                </table>        
                <br>
                <br>
                <p><i>*Diagnosa awal didapatkan melalui sistem deteksi dini HealthyBeat yang menggunakan machine learning (model SVM) dalam proses klasifikasinya. Diagnosa ini hanya menjadi rujukan untuk pasien melakukan cek medis lebih lanjut di Rumah Sakit.</i></p>
                
            </div>
        </body>
        </html>
    `;

    const emailContentWithValues = 
        template.replace(/{{fullname}}/g, fullname)
        .replace(/{{telpnum}}/g, telpnum)
        .replace(/{{date}}/g, date);
  
    return emailContentWithValues;
};

const createTransporter = async () => {
    const oauth2Client = new OAuth2(
        process.env.CLIENT_ID,
        process.env.CLIENT_SECRET,
        "https://developers.google.com/oauthplayground"
    );
  
    oauth2Client.setCredentials({
        refresh_token: process.env.REFRESH_TOKEN
    });
  
    const accessToken = await new Promise((resolve, reject) => {
        oauth2Client.getAccessToken((err, token) => {
            if (err) {
            reject();
            }
            resolve(token);
        });
    });
  
    const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
            type: "OAuth2",
            user: process.env.EMAIL,
            accessToken,
            clientId: process.env.CLIENT_ID,
            clientSecret: process.env.CLIENT_SECRET,
            refreshToken: process.env.REFRESH_TOKEN
        }
    });
  
    return transporter;
};

const sendEmail = async (emailOptions) => {
    let emailTransporter = await createTransporter();
    await emailTransporter.sendMail(emailOptions);
};

module.exports = {
    getEmailContent,
    createTransporter,
    sendEmail
};