const { User } = require('./user-schema');
const bcrypt = require('bcryptjs');

// new user register logic
async function registerNewUser(userData) {
    const user = new User(userData);
    try {
        await user.save();
        return { success: true, data: user, message: 'User saved successfully.', code:201 };
    } catch (error) {
        return { success: false, message: 'Failed to save user.', error, code:500 };
    }
}
// ----------------------------------------------------------------------

// authentication logic
async function authenticateUser(userData) {
    try {
        // memastikan username terdaftar
        const existUser = await User.findOne({ username: userData.username });
        if (!existUser) {
            const error = new Error('User not found');
            return { success: false, message: 'User not found.', error, code:401 };
        }
        // memastikan password sesuai
        const isMatch = await bcrypt.compare(userData.password, existUser.password);
        if (isMatch) {
            return { existUser, success: true, message: 'Login success', code:200 };
        } else {
            const error = new Error('Password is wrong');
            return { success: false, message: 'Password is wrong', error, code:401 };
        }
    } catch (error) {
        return { success: false, message: 'Server error', error, code:500};
    }
}
// ----------------------------------------------------------------------

// get user logic
async function getUserByUsername(username) {
    try {
        const user = await User.findOne({ username: username });
        if (!user) {
            return { success: false, message: "User not found", code:400 };
        }

        return { success: true, data: user, code:200 };

    } catch (error) {
        return { success: false, message: "Server error" };
    }
}
// ----------------------------------------------------------------------

// update user logic
async function updateUserByUsername(username, userData) {
    try {
        const user = await User.findOne({ username: username });
        if (!user) {
            return { success: false, message: "User not found", code:400 };
        }

        const updatedUser = await User.findOneAndUpdate({ username: username}, { $set: userData });

        if (updatedUser) {
            return { success: true, code: 204 };
        } else {
            return { success: false, message: "Failed to update user", code:400 }
        }

    } catch (error) {
        return { success: false, message: "Server error", code:500 }
    }
}
// ----------------------------------------------------------------------

// get user history logic
async function getHistoryByUsername(username) {
    try {
        const user = await User.findOne({ username: username });
        if (!user) {
            return { success: false, message: "User not found", code:400 };
        }

        return { success: true, data: user.history, code:200 };

    } catch (error) {
        return { success: false, message: "Server error" };
    }
}
// ----------------------------------------------------------------------

// new history entry
// async function entryHistory(userData) {
//     try {
//         const user = await User.findOne({ username: userData.username });

//         if (!user) {
//             return { success: false, message: 'User not found.', error, code:401 };
//         };

//         const newHistoryEntry = {
//             date: userData.date,
//             result: userData.result,
//             image: userData.image
//         };

//         user.history.push(newHistoryEntry);
//         await user.save();

//     } catch (error) {
//         return { success: false, message: 'Server error', error, code:500};
//     }
// }
// ----------------------------------------------------------------------

module.exports = {
    registerNewUser,
    authenticateUser,
    getUserByUsername,
    updateUserByUsername,
    getHistoryByUsername
};