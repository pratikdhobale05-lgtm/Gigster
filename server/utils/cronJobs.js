const Milestone = require('../models/Milestone');
const Escrow = require('../models/Escrow');
const Project = require('../models/Project');

// --- AUTO-APPROVAL CRON JOB ---
// Checks every hour for milestones past their 14-day auto-approval deadline
// If the client hasn't responded, auto-approves and releases funds
const runAutoApproval = async () => {
    try {
        const now = new Date();

        // Find all submitted milestones past their deadline
        const overdueMs = await Milestone.find({
            status: 'submitted',
            autoApprovalDeadline: { $lte: now }
        });

        for (const milestone of overdueMs) {
            // Auto-approve the milestone
            milestone.status = 'approved';
            await milestone.save();

            // Release the escrow tied to this specific milestone
            const escrow = await Escrow.findOne({
                milestoneId: milestone._id,
                status: 'funded'
            });
            if (escrow) {
                escrow.status = 'released';
                await escrow.save();
            }

            // Mark project as completed
            const project = await Project.findById(milestone.projectId);
            if (project) {
                project.status = 'completed';
                await project.save();
            }

            console.log(`⏰ Auto-approved milestone ${milestone._id} for project ${milestone.projectId}`);
        }

        if (overdueMs.length > 0) {
            console.log(`✅ Auto-approval cron: processed ${overdueMs.length} overdue milestone(s)`);
        }
    } catch (err) {
        console.error('❌ Auto-approval cron error:', err.message);
    }
};

// Start the cron — runs every hour
const startCronJobs = () => {
    console.log('⏰ Auto-approval cron job initialized (runs every hour)');
    // Run every hour
    setInterval(runAutoApproval, 60 * 60 * 1000);
    // Also run once on startup after a short delay
    setTimeout(runAutoApproval, 5000);
};

module.exports = { startCronJobs };
