import { Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
// 1. Make sure to import your new page at the top!
import CreateProject from './pages/CreateProject';
import Profile from './pages/Profile';
import ProjectDetails from './pages/ProjectDetails';

function App() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />

      <main className="flex-grow">
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/dashboard" element={<Dashboard />} />

          {/* 2. Add your new route right here inside the <Routes> block */}
          <Route path="/profile/:id" element={<Profile />} />
          <Route path="/project/:id" element={<ProjectDetails />} />

          <Route path="/create-project" element={<CreateProject />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;