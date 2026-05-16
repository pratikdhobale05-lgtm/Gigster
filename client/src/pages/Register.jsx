import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import useAuthStore from '../store/authStore';

const Register = () => {
    const navigate = useNavigate();
    const login = useAuthStore((state) => state.login); // Grab our Zustand login function

    // Hold the form data in state
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        role: 'client', // Default to client
    });
    const [error, setError] = useState('');

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        try {
            // 1. Send data to the Express backend
            const response = await api.post('/auth/register', formData);

            // 2. Save the user and token in our global Zustand store
            login(response.data.data.user, response.data.token);

            // 3. Send them to the dashboard!
            navigate('/dashboard');
        } catch (err) {
            // If the backend sends an error (like "Email already exists"), show it
            setError(err.response?.data?.message || 'Registration failed. Try again.');
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8">
                <h2 className="text-3xl font-bold text-center text-gray-800 mb-8">Join Gigster</h2>

                {/* Display Error Message if one exists */}
                {error && <div className="bg-red-100 text-red-700 p-3 rounded-lg mb-4 text-center">{error}</div>}

                <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                        <input
                            type="text" name="name" required
                            onChange={handleChange}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                        <input
                            type="email" name="email" required
                            onChange={handleChange}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
                        <input
                            type="password" name="password" required minLength="8"
                            onChange={handleChange}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">I want to...</label>
                        <select name="role" onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white">
                            <option value="client">Hire talent (Client)</option>
                            <option value="freelancer">Find work (Freelancer)</option>
                        </select>
                    </div>

                    <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg mt-4">
                        Create Account
                    </button>
                </form>

                <p className="mt-6 text-center text-gray-600">
                    Already have an account? <Link to="/login" className="text-blue-600 font-semibold">Log in</Link>
                </p>
            </div>
        </div>
    );
};

export default Register;