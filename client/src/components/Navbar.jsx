import { Link, useNavigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import { Briefcase, LogOut, User } from 'lucide-react'; // Using Lucide for beautiful icons

const Navbar = () => {
    const { isAuthenticated, user, logout } = useAuthStore();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <nav className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16 items-center">

                    {/* Logo Section */}
                    <Link to="/" className="flex items-center gap-2">
                        <Briefcase className="w-8 h-8 text-blue-600" />
                        <span className="text-2xl font-bold text-gray-900 tracking-tight">Gigster</span>
                    </Link>

                    {/* Navigation Links */}
                    <div className="flex items-center gap-6">
                        {isAuthenticated ? (
                            <>
                                <Link to="/dashboard" className="text-gray-600 hover:text-blue-600 font-medium transition-colors">
                                    Dashboard
                                </Link>

                                <div className="h-6 w-px bg-gray-300"></div> {/* Divider */}

                                <div className="flex items-center gap-2 text-sm font-medium text-gray-700 bg-gray-100 px-3 py-1.5 rounded-full">
                                    <User className="w-4 h-4" />
                                    {user?.name} <span className="text-blue-600 ml-1">({user?.role})</span>
                                </div>

                                <button
                                    onClick={handleLogout}
                                    className="flex items-center gap-2 text-gray-600 hover:text-red-600 font-medium transition-colors ml-2"
                                >
                                    <LogOut className="w-4 h-4" />
                                    Logout
                                </button>
                            </>
                        ) : (
                            <>
                                <Link to="/login" className="text-gray-600 hover:text-blue-600 font-medium transition-colors">
                                    Log In
                                </Link>
                                <Link to="/register" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors shadow-sm">
                                    Sign Up
                                </Link>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;