const Project = require('../models/Project');
const Milestone = require('../models/Milestone');

// --- 1. CREATE A PROJECT (Client Only) ---
exports.createProject = async (req, res) => {
    try {
        const newProject = await Project.create({
            title: req.body.title,
            description: req.body.description,
            category: req.body.category,
            budget: req.body.budget,
            deadline: req.body.deadline,
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

// --- 2. BROWSE OPEN PROJECTS (For Freelancers) ---
exports.getAllProjects = async (req, res) => {
    try {
        const query = { status: 'open' };
        if (req.query.category) {
            query.category = req.query.category;
        }

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

// --- 3. GET MY PROJECTS (Dashboard) ---
exports.getMyProjects = async (req, res) => {
    try {
        let query;
        if (req.user.role === 'client') {
            query = { clientId: req.user._id };
        } else {
            // Freelancer sees projects they're hired on
            query = { freelancerId: req.user._id };
        }

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

// --- 4. GET A SINGLE PROJECT ---
exports.getProject = async (req, res) => {
    try {
        const project = await Project.findById(req.params.id);
        if (!project) {
            return res.status(404).json({ status: 'fail', message: 'Project not found' });
        }
        res.status(200).json({
            status: 'success',
            data: project
        });
    } catch (err) {
        res.status(400).json({ status: 'fail', message: err.message });
    }
};