import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Calendar, DollarSign, Tag, ArrowLeft, Clock, User, CheckCircle, ShieldCheck } from 'lucide-react';
import api from '../utils/api';
import useAuthStore from '../store/authStore';
import ChatBox from '../components/ChatBox'; // Make sure this is imported!
// Find your lucide-react import at the top and add Star:
import { Calendar, DollarSign, Tag, ArrowLeft, Clock, User, CheckCircle, ShieldCheck, Star } from 'lucide-react';

const ProjectDetails = () => {
    const { id } = useParams();
    const { user } = useAuthStore();

    const [project, setProject] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Proposal State
    const [showBidForm, setShowBidForm] = useState(false);
    const [bidData, setBidData] = useState({ price: '', coverLetter: '' });
    const [bidStatus, setBidStatus] = useState(null);
    const [proposals, setProposals] = useState([]);
    // --- NEW: Review State ---
    const [rating, setRating] = useState(0);
    const [hoveredRating, setHoveredRating] = useState(0);
    const [reviewComment, setReviewComment] = useState('');
    const [reviewSubmitted, setReviewSubmitted] = useState(false);

    useEffect(() => {
        fetchProjectData();
    }, [id, user?.role]);

    const fetchProjectData = async () => {
        try {
            const projectResponse = await api.get(`/projects/${id}`);
            setProject(projectResponse.data.data);

            if (user?.role === 'client' && projectResponse.data.data.status === 'open') {
                const proposalsResponse = await api.get(`/proposals?project=${id}`);
                setProposals(proposalsResponse.data.data || []);
            }
        } catch (err) {
            setError('Could not load project details. It may have been deleted.');
        } finally {
            setLoading(false);
        }
    };

    const handleBidSubmit = async (e) => {
        e.preventDefault();
        setBidStatus(null);
        try {
            await api.post('/proposals', { project: id, price: bidData.price, coverLetter: bidData.coverLetter });
            setBidStatus('success');
            setShowBidForm(false);
        } catch (err) {
            setBidStatus('error');
        }
    };

    const handleAcceptProposal = async (proposalId) => {
        try {
            await api.put(`/proposals/${proposalId}/accept`);
            alert('Freelancer hired successfully!');
            fetchProjectData(); // Refresh the data to show the new status!
        } catch (err) {
            alert('Failed to accept proposal.');
        }
    };

    // --- NEW: ESCROW FUNCTIONS ---

    // 1. Client Funds the Project
    const handleFundProject = async () => {
        try {
            await api.post(`/escrow/milestones/${id}/fund`);
            alert('Project successfully funded! The money is in Escrow.');
            fetchProjectData(); // Refresh to update status
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to fund project.');
        }
    };

    // 2. Freelancer Submits Work
    const handleSubmitWork = async () => {
        try {
            await api.patch(`/escrow/milestones/${id}/submit`);
            alert('Work submitted to the client for review!');
            fetchProjectData();
        } catch (err) {
            alert('Failed to submit work.');
        }
    };

    // 3. Client Approves Work & Releases Funds
    const handleApproveWork = async () => {
        try {
            await api.patch(`/escrow/milestones/${id}/approve`);
            alert('Work approved! Funds have been released to the freelancer.');
            fetchProjectData();
        } catch (err) {
            alert('Failed to approve work.');
        }
    };

    // 4. Client Leaves a Review
    const handleSubmitReview = async (e) => {
        e.preventDefault();
        if (rating === 0) {
            return alert('Please select a star rating!');
        }
        try {
            await api.post('/reviews', {
                projectId: id,
                rating,
                comment: reviewComment
            });
            setReviewSubmitted(true);
            alert('Review submitted successfully!');
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to submit review.');
        }
    };

    if (loading) return <div className="p-8 text-center text-gray-500">Loading project...</div>;
    if (error) return <div className="p-8 text-center text-red-500">{error}</div>;
    if (!project) return null;

    const deadline = new Date(project.deadline).toLocaleDateString();
    const isClient = user?.role === 'client';
    const isHiredFreelancer = user?.role === 'freelancer' && project.hiredFreelancer === user._id;

    return (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 mb-20">
            <Link to="/dashboard" className="inline-flex items-center gap-2 text-gray-500 hover:text-blue-600 mb-6 transition-colors">
                <ArrowLeft className="w-4 h-4" /> Back to Dashboard
            </Link>

            {/* --- Main Project Card --- */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 mb-8">
                <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4 mb-6 border-b border-gray-100 pb-6">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">{project.title}</h1>
                        <div className="flex items-center gap-2">
                            <span className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full font-medium text-sm">
                                <Tag className="w-4 h-4 inline mr-1" /> {project.category}
                            </span>
                            {/* Show Project Status Pill */}
                            <span className={`px-3 py-1 rounded-full font-medium text-sm border 
                 ${project.status === 'open' ? 'bg-gray-50 border-gray-200 text-gray-600' : ''}
                 ${project.status === 'in_progress' ? 'bg-yellow-50 border-yellow-200 text-yellow-700' : ''}
                 ${project.status === 'funded' ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : ''}
                 ${project.status === 'under_review' ? 'bg-purple-50 border-purple-200 text-purple-700' : ''}
                 ${project.status === 'completed' ? 'bg-green-50 border-green-200 text-green-700' : ''}
               `}>
                                Status: {project.status.replace('_', ' ').toUpperCase()}
                            </span>
                        </div>
                    </div>
                    <div className="flex items-center text-2xl font-bold text-green-600 bg-green-50 px-4 py-2 rounded-lg">
                        <DollarSign className="w-6 h-6" />
                        {project.budget}
                    </div>
                </div>

                <div className="mb-8">
                    <h2 className="text-xl font-bold text-gray-900 mb-4">Project Description</h2>
                    <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">{project.description}</p>
                </div>

                {/* --- ESCROW / MILESTONE ACTION AREA --- */}
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 flex flex-col items-center justify-center text-center mt-8">

                    {/* State 1: Freelancer Hired, Not Funded Yet (Client sees Fund button) */}
                    {project.status === 'in_progress' && isClient && (
                        <>
                            <ShieldCheck className="w-12 h-12 text-indigo-500 mb-3" />
                            <h3 className="text-lg font-bold text-gray-900">Freelancer Hired</h3>
                            <p className="text-gray-600 mb-4 text-sm max-w-md">Fund the project to lock the money in Escrow. Your freelancer will be notified to start working.</p>
                            <button onClick={handleFundProject} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-8 rounded-lg transition-colors">
                                Fund Project Securely
                            </button>
                        </>
                    )}
                    {project.status === 'in_progress' && isHiredFreelancer && (
                        <p className="text-gray-600 font-medium">Waiting for the client to fund the project into Escrow before you begin...</p>
                    )}

                    {/* State 2: Funded, Working (Freelancer sees Submit button) */}
                    {project.status === 'funded' && isHiredFreelancer && (
                        <>
                            <h3 className="text-lg font-bold text-gray-900">Project Funded!</h3>
                            <p className="text-gray-600 mb-4 text-sm max-w-md">The client has secured the funds in Escrow. Once you are finished, submit your work here.</p>
                            <button onClick={handleSubmitWork} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-8 rounded-lg transition-colors">
                                Submit Completed Work
                            </button>
                        </>
                    )}
                    {project.status === 'funded' && isClient && (
                        <p className="text-indigo-600 font-medium"><ShieldCheck className="w-5 h-5 inline mr-1" /> Funds secured in Escrow. Waiting for freelancer to submit work.</p>
                    )}

                    {/* State 3: Submitted, Under Review (Client sees Approve button) */}
                    {project.status === 'under_review' && isClient && (
                        <>
                            <h3 className="text-lg font-bold text-purple-900">Work Submitted for Review</h3>
                            <p className="text-gray-600 mb-4 text-sm max-w-md">Review the work provided in the chat. If everything looks good, approve it to release the funds.</p>
                            <button onClick={handleApproveWork} className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-8 rounded-lg transition-colors">
                                Approve Work & Release Funds
                            </button>
                        </>
                    )}
                    {project.status === 'under_review' && isHiredFreelancer && (
                        <p className="text-purple-600 font-medium">Work submitted! Waiting for the client to review and approve...</p>
                    )}

                    {/* State 4: Completed & Review Form */}
                    {project.status === 'completed' && (
                        <div className="flex flex-col items-center w-full max-w-lg">
                            <CheckCircle className="w-12 h-12 text-green-500 mb-3" />
                            <h3 className="text-xl font-bold text-green-700 mb-6">Project Completed Successfully!</h3>

                            {/* Show Review Form ONLY if it's the client and they haven't submitted one yet */}
                            {isClient && !reviewSubmitted ? (
                                <div className="bg-white p-6 rounded-xl border border-gray-200 w-full shadow-sm">
                                    <h4 className="text-lg font-bold text-gray-900 mb-4 text-center">Rate your Freelancer</h4>
                                    <form onSubmit={handleSubmitReview} className="flex flex-col gap-4">

                                        {/* The 5-Star Clicker */}
                                        <div className="flex justify-center gap-2 mb-2">
                                            {[1, 2, 3, 4, 5].map((star) => (
                                                <Star
                                                    key={star}
                                                    className={`w-8 h-8 cursor-pointer transition-colors ${(hoveredRating || rating) >= star
                                                            ? 'fill-yellow-400 text-yellow-400'
                                                            : 'text-gray-300'
                                                        }`}
                                                    onMouseEnter={() => setHoveredRating(star)}
                                                    onMouseLeave={() => setHoveredRating(0)}
                                                    onClick={() => setRating(star)}
                                                />
                                            ))}
                                        </div>

                                        <textarea
                                            required
                                            rows="3"
                                            value={reviewComment}
                                            onChange={(e) => setReviewComment(e.target.value)}
                                            placeholder="What was it like working with them?"
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                                        ></textarea>

                                        <button type="submit" className="bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-2 px-8 rounded-lg transition-colors mt-2">
                                            Submit Review
                                        </button>
                                    </form>
                                </div>
                            ) : (
                                <p className="text-gray-600 mt-1">Funds have been released and this contract is closed.</p>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* --- FREELANCER BIDDING AREA (Only shows for freelancers when project is open) --- */}
            {!isClient && project.status === 'open' && !project.hiredFreelancer && (
                <div className="mt-8 bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                    {!showBidForm ? (
                        <div className="text-center">
                            <h3 className="text-lg font-bold text-gray-900 mb-2">Interested in this project?</h3>
                            <button 
                                onClick={() => setShowBidForm(true)}
                                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-lg transition-colors"
                            >
                                Submit a Proposal
                            </button>
                        </div>
                    ) : (
                        <form onSubmit={handleBidSubmit} className="space-y-4">
                            <h3 className="text-xl font-bold text-gray-900 mb-4">Submit Your Proposal</h3>
                            
                            {bidStatus === 'success' && <div className="bg-green-100 text-green-700 p-3 rounded-lg mb-4">Your proposal has been submitted successfully!</div>}
                            {bidStatus === 'error' && <div className="bg-red-100 text-red-700 p-3 rounded-lg mb-4">Failed to submit proposal. You may have already bid on this project.</div>}
                            
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Your Proposed Budget ($)</label>
                                <input 
                                    type="number" required min="1"
                                    value={bidData.price}
                                    onChange={(e) => setBidData({...bidData, price: e.target.value})}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Cover Letter</label>
                                <textarea 
                                    required rows="4"
                                    value={bidData.coverLetter}
                                    onChange={(e) => setBidData({...bidData, coverLetter: e.target.value})}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                                    placeholder="Explain why you are the best fit for this job..."
                                ></textarea>
                            </div>
                            
                            <div className="flex justify-end gap-3 mt-4">
                                <button type="button" onClick={() => setShowBidForm(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                                    Cancel
                                </button>
                                <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-lg transition-colors">
                                    Submit Proposal
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            )}

            {/* --- LIVE CHAT (Only shows if someone is hired) --- */}
            {project.hiredFreelancer && (isClient || isHiredFreelancer) && (
                <div className="mt-12">
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Project Workspace</h2>
                    <p className="text-gray-600">Communicate directly with your project partner here.</p>
                    <ChatBox projectId={project._id} currentUser={user} />
                </div>
            )}

            {/* --- RECEIVED PROPOSALS (Only for Client before hiring) --- */}
            {isClient && project.status === 'open' && (
                <div className="mt-12">
                    <h2 className="text-2xl font-bold text-gray-900 mb-6">Received Proposals ({proposals.length})</h2>
                    {proposals.length === 0 ? (
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center text-gray-500">
                            No one has bid on this project yet. Check back soon!
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {proposals.map(proposal => (
                                <div key={proposal._id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <h3 className="font-bold text-blue-600 hover:underline">
                                                <Link to={`/profile/${proposal.freelancer}`}>
                                                    View Freelancer Profile
                                                </Link>
                                            </h3>
                                            <p className="text-sm text-gray-500 mt-1">Proposed Price: <span className="font-bold text-green-600">${proposal.price}</span></p>
                                        </div>
                                        <button onClick={() => handleAcceptProposal(proposal._id)} className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-bold transition-colors">
                                            Accept & Hire
                                        </button>
                                    </div>
                                    <div className="bg-gray-50 p-4 rounded-lg">
                                        <p className="text-gray-600 text-sm whitespace-pre-wrap">{proposal.coverLetter}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default ProjectDetails;