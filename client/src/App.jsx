import { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import CreateProject from './pages/CreateProject';
import Profile from './pages/Profile';
import ProjectDetails from './pages/ProjectDetails';
import AdminDashboard from './pages/AdminDashboard';
import useAuthStore from './store/authStore';

// Protected Route Wrapper — requires login
const ProtectedRoute = ({ children }) => {
    const { isAuthenticated } = useAuthStore();
    if (!isAuthenticated) return <Navigate to="/login" replace />;
    return children;
};

// Admin Route Wrapper — requires login + admin role
const AdminRoute = ({ children }) => {
    const { isAuthenticated, user } = useAuthStore();
    if (!isAuthenticated) return <Navigate to="/login" replace />;
    if (user?.role !== 'admin') return <Navigate to="/dashboard" replace />;
    return children;
};

function App() {
    const { fetchMe, isAuthenticated } = useAuthStore();

    // Rehydrate user data on app load
    useEffect(() => {
        if (isAuthenticated) {
            fetchMe();
        }
    }, [fetchMe, isAuthenticated]);

    return (
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
            <Navbar />
            <main style={{ flex: 1 }}>
                <Routes>
                    <Route path="/" element={<Navigate to={isAuthenticated ? "/dashboard" : "/login"} replace />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                    <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                    <Route path="/create-project" element={<ProtectedRoute><CreateProject /></ProtectedRoute>} />
                    <Route path="/project/:id" element={<ProtectedRoute><ProjectDetails /></ProtectedRoute>} />
                    <Route path="/profile/:id" element={<Profile />} />
                    <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
                </Routes>
            </main>
        </div>
    );
}

export default App;