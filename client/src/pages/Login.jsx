import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import useAuthStore from '../store/authStore';
import { Mail, Lock, ArrowRight, Zap } from 'lucide-react';

const Login = () => {
    const navigate = useNavigate();
    const login = useAuthStore((state) => state.login);

    const [formData, setFormData] = useState({ email: '', password: '' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const response = await api.post('/auth/login', formData);
            const user = response.data.data.user;
            login(user, response.data.token);
            navigate(user.role === 'admin' ? '/admin' : '/dashboard');
        } catch (err) {
            setError(err.response?.data?.message || 'Invalid email or password');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '2rem', position: 'relative', overflow: 'hidden'
        }}>
            {/* Background glow */}
            <div style={{
                position: 'absolute', width: '500px', height: '500px', borderRadius: '50%',
                background: 'var(--gradient-glow)', top: '10%', left: '50%', transform: 'translateX(-50%)',
                pointerEvents: 'none'
            }} />

            <div className="animate-fade-in-up" style={{
                maxWidth: '420px', width: '100%', position: 'relative', zIndex: 1
            }}>
                {/* Logo */}
                <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                    <div style={{
                        width: '56px', height: '56px', borderRadius: 'var(--radius-lg)',
                        background: 'var(--gradient-primary)', display: 'inline-flex',
                        alignItems: 'center', justifyContent: 'center', marginBottom: '1rem'
                    }}>
                        <Zap style={{ width: '28px', height: '28px', color: 'white' }} />
                    </div>
                    <h1 style={{ fontSize: '1.75rem', fontWeight: '800', marginBottom: '0.5rem', letterSpacing: '-0.025em' }}>
                        Welcome back
                    </h1>
                    <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9375rem' }}>
                        Sign in to your Gigster account
                    </p>
                </div>

                {/* Card */}
                <div className="card" style={{ padding: '2rem' }}>
                    {error && (
                        <div style={{
                            background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)',
                            color: '#f87171', padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)',
                            marginBottom: '1.5rem', fontSize: '0.875rem', textAlign: 'center'
                        }}>
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: '600', color: 'var(--color-text-secondary)', marginBottom: '0.5rem' }}>
                                Email Address
                            </label>
                            <div style={{ position: 'relative' }}>
                                <Mail style={{
                                    position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)',
                                    width: '16px', height: '16px', color: 'var(--color-text-muted)'
                                }} />
                                <input
                                    type="email" name="email" required onChange={handleChange}
                                    placeholder="you@example.com"
                                    className="input-dark"
                                    style={{ paddingLeft: '2.5rem' }}
                                />
                            </div>
                        </div>

                        <div>
                            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: '600', color: 'var(--color-text-secondary)', marginBottom: '0.5rem' }}>
                                Password
                            </label>
                            <div style={{ position: 'relative' }}>
                                <Lock style={{
                                    position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)',
                                    width: '16px', height: '16px', color: 'var(--color-text-muted)'
                                }} />
                                <input
                                    type="password" name="password" required onChange={handleChange}
                                    autoComplete="current-password" placeholder="••••••••"
                                    className="input-dark"
                                    style={{ paddingLeft: '2.5rem' }}
                                />
                            </div>
                        </div>

                        <button type="submit" className="btn-primary" disabled={loading} style={{
                            width: '100%', justifyContent: 'center', padding: '0.75rem', marginTop: '0.5rem', fontSize: '0.9375rem'
                        }}>
                            {loading ? 'Signing in...' : (
                                <>Sign In <ArrowRight style={{ width: '16px', height: '16px' }} /></>
                            )}
                        </button>
                    </form>
                </div>

                <p style={{ marginTop: '1.5rem', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
                    Don't have an account?{' '}
                    <Link to="/register" style={{ color: 'var(--color-primary-light)', fontWeight: '600', textDecoration: 'none' }}>
                        Create one
                    </Link>
                </p>
            </div>
        </div>
    );
};

export default Login;