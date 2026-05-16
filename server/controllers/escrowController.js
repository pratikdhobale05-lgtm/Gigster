const Project = require('../models/Project');
const Escrow = require('../models/Escrow');

// 1. Client funds the milestone
exports.fundMilestone = async (req, res) => {
    try {
        const projectId = req.params.id;
        const project = await Project.findById(projectId);

        if (!project) return res.status(404).json({ message: 'Project not found' });
        if (!project.hiredFreelancer) return res.status(400).json({ message: 'Must hire a freelancer first' });

        // Create the Escrow record (locking the money)
        const escrow = await Escrow.create({
            project: project._id,
            client: req.user._id,
            freelancer: project.hiredFreelancer,
            amount: project.budget,
            status: 'funded'
        });

        // Update the project status
        project.status = 'funded';
        await project.save();

        res.status(200).json({ success: true, message: 'Milestone funded securely!', data: escrow });
    } catch (error) {
        res.status(500).json({ message: 'Server error funding milestone', error: error.message });
    }
};

// 2. Freelancer submits the completed work
exports.submitWork = async (req, res) => {
    try {
        const projectId = req.params.id;
        const project = await Project.findById(projectId);

        if (!project) return res.status(404).json({ message: 'Project not found' });

        // Security check: Only the hired freelancer can submit work
        if (project.hiredFreelancer.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Only the hired freelancer can submit work' });
        }

        // Update project status to show it is ready for client review
        project.status = 'under_review';
        await project.save();

        res.status(200).json({ success: true, message: 'Work submitted for review!' });
    } catch (error) {
        res.status(500).json({ message: 'Server error submitting work', error: error.message });
    }
};

// 3. Client approves the work (Releasing funds)
exports.approveWork = async (req, res) => {
    try {
        const projectId = req.params.id;

        // Find the escrow record tied to this project
        const escrow = await Escrow.findOne({ project: projectId, status: 'funded' });
        if (!escrow) return res.status(404).json({ message: 'No active funded escrow found for this project' });

        // Update the Escrow to release the money to the Freelancer
        escrow.status = 'released';
        await escrow.save();

        // Update the project to completely finished
        const project = await Project.findById(projectId);
        project.status = 'completed';
        await project.save();

        // (Optional: Here is where you would update the Freelancer's "Wallet" balance in a real app)

        res.status(200).json({ success: true, message: 'Work approved and funds released!' });
    } catch (error) {
        res.status(500).json({ message: 'Server error approving work', error: error.message });
    }
};