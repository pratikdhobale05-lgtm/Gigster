import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { DollarSign, Tag, ArrowLeft, CheckCircle, ShieldCheck, Star, AlertTriangle, Clock, Send } from 'lucide-react';
import api from '../utils/api';
import useAuthStore from '../store/authStore';
import ChatBox from '../components/ChatBox';
import PaymentQRModal from '../components/PaymentQRModal';

const statusMap = {
    open: { label: 'Open', class: 'badge-open' },
    in_progress: { label: 'In Progress', class: 'badge-in-progress' },
    funded: { label: 'Funded', class: 'badge-funded' },
    under_review: { label: 'Under Review', class: 'badge-under-review' },
    completed: { label: 'Completed', class: 'badge-completed' },
    disputed: { label: 'Disputed', class: 'badge-disputed' },
};

const ProjectDetails = () => {
    const { id } = useParams();
    const { user } = useAuthStore();
    const [project, setProject] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showBidForm, setShowBidForm] = useState(false);
    const [bidData, setBidData] = useState({ price: '', coverLetter: '' });
    const [bidStatus, setBidStatus] = useState(null);
    const [proposals, setProposals] = useState([]);
    const [rating, setRating] = useState(0);
    const [hoveredRating, setHoveredRating] = useState(0);
    const [reviewComment, setReviewComment] = useState('');
    const [reviewSubmitted, setReviewSubmitted] = useState(false);
    const [refreshKey, setRefreshKey] = useState(0);

    useEffect(() => {
        let cancelled = false;
        const fetchProjectData = async () => {
            try {
                setLoading(true);
                const res = await api.get(`/projects/${id}`);
                if (cancelled) return;
                const p = res.data.data;
                setProject(p);
                if (user?.role === 'client' && p.status === 'open' && (p.clientId?._id === user._id || p.clientId === user._id)) {
                    const pRes = await api.get(`/proposals?project=${id}`);
                    if (!cancelled) setProposals(pRes.data.data || []);
                }
            } catch { if (!cancelled) setError('Could not load project.'); }
            finally { if (!cancelled) setLoading(false); }
        };
        fetchProjectData();
        return () => { cancelled = true; };
    }, [id, user, refreshKey]);

    const refetch = () => setRefreshKey(k => k + 1);

    const [fundingInProgress, setFundingInProgress] = useState(false);
    const [qrModal, setQrModal] = useState({ open: false, orderId: null, amount: null, upiString: null, simulated: false });

    const handleBidSubmit = async (e) => {
        e.preventDefault(); setBidStatus(null);
        try { await api.post('/proposals', { project: id, price: bidData.price, coverLetter: bidData.coverLetter }); setBidStatus('success'); setShowBidForm(false); }
        catch { setBidStatus('error'); }
    };
    const handleAcceptProposal = async (pid) => { try { await api.put(`/proposals/${pid}/accept`); refetch(); } catch { alert('Failed'); } };

    // ── Razorpay / QR Payment Flow ──
    const handleFundProject = async () => {
        try {
            setFundingInProgress(true);

            // Step 1: Create a Razorpay order on the backend
            const { data } = await api.post(`/escrow/milestones/${id}/create-order`);
            const orderData = data.data;

            // Step 2: Build UPI deep-link string for QR code
            const amountInRupees = (orderData.amount / 100).toFixed(2);
            const upiString = `upi://pay?pa=gigster@razorpay&pn=Gigster+Escrow&am=${amountInRupees}&cu=INR&tn=EscrowPayment&tr=${orderData.orderId}`;

            // Step 3: Show the QR modal (works for both simulated & real Razorpay)
            setFundingInProgress(false);
            setQrModal({
                open: true,
                orderId: orderData.orderId,
                amount: orderData.amount,
                upiString,
                simulated: orderData.simulated,
            });
        } catch (e) {
            setFundingInProgress(false);
            alert(e.response?.data?.message || 'Failed to initiate payment');
        }
    };

    // Called by PaymentQRModal after user confirms / simulates payment
    const handleQRPaymentSuccess = async (paymentData) => {
        try {
            await api.post(`/escrow/milestones/${id}/verify-payment`, {
                razorpay_order_id: paymentData.razorpay_order_id,
                razorpay_payment_id: paymentData.razorpay_payment_id,
                razorpay_signature: paymentData.razorpay_signature,
            });
            setQrModal({ open: false, orderId: null, amount: null, upiString: null, simulated: false });
            refetch();
        } catch (err) {
            setQrModal({ open: false, orderId: null, amount: null, upiString: null, simulated: false });
            alert(err.response?.data?.message || 'Payment verification failed');
        }
    };

    const handleSubmitWork = async () => { try { await api.patch(`/escrow/milestones/${id}/submit`); refetch(); } catch { alert('Failed'); } };
    const handleApproveWork = async () => { try { await api.patch(`/escrow/milestones/${id}/approve`); refetch(); } catch { alert('Failed'); } };
    const handleRaiseDispute = async () => {
        if (!confirm('Raise a dispute? Funds will be locked for admin review.')) return;
        try { await api.post(`/escrow/milestones/${id}/dispute`); refetch(); } catch { alert('Failed'); }
    };
    const handleSubmitReview = async (e) => {
        e.preventDefault(); if (!rating) return alert('Select a rating');
        try { await api.post('/reviews', { projectId: id, rating, comment: reviewComment }); setReviewSubmitted(true); }
        catch (err) { alert(err.response?.data?.message || 'Failed'); }
    };

    if (loading) return <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><div className="animate-pulse-glow" style={{ width: 48, height: 48, borderRadius: 'var(--radius-lg)', background: 'var(--gradient-primary)' }} /></div>;
    if (error) return <div style={{ padding: '2rem', textAlign: 'center', color: '#f87171' }}>{error}</div>;
    if (!project) return null;

    const isClient = user?.role === 'client';
    const isOwner = isClient && (project.clientId?._id === user._id || project.clientId === user._id);
    const isHired = user?.role === 'freelancer' && project.freelancerId?._id === user._id;
    const status = statusMap[project.status] || statusMap.open;

    return (
        <>
        <div style={{ maxWidth: 900, margin: '0 auto', padding: '2rem 1.5rem 4rem' }}>
            <Link to="/dashboard" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--color-text-muted)', textDecoration: 'none', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
                <ArrowLeft style={{ width: 16, height: 16 }} /> Back to Dashboard
            </Link>

            {/* Project Card */}
            <div className="card animate-fade-in-up" style={{ padding: '2rem', marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', marginBottom: '1.5rem', paddingBottom: '1.5rem', borderBottom: '1px solid var(--color-border)', flexWrap: 'wrap' }}>
                    <div style={{ flex: 1 }}>
                        <h1 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '0.75rem' }}>{project.title}</h1>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                            <span className={`badge ${status.class}`}><span style={{ width: 6, height: 6, borderRadius: '50%', background: 'currentColor', display: 'inline-block' }} />{status.label}</span>
                            <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', display: 'inline-flex', alignItems: 'center', gap: 4 }}><Tag style={{ width: 12, height: 12 }} />{project.category}</span>
                        </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '1.5rem', fontWeight: 800, padding: '0.5rem 1rem', borderRadius: 'var(--radius-md)', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', color: '#34d399' }}>
                        <DollarSign style={{ width: 20, height: 20 }} />{project.budget}
                    </div>
                </div>
                <h2 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.75rem', color: 'var(--color-text-secondary)' }}>Description</h2>
                <p style={{ color: 'var(--color-text-muted)', lineHeight: 1.8, whiteSpace: 'pre-wrap', fontSize: '0.9375rem', marginBottom: '2rem' }}>{project.description}</p>

                {/* Escrow Actions */}
                <div style={{ background: 'var(--color-bg-base)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', padding: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                    {project.status === 'in_progress' && isOwner && (<>
                        <ShieldCheck style={{ width: 48, height: 48, color: '#6366f1', marginBottom: 12 }} />
                        <h3 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: 8 }}>Freelancer Hired</h3>
                        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', maxWidth: 400, marginBottom: 16 }}>Fund the project to lock money in Escrow.</p>
                        <button onClick={handleFundProject} className="btn-primary" disabled={fundingInProgress}><ShieldCheck style={{ width: 16, height: 16 }} /> {fundingInProgress ? 'Processing...' : 'Fund Project'}</button>
                    </>)}
                    {project.status === 'in_progress' && isHired && <p style={{ color: 'var(--color-text-muted)' }}>⏳ Waiting for client to fund...</p>}

                    {project.status === 'funded' && isHired && (<>
                        <ShieldCheck style={{ width: 48, height: 48, color: '#06b6d4', marginBottom: 12 }} />
                        <h3 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: 8 }}>Funded!</h3>
                        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', maxWidth: 400, marginBottom: 16 }}>Submit your work when ready.</p>
                        <button onClick={handleSubmitWork} className="btn-primary"><Send style={{ width: 16, height: 16 }} /> Submit Work</button>
                    </>)}
                    {project.status === 'funded' && isOwner && <p style={{ color: '#22d3ee' }}>🔒 Funds in Escrow. Waiting for submission.</p>}

                    {project.status === 'under_review' && isOwner && (<>
                        <Clock style={{ width: 48, height: 48, color: '#c084fc', marginBottom: 12 }} />
                        <h3 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: 8 }}>Work Submitted</h3>
                        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', maxWidth: 400, marginBottom: 16 }}>Review deliverables. You have 14 days to respond.</p>
                        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
                            <button onClick={handleApproveWork} className="btn-success"><CheckCircle style={{ width: 16, height: 16 }} /> Approve & Release</button>
                            <button onClick={handleRaiseDispute} className="btn-danger"><AlertTriangle style={{ width: 16, height: 16 }} /> Dispute</button>
                        </div>
                    </>)}
                    {project.status === 'under_review' && isHired && (<div>
                        <p style={{ color: '#c084fc', marginBottom: 12 }}>Waiting for review...</p>
                        <button onClick={handleRaiseDispute} className="btn-danger" style={{ fontSize: '0.8125rem' }}><AlertTriangle style={{ width: 14, height: 14 }} /> Dispute</button>
                    </div>)}

                    {project.status === 'disputed' && (<>
                        <AlertTriangle style={{ width: 48, height: 48, color: '#f87171', marginBottom: 12 }} />
                        <h3 style={{ color: '#f87171', fontWeight: 700, marginBottom: 8 }}>Dispute Active</h3>
                        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>Funds locked. Admin will review.</p>
                    </>)}

                    {project.status === 'completed' && (<div style={{ width: '100%', maxWidth: 480 }}>
                        <CheckCircle style={{ width: 48, height: 48, color: '#10b981', margin: '0 auto 12px' }} />
                        <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#34d399', marginBottom: '1.5rem' }}>Completed!</h3>
                        {(isOwner || isHired) && !reviewSubmitted ? (
                            <div className="card" style={{ padding: '1.5rem', textAlign: 'left' }}>
                                <h4 style={{ fontWeight: 700, marginBottom: '1rem', textAlign: 'center' }}>Rate your {isClient ? 'Freelancer' : 'Client'}</h4>
                                <form onSubmit={handleSubmitReview} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                    <div style={{ display: 'flex', justifyContent: 'center', gap: 8 }}>
                                        {[1,2,3,4,5].map(s => <Star key={s} style={{ width: 32, height: 32, cursor: 'pointer', transition: 'all 0.15s', color: (hoveredRating||rating)>=s?'#fbbf24':'var(--color-bg-elevated)', fill: (hoveredRating||rating)>=s?'#fbbf24':'none' }} onMouseEnter={()=>setHoveredRating(s)} onMouseLeave={()=>setHoveredRating(0)} onClick={()=>setRating(s)} />)}
                                    </div>
                                    <textarea required rows="3" value={reviewComment} onChange={e=>setReviewComment(e.target.value)} placeholder="Your experience?" className="input-dark" style={{ resize: 'none' }} />
                                    <button type="submit" className="btn-primary" style={{ width: '100%', justifyContent: 'center' }}>Submit Review</button>
                                </form>
                            </div>
                        ) : <p style={{ color: 'var(--color-text-muted)' }}>{reviewSubmitted ? '✅ Review submitted!' : 'Contract closed.'}</p>}
                    </div>)}

                    {project.status === 'open' && <p style={{ color: 'var(--color-text-muted)' }}>{isClient ? 'Review proposals below.' : 'Submit your proposal!'}</p>}
                </div>
            </div>

            {/* Bid Form */}
            {!isClient && project.status === 'open' && !project.freelancerId && (
                <div className="card" style={{ padding: '2rem', marginBottom: '1.5rem' }}>
                    {bidStatus === 'success' && <div style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', color: '#34d399', padding: '0.75rem', borderRadius: 'var(--radius-md)', marginBottom: '1rem', textAlign: 'center', fontSize: '0.875rem' }}>✅ Proposal submitted!</div>}
                    {!showBidForm ? (
                        <div style={{ textAlign: 'center' }}>
                            <h3 style={{ fontWeight: 700, marginBottom: 12 }}>Interested?</h3>
                            <button onClick={() => setShowBidForm(true)} className="btn-primary">Submit a Proposal</button>
                        </div>
                    ) : (
                        <form onSubmit={handleBidSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                            <h3 style={{ fontWeight: 700 }}>Your Proposal</h3>
                            {bidStatus === 'error' && <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#f87171', padding: '0.75rem', borderRadius: 'var(--radius-md)', fontSize: '0.875rem' }}>Failed. You may have already bid.</div>}
                            <div><label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 6 }}>Budget ($)</label><input type="number" required min="1" value={bidData.price} onChange={e=>setBidData({...bidData, price: e.target.value})} className="input-dark" /></div>
                            <div><label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 6 }}>Cover Letter</label><textarea required rows="4" value={bidData.coverLetter} onChange={e=>setBidData({...bidData, coverLetter: e.target.value})} className="input-dark" style={{ resize: 'none' }} placeholder="Why you're the best fit..." /></div>
                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
                                <button type="button" onClick={() => setShowBidForm(false)} className="btn-secondary">Cancel</button>
                                <button type="submit" className="btn-primary">Submit</button>
                            </div>
                        </form>
                    )}
                </div>
            )}

            {/* Chat */}
            {project.freelancerId && (isOwner || isHired) && (
                <div style={{ marginTop: '2rem' }}>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: 4 }}>Project Workspace</h2>
                    <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>Communicate with your partner.</p>
                    <ChatBox projectId={project._id} currentUser={user} />
                </div>
            )}

            {/* Proposals */}
            {isOwner && project.status === 'open' && (
                <div style={{ marginTop: '2rem' }}>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1rem' }}>Proposals ({proposals.length})</h2>
                    {proposals.length === 0 ? <div className="card" style={{ padding: '3rem', textAlign: 'center' }}><p style={{ color: 'var(--color-text-muted)' }}>No proposals yet.</p></div> : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {proposals.map(p => (
                                <div key={p._id} className="card" style={{ padding: '1.5rem' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: 12 }}>
                                        <div>
                                            <Link to={`/profile/${p.freelancer?._id||p.freelancer}`} style={{ color: 'var(--color-primary-light)', fontWeight: 600, textDecoration: 'none' }}>{p.freelancer?.name || 'Freelancer'}</Link>
                                            {p.freelancer?.ratingsAverage > 0 && <span style={{ marginLeft: 12, fontSize: '0.8125rem', color: '#fbbf24' }}><Star style={{ width: 14, height: 14, display: 'inline', verticalAlign: 'middle', fill: '#fbbf24' }} /> {p.freelancer.ratingsAverage}</span>}
                                            <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', marginTop: 4 }}>Proposed: <span style={{ color: '#34d399', fontWeight: 700 }}>${p.price}</span></p>
                                        </div>
                                        <button onClick={() => handleAcceptProposal(p._id)} className="btn-success"><CheckCircle style={{ width: 16, height: 16 }} /> Accept & Hire</button>
                                    </div>
                                    <div style={{ background: 'var(--color-bg-base)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
                                        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>{p.coverLetter}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>

        {/* QR Payment Modal */}
        <PaymentQRModal
            isOpen={qrModal.open}
            onClose={() => setQrModal({ open: false, orderId: null, amount: null, upiString: null, simulated: false })}
            onSuccess={handleQRPaymentSuccess}
            amount={qrModal.amount}
            orderId={qrModal.orderId}
            upiString={qrModal.upiString}
            simulated={qrModal.simulated}
            projectName={project?.title}
        />
        </>
    );
};

export default ProjectDetails;