import { DollarSign, Tag, Calendar, ArrowUpRight, User } from 'lucide-react';
import { Link } from 'react-router-dom';

const statusMap = {
    open: { label: 'Open', class: 'badge-open' },
    in_progress: { label: 'In Progress', class: 'badge-in-progress' },
    funded: { label: 'Funded', class: 'badge-funded' },
    under_review: { label: 'Under Review', class: 'badge-under-review' },
    completed: { label: 'Completed', class: 'badge-completed' },
    disputed: { label: 'Disputed', class: 'badge-disputed' },
    cancelled: { label: 'Cancelled', class: 'badge-cancelled' },
};

const ProjectCard = ({ project, userRole, index = 0 }) => {
    const deadline = project.deadline ? new Date(project.deadline).toLocaleDateString() : null;
    const status = statusMap[project.status] || statusMap.open;
    const clientName = project.clientId?.name || 'Unknown Client';

    return (
        <Link to={`/project/${project._id}`} style={{ textDecoration: 'none' }}>
            <div
                className={`card gradient-border animate-fade-in-up stagger-${Math.min(index + 1, 5)}`}
                style={{
                    padding: '1.5rem', cursor: 'pointer', display: 'flex', flexDirection: 'column',
                    gap: '1rem', height: '100%'
                }}
            >
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.75rem' }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <h3 style={{
                            fontSize: '1.0625rem', fontWeight: '700', color: 'var(--color-text-primary)',
                            marginBottom: '0.5rem', lineHeight: '1.4',
                            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
                        }}>
                            {project.title}
                        </h3>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                            <span className={`badge ${status.class}`}>
                                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'currentColor', display: 'inline-block' }} />
                                {status.label}
                            </span>
                            <span style={{
                                display: 'inline-flex', alignItems: 'center', gap: '0.25rem',
                                fontSize: '0.75rem', color: 'var(--color-text-muted)'
                            }}>
                                <Tag style={{ width: '12px', height: '12px' }} /> {project.category}
                            </span>
                        </div>
                    </div>
                    <div style={{
                        display: 'flex', alignItems: 'center', gap: '0.25rem',
                        fontSize: '1.125rem', fontWeight: '800',
                        background: 'linear-gradient(135deg, #10b981, #34d399)',
                        WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                        whiteSpace: 'nowrap'
                    }}>
                        <DollarSign style={{ width: '18px', height: '18px', color: '#10b981' }} />
                        {project.budget}
                    </div>
                </div>

                {/* Description */}
                <p style={{
                    color: 'var(--color-text-muted)', fontSize: '0.8125rem', lineHeight: '1.6',
                    flex: 1, overflow: 'hidden', display: '-webkit-box',
                    WebkitLineClamp: 3, WebkitBoxOrient: 'vertical'
                }}>
                    {project.description}
                </p>

                {/* Footer */}
                <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    borderTop: '1px solid var(--color-border)', paddingTop: '1rem'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                            <User style={{ width: '12px', height: '12px' }} />
                            {clientName}
                        </div>
                        {deadline && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                                <Calendar style={{ width: '12px', height: '12px' }} />
                                {deadline}
                            </div>
                        )}
                    </div>
                    <div style={{
                        display: 'flex', alignItems: 'center', gap: '0.25rem',
                        color: 'var(--color-primary-light)', fontSize: '0.8125rem', fontWeight: '600'
                    }}>
                        {userRole === 'client' ? 'Manage' : 'View'}
                        <ArrowUpRight style={{ width: '14px', height: '14px' }} />
                    </div>
                </div>
            </div>
        </Link>
    );
};

export default ProjectCard;