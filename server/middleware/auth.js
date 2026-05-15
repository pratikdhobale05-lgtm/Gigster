const jwt = require('jsonwebtoken');
const User = require('../models/User');

// --- 1. PROTECT ROUTES (Verify JWT) ---
// This middleware ensures the user is logged in before accessing a route
exports.protect = async (req, res, next) => {
    try {
        // 1. Get token from the 'Authorization' header
        let token;
        if (
            req.headers.authorization &&
            req.headers.authorization.startsWith('Bearer')
        ) {
            token = req.headers.authorization.split(' ')[1]; // Extract token after "Bearer "
        }

        if (!token) {
            return res.status(401).json({
                status: 'fail',
                message: 'You are not logged in! Please provide a token to get access.',
            });
        }

        // 2. Verify token (Catches expired or manipulated tokens)
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // 3. Check if user still exists in the database
        // (In case they were deleted but their token hasn't expired yet)
        const currentUser = await User.findById(decoded.id);
        if (!currentUser) {
            return res.status(401).json({
                status: 'fail',
                message: 'The user belonging to this token no longer exists.',
            });
        }

        // 4. Grant Access: Attach the user document to the request object
        // This allows the next controllers to know exactly who is making the request
        req.user = currentUser;
        next();
    } catch (err) {
        return res.status(401).json({
            status: 'fail',
            message: 'Invalid token or token has expired. Please log in again.',
        });
    }
};

// --- 2. ROLE-BASED ACCESS CONTROL (RBAC) ---
// This middleware restricts routes to specific user roles (e.g., only 'client')
exports.restrictTo = (...roles) => {
    return (req, res, next) => {
        // req.user is guaranteed to exist here because we run `protect` first
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                status: 'fail',
                message: 'You do not have permission to perform this action.',
            });
        }
        next();
    };
};