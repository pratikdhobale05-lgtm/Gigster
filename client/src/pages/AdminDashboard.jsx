import { useState, useEffect, useCallback } from 'react';
import {
    Users, FolderOpen, CreditCard, AlertTriangle, Star,
    TrendingUp, Activity, CheckCircle, XCircle, Clock,
    RefreshCw, ShieldCheck, BarChart2,
} from 'lucide-react';
import api from '../utils/api';

// ─── Helpers ───────────────────────────────────────────────
const fmt = (n) => new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(n || 0);
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
const fmtTime = (d) => d ? new Date(d).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '';

const STATUS_COLORS = {
    open: '#6366f1',
    in_progress: '#f59e0b',
    funded: '#06b6d4',
    under_review: '#a78bfa',
    completed: '#10b981',
    disputed: '#ef4444',
    cancelled: '#64748b',
    funded_escrow: '#06b6d4',
    released: '#10b981',
    refunded: '#64748b',
    client: '#818cf8',
    freelancer: '#34d399',
    admin: '#f43f5e',
    review: '#fbbf24',
};

const Badge = ({ label, status }) => {
    const color = STATUS_COLORS[status] || '#64748b';
    return (
        <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 5,
            padding: '0.2rem 0.65rem', borderRadius: 100, fontSize: '0.7rem',
            fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase',
            background: `${color}1a`, color, border: `1px solid ${color}33`,
        }}>
            <span style={{ width: 5, height: 5, borderRadius: '50%', background: color, flexShrink: 0 }} />
            {label}
        </span>
    );
};

// ─── KPI Card ──────────────────────────────────────────────
const KpiCard = ({ icon: Icon, label, value, sub, color = '#6366f1', gradient }) => (
    <div style={{
        background: gradient || 'linear-gradient(135deg, #1a2235, #141b2d)',
        border: `1px solid ${color}30`,
        borderRadius: 16, padding: '1.5rem',
        display: 'flex', gap: '1rem', alignItems: 'center',
        boxShadow: `0 4px 24px ${color}10`,
        transition: 'transform 0.2s',
    }}
        onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
        onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
    >
        <div style={{
            width: 52, height: 52, borderRadius: 14, flexShrink: 0,
            background: `${color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: `1px solid ${color}30`,
        }}>
            <Icon size={24} style={{ color }} />
        </div>
        <div>
            <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginBottom: 2, fontWeight: 600 }}>{label}</p>
            <p style={{ fontSize: '1.75rem', fontWeight: 900, color: 'var(--color-text-primary)', lineHeight: 1 }}>{value}</p>
            {sub && <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: 4 }}>{sub}</p>}
        </div>
    </div>
);

// ─── Section Header ────────────────────────────────────────
const SectionTitle = ({ children }) => (
    <h2 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-text-secondary)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: 8 }}>
        {children}
    </h2>
);

// ─── Simple Table ──────────────────────────────────────────
const Table = ({ headers, children, empty }) => (
    <div style={{ overflowX: 'auto', borderRadius: 12, border: '1px solid var(--color-border)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8125rem' }}>
            <thead>
                <tr style={{ background: 'var(--color-bg-elevated)' }}>
                    {headers.map(h => (
                        <th key={h} style={{
                            padding: '0.75rem 1rem', textAlign: 'left',
                            fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.06em',
                            color: 'var(--color-text-muted)', textTransform: 'uppercase',
                            borderBottom: '1px solid var(--color-border)',
                        }}>{h}</th>
                    ))}
                </tr>
            </thead>
            <tbody>
                {children}
            </tbody>
        </table>
        {empty && (
            <div style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
                {empty}
            </div>
        )}
    </div>
);

const Td = ({ children, muted }) => (
    <td style={{
        padding: '0.75rem 1rem',
        borderBottom: '1px solid var(--color-border)',
        color: muted ? 'var(--color-text-muted)' : 'var(--color-text-secondary)',
        verticalAlign: 'middle',
    }}>{children}</td>
);

const Tr = ({ children, onClick }) => (
    <tr
        onClick={onClick}
        style={{ transition: 'background 0.15s', cursor: onClick ? 'pointer' : 'default' }}
        onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
    >{children}</tr>
);

// ─── Project Status Bar Chart ──────────────────────────────
const ProjectStatusChart = ({ byStatus }) => {
    const statuses = ['open', 'in_progress', 'funded', 'under_review', 'completed', 'disputed', 'cancelled'];
    const max = Math.max(...statuses.map(s => byStatus[s] || 0), 1);
    const labels = {
        open: 'Open', in_progress: 'In Progress', funded: 'Funded',
        under_review: 'Review', completed: 'Completed', disputed: 'Disputed', cancelled: 'Cancelled',
    };
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {statuses.map(s => {
                const val = byStatus[s] || 0;
                const pct = (val / max) * 100;
                return (
                    <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span style={{ width: 88, fontSize: '0.75rem', color: 'var(--color-text-muted)', flexShrink: 0, textAlign: 'right' }}>
                            {labels[s]}
                        </span>
                        <div style={{ flex: 1, height: 10, background: 'rgba(255,255,255,0.06)', borderRadius: 100, overflow: 'hidden' }}>
                            <div style={{
                                height: '100%', width: `${pct}%`, borderRadius: 100,
                                background: STATUS_COLORS[s] || '#6366f1',
                                transition: 'width 0.8s cubic-bezier(0.16, 1, 0.3, 1)',
                            }} />
                        </div>
                        <span style={{ width: 28, fontSize: '0.8rem', fontWeight: 700, color: STATUS_COLORS[s] || '#fff', textAlign: 'right', flexShrink: 0 }}>
                            {val}
                        </span>
                    </div>
                );
            })}
        </div>
    );
};

// ─── Activity Feed ─────────────────────────────────────────
const ActivityFeed = ({ events }) => {
    const [page, setPage] = useState(1);
    const pageSize = 15;
    const pageCount = Math.ceil((events?.length || 0) / pageSize);
    const currentPage = Math.min(page, Math.max(pageCount, 1));
    const startIndex = (currentPage - 1) * pageSize;
    const visibleEvents = events?.slice(startIndex, startIndex + pageSize) || [];

    if (!events?.length) return (
        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', textAlign: 'center', padding: '2rem 0' }}>
            No recent activity yet.
        </p>
    );
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {visibleEvents.map((e, i) => (
                <div key={i} style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '0.625rem 0.75rem', borderRadius: 10,
                    transition: 'background 0.15s',
                }}
                    onMouseEnter={ev => ev.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
                    onMouseLeave={ev => ev.currentTarget.style.background = 'transparent'}
                >
                    <span style={{ fontSize: '1.1rem', flexShrink: 0 }}>{e.icon}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ margin: 0, fontSize: '0.8125rem', color: 'var(--color-text-secondary)', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {e.label}
                        </p>
                        <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{e.detail}</p>
                    </div>
                    <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', flexShrink: 0, whiteSpace: 'nowrap' }}>
                        {fmtDate(e.timestamp)} {fmtTime(e.timestamp)}
                    </span>
                </div>
            ))}
            {pageCount > 1 && (
                <div style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    gap: 12, padding: '0.75rem 0.25rem 0.25rem',
                    borderTop: '1px solid var(--color-border)', marginTop: 8,
                }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                        Showing {startIndex + 1}–{Math.min(startIndex + pageSize, events.length)} of {events.length}
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <button
                            type="button"
                            onClick={() => setPage(currentPage - 1)}
                            disabled={currentPage === 1}
                            style={{
                                padding: '0.4rem 0.75rem', borderRadius: 8,
                                background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)',
                                color: currentPage === 1 ? 'var(--color-text-muted)' : 'var(--color-text-secondary)',
                                cursor: currentPage === 1 ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
                            }}
                        >
                            Previous
                        </button>
                        <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', whiteSpace: 'nowrap' }}>
                            Page {currentPage} of {pageCount}
                        </span>
                        <button
                            type="button"
                            onClick={() => setPage(currentPage + 1)}
                            disabled={currentPage === pageCount}
                            style={{
                                padding: '0.4rem 0.75rem', borderRadius: 8,
                                background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)',
                                color: currentPage === pageCount ? 'var(--color-text-muted)' : 'var(--color-text-secondary)',
                                cursor: currentPage === pageCount ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
                            }}
                        >
                            Next
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

// ═══════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════
const AdminDashboard = () => {
    const [activeTab, setActiveTab] = useState('overview');
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    // Data state
    const [stats, setStats] = useState(null);
    const [activity, setActivity] = useState([]);
    const [users, setUsers] = useState([]);
    const [projects, setProjects] = useState([]);
    const [escrows, setEscrows] = useState([]);
    const [disputes, setDisputes] = useState([]);
    const [reviews, setReviews] = useState([]);
    const [resolvingId, setResolvingId] = useState(null);

    const fetchAll = useCallback(async (isRefresh = false) => {
        if (isRefresh) setRefreshing(true);
        else setLoading(true);
        try {
            const [
                statsRes, activityRes, usersRes,
                projectsRes, escrowsRes, disputesRes, reviewsRes,
            ] = await Promise.all([
                api.get('/admin/stats'),
                api.get('/admin/activity'),
                api.get('/admin/users'),
                api.get('/admin/projects'),
                api.get('/admin/escrows'),
                api.get('/admin/disputes'),
                api.get('/admin/reviews'),
            ]);
            setStats(statsRes.data.data);
            setActivity(activityRes.data.data);
            setUsers(usersRes.data.data);
            setProjects(projectsRes.data.data);
            setEscrows(escrowsRes.data.data);
            setDisputes(disputesRes.data.data);
            setReviews(reviewsRes.data.data);
        } catch (err) {
            console.error('Admin fetch error:', err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => { fetchAll(); }, [fetchAll]);

    const handleResolveDispute = async (escrowId, resolution) => {
        if (!window.confirm(`Mark this dispute as "${resolution}"?`)) return;
        setResolvingId(escrowId);
        try {
            await api.patch(`/admin/disputes/${escrowId}`, { resolution });
            await fetchAll(true);
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to resolve dispute');
        } finally {
            setResolvingId(null);
        }
    };

    const tabs = [
        { id: 'overview',  label: 'Overview',  icon: BarChart2 },
        { id: 'users',     label: 'Users',     icon: Users },
        { id: 'projects',  label: 'Projects',  icon: FolderOpen },
        { id: 'payments',  label: 'Payments',  icon: CreditCard },
        { id: 'disputes',  label: 'Disputes',  icon: AlertTriangle, badge: disputes.length },
        { id: 'reviews',   label: 'Reviews',   icon: Star },
    ];

    // ── Loading screen ──
    if (loading) return (
        <div style={{ minHeight: '80vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
            <div style={{ width: 52, height: 52, borderRadius: 14, background: 'var(--gradient-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', animation: 'pulse 1.5s ease-in-out infinite' }}>
                <ShieldCheck size={28} style={{ color: '#fff' }} />
            </div>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>Loading admin dashboard…</p>
        </div>
    );

    return (
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '2rem 1.5rem 4rem' }}>

            {/* ── Page Header ── */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(244,63,94,0.12)', border: '1px solid rgba(244,63,94,0.25)', borderRadius: 100, padding: '0.3rem 0.875rem', marginBottom: '0.75rem' }}>
                        <ShieldCheck size={13} style={{ color: '#f43f5e' }} />
                        <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#f43f5e', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Admin Panel</span>
                    </div>
                    <h1 style={{ fontSize: '1.75rem', fontWeight: 900, margin: 0, marginBottom: 6 }}>Platform Dashboard</h1>
                    <p style={{ color: 'var(--color-text-muted)', margin: 0, fontSize: '0.875rem' }}>Monitor all platform activity in real-time</p>
                </div>
                <button
                    onClick={() => fetchAll(true)}
                    disabled={refreshing}
                    style={{
                        display: 'flex', alignItems: 'center', gap: 6,
                        padding: '0.5rem 1rem', borderRadius: 10,
                        background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)',
                        color: 'var(--color-text-secondary)', cursor: 'pointer', fontSize: '0.8125rem',
                        fontWeight: 600, fontFamily: 'inherit', transition: 'all 0.2s',
                    }}
                >
                    <RefreshCw size={14} style={{ animation: refreshing ? 'spin 0.7s linear infinite' : 'none' }} />
                    {refreshing ? 'Refreshing…' : 'Refresh'}
                </button>
            </div>

            {/* ── Tab Bar ── */}
            <div style={{
                display: 'flex', gap: 4, background: 'var(--color-bg-base)',
                border: '1px solid var(--color-border)', borderRadius: 14,
                padding: 6, marginBottom: '2rem', flexWrap: 'wrap',
            }}>
                {tabs.map(({ id, label, icon: Icon, badge }) => (
                    <button
                        key={id}
                        onClick={() => setActiveTab(id)}
                        style={{
                            display: 'flex', alignItems: 'center', gap: 7,
                            padding: '0.5rem 1rem', borderRadius: 10,
                            border: 'none', cursor: 'pointer', fontSize: '0.8125rem', fontWeight: 600,
                            fontFamily: 'inherit', transition: 'all 0.2s', position: 'relative',
                            background: activeTab === id ? 'var(--gradient-primary)' : 'transparent',
                            color: activeTab === id ? '#fff' : 'var(--color-text-muted)',
                            boxShadow: activeTab === id ? '0 2px 12px rgba(99,102,241,0.35)' : 'none',
                        }}
                    >
                        <Icon size={15} />
                        {label}
                        {badge > 0 && (
                            <span style={{
                                background: '#ef4444', color: '#fff', borderRadius: 100,
                                padding: '0 5px', fontSize: '0.65rem', fontWeight: 800,
                                minWidth: 16, textAlign: 'center', lineHeight: '16px',
                            }}>{badge}</span>
                        )}
                    </button>
                ))}
            </div>

            {/* ══════════════════════════════════════
                TAB: OVERVIEW
            ══════════════════════════════════════ */}
            {activeTab === 'overview' && stats && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                    {/* KPI grid */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
                        <KpiCard icon={Users}       label="Total Users"       value={fmt(stats.users.total)}            sub={`${stats.users.clients} clients · ${stats.users.freelancers} freelancers`} color="#6366f1" />
                        <KpiCard icon={FolderOpen}  label="Total Projects"    value={fmt(stats.projects.total)}         sub={`${stats.projects.byStatus?.completed || 0} completed`}                  color="#10b981" />
                        <KpiCard icon={CreditCard}  label="Funds in Escrow"   value={`₹${fmt(stats.escrow.funded.amount)}`}   sub={`${stats.escrow.funded.count} transactions`}                    color="#06b6d4" />
                        <KpiCard icon={TrendingUp}  label="Funds Released"    value={`₹${fmt(stats.escrow.released.amount)}`} sub={`${stats.escrow.released.count} payouts`}                        color="#10b981" />
                        <KpiCard icon={AlertTriangle} label="Active Disputes" value={fmt(stats.activeDisputes)}         sub="Funds locked"                                                            color="#ef4444" />
                        <KpiCard icon={Star}        label="Avg Platform Rating" value={`${stats.reviews.avgRating} ★`} sub={`${stats.reviews.total} reviews`}                                       color="#fbbf24" />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                        {/* Project status chart */}
                        <div style={{ background: 'var(--color-bg-base)', border: '1px solid var(--color-border)', borderRadius: 16, padding: '1.5rem' }}>
                            <SectionTitle><BarChart2 size={16} /> Project Status Breakdown</SectionTitle>
                            <ProjectStatusChart byStatus={stats.projects.byStatus} />
                        </div>

                        {/* Escrow summary */}
                        <div style={{ background: 'var(--color-bg-base)', border: '1px solid var(--color-border)', borderRadius: 16, padding: '1.5rem' }}>
                            <SectionTitle><CreditCard size={16} /> Escrow Summary</SectionTitle>
                            {['funded', 'released', 'disputed', 'refunded'].map(s => (
                                <div key={s} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.625rem 0', borderBottom: '1px solid var(--color-border)' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                        <span style={{ width: 8, height: 8, borderRadius: '50%', background: STATUS_COLORS[s] || '#ccc', flexShrink: 0 }} />
                                        <span style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', textTransform: 'capitalize' }}>{s}</span>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <span style={{ fontSize: '0.9rem', fontWeight: 700, color: STATUS_COLORS[s] }}>₹{fmt(stats.escrow[s]?.amount)}</span>
                                        <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', marginLeft: 6 }}>({stats.escrow[s]?.count || 0})</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Activity feed */}
                    <div style={{ background: 'var(--color-bg-base)', border: '1px solid var(--color-border)', borderRadius: 16, padding: '1.5rem' }}>
                        <SectionTitle><Activity size={16} /> Recent Platform Activity</SectionTitle>
                        <ActivityFeed events={activity} />
                    </div>
                </div>
            )}

            {/* ══════════════════════════════════════
                TAB: USERS
            ══════════════════════════════════════ */}
            {activeTab === 'users' && (
                <div>
                    <SectionTitle><Users size={16} /> All Users ({users.length})</SectionTitle>
                    <Table
                        headers={['Name', 'Email', 'Role', 'Rating', 'Reviews', 'Joined']}
                        empty={users.length === 0 ? 'No users found.' : null}
                    >
                        {users.map(u => (
                            <Tr key={u._id}>
                                <Td>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                        <div style={{
                                            width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
                                            background: `${STATUS_COLORS[u.role]}25`,
                                            border: `1px solid ${STATUS_COLORS[u.role]}40`,
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            fontSize: '0.75rem', fontWeight: 700, color: STATUS_COLORS[u.role],
                                        }}>
                                            {u.name?.charAt(0)?.toUpperCase()}
                                        </div>
                                        <span style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>{u.name}</span>
                                    </div>
                                </Td>
                                <Td muted>{u.email}</Td>
                                <Td><Badge label={u.role} status={u.role} /></Td>
                                <Td>
                                    {u.ratingsAverage > 0
                                        ? <span style={{ color: '#fbbf24', fontWeight: 700 }}>★ {u.ratingsAverage}</span>
                                        : <span style={{ color: 'var(--color-text-muted)' }}>—</span>}
                                </Td>
                                <Td muted>{u.ratingsQuantity || 0}</Td>
                                <Td muted>{fmtDate(u.createdAt)}</Td>
                            </Tr>
                        ))}
                    </Table>
                </div>
            )}

            {/* ══════════════════════════════════════
                TAB: PROJECTS
            ══════════════════════════════════════ */}
            {activeTab === 'projects' && (
                <div>
                    <SectionTitle><FolderOpen size={16} /> All Projects ({projects.length})</SectionTitle>
                    <Table
                        headers={['Title', 'Status', 'Budget', 'Client', 'Freelancer', 'Created']}
                        empty={projects.length === 0 ? 'No projects yet.' : null}
                    >
                        {projects.map(p => (
                            <Tr key={p._id}>
                                <Td>
                                    <span style={{ fontWeight: 600, color: 'var(--color-text-primary)', display: 'block', maxWidth: 200, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                        {p.title}
                                    </span>
                                    <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>{p.category}</span>
                                </Td>
                                <Td><Badge label={p.status?.replace('_', ' ')} status={p.status} /></Td>
                                <Td><span style={{ color: '#34d399', fontWeight: 700 }}>₹{fmt(p.budget)}</span></Td>
                                <Td muted>{p.clientId?.name || '—'}</Td>
                                <Td muted>{p.freelancerId?.name || <span style={{ color: 'var(--color-text-muted)', fontStyle: 'italic' }}>Unassigned</span>}</Td>
                                <Td muted>{fmtDate(p.createdAt)}</Td>
                            </Tr>
                        ))}
                    </Table>
                </div>
            )}

            {/* ══════════════════════════════════════
                TAB: PAYMENTS
            ══════════════════════════════════════ */}
            {activeTab === 'payments' && (
                <div>
                    <SectionTitle><CreditCard size={16} /> All Escrow Transactions ({escrows.length})</SectionTitle>
                    <Table
                        headers={['Project', 'Amount', 'Status', 'Client', 'Freelancer', 'Date']}
                        empty={escrows.length === 0 ? 'No payment transactions yet.' : null}
                    >
                        {escrows.map(e => (
                            <Tr key={e._id}>
                                <Td>
                                    <span style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>{e.project?.title || '—'}</span>
                                </Td>
                                <Td><span style={{ color: '#34d399', fontWeight: 800, fontSize: '0.9rem' }}>₹{fmt(e.amount)}</span></Td>
                                <Td><Badge label={e.status} status={e.status === 'funded' ? 'funded_escrow' : e.status} /></Td>
                                <Td muted>{e.client?.name || '—'}</Td>
                                <Td muted>{e.freelancer?.name || '—'}</Td>
                                <Td muted>{fmtDate(e.createdAt)}</Td>
                            </Tr>
                        ))}
                    </Table>
                </div>
            )}

            {/* ══════════════════════════════════════
                TAB: DISPUTES
            ══════════════════════════════════════ */}
            {activeTab === 'disputes' && (
                <div>
                    <SectionTitle><AlertTriangle size={16} /> Active Disputes ({disputes.length})</SectionTitle>
                    {disputes.length === 0 ? (
                        <div style={{ background: 'var(--color-bg-base)', border: '1px solid var(--color-border)', borderRadius: 16, padding: '3rem', textAlign: 'center' }}>
                            <CheckCircle size={40} style={{ color: '#10b981', margin: '0 auto 1rem' }} />
                            <p style={{ color: '#34d399', fontWeight: 700, marginBottom: 4 }}>No Active Disputes</p>
                            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>All platform transactions are in good standing.</p>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {disputes.map(d => (
                                <div key={d._id} style={{
                                    background: 'linear-gradient(135deg, rgba(239,68,68,0.05), rgba(239,68,68,0.02))',
                                    border: '1px solid rgba(239,68,68,0.2)',
                                    borderRadius: 16, padding: '1.5rem',
                                }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1rem' }}>
                                        <div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                                                <AlertTriangle size={16} style={{ color: '#ef4444' }} />
                                                <span style={{ fontWeight: 700, color: 'var(--color-text-primary)', fontSize: '1rem' }}>
                                                    {d.project?.title || 'Unknown Project'}
                                                </span>
                                                <Badge label="Disputed" status="disputed" />
                                            </div>
                                            <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
                                                <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                                                    <strong style={{ color: '#818cf8' }}>Client:</strong> {d.client?.name || '—'} ({d.client?.email || '—'})
                                                </span>
                                                <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                                                    <strong style={{ color: '#34d399' }}>Freelancer:</strong> {d.freelancer?.name || '—'} ({d.freelancer?.email || '—'})
                                                </span>
                                            </div>
                                        </div>
                                        <div style={{ textAlign: 'right' }}>
                                            <p style={{ fontSize: '1.5rem', fontWeight: 900, color: '#ef4444', margin: 0 }}>₹{fmt(d.amount)}</p>
                                            <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', margin: 0 }}>Locked in Escrow</p>
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', paddingTop: '1rem', borderTop: '1px solid rgba(239,68,68,0.15)' }}>
                                        <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginRight: 'auto' }}>
                                            <Clock size={12} style={{ verticalAlign: 'middle', marginRight: 4 }} />
                                            Raised on {fmtDate(d.createdAt)}
                                        </span>
                                        <button
                                            onClick={() => handleResolveDispute(d._id, 'released')}
                                            disabled={resolvingId === d._id}
                                            style={{
                                                display: 'flex', alignItems: 'center', gap: 6,
                                                padding: '0.5rem 1rem', borderRadius: 8,
                                                background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)',
                                                color: '#34d399', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 700, fontFamily: 'inherit',
                                                transition: 'all 0.2s',
                                            }}
                                        >
                                            <CheckCircle size={14} />
                                            Release to Freelancer
                                        </button>
                                        <button
                                            onClick={() => handleResolveDispute(d._id, 'refunded')}
                                            disabled={resolvingId === d._id}
                                            style={{
                                                display: 'flex', alignItems: 'center', gap: 6,
                                                padding: '0.5rem 1rem', borderRadius: 8,
                                                background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)',
                                                color: '#818cf8', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 700, fontFamily: 'inherit',
                                                transition: 'all 0.2s',
                                            }}
                                        >
                                            <XCircle size={14} />
                                            Refund to Client
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* ══════════════════════════════════════
                TAB: REVIEWS
            ══════════════════════════════════════ */}
            {activeTab === 'reviews' && (
                <div>
                    <SectionTitle><Star size={16} /> All Reviews ({reviews.length})</SectionTitle>
                    <Table
                        headers={['Project', 'Reviewer', 'Reviewee', 'Rating', 'Comment', 'Date']}
                        empty={reviews.length === 0 ? 'No reviews yet.' : null}
                    >
                        {reviews.map(r => (
                            <Tr key={r._id}>
                                <Td>
                                    <span style={{ fontWeight: 600, color: 'var(--color-text-primary)', display: 'block', maxWidth: 140, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                        {r.project?.title || '—'}
                                    </span>
                                </Td>
                                <Td muted>{r.reviewer?.name || '—'}</Td>
                                <Td muted>{r.reviewee?.name || '—'}</Td>
                                <Td>
                                    <span style={{ color: '#fbbf24', fontWeight: 800 }}>{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</span>
                                </Td>
                                <Td>
                                    <span style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem', display: 'block', maxWidth: 220, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                        {r.comment}
                                    </span>
                                </Td>
                                <Td muted>{fmtDate(r.createdAt)}</Td>
                            </Tr>
                        ))}
                    </Table>
                </div>
            )}

            {/* Spin keyframe for refresh icon */}
            <style>{`
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
                @keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.5; } }
            `}</style>
        </div>
    );
};

export default AdminDashboard;
