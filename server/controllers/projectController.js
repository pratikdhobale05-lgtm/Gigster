const Project = require('../models/Project');
const Milestone = require('../models/Milestone');

// --- 1. CREATE A PROJECT (Client Only) ---
exports.createProject = async (req, res) => {
    try {
        // We get req.user._id securely from the auth.protect middleware
        const newProject = await Project.create({
            title: req.body.title,
            description: req.body.description,
            category: req.body.category,
            budget: req.body.budget,
            clientId: req.user._id,
        });

        res.status(201).json({
            status: 'success',
            data: { project: newProject }
        });
    } catch (err) {
        res.status(400).json({ status: 'fail', message: err.message });
    }
};

// --- 2. BROWSE OPEN PROJECTS (Freelancers) ---
exports.getAllProjects = async (req, res) => {
    try {
        // Basic filtering: Only show 'open' projects
        // You can expand this later to filter by category: req.query.category
        const query = { status: 'open' };
        if (req.query.category) {
            query.category = req.query.category;
        }

        // Sort by newest first
        const projects = await Project.find(query).sort({ createdAt: -1 });

        res.status(200).json({
            status: 'success',
            results: projects.length,
            data: { projects }
        });
    } catch (err) {
        res.status(400).json({ status: 'fail', message: err.message });
    }
};

// --- 3. SUBMIT A BID (Freelancer Only) ---
exports.submitBid = async (req, res) => {
    try {
        const project = await Project.findById(req.params.id);

        if (!project) {
            return res.status(404).json({ status: 'fail', message: 'Project not found' });
        }

        if (project.status !== 'open') {
            return res.status(400).json({ status: 'fail', message: 'This project is no longer accepting bids' });
        }

        // Check if freelancer already bid to prevent spam
        const alreadyBid = project.bids.find(
            (bid) => bid.freelancerId.toString() === req.user._id.toString()
        );
        if (alreadyBid) {
            return res.status(400).json({ status: 'fail', message: 'You have already placed a bid on this project' });
        }

        // Push the new bid into the embedded array
        project.bids.push({
            freelancerId: req.user._id,
            amount: req.body.amount,
            proposal: req.body.proposal,
        });

        await project.save();

        res.status(201).json({
            status: 'success',
            message: 'Bid submitted successfully',
            data: { project }
        });
    } catch (err) {
        res.status(400).json({ status: 'fail', message: err.message });
    }
};

// --- 4. ACCEPT A BID (Client Only) ---
exports.acceptBid = async (req, res) => {
    try {
        const project = await Project.findById(req.params.id);

        if (!project) {
            return res.status(404).json({ status: 'fail', message: 'Project not found' });
        }

        // Security Check: Ensure the person accepting the bid actually owns the project
        if (project.clientId._id.toString() !== req.user._id.toString()) {
            return res.status(403).json({ status: 'fail', message: 'You do not have permission to modify this project' });
        }

        // Find the specific bid in the array
        const bid = project.bids.id(req.body.bidId);
        if (!bid) {
            return res.status(404).json({ status: 'fail', message: 'Bid not found' });
        }

        // Update Project Status
        project.status = 'in-progress';
        project.freelancerId = bid.freelancerId;
        bid.status = 'accepted';

        // Save project changes
        await project.save();

        // --- ESCROW PREPARATION ---
        // Automatically generate the first milestone based on the accepted bid amount.
        // In a real app, clients and freelancers might negotiate multiple milestones, 
        // but we will generate one bulk milestone here to keep the flow simple.
        const milestone = await Milestone.create({
            projectId: project._id,
            title: 'Project Delivery',
            amount: bid.amount,
            status: 'pending' // Ready for the client to fund it!
        });

        res.status(200).json({
            status: 'success',
            message: 'Bid accepted! Please fund the milestone to begin.',
            data: {
                project,
                milestone
            }
        });
    } catch (err) {
        res.status(400).json({ status: 'fail', message: err.message });
    }
};