import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { Briefcase, ArrowRight, DollarSign, Calendar, Tag, FileText } from 'lucide-react';

const categories = [
    'Web Development', 'Mobile App', 'Design', 'Writing', 'Marketing',
    'Data Science', 'DevOps', 'AI / Machine Learning'
];

const CreateProject = () => {
    const navigate = useNavigate();
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const [formData, setFormData] = useState({
        title: '', description: '', budget: '', category: 'Web Development', deadline: ''
    });

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            await api.post('/projects', formData);
            navigate('/dashboard');
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to post project. Try again.');
            setLoading(false);
        }
    };

    return (
        <div style={{ minHeight: '100vh', padding: '2rem 1.5rem' }}>
            <div className="animate-fade-in-up" style={{ maxWidth: '640px', margin: '0 auto' }}>

                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2rem' }}>
                    <div style={{
                        width: '44px', height: '44px', borderRadius: 'var(--radius-md)',
                        background: 'var(--gradient-primary)', display: 'flex',
                        alignItems: 'center', justifyContent: 'center'
                    }}>
                        <Briefcase style={{ width: '22px', height: '22px', color: 'white' }} />
                    </div>
                    <div>
                        <h1 style={{ fontSize: '1.5rem', fontWeight: '800', letterSpacing: '-0.025em' }}>Post a New Gig</h1>
                        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.8125rem' }}>Describe your project and find the perfect freelancer.</p>
                    </div>
                </div>

                <div className="card" style={{ padding: '2rem' }}>
                    {error && (
                        <div style={{
                            background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)',
                            color: '#f87171', padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)',
                            marginBottom: '1.5rem', fontSize: '0.875rem'
                        }}>
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                        {/* Title */}
                        <div>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.8125rem', fontWeight: '600', color: 'var(--color-text-secondary)', marginBottom: '0.5rem' }}>
                                <FileText style={{ width: '14px', height: '14px' }} /> Project Title
                            </label>
                            <input
                                type="text" name="title" required onChange={handleChange}
                                placeholder="e.g., Build a modern React dashboard" className="input-dark"
                            />
                        </div>

                        {/* Category */}
                        <div>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.8125rem', fontWeight: '600', color: 'var(--color-text-secondary)', marginBottom: '0.5rem' }}>
                                <Tag style={{ width: '14px', height: '14px' }} /> Category
                            </label>
                            <select name="category" onChange={handleChange} className="input-dark" style={{ cursor: 'pointer' }}>
                                {categories.map(cat => (
                                    <option key={cat} value={cat}>{cat}</option>
                                ))}
                            </select>
                        </div>

                        {/* Description */}
                        <div>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.8125rem', fontWeight: '600', color: 'var(--color-text-secondary)', marginBottom: '0.5rem' }}>
                                Description
                            </label>
                            <textarea
                                name="description" required rows="5" onChange={handleChange}
                                placeholder="Describe what you need done in detail..."
                                className="input-dark" style={{ resize: 'none', lineHeight: '1.6' }}
                            />
                        </div>

                        {/* Budget & Deadline */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <div>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.8125rem', fontWeight: '600', color: 'var(--color-text-secondary)', marginBottom: '0.5rem' }}>
                                    <DollarSign style={{ width: '14px', height: '14px' }} /> Budget ($)
                                </label>
                                <input
                                    type="number" name="budget" required min="5" onChange={handleChange}
                                    placeholder="e.g., 500" className="input-dark"
                                />
                            </div>
                            <div>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.8125rem', fontWeight: '600', color: 'var(--color-text-secondary)', marginBottom: '0.5rem' }}>
                                    <Calendar style={{ width: '14px', height: '14px' }} /> Deadline
                                </label>
                                <input
                                    type="date" name="deadline" required onChange={handleChange}
                                    className="input-dark"
                                />
                            </div>
                        </div>

                        <button type="submit" className="btn-primary" disabled={loading} style={{
                            width: '100%', justifyContent: 'center', padding: '0.75rem', marginTop: '0.5rem', fontSize: '0.9375rem'
                        }}>
                            {loading ? 'Publishing...' : (
                                <>Publish Gig <ArrowRight style={{ width: '16px', height: '16px' }} /></>
                            )}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default CreateProject;