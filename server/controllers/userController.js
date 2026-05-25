const User = require('../models/User');

// --- GET CURRENT LOGGED-IN USER ---
exports.getMe = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        if (!user) {
            return res.status(404).json({ status: 'fail', message: 'User not found' });
        }
        res.status(200).json({
            status: 'success',
            data: { user }
        });
    } catch (err) {
        res.status(400).json({ status: 'fail', message: err.message });
    }
};

// --- GET PUBLIC PROFILE ---
exports.getProfile = async (req, res) => {
    try {
        const user = await User.findById(req.params.id).select('name profile ratingsAverage ratingsQuantity role createdAt');
        if (!user) {
            return res.status(404).json({ status: 'fail', message: 'User not found' });
        }
        res.status(200).json({
            status: 'success',
            data: { user }
        });
    } catch (err) {
        res.status(400).json({ status: 'fail', message: err.message });
    }
};

// --- UPDATE MY PROFILE ---
exports.updateProfile = async (req, res) => {
    try {
        const allowedFields = ['name', 'profile'];
        const updates = {};
        
        Object.keys(req.body).forEach(key => {
            if (allowedFields.includes(key)) {
                updates[key] = req.body[key];
            }
        });

        const user = await User.findByIdAndUpdate(req.user._id, updates, {
            new: true,
            runValidators: true
        });

        res.status(200).json({
            status: 'success',
            data: { user }
        });
    } catch (err) {
        res.status(400).json({ status: 'fail', message: err.message });
    }
};
