const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, 'Please provide your name'],
            trim: true,
        },
        email: {
            type: String,
            required: [true, 'Please provide your email'],
            unique: true,
            lowercase: true,
        },
        password: {
            type: String,
            required: [true, 'Please provide a password'],
            minlength: 8,
            select: false, // Prevents password from being returned in standard queries
        },
        role: {
            type: String,
            enum: ['client', 'freelancer', 'admin'],
            default: 'client', // Defaults to client if not specified
            required: true,
        },
        // Niche-specific profile data (more relevant for freelancers)
        profile: {
            title: String, // e.g., "Senior AI Prompt Engineer"
            bio: String,
            skills: [String],
            avatarUrl: String, // Will map to Cloudinary later
        },
        // Financial and Escrow references
        stripeAccountId: {
            type: String, // Needed for freelancers to receive payouts
            select: false,
        },
        // Aggregated rating from completed projects
        ratingsAverage: {
            type: Number,
            default: 0,
            min: [0, 'Rating must be above 0'],
            max: [5, 'Rating must be below 5.0'],
        },
        ratingsQuantity: {
            type: Number,
            default: 0,
        },
    },
    { timestamps: true } // Automatically adds createdAt and updatedAt fields
);

// --- MIDDLEWARE: Hash password before saving to the database ---
userSchema.pre('save', async function (next) {
    // Only run this function if password was actually modified
    if (!this.isModified('password')) return next();

    // Hash the password with cost of 12
    this.password = await bcrypt.hash(this.password, 12);
    next();
});

// --- INSTANCE METHOD: Verify password during login ---
userSchema.methods.correctPassword = async function (
    candidatePassword,
    userPassword
) {
    return await bcrypt.compare(candidatePassword, userPassword);
};

const User = mongoose.model('User', userSchema);
module.exports = User;