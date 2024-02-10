const express = require('express');
const authToken = require('./middleware/jwt-auth');
const {
    registerNewUser, authenticateUser, getUserByUsername, 
    updateUserByUsername, getHistoryByUsername, addHistoryByUsername,
    getHistoryByDate
} = require('./middleware/user-model');

const { dataProcess } = require('./ml_models/script-handler');
const { connectToDatabase } = require('./middleware/mongo-conn-handler');
const DB_URI = "mongodb://localhost:27017/healthybeat";
const path = require('path');

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use((req, res, next) => {
    if (req.is('text/plain')) {
        let data = '';
        req.setEncoding('utf8');
        req.on('data', (chunk) => {
            data += chunk;
        });
        req.on('end', () => {
            req.body = data;
            next();
        });
    } else {
        next();
    }
});

app.get("/api/healthybeat", (req, res) => {
    res.send("Welcome, this is webserver for HealthyBeat API.")
});

// register route
app.post("/api/healthybeat/user/register", async (req, res) => {
    if (Object.keys(req.body).length === 0) {
        res.status(400).json({ message: "Body can not be empty." });
        console.log('Request has no body.');
    }

    await connectToDatabase(DB_URI);
    const result = await registerNewUser(req.body);
    if (result.success) {
        console.log(result.message);
        res.status(result.code).json(result);
    } else {
        console.log(result.error);
        res.status(result.code).json(result);
    }
});

// login route
app.post("/api/healthybeat/user/login", async (req, res) => {
    if (Object.keys(req.body).length === 0) {
        res.status(400).json({ success:false, message: "Body can not be empty." });
    }
    await connectToDatabase(DB_URI);
    const result = await authenticateUser(req.body);
    if (result.success) {
        console.log(result.message);

        const token = authToken.generateToken({ username: result.existUser.username });

        res.status(result.code).json({ success: true, message:`${result.message}`, token:`${token}` });
    } else {
        console.log(result.error);
        res.status(result.code).json(result);
    }
});

// get user data
app.get("/api/healthybeat/user/:username", async (req, res) =>{
    const username = req.params.username;
    if (!username) {
        res.status(400).json({ success: false, message: "Username is required." });
        return;
    }

    await connectToDatabase(DB_URI);
    const result = await getUserByUsername(username);

    if (result) {
        res.status(result.code).json(result);
    } else {
        res.status(404).json({ success: false, message: "User not found." });
    }
});

// update user data
app.put("/api/healthybeat/user/:username", async (req, res) =>{
    const username = req.params.username;
    const userData = req.body;

    if (!username) {
        res.status(400).json({ success: false, message: "Username is required." });
    }

    if (Object.keys(req.body).length === 0) {
        res.status(400).json({ success: false, message: "Body is required." });
    }

    await connectToDatabase(DB_URI);
    const result = await updateUserByUsername(username, userData);

    if (result.success) {
        res.status(result.code).json(result);
    } else {
        res.status(result.code).json(result);
    }
});

// get user history
app.get("/api/healthybeat/history/:username", async (req, res) => {
    const username = req.params.username;

    if (!username) {
        res.status(400).json({ success: false, message: "Username is required" });
        return;
    }

    await connectToDatabase(DB_URI);
    const historyResult = await getHistoryByUsername(username);

    if (Object.keys(historyResult).length === 0) {
        res.status(404).json({ success: false, message: "Have no history to show" });
    } else {
        res.status(200).json(historyResult);
    }
});

// update/new user history
app.post("/api/healthybeat/history/:username", async (req, res) => {
    const username = req.params.username;
    const rawData = req.body;
    console.log(req.headers);

    if (!username || !rawData || (rawData.length === 0)) {
        res.status(400).json({ success: false, message: "Username and raw data is required" });
        return;
    }

    const processResult = await dataProcess(username, rawData);
    console.log(processResult);

    let modifiedUsername = "";
    const regex = /([^_]+)_(\d{2}-\d{2}-\d{4})_(\d{2}-\d{2})/;
    const match = username.match(regex);
    if (match) {
        modifiedUsername = match[1];
    } else {
        console.log("Format string tidak sesuai");
        res.status(400).json({ success: false, message: "Username format is not correct" });
    }
    
    if ((processResult===null) || (processResult===undefined) || (Object.keys(processResult).length===0)) {
        res.status(500).json({ success: false, message: "Internal server error" });
    } else if (processResult.result === "Hasil deteksi dini dinyatakan SAKIT") {
        console.log("Data sakit");
        // Another ToDo
    } else {
        await connectToDatabase(DB_URI);
        const result = await addHistoryByUsername(modifiedUsername, processResult);
    
        if (result.success) {
            res.status(result.code).json(result);
        } else {
            res.status(result.code).json(result);
        }
        console.log("berhasil");
    }
});

// get spesific user history by date and time
app.get("/api/healthybeat/history/:username/:date/:time", async (req, res) => {
    const username = req.params.username;
    const date = req.params.date;
    const time = req.params.time;

    if (!username || !date || !time) {
        res.status(400).json({ success: false, message: "Username and date data is required" });
        return;
    }

    await connectToDatabase(DB_URI);
    const result = await getHistoryByDate(username, date, time);

    if (result.success) {
        res.status(result.code).json(result);
    } else {
        res.status(result.code).json(result);
    }
});

// get ekg image/pdf report from history
app.get("/api/healthybeat/download/:filename", async(req, res) =>{
    const fileName = req.params.filename;
    const filePaths = path.join(__dirname, '/reports/', fileName);

    if (!filePaths) {
        res.status(400).json({ success: false, message: "File is not found or not exists" })
    } else {
        res.sendFile(filePaths);
    }
});

// request listener
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
