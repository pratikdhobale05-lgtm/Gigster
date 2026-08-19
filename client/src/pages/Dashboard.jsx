import { useState, useEffect } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { PlusCircle, Search, Loader, Briefcase, TrendingUp, CheckCircle, Clock, Star, ShieldCheck, Sparkles, Filter } from 'lucide-react';
import useAuthStore from '../store/authStore';
import api from '../utils/api';
import ProjectCard from '../components/ProjectCard';

const Dashboard = () => {
    const { user } = useAuthStore();
    const [projects, setProjects] = useState([]);
    const [myProjects, setMyProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('All');

    useEffect(() => {
        if (!user) return;
        const fetchData = async () => {
            try {
                // Fetch open projects (for freelancer browse)
                const openRes = await api.get('/projects');
                setProjects(openRes.data.data.projects || []);

                // Fetch my projects (for dashboard)
                const myRes = await api.get('/projects/my');
                setMyProjects(myRes.data.data.projects || []);
            } catch (error) {
                console.error("Error fetching projects:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [user]);

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    if (loading) {
        return (
            <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div className="animate-pulse-glow" style={{
                    width: '56px', height: '56px', borderRadius: 'var(--radius-lg)',
                    background: 'var(--gradient-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                    <Loader style={{ width: '24px', height: '24px', color: 'white', animation: 'spin 1s linear infinite' }} />
                </div>
            </div>
        );
    }

    const isClient = user?.role === 'client';

    // Stats calculations
    const totalProjects = myProjects.length;
    const activeProjects = myProjects.filter(p => ['in_progress', 'funded', 'under_review'].includes(p.status)).length;
    const completedProjects = myProjects.filter(p => p.status === 'completed').length;
    
    // Extract unique categories from open projects + current list
    const categories = ['All', ...new Set(projects.map(p => p.category).filter(Boolean))];

    // Filtered projects based on search + selected category
    const filteredProjects = projects.filter(p => {
        const matchesSearch = p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.description?.toLowerCase().includes(searchTerm.toLowerCase());
        
        const matchesCategory = selectedCategory === 'All' || p.category === selectedCategory;
        
        return matchesSearch && matchesCategory;
    });

    const stats = [
        { label: 'Total Projects', value: totalProjects, icon: Briefcase, color: '#6366f1' },
        { label: 'Active Projects', value: activeProjects, icon: TrendingUp, color: '#f59e0b' },
        { label: 'Completed Gigs', value: completedProjects, icon: CheckCircle, color: '#10b981' },
    ];

    return (
        <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '2rem 1.5rem 4rem' }}>
            
            {/* ── Welcome Hero Banner ── */}
            <div className="card animate-fade-in-up" style={{
                background: 'var(--gradient-hero)',
                padding: '2.5rem',
                borderRadius: 'var(--radius-lg)',
                marginBottom: '2.5rem',
                border: '1px solid rgba(99, 102, 241, 0.15)',
                boxShadow: 'var(--shadow-glow)',
                position: 'relative',
                overflow: 'hidden'
            }}>
                <div style={{
                    position: 'absolute',
                    top: '-50px',
                    right: '-50px',
                    width: '200px',
                    height: '200px',
                    background: 'radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 70%)',
                    borderRadius: '50%'
                }} />
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.5rem', position: 'relative', zIndex: 1 }}>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                            <span style={{
                                background: isClient ? 'rgba(99, 102, 241, 0.15)' : 'rgba(6, 182, 212, 0.15)',
                                color: isClient ? 'var(--color-primary-light)' : 'var(--color-accent-light)',
                                fontSize: '0.75rem',
                                fontWeight: '700',
                                padding: '0.25rem 0.75rem',
                                borderRadius: 'var(--radius-full)',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                textTransform: 'uppercase'
                            }}>
                                <Sparkles style={{ width: '12px', height: '12px' }} />
                                {isClient ? 'Client Portal' : 'Freelancer Portal'}
                            </span>
                            {user?.ratingsAverage > 0 && (
                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', color: '#fbbf24', fontSize: '0.8125rem', fontWeight: '600' }}>
                                    <Star style={{ width: '14px', height: '14px', fill: '#fbbf24' }} />
                                    {user.ratingsAverage.toFixed(1)}
                                </span>
                            )}
                        </div>
                        <h1 style={{ fontSize: '2rem', fontWeight: '900', letterSpacing: '-0.03em', marginBottom: '0.5rem', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                            Welcome back, {user?.name || 'User'}! 👋
                        </h1>
                        <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9375rem', maxWidth: '600px', margin: 0 }}>
                            {isClient 
                                ? 'Post projects, hire top tier talent, and secure milestone payments via secure escrow.'
                                : 'Explore available projects, submit detailed proposals, and start building software.'}
                        </p>
                    </div>

                    {isClient ? (
                        <Link to="/create-project" className="btn-primary" style={{ textDecoration: 'none', padding: '0.75rem 1.75rem', fontSize: '0.9375rem', borderRadius: 'var(--radius-md)' }}>
                            <PlusCircle style={{ width: '18px', height: '18px' }} />
                            Post a New Gig
                        </Link>
                    ) : (
                        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                            <div style={{ textAlign: 'right', display: 'none', md: 'block' }}>
                                <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Security Check</span>
                                <span style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--color-success)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                    <ShieldCheck style={{ width: '14px', height: '14px' }} /> Verified Freelancer
                                </span>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* ── Stats & Overview Grid ── */}
            <div className="animate-fade-in-up stagger-1" style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                gap: '1.25rem',
                marginBottom: '3rem'
            }}>
                {stats.map((stat) => (
                    <div key={stat.label} className="card" style={{
                        padding: '1.5rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '1.25rem',
                        background: 'rgba(30, 41, 59, 0.4)',
                        backdropFilter: 'blur(10px)',
                        transition: 'transform 0.2s ease, box-shadow 0.2s ease'
                    }}>
                        <div style={{
                            width: '52px',
                            height: '52px',
                            borderRadius: 'var(--radius-md)',
                            background: `${stat.color}12`,
                            border: `1px solid ${stat.color}25`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0
                        }}>
                            <stat.icon style={{ width: '24px', height: '24px', color: stat.color }} />
                        </div>
                        <div>
                            <div style={{ fontSize: '1.75rem', fontWeight: '800', color: 'var(--color-text-primary)', lineHeight: 1.2 }}>
                                {stat.value}
                            </div>
                            <div style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', fontWeight: '600', marginTop: '2px' }}>
                                {stat.label}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* ── Primary Content Section ── */}
            {isClient ? (
                <div className="animate-fade-in-up stagger-2">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                        <h2 style={{ fontSize: '1.25rem', fontWeight: '800', color: 'var(--color-text-primary)' }}>
                            Your Projects & Contracts
                        </h2>
                    </div>
                    {myProjects.length === 0 ? (
                        <div className="card" style={{ padding: '4rem 2rem', textAlign: 'center', background: 'rgba(30, 41, 59, 0.2)' }}>
                            <Briefcase style={{ width: '48px', height: '48px', color: 'var(--color-text-muted)', margin: '0 auto 1.25rem' }} />
                            <h3 style={{ fontSize: '1.125rem', fontWeight: '700', marginBottom: '0.5rem' }}>No projects created yet</h3>
                            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', maxWidth: '400px', margin: '0 auto 1.5rem' }}>
                                Post a new project description to start getting competitive proposals from professional software engineers.
                            </p>
                            <Link to="/create-project" className="btn-primary" style={{ textDecoration: 'none' }}>
                                <PlusCircle style={{ width: '16px', height: '16px' }} /> Post a Project
                            </Link>
                        </div>
                    ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '1.25rem' }}>
                            {myProjects.map((project, i) => (
                                <ProjectCard key={project._id} project={project} userRole={user.role} index={i} />
                            ))}
                        </div>
                    )}
                </div>
            ) : (
                <div className="animate-fade-in-up stagger-2">
                    
                    {/* Freelancer: Active Work section */}
                    {myProjects.length > 0 && (
                        <div style={{ marginBottom: '3rem' }}>
                            <h2 style={{ fontSize: '1.25rem', fontWeight: '800', marginBottom: '1.25rem', color: 'var(--color-text-primary)' }}>
                                Your Active Contracts
                            </h2>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '1.25rem' }}>
                                {myProjects.map((project, i) => (
                                    <ProjectCard key={project._id} project={project} userRole={user.role} index={i} />
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Freelancer: Browse Open Gigs Section */}
                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        gap: '1rem',
                        marginBottom: '1.5rem'
                    }}>
                        <h2 style={{ fontSize: '1.25rem', fontWeight: '800', color: 'var(--color-text-primary)' }}>
                            Browse Open Gigs
                        </h2>
                        
                        {/* Search Input */}
                        <div style={{ position: 'relative', minWidth: '300px' }}>
                            <Search style={{
                                position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)',
                                width: '16px', height: '16px', color: 'var(--color-text-muted)'
                            }} />
                            <input
                                type="text" placeholder="Search by title, skills or details..."
                                value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                                className="input-dark" style={{ paddingLeft: '2.5rem', background: 'rgba(30, 41, 59, 0.4)' }}
                            />
                        </div>
                    </div>

                    {/* Category Filter Tags */}
                    {categories.length > 1 && (
                        <div style={{
                            display: 'flex',
                            gap: '8px',
                            overflowX: 'auto',
                            paddingBottom: '1rem',
                            marginBottom: '1.5rem',
                            scrollbarWidth: 'none',
                            msOverflowStyle: 'none'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--color-text-muted)', fontSize: '0.8125rem', marginRight: '8px' }}>
                                <Filter style={{ width: '14px', height: '14px' }} />
                                Filter:
                            </div>
                            {categories.map(cat => (
                                <button
                                    key={cat}
                                    onClick={() => setSelectedCategory(cat)}
                                    style={{
                                        border: '1px solid var(--color-border)',
                                        background: selectedCategory === cat ? 'var(--gradient-primary)' : 'rgba(30, 41, 59, 0.4)',
                                        color: selectedCategory === cat ? 'white' : 'var(--color-text-secondary)',
                                        fontSize: '0.8125rem',
                                        fontWeight: '600',
                                        padding: '0.375rem 1rem',
                                        borderRadius: 'var(--radius-full)',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s ease',
                                        whiteSpace: 'nowrap',
                                        boxShadow: selectedCategory === cat ? 'var(--shadow-glow)' : 'none'
                                    }}
                                >
                                    {cat}
                                </button>
                            ))}
                        </div>
                    )}

                    {filteredProjects.length === 0 ? (
                        <div className="card" style={{ padding: '4rem 2rem', textAlign: 'center', background: 'rgba(30, 41, 59, 0.2)' }}>
                            <Search style={{ width: '48px', height: '48px', color: 'var(--color-text-muted)', margin: '0 auto 1.25rem' }} />
                            <h3 style={{ fontSize: '1.125rem', fontWeight: '700', marginBottom: '0.5rem' }}>No matches found</h3>
                            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', maxWidth: '360px', margin: '0 auto' }}>
                                {searchTerm 
                                    ? 'Try modifying your search queries or clearing the category filters.' 
                                    : 'There are currently no open gigs available matching this category. Please check back later!'}
                            </p>
                        </div>
                    ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '1.25rem' }}>
                            {filteredProjects.map((project, i) => (
                                <ProjectCard key={project._id} project={project} userRole={user.role} index={i} />
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default Dashboard;