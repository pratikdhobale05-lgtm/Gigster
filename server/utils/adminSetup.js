const User = require('../models/User');

const ensureAdminAccount = async () => {
    const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
    const password = process.env.ADMIN_PASSWORD;

    if (!email || !password) {
        throw new Error('ADMIN_EMAIL and ADMIN_PASSWORD must be configured');
    }
    if (password.length < 8) {
        throw new Error('ADMIN_PASSWORD must be at least 8 characters long');
    }

    let admin = await User.findOne({ email }).select('+password');
    if (!admin) {
        admin = await User.create({
            name: 'Administrator',
            email,
            password,
            role: 'admin',
        });
    } else {
        admin.role = 'admin';
        if (!(await admin.correctPassword(password, admin.password))) {
            admin.password = password;
        }
        await admin.save();
    }

    await User.updateMany(
        { role: 'admin', email: { $ne: email } },
        { $set: { role: 'client' } }
    );

    console.log(`Admin account configured for ${email}`);
};

module.exports = ensureAdminAccount;
