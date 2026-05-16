import { useState, useEffect } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { PlusCircle, Search, Loader } from 'lucide-react';
import useAuthStore from '../store/authStore';
import api from '../utils/api';
import ProjectCard from '../components/ProjectCard';

const Dashboard = () => {
    const { user } = useAuthStore();
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);

    // If user state is lost (e.g. on refresh), redirect to login
    if (!user) {
        return <Navigate to="/login" replace />;
    }

    // Fetch projects as soon as the dashboard loads
    useEffect(() => {
        const fetchProjects = async () => {
            try {
                const response = await api.get('/projects');
                setProjects(response.data.data.projects); // Save the projects array to state
            } catch (error) {
                console.error("Error fetching projects:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchProjects();
    }, []);

    // Show a loading spinner while waiting for the backend
    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader className="w-10 h-10 text-blue-600 animate-spin" />
            </div>
        );
    }

    // --- CLIENT DASHBOARD VIEW ---
    if (user?.role === 'client') {
        // Filter to only show projects created by THIS specific client
        const myProjects = projects.filter(
            (p) => p.clientId === user._id || p.clientId?._id === user._id
        );

        return (
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Client Dashboard</h1>
                        <p className="text-gray-600 mt-1">Manage your posted gigs and proposals.</p>
                    </div>
                    <Link to="/create-project" className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg font-medium shadow-sm transition-colors">
                        <PlusCircle className="w-5 h-5" />
                        Post a New Gig
                    </Link>
                </div>

                {myProjects.length === 0 ? (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
                        <p className="text-gray-500">You haven't posted any gigs yet. Click the button above to get started!</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {myProjects.map((project) => (
                            <ProjectCard key={project._id} project={project} userRole={user.role} />
                        ))}
                    </div>
                )}
            </div>
        );
    }

    // --- FREELANCER DASHBOARD VIEW ---
    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Freelancer Dashboard</h1>
                    <p className="text-gray-600 mt-1">Find your next project and track your active bids.</p>
                </div>
                <button className="flex items-center gap-2 bg-blue-100 text-blue-700 hover:bg-blue-200 px-5 py-2.5 rounded-lg font-medium transition-colors">
                    <Search className="w-5 h-5" />
                    Browse All Gigs
                </button>
            </div>

            {projects.length === 0 ? (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
                    <p className="text-gray-500">No gigs available right now. Check back later!</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {/* Freelancers see ALL projects */}
                    {projects.map((project) => (
                        <ProjectCard key={project._id} project={project} userRole={user.role} />
                    ))}
                </div>
            )}
        </div>
    );
};

export default Dashboard;