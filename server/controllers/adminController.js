const User = require('../models/User');
const Project = require('../models/Project');
const Proposal = require('../models/Proposal');
const Milestone = require('../models/Milestone');
const Escrow = require('../models/Escrow');
const Review = require('../models/Review');

// ─────────────────────────────────────────────────────
// 1. Platform-wide stats (KPI cards)
// ─────────────────────────────────────────────────────
exports.getStats = async (req, res) => {
    try {
        const [
            totalUsers,
            clientCount,
            freelancerCount,
            projectStatusCounts,
            escrowStats,
            totalProposals,
            totalReviews,
            avgRatingResult,
            activeDisputes,
        ] = await Promise.all([
            User.countDocuments(),
            User.countDocuments({ role: 'client' }),
            User.countDocuments({ role: 'freelancer' }),
            Project.aggregate([
                { $group: { _id: '$status', count: { $sum: 1 } } }
            ]),
            Escrow.aggregate([
                {
                    $group: {
                        _id: '$status',
                        totalAmount: { $sum: '$amount' },
                        count: { $sum: 1 },
                    }
                }
            ]),
            Proposal.countDocuments(),
            Review.countDocuments(),
            Review.aggregate([{ $group: { _id: null, avg: { $avg: '$rating' } } }]),
            Escrow.countDocuments({ status: 'disputed' }),
        ]);

        // Shape project status map
        const projectsByStatus = {};
        projectStatusCounts.forEach(({ _id, count }) => { projectsByStatus[_id] = count; });

        // Shape escrow money map
        const escrowByStatus = {};
        escrowStats.forEach(({ _id, totalAmount, count }) => {
            escrowByStatus[_id] = { amount: totalAmount, count };
        });

        res.status(200).json({
            success: true,
            data: {
                users: { total: totalUsers, clients: clientCount, freelancers: freelancerCount },
                projects: {
                    total: Object.values(projectsByStatus).reduce((a, b) => a + b, 0),
                    byStatus: projectsByStatus,
                },
                escrow: {
                    funded: escrowByStatus.funded || { amount: 0, count: 0 },
                    released: escrowByStatus.released || { amount: 0, count: 0 },
                    disputed: escrowByStatus.disputed || { amount: 0, count: 0 },
                    refunded: escrowByStatus.refunded || { amount: 0, count: 0 },
                },
                proposals: { total: totalProposals },
                reviews: {
                    total: totalReviews,
                    avgRating: avgRatingResult[0]?.avg
                        ? Math.round(avgRatingResult[0].avg * 10) / 10
                        : 0,
                },
                activeDisputes,
            },
        });
    } catch (error) {
        console.error('Admin getStats error:', error);
        res.status(500).json({ message: 'Server error fetching stats', error: error.message });
    }
};

// ─────────────────────────────────────────────────────
// 2. All users
// ─────────────────────────────────────────────────────
exports.getAllUsers = async (req, res) => {
    try {
        const users = await User.find()
            .select('name email role profile.title ratingsAverage ratingsQuantity createdAt')
            .sort({ createdAt: -1 });
        res.status(200).json({ success: true, count: users.length, data: users });
    } catch (error) {
        res.status(500).json({ message: 'Server error fetching users', error: error.message });
    }
};

// ─────────────────────────────────────────────────────
// 3. All projects
// ─────────────────────────────────────────────────────
exports.getAllProjects = async (req, res) => {
    try {
        // Use lean() + manual populate to avoid schema pre-hook overhead
        const projects = await Project.find()
            .populate('clientId', 'name email')
            .populate('freelancerId', 'name email')
            .sort({ createdAt: -1 })
            .lean();
        res.status(200).json({ success: true, count: projects.length, data: projects });
    } catch (error) {
        res.status(500).json({ message: 'Server error fetching projects', error: error.message });
    }
};

// ─────────────────────────────────────────────────────
// 4. All escrow / payment records
// ─────────────────────────────────────────────────────
exports.getAllEscrows = async (req, res) => {
    try {
        const escrows = await Escrow.find()
            .populate('project', 'title budget')
            .populate('client', 'name email')
            .populate('freelancer', 'name email')
            .sort({ createdAt: -1 })
            .lean();
        res.status(200).json({ success: true, count: escrows.length, data: escrows });
    } catch (error) {
        res.status(500).json({ message: 'Server error fetching escrows', error: error.message });
    }
};

// ─────────────────────────────────────────────────────
// 5. All disputed escrows
// ─────────────────────────────────────────────────────
exports.getAllDisputes = async (req, res) => {
    try {
        const disputes = await Escrow.find({ status: 'disputed' })
            .populate('project', 'title budget status')
            .populate('client', 'name email')
            .populate('freelancer', 'name email')
            .sort({ createdAt: -1 })
            .lean();
        res.status(200).json({ success: true, count: disputes.length, data: disputes });
    } catch (error) {
        res.status(500).json({ message: 'Server error fetching disputes', error: error.message });
    }
};

// ─────────────────────────────────────────────────────
// 6. Admin resolves a dispute
// ─────────────────────────────────────────────────────
exports.resolveDispute = async (req, res) => {
    try {
        const { resolution } = req.body; // 'released' | 'refunded'

        if (!['released', 'refunded'].includes(resolution)) {
            return res.status(400).json({ message: "Resolution must be 'released' or 'refunded'" });
        }

        const escrow = await Escrow.findById(req.params.id);
        if (!escrow) return res.status(404).json({ message: 'Escrow record not found' });
        if (escrow.status !== 'disputed') {
            return res.status(400).json({ message: 'This escrow is not in a disputed state' });
        }

        escrow.status = resolution;
        await escrow.save();

        // Also update the linked project and milestone status
        const project = await Project.findByIdAndUpdate(
            escrow.project,
            { status: resolution === 'released' ? 'completed' : 'cancelled' },
            { new: true }
        );

        await Milestone.findOneAndUpdate(
            { projectId: escrow.project, status: 'disputed' },
            { status: resolution === 'released' ? 'approved' : 'pending' }
        );

        res.status(200).json({
            success: true,
            message: `Dispute resolved: funds ${resolution}`,
            data: { escrow, project },
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error resolving dispute', error: error.message });
    }
};

// ─────────────────────────────────────────────────────
// 7. All reviews
// ─────────────────────────────────────────────────────
exports.getAllReviews = async (req, res) => {
    try {
        const reviews = await Review.find()
            .populate('reviewer', 'name role')
            .populate('reviewee', 'name role')
            .populate('project', 'title')
            .sort({ createdAt: -1 })
            .lean();
        res.status(200).json({ success: true, count: reviews.length, data: reviews });
    } catch (error) {
        res.status(500).json({ message: 'Server error fetching reviews', error: error.message });
    }
};

// ─────────────────────────────────────────────────────
// 8. Recent activity feed (last 30 events across platform)
// ─────────────────────────────────────────────────────
exports.getRecentActivity = async (req, res) => {
    try {
        const [recentProjects, recentEscrows, recentUsers, recentReviews] = await Promise.all([
            Project.find()
                .select('title status createdAt clientId')
                .populate('clientId', 'name')
                .sort({ createdAt: -1 })
                .limit(10)
                .lean(),
            Escrow.find()
                .select('status amount createdAt project client')
                .populate('project', 'title')
                .populate('client', 'name')
                .sort({ createdAt: -1 })
                .limit(10)
                .lean(),
            User.find()
                .select('name role createdAt')
                .sort({ createdAt: -1 })
                .limit(10)
                .lean(),
            Review.find()
                .select('rating createdAt reviewer reviewee')
                .populate('reviewer', 'name')
                .populate('reviewee', 'name')
                .sort({ createdAt: -1 })
                .limit(10)
                .lean(),
        ]);

        const events = [
            ...recentProjects.map(p => ({
                type: 'project',
                icon: '📁',
                label: `Project "${p.title}" created`,
                detail: `by ${p.clientId?.name || 'Client'}`,
                status: p.status,
                timestamp: p.createdAt,
            })),
            ...recentEscrows.map(e => ({
                type: 'payment',
                icon: e.status === 'disputed' ? '⚠️' : e.status === 'released' ? '✅' : '💳',
                label: `Escrow ${e.status} — ₹${e.amount}`,
                detail: `for "${e.project?.title || 'Project'}"`,
                status: e.status,
                timestamp: e.createdAt,
            })),
            ...recentUsers.map(u => ({
                type: 'user',
                icon: '👤',
                label: `New ${u.role} registered`,
                detail: u.name,
                status: u.role,
                timestamp: u.createdAt,
            })),
            ...recentReviews.map(r => ({
                type: 'review',
                icon: '⭐',
                label: `${r.reviewer?.name || 'User'} reviewed ${r.reviewee?.name || 'User'}`,
                detail: `Rating: ${r.rating}/5`,
                status: 'review',
                timestamp: r.createdAt,
            })),
        ];

        // Sort all events by timestamp desc and take latest 30
        events.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

        res.status(200).json({ success: true, data: events.slice(0, 30) });
    } catch (error) {
        res.status(500).json({ message: 'Server error fetching activity', error: error.message });
    }
};
