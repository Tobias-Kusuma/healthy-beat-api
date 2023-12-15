const express = require('express');
const authToken = require('./middleware/jwt-auth');
const {
    registerNewUser, authenticateUser, getUserByUsername,
    updateUserByUsername, getHistoryByUsername
} = require('./middleware/user-model');
const { connectToDatabase } = require('./middleware/mongo-conn-handler');
const DB_URI = "mongodb://localhost:27017/healthybeat";
const multer = require('multer');
const { spawn } = require('child_process');

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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
    const token = req.headers.authorization;
    if (!token) {
        return res.status(403).json({ success: false, message: "Unauthorized" });
    }
    // Verifikasi token
    const decoded = authToken.verifyToken(token);
    if (decoded) {
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
    } else {
        res.status(403).json({ success: false, message: "Unauthorized, token expired" });
    }
    
});

// update user data
app.put("/api/healthybeat/user/:username", async (req, res) =>{
    const token = req.headers.authorization;

    if (!token) {
        return res.status(403).json({ success: false, message: "Unauthorized" });
    }
    // Verifikasi token
    const decoded = authToken.verifyToken(token);

    if (decoded) {
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

    } else {
        res.status(403).json({ success: false, message: "Unauthorized, token expired" });
    }
    
});

// get user history
app.get("/api/healthybeat/history/:username", async (req, res) => {
    const token = req.headers.authorization;
    if (!token) {
        return res.status(403).json({ message: "Unauthorized" });
    }
    // Verifikasi token
    const decoded = authToken.verifyToken(token);
    if (decoded) {
        const username = req.params.username;

        if (!username) {
            res.status(400).json({ success: false, message: "Username is required" });
        }

        await connectToDatabase(DB_URI);
        const historyResult = getHistoryByUsername(username);

        if (Object.keys(historyResult).length === 0) {
            res.status(404).json({ success: false, message: "Have no history to show" });
        } else {
            res.status(200).json(historyResult);
        }

    } else {
        res.status(403).json({ message: "Unauthorized, token expired" });
    }
});

// request listener
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
