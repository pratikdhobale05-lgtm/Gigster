const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Helper function to generate JWTs
const signToken = (id, role) => {
    return jwt.sign({ id, role }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN,
    });
};

// --- REGISTER A NEW USER ---
exports.register = async (req, res) => {
    try {
        const newUser = await User.create({
            name: req.body.name,
            email: req.body.email,
            password: req.body.password,
            role: req.body.role, // 'client' or 'freelancer'
        });

        // Remove password from the response output for security
        newUser.password = undefined;

        // Generate token
        const token = signToken(newUser._id, newUser.role);

        res.status(201).json({
            status: 'success',
            token,
            data: { user: newUser }
        });
    } catch (err) {
        res.status(400).json({
            status: 'fail',
            message: err.message
        });
    }
};

// --- LOG IN AN EXISTING USER ---
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // 1. Check if email and password were provided in the request
        if (!email || !password) {
            return res.status(400).json({
                status: 'fail',
                message: 'Please provide email and password'
            });
        }

        // 2. Find the user and explicitly select the password field 
        // (since we set select: false in the schema)
        const user = await User.findOne({ email }).select('+password');

        // 3. Check if user exists and if the password matches the hash
        if (!user || !(await user.correctPassword(password, user.password))) {
            return res.status(401).json({
                status: 'fail',
                message: 'Incorrect email or password'
            });
        }

        // 4. If everything is correct, send the token to the client
        const token = signToken(user._id, user.role);

        // Hide password again before sending the response
        user.password = undefined;

        res.status(200).json({
            status: 'success',
            token,
            data: { user }
        });
    } catch (err) {
        res.status(400).json({
            status: 'fail',
            message: err.message
        });
    }
};