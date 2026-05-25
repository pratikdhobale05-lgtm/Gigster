import { useState, useEffect } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { PlusCircle, Search, Loader, Briefcase, TrendingUp, CheckCircle, Clock } from 'lucide-react';
import useAuthStore from '../store/authStore';
import api from '../utils/api';
import ProjectCard from '../components/ProjectCard';

const Dashboard = () => {
    const { user } = useAuthStore();
    const [projects, setProjects] = useState([]);
    const [myProjects, setMyProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

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

    // Stats
    const totalProjects = myProjects.length;
    const activeProjects = myProjects.filter(p => ['in_progress', 'funded', 'under_review'].includes(p.status)).length;
    const completedProjects = myProjects.filter(p => p.status === 'completed').length;

    // Filtered projects for freelancer
    const filteredProjects = projects.filter(p =>
        p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.description?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const stats = [
        { label: 'Total Projects', value: totalProjects, icon: Briefcase, color: '#6366f1' },
        { label: 'Active', value: activeProjects, icon: TrendingUp, color: '#f59e0b' },
        { label: 'Completed', value: completedProjects, icon: CheckCircle, color: '#10b981' },
    ];

    return (
        <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '2rem 1.5rem' }}>
            {/* Header */}
            <div className="animate-fade-in-up" style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
                marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem'
            }}>
                <div>
                    <h1 style={{ fontSize: '1.75rem', fontWeight: '800', letterSpacing: '-0.025em', marginBottom: '0.25rem' }}>
                        {isClient ? 'Client Dashboard' : 'Freelancer Dashboard'}
                    </h1>
                    <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9375rem' }}>
                        {isClient ? 'Manage your posted gigs and track progress.' : 'Find your next project and track your work.'}
                    </p>
                </div>
                {isClient ? (
                    <Link to="/create-project" className="btn-primary" style={{ textDecoration: 'none' }}>
                        <PlusCircle style={{ width: '18px', height: '18px' }} />
                        Post a New Gig
                    </Link>
                ) : (
                    <div style={{ position: 'relative', minWidth: '280px' }}>
                        <Search style={{
                            position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)',
                            width: '16px', height: '16px', color: 'var(--color-text-muted)'
                        }} />
                        <input
                            type="text" placeholder="Search projects..."
                            value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                            className="input-dark" style={{ paddingLeft: '2.5rem' }}
                        />
                    </div>
                )}
            </div>

            {/* Stats Row */}
            <div className="animate-fade-in-up stagger-1" style={{
                display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '1rem', marginBottom: '2rem'
            }}>
                {stats.map((stat, i) => (
                    <div key={stat.label} className="card" style={{
                        padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem'
                    }}>
                        <div style={{
                            width: '44px', height: '44px', borderRadius: 'var(--radius-md)',
                            background: `${stat.color}15`, display: 'flex',
                            alignItems: 'center', justifyContent: 'center', flexShrink: 0
                        }}>
                            <stat.icon style={{ width: '20px', height: '20px', color: stat.color }} />
                        </div>
                        <div>
                            <div style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--color-text-primary)' }}>
                                {stat.value}
                            </div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', fontWeight: '500' }}>
                                {stat.label}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Projects Section */}
            {isClient ? (
                <>
                    <h2 style={{ fontSize: '1.125rem', fontWeight: '700', marginBottom: '1rem', color: 'var(--color-text-secondary)' }}>
                        Your Projects
                    </h2>
                    {myProjects.length === 0 ? (
                        <div className="card" style={{ padding: '3rem', textAlign: 'center' }}>
                            <Clock style={{ width: '48px', height: '48px', color: 'var(--color-text-muted)', margin: '0 auto 1rem' }} />
                            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9375rem' }}>
                                You haven't posted any gigs yet. Click "Post a New Gig" to get started!
                            </p>
                        </div>
                    ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '1rem' }}>
                            {myProjects.map((project, i) => (
                                <ProjectCard key={project._id} project={project} userRole={user.role} index={i} />
                            ))}
                        </div>
                    )}
                </>
            ) : (
                <>
                    {/* Freelancer: Show active work */}
                    {myProjects.length > 0 && (
                        <div style={{ marginBottom: '2rem' }}>
                            <h2 style={{ fontSize: '1.125rem', fontWeight: '700', marginBottom: '1rem', color: 'var(--color-text-secondary)' }}>
                                Your Active Work
                            </h2>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '1rem' }}>
                                {myProjects.map((project, i) => (
                                    <ProjectCard key={project._id} project={project} userRole={user.role} index={i} />
                                ))}
                            </div>
                        </div>
                    )}

                    <h2 style={{ fontSize: '1.125rem', fontWeight: '700', marginBottom: '1rem', color: 'var(--color-text-secondary)' }}>
                        Browse Open Gigs ({filteredProjects.length})
                    </h2>
                    {filteredProjects.length === 0 ? (
                        <div className="card" style={{ padding: '3rem', textAlign: 'center' }}>
                            <Search style={{ width: '48px', height: '48px', color: 'var(--color-text-muted)', margin: '0 auto 1rem' }} />
                            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9375rem' }}>
                                {searchTerm ? 'No projects match your search.' : 'No open gigs available right now. Check back later!'}
                            </p>
                        </div>
                    ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '1rem' }}>
                            {filteredProjects.map((project, i) => (
                                <ProjectCard key={project._id} project={project} userRole={user.role} index={i} />
                            ))}
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default Dashboard;