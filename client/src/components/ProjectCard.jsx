const statusMap = {
    open: { label: 'Open', class: 'badge-open', color: '#818cf8' },
    in_progress: { label: 'In Progress', class: 'badge-in-progress', color: '#fbbf24' },
    funded: { label: 'Funded', class: 'badge-funded', color: '#22d3ee' },
    under_review: { label: 'Under Review', class: 'badge-under-review', color: '#c084fc' },
    completed: { label: 'Completed', class: 'badge-completed', color: '#34d399' },
    disputed: { label: 'Disputed', class: 'badge-disputed', color: '#f87171' },
    cancelled: { label: 'Cancelled', class: 'badge-cancelled', color: '#94a3b8' },
};

import { DollarSign, Tag, Calendar, ArrowUpRight, User, CircleCheck, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

const ProjectCard = ({ project, userRole, index = 0 }) => {
    const deadline = project.deadline ? new Date(project.deadline).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : null;
    const status = statusMap[project.status] || statusMap.open;
    const clientName = project.clientId?.name || 'Unknown Client';
    
    // Generate mock skill badges based on category to make the card look highly realistic and clean
    const getMockSkills = (category) => {
        const cat = category?.toLowerCase() || '';
        if (cat.includes('web') || cat.includes('mern') || cat.includes('react') || cat.includes('commerce')) {
            return ['React', 'Node.js', 'MongoDB', 'REST API'];
        }
        if (cat.includes('design') || cat.includes('ui') || cat.includes('ux')) {
            return ['Figma', 'UI Design', 'Wireframing', 'TailwindCSS'];
        }
        if (cat.includes('ai') || cat.includes('chat') || cat.includes('data')) {
            return ['OpenAI API', 'Python', 'Vector DB', 'LangChain'];
        }
        return ['Software Eng', 'Git', 'Clean Code'];
    };

    const skills = getMockSkills(project.category);

    return (
        <Link to={`/project/${project._id}`} style={{ textDecoration: 'none' }}>
            <div
                className={`card gradient-border animate-fade-in-up stagger-${Math.min(index + 1, 5)}`}
                style={{
                    padding: '1.75rem',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    height: '100%',
                    background: 'rgba(30, 41, 59, 0.45)',
                    backdropFilter: 'blur(12px)',
                    transition: 'transform 0.3s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.3s ease, border-color 0.3s ease',
                    position: 'relative'
                }}
                onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-4px)';
                    e.currentTarget.style.boxShadow = 'var(--shadow-md)';
                    e.currentTarget.style.borderColor = 'var(--color-primary-light)';
                }}
                onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                    e.currentTarget.style.borderColor = 'var(--color-border)';
                }}
            >
                <div>
                    {/* Header */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.75rem', marginBottom: '1rem' }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                            <h3 style={{
                                fontSize: '1.125rem',
                                fontWeight: '800',
                                color: 'var(--color-text-primary)',
                                marginBottom: '0.5rem',
                                lineHeight: '1.3',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                                letterSpacing: '-0.015em',
                                fontFamily: "'Plus Jakarta Sans', sans-serif"
                            }}>
                                {project.title}
                            </h3>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                                <span className={`badge ${status.class}`} style={{
                                    border: `1px solid ${status.color}30`,
                                    padding: '0.25rem 0.625rem'
                                }}>
                                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: status.color, display: 'inline-block' }} />
                                    {status.label}
                                </span>
                                <span style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '0.25rem',
                                    fontSize: '0.75rem',
                                    color: 'var(--color-text-muted)',
                                    background: 'rgba(255, 255, 255, 0.03)',
                                    padding: '0.2rem 0.5rem',
                                    borderRadius: 'var(--radius-sm)'
                                }}>
                                    <Tag style={{ width: '12px', height: '12px' }} /> {project.category}
                                </span>
                            </div>
                        </div>
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '1px',
                            fontSize: '1.25rem',
                            fontWeight: '900',
                            color: '#34d399',
                            background: 'rgba(52, 211, 153, 0.08)',
                            padding: '0.375rem 0.75rem',
                            borderRadius: 'var(--radius-md)',
                            border: '1px solid rgba(52, 211, 153, 0.15)',
                            whiteSpace: 'nowrap',
                            fontFamily: "'Plus Jakarta Sans', sans-serif"
                        }}>
                            <DollarSign style={{ width: '16px', height: '16px', color: '#34d399', flexShrink: 0 }} />
                            {project.budget.toLocaleString()}
                        </div>
                    </div>

                    {/* Description */}
                    <p style={{
                        color: 'var(--color-text-secondary)',
                        fontSize: '0.875rem',
                        lineHeight: '1.6',
                        marginBottom: '1.25rem',
                        display: '-webkit-box',
                        WebkitLineClamp: 3,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden'
                    }}>
                        {project.description}
                    </p>

                    {/* Skills Badges */}
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
                        {skills.map(skill => (
                            <span key={skill} style={{
                                fontSize: '0.75rem',
                                color: 'var(--color-text-muted)',
                                border: '1px solid var(--color-border)',
                                padding: '0.15rem 0.5rem',
                                borderRadius: 'var(--radius-sm)',
                                background: 'rgba(15, 23, 42, 0.2)'
                            }}>
                                {skill}
                            </span>
                        ))}
                    </div>
                </div>

                {/* Footer */}
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    borderTop: '1px solid var(--color-border)',
                    paddingTop: '1.25rem',
                    marginTop: 'auto'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.75rem', color: 'var(--color-text-muted)', fontWeight: '500' }}>
                            <User style={{ width: '13px', height: '13px', color: 'var(--color-text-muted)' }} />
                            {clientName}
                        </div>
                        {deadline && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.75rem', color: 'var(--color-text-muted)', fontWeight: '500' }}>
                                <Calendar style={{ width: '13px', height: '13px', color: 'var(--color-text-muted)' }} />
                                {deadline}
                            </div>
                        )}
                    </div>
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.25rem',
                        color: 'var(--color-primary-light)',
                        fontSize: '0.8125rem',
                        fontWeight: '700',
                        letterSpacing: '-0.01em',
                        transition: 'color 0.2s ease'
                    }}>
                        {userRole === 'client' ? 'Manage Gig' : 'View Details'}
                        <ArrowUpRight style={{ width: '14px', height: '14px' }} />
                    </div>
                </div>
            </div>
        </Link>
    );
};

export default ProjectCard;