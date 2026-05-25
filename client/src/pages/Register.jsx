import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import useAuthStore from '../store/authStore';
import { Mail, Lock, User, ArrowRight, Zap, Briefcase, Code } from 'lucide-react';

const Register = () => {
    const navigate = useNavigate();
    const login = useAuthStore((state) => state.login);

    const [formData, setFormData] = useState({
        name: '', email: '', password: '', role: 'client',
    });
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
            const response = await api.post('/auth/register', formData);
            login(response.data.data.user, response.data.token);
            navigate('/dashboard');
        } catch (err) {
            setError(err.response?.data?.message || 'Registration failed. Try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '2rem', position: 'relative', overflow: 'hidden'
        }}>
            <div style={{
                position: 'absolute', width: '500px', height: '500px', borderRadius: '50%',
                background: 'radial-gradient(ellipse at center, rgba(6,182,212,0.12) 0%, transparent 70%)',
                top: '10%', left: '50%', transform: 'translateX(-50%)', pointerEvents: 'none'
            }} />

            <div className="animate-fade-in-up" style={{ maxWidth: '420px', width: '100%', position: 'relative', zIndex: 1 }}>
                <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                    <div style={{
                        width: '56px', height: '56px', borderRadius: 'var(--radius-lg)',
                        background: 'var(--gradient-primary)', display: 'inline-flex',
                        alignItems: 'center', justifyContent: 'center', marginBottom: '1rem'
                    }}>
                        <Zap style={{ width: '28px', height: '28px', color: 'white' }} />
                    </div>
                    <h1 style={{ fontSize: '1.75rem', fontWeight: '800', marginBottom: '0.5rem', letterSpacing: '-0.025em' }}>
                        Join Gigster
                    </h1>
                    <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9375rem' }}>
                        Create your account and start your journey
                    </p>
                </div>

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
                        {/* Role Selection Cards */}
                        <div>
                            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: '600', color: 'var(--color-text-secondary)', marginBottom: '0.5rem' }}>
                                I want to...
                            </label>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                                <button type="button" onClick={() => setFormData({ ...formData, role: 'client' })}
                                    style={{
                                        padding: '1rem', borderRadius: 'var(--radius-md)', cursor: 'pointer',
                                        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem',
                                        background: formData.role === 'client' ? 'rgba(99,102,241,0.12)' : 'var(--color-bg-base)',
                                        border: formData.role === 'client' ? '2px solid var(--color-primary)' : '1px solid var(--color-border)',
                                        color: formData.role === 'client' ? 'var(--color-primary-light)' : 'var(--color-text-muted)',
                                        transition: 'all 0.2s'
                                    }}>
                                    <Briefcase style={{ width: '20px', height: '20px' }} />
                                    <span style={{ fontSize: '0.8125rem', fontWeight: '600' }}>Hire Talent</span>
                                    <span style={{ fontSize: '0.6875rem', opacity: 0.7 }}>Client</span>
                                </button>
                                <button type="button" onClick={() => setFormData({ ...formData, role: 'freelancer' })}
                                    style={{
                                        padding: '1rem', borderRadius: 'var(--radius-md)', cursor: 'pointer',
                                        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem',
                                        background: formData.role === 'freelancer' ? 'rgba(6,182,212,0.12)' : 'var(--color-bg-base)',
                                        border: formData.role === 'freelancer' ? '2px solid var(--color-accent)' : '1px solid var(--color-border)',
                                        color: formData.role === 'freelancer' ? 'var(--color-accent-light)' : 'var(--color-text-muted)',
                                        transition: 'all 0.2s'
                                    }}>
                                    <Code style={{ width: '20px', height: '20px' }} />
                                    <span style={{ fontSize: '0.8125rem', fontWeight: '600' }}>Find Work</span>
                                    <span style={{ fontSize: '0.6875rem', opacity: 0.7 }}>Freelancer</span>
                                </button>
                            </div>
                        </div>

                        <div>
                            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: '600', color: 'var(--color-text-secondary)', marginBottom: '0.5rem' }}>
                                Full Name
                            </label>
                            <div style={{ position: 'relative' }}>
                                <User style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', width: '16px', height: '16px', color: 'var(--color-text-muted)' }} />
                                <input type="text" name="name" required onChange={handleChange} placeholder="John Doe" className="input-dark" style={{ paddingLeft: '2.5rem' }} />
                            </div>
                        </div>

                        <div>
                            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: '600', color: 'var(--color-text-secondary)', marginBottom: '0.5rem' }}>
                                Email Address
                            </label>
                            <div style={{ position: 'relative' }}>
                                <Mail style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', width: '16px', height: '16px', color: 'var(--color-text-muted)' }} />
                                <input type="email" name="email" required onChange={handleChange} placeholder="you@example.com" className="input-dark" style={{ paddingLeft: '2.5rem' }} />
                            </div>
                        </div>

                        <div>
                            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: '600', color: 'var(--color-text-secondary)', marginBottom: '0.5rem' }}>
                                Password
                            </label>
                            <div style={{ position: 'relative' }}>
                                <Lock style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', width: '16px', height: '16px', color: 'var(--color-text-muted)' }} />
                                <input type="password" name="password" required minLength="8" onChange={handleChange} autoComplete="new-password" placeholder="Min. 8 characters" className="input-dark" style={{ paddingLeft: '2.5rem' }} />
                            </div>
                        </div>

                        <button type="submit" className="btn-primary" disabled={loading} style={{
                            width: '100%', justifyContent: 'center', padding: '0.75rem', marginTop: '0.5rem', fontSize: '0.9375rem'
                        }}>
                            {loading ? 'Creating Account...' : (
                                <>Create Account <ArrowRight style={{ width: '16px', height: '16px' }} /></>
                            )}
                        </button>
                    </form>
                </div>

                <p style={{ marginTop: '1.5rem', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
                    Already have an account?{' '}
                    <Link to="/login" style={{ color: 'var(--color-primary-light)', fontWeight: '600', textDecoration: 'none' }}>
                        Sign in
                    </Link>
                </p>
            </div>
        </div>
    );
};

export default Register;