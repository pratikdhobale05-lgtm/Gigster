import { Link, useNavigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import { Zap, LogOut, User, LayoutDashboard, Menu, X } from 'lucide-react';
import { useState } from 'react';

const Navbar = () => {
    const { isAuthenticated, user, logout } = useAuthStore();
    const navigate = useNavigate();
    const [mobileOpen, setMobileOpen] = useState(false);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <nav className="sticky top-0 z-50 glass-strong" style={{ borderBottom: '1px solid var(--color-border)' }}>
            <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: '64px' }}>

                    {/* Logo */}
                    <Link to={isAuthenticated ? "/dashboard" : "/login"} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none' }}>
                        <div style={{
                            width: '36px', height: '36px', borderRadius: 'var(--radius-md)',
                            background: 'var(--gradient-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}>
                            <Zap style={{ width: '20px', height: '20px', color: 'white' }} />
                        </div>
                        <span style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--color-text-primary)', letterSpacing: '-0.025em' }}>
                            Gigster
                        </span>
                    </Link>

                    {/* Desktop Nav */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }} className="hidden md:flex">
                        {isAuthenticated ? (
                            <>
                                <Link to="/dashboard" style={{
                                    display: 'flex', alignItems: 'center', gap: '0.375rem',
                                    color: 'var(--color-text-secondary)', textDecoration: 'none', fontSize: '0.875rem',
                                    fontWeight: '500', transition: 'color 0.2s', padding: '0.5rem 0.75rem',
                                    borderRadius: 'var(--radius-md)'
                                }}
                                    onMouseEnter={e => e.target.style.color = 'var(--color-text-primary)'}
                                    onMouseLeave={e => e.target.style.color = 'var(--color-text-secondary)'}
                                >
                                    <LayoutDashboard style={{ width: '16px', height: '16px' }} />
                                    Dashboard
                                </Link>

                                <div style={{ width: '1px', height: '24px', background: 'var(--color-border)' }} />

                                <div style={{
                                    display: 'flex', alignItems: 'center', gap: '0.5rem',
                                    fontSize: '0.8125rem', fontWeight: '500', color: 'var(--color-text-secondary)',
                                    background: 'var(--color-bg-base)', padding: '0.375rem 0.75rem',
                                    borderRadius: 'var(--radius-full)', border: '1px solid var(--color-border)'
                                }}>
                                    <div style={{
                                        width: '24px', height: '24px', borderRadius: '50%',
                                        background: 'var(--gradient-primary)', display: 'flex',
                                        alignItems: 'center', justifyContent: 'center'
                                    }}>
                                        <User style={{ width: '12px', height: '12px', color: 'white' }} />
                                    </div>
                                    <span style={{ color: 'var(--color-text-primary)' }}>{user?.name}</span>
                                    <span style={{
                                        color: 'var(--color-primary-light)', fontSize: '0.6875rem',
                                        textTransform: 'uppercase', fontWeight: '700', letterSpacing: '0.05em'
                                    }}>
                                        {user?.role}
                                    </span>
                                </div>

                                <button onClick={handleLogout} style={{
                                    display: 'flex', alignItems: 'center', gap: '0.375rem',
                                    color: 'var(--color-text-muted)', fontSize: '0.875rem', fontWeight: '500',
                                    background: 'none', border: 'none', cursor: 'pointer', transition: 'color 0.2s',
                                    padding: '0.5rem 0.75rem', borderRadius: 'var(--radius-md)'
                                }}
                                    onMouseEnter={e => e.target.style.color = 'var(--color-danger)'}
                                    onMouseLeave={e => e.target.style.color = 'var(--color-text-muted)'}
                                >
                                    <LogOut style={{ width: '16px', height: '16px' }} />
                                    Logout
                                </button>
                            </>
                        ) : (
                            <>
                                <Link to="/login" style={{
                                    color: 'var(--color-text-secondary)', textDecoration: 'none',
                                    fontSize: '0.875rem', fontWeight: '500', transition: 'color 0.2s'
                                }}
                                    onMouseEnter={e => e.target.style.color = 'var(--color-text-primary)'}
                                    onMouseLeave={e => e.target.style.color = 'var(--color-text-secondary)'}
                                >
                                    Log In
                                </Link>
                                <Link to="/register" className="btn-primary" style={{ textDecoration: 'none' }}>
                                    Get Started
                                </Link>
                            </>
                        )}
                    </div>

                    {/* Mobile toggle */}
                    <button
                        onClick={() => setMobileOpen(!mobileOpen)}
                        className="md:hidden"
                        style={{ background: 'none', border: 'none', color: 'var(--color-text-primary)', cursor: 'pointer' }}
                    >
                        {mobileOpen ? <X /> : <Menu />}
                    </button>
                </div>

                {/* Mobile menu */}
                {mobileOpen && (
                    <div className="md:hidden animate-slide-down" style={{
                        padding: '1rem 0', display: 'flex', flexDirection: 'column', gap: '0.5rem',
                        borderTop: '1px solid var(--color-border)'
                    }}>
                        {isAuthenticated ? (
                            <>
                                <Link to="/dashboard" onClick={() => setMobileOpen(false)}
                                    style={{ color: 'var(--color-text-secondary)', textDecoration: 'none', padding: '0.5rem 0', fontSize: '0.875rem' }}>
                                    Dashboard
                                </Link>
                                <button onClick={() => { handleLogout(); setMobileOpen(false); }}
                                    style={{ color: 'var(--color-danger)', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', padding: '0.5rem 0', fontSize: '0.875rem' }}>
                                    Logout
                                </button>
                            </>
                        ) : (
                            <>
                                <Link to="/login" onClick={() => setMobileOpen(false)}
                                    style={{ color: 'var(--color-text-secondary)', textDecoration: 'none', padding: '0.5rem 0' }}>
                                    Log In
                                </Link>
                                <Link to="/register" onClick={() => setMobileOpen(false)}
                                    className="btn-primary" style={{ textDecoration: 'none', textAlign: 'center' }}>
                                    Get Started
                                </Link>
                            </>
                        )}
                    </div>
                )}
            </div>
        </nav>
    );
};

export default Navbar;