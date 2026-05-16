import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { Briefcase } from 'lucide-react';

const CreateProject = () => {
    const navigate = useNavigate();
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        budget: '',
        category: 'Web Development', // Default value
        deadline: ''
    });

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            // Send the project data to your backend
            await api.post('/projects', formData);

            // If successful, send them back to the dashboard
            navigate('/dashboard');
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to post project. Try again.');
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-sm border border-gray-200 p-8">

                <div className="flex items-center gap-3 mb-8 border-b border-gray-100 pb-6">
                    <Briefcase className="w-8 h-8 text-blue-600" />
                    <h2 className="text-3xl font-bold text-gray-900">Post a New Gig</h2>
                </div>

                {error && <div className="bg-red-100 text-red-700 p-4 rounded-lg mb-6">{error}</div>}

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Title */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Project Title</label>
                        <input
                            type="text" name="title" required onChange={handleChange}
                            placeholder="e.g., Build a modern React website"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                    </div>

                    {/* Category */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                        <select name="category" onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white">
                            <option value="Web Development">Web Development</option>
                            <option value="Mobile App">Mobile App</option>
                            <option value="Design">Design / UI/UX</option>
                            <option value="Writing">Writing & Translation</option>
                            <option value="Marketing">Digital Marketing</option>
                        </select>
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Project Description</label>
                        <textarea
                            name="description" required rows="5" onChange={handleChange}
                            placeholder="Describe what you need done in detail..."
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                        ></textarea>
                    </div>

                    {/* Budget and Deadline Row */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Budget ($)</label>
                            <input
                                type="number" name="budget" required min="5" onChange={handleChange}
                                placeholder="e.g., 500"
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Deadline</label>
                            <input
                                type="date" name="deadline" required onChange={handleChange}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                        </div>
                    </div>

                    <button
                        type="submit" disabled={loading}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg mt-8 transition-colors disabled:bg-blue-400"
                    >
                        {loading ? 'Posting...' : 'Publish Gig'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default CreateProject;