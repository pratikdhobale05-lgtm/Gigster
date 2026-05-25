import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Star, User as UserIcon, Briefcase, ArrowLeft, MapPin, Calendar } from 'lucide-react';
import api from '../utils/api';

const Profile = () => {
    const { id } = useParams();
    const [profile, setProfile] = useState(null);
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [userRes, reviewRes] = await Promise.all([
                    api.get(`/users/${id}`),
                    api.get(`/reviews/user/${id}`)
                ]);
                setProfile(userRes.data.data.user);
                setReviews(reviewRes.data.data || []);
            } catch {
                setError('Could not load profile.');
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [id]);

    if (loading) return <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><div className="animate-pulse-glow" style={{ width: 48, height: 48, borderRadius: 'var(--radius-lg)', background: 'var(--gradient-primary)' }} /></div>;
    if (error) return <div style={{ padding: '2rem', textAlign: 'center', color: '#f87171' }}>{error}</div>;

    const avgRating = reviews.length > 0
        ? (reviews.reduce((a, c) => a + c.rating, 0) / reviews.length).toFixed(1)
        : profile?.ratingsAverage || 0;

    return (
        <div style={{ maxWidth: 800, margin: '0 auto', padding: '2rem 1.5rem 4rem' }}>
            <Link to="/dashboard" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--color-text-muted)', textDecoration: 'none', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
                <ArrowLeft style={{ width: 16, height: 16 }} /> Back
            </Link>

            {/* Profile Header */}
            <div className="card animate-fade-in-up" style={{ padding: '2rem', marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
                    <div style={{
                        width: 80, height: 80, borderRadius: 'var(--radius-lg)',
                        background: 'var(--gradient-primary)', display: 'flex',
                        alignItems: 'center', justifyContent: 'center', flexShrink: 0
                    }}>
                        {profile?.profile?.avatarUrl ? (
                            <img src={profile.profile.avatarUrl} alt="" style={{ width: 80, height: 80, borderRadius: 'var(--radius-lg)', objectFit: 'cover' }} />
                        ) : (
                            <UserIcon style={{ width: 36, height: 36, color: 'white' }} />
                        )}
                    </div>
                    <div style={{ flex: 1 }}>
                        <h1 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: 4 }}>{profile?.name}</h1>
                        {profile?.profile?.title && <p style={{ color: 'var(--color-primary-light)', fontSize: '0.9375rem', fontWeight: 600, marginBottom: 8 }}>{profile.profile.title}</p>}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap', fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Briefcase style={{ width: 14, height: 14 }} />{profile?.role}</span>
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

            {/* Reviews */}
            <div className="card animate-fade-in-up stagger-2" style={{ padding: '2rem' }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1.5rem' }}>Reviews</h2>
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