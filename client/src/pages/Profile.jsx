import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Star, User as UserIcon, Briefcase, ArrowLeft, Calendar, Edit2, Save, X, Sparkles } from 'lucide-react';
import api from '../utils/api';
import useAuthStore from '../store/authStore';

const Profile = () => {
    const { id } = useParams();
    const { user, fetchMe } = useAuthStore();
    const [profile, setProfile] = useState(null);
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const [isEditing, setIsEditing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [editForm, setEditForm] = useState({
        name: '',
        title: '',
        bio: '',
        skills: '',
        avatarUrl: ''
    });

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [userRes, reviewRes] = await Promise.all([
                    api.get(`/users/${id}`),
                    api.get(`/reviews/user/${id}`)
                ]);
                const fetchedUser = userRes.data.data.user;
                setProfile(fetchedUser);
                setReviews(reviewRes.data.data || []);
                setEditForm({
                    name: fetchedUser.name || '',
                    title: fetchedUser.profile?.title || '',
                    bio: fetchedUser.profile?.bio || '',
                    skills: (fetchedUser.profile?.skills || []).join(', '),
                    avatarUrl: fetchedUser.profile?.avatarUrl || ''
                });
            } catch {
                setError('Could not load profile.');
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [id]);

    const isOwnProfile = user && profile && (user._id === profile._id || user.id === profile._id);

    const handleSaveProfile = async (e) => {
        e.preventDefault();
        try {
            setSaving(true);
            const skillsArray = editForm.skills
                .split(',')
                .map(s => s.trim())
                .filter(Boolean);

            const payload = {
                name: editForm.name,
                profile: {
                    title: editForm.title,
                    bio: editForm.bio,
                    skills: skillsArray,
                    avatarUrl: editForm.avatarUrl
                }
            };

            const res = await api.patch('/users/me/profile', payload);
            setProfile(res.data.data.user);
            setIsEditing(false);
            if (fetchMe) fetchMe();
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to update profile');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><div className="animate-pulse-glow" style={{ width: 48, height: 48, borderRadius: 'var(--radius-lg)', background: 'var(--gradient-primary)' }} /></div>;
    if (error) return <div style={{ padding: '2rem', textAlign: 'center', color: '#f87171' }}>{error}</div>;

    const avgRating = reviews.length > 0
        ? (reviews.reduce((a, c) => a + c.rating, 0) / reviews.length).toFixed(1)
        : profile?.ratingsAverage || 0;

    return (
        <div style={{ maxWidth: 800, margin: '0 auto', padding: '2rem 1.5rem 4rem' }}>
            <Link to="/dashboard" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--color-text-muted)', textDecoration: 'none', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
                <ArrowLeft style={{ width: 16, height: 16 }} /> Back to Dashboard
            </Link>

            {/* Profile Header */}
            <div className="card animate-fade-in-up" style={{ padding: '2rem', marginBottom: '1.5rem', position: 'relative' }}>
                {isOwnProfile && !isEditing && (
                    <button
                        onClick={() => setIsEditing(true)}
                        className="btn-secondary"
                        style={{ position: 'absolute', top: 20, right: 20, padding: '0.5rem 1rem', fontSize: '0.8125rem' }}
                    >
                        <Edit2 style={{ width: 14, height: 14 }} /> Edit Profile
                    </button>
                )}

                <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
                    <div style={{
                        width: 80, height: 80, borderRadius: 'var(--radius-lg)',
                        background: 'var(--gradient-primary)', display: 'flex',
                        alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                        overflow: 'hidden'
                    }}>
                        {profile?.profile?.avatarUrl ? (
                            <img src={profile.profile.avatarUrl} alt="" style={{ width: 80, height: 80, borderRadius: 'var(--radius-lg)', objectFit: 'cover' }} />
                        ) : (
                            <UserIcon style={{ width: 36, height: 36, color: 'white' }} />
                        )}
                    </div>
                    <div style={{ flex: 1, paddingRight: isOwnProfile ? '100px' : '0' }}>
                        <h1 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: 4 }}>{profile?.name}</h1>
                        {profile?.profile?.title && <p style={{ color: 'var(--color-primary-light)', fontSize: '0.9375rem', fontWeight: 600, marginBottom: 8 }}>{profile.profile.title}</p>}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap', fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: 4, textTransform: 'capitalize' }}><Briefcase style={{ width: 14, height: 14 }} />{profile?.role}</span>
                            <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#fbbf24', fontWeight: 700 }}>
                                <Star style={{ width: 14, height: 14, fill: '#fbbf24' }} /> {avgRating} ({reviews.length} reviews)
                            </span>
                            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                <Calendar style={{ width: 14, height: 14 }} /> Joined {new Date(profile?.createdAt).toLocaleDateString()}
                            </span>
                        </div>
                    </div>
                </div>

                {profile?.profile?.bio && (
                    <div style={{ marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid var(--color-border)' }}>
                        <p style={{ color: 'var(--color-text-muted)', lineHeight: 1.7, fontSize: '0.9375rem' }}>{profile.profile.bio}</p>
                    </div>
                )}

                {profile?.profile?.skills?.length > 0 && (
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: '1rem' }}>
                        {profile.profile.skills.map((skill, i) => (
                            <span key={i} style={{
                                padding: '0.25rem 0.75rem', borderRadius: 'var(--radius-full)',
                                background: 'rgba(99,102,241,0.1)', color: 'var(--color-primary-light)',
                                fontSize: '0.75rem', fontWeight: 600
                            }}>{skill}</span>
                        ))}
                    </div>
                )}
            </div>

            {/* Edit Profile Modal */}
            {isEditing && (
                <div style={{
                    position: 'fixed', inset: 0, zIndex: 9999,
                    background: 'rgba(7, 10, 20, 0.85)', backdropFilter: 'blur(8px)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem'
                }}>
                    <div className="card animate-fade-in-up" style={{
                        width: '100%', maxWidth: '520px', padding: '2rem',
                        background: 'linear-gradient(145deg, #1a2235, #141b2d)',
                        borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: 8 }}>
                                <Sparkles style={{ width: 18, height: 18, color: 'var(--color-primary-light)' }} /> Edit Profile
                            </h2>
                            <button onClick={() => setIsEditing(false)} style={{ background: 'none', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer' }}>
                                <X style={{ width: 18, height: 18 }} />
                            </button>
                        </div>

                        <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 6 }}>Full Name</label>
                                <input type="text" required value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })} className="input-dark" />
                            </div>

                            <div>
                                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 6 }}>Professional Title</label>
                                <input type="text" placeholder="e.g. Senior Full-Stack Engineer" value={editForm.title} onChange={e => setEditForm({ ...editForm, title: e.target.value })} className="input-dark" />
                            </div>

                            <div>
                                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 6 }}>Bio / About</label>
                                <textarea rows="3" placeholder="Tell clients about your background and expertise..." value={editForm.bio} onChange={e => setEditForm({ ...editForm, bio: e.target.value })} className="input-dark" style={{ resize: 'none' }} />
                            </div>

                            <div>
                                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 6 }}>Skills (comma-separated)</label>
                                <input type="text" placeholder="React, Node.js, TypeScript, Python" value={editForm.skills} onChange={e => setEditForm({ ...editForm, skills: e.target.value })} className="input-dark" />
                            </div>

                            <div>
                                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 6 }}>Avatar Image URL</label>
                                <input type="url" placeholder="https://example.com/avatar.jpg" value={editForm.avatarUrl} onChange={e => setEditForm({ ...editForm, avatarUrl: e.target.value })} className="input-dark" />
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: '1rem' }}>
                                <button type="button" onClick={() => setIsEditing(false)} className="btn-secondary">Cancel</button>
                                <button type="submit" disabled={saving} className="btn-primary">
                                    <Save style={{ width: 14, height: 14 }} /> {saving ? 'Saving...' : 'Save Changes'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Reviews */}
            <div className="card animate-fade-in-up stagger-2" style={{ padding: '2rem' }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1.5rem' }}>Reviews & Feedback</h2>
                {reviews.length === 0 ? (
                    <p style={{ color: 'var(--color-text-muted)', textAlign: 'center', padding: '2rem 0' }}>No reviews yet.</p>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                        {reviews.map(r => (
                            <div key={r._id} style={{ paddingBottom: '1.25rem', borderBottom: '1px solid var(--color-border)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                                    <h4 style={{ fontWeight: 600, fontSize: '0.9375rem' }}>{r.project?.title || 'Project'}</h4>
                                    <div style={{ display: 'flex', gap: 2 }}>
                                        {[...Array(5)].map((_, i) => <Star key={i} style={{ width: 14, height: 14, color: i < r.rating ? '#fbbf24' : 'var(--color-bg-elevated)', fill: i < r.rating ? '#fbbf24' : 'none' }} />)}
                                    </div>
                                </div>
                                <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', fontStyle: 'italic', lineHeight: 1.6 }}>"{r.comment}"</p>
                                <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: 6 }}>
                                    By {r.reviewer?.name || 'User'} · {new Date(r.createdAt).toLocaleDateString()}
                                </p>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Profile;