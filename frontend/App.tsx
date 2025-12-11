import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { Incidents } from './pages/Incidents';
import { LiveMonitor } from './pages/LiveMonitor';
import { Login } from './pages/Login';
import { Analytics } from './pages/Analytics';
import { AuthProvider, useAuth } from './context/AuthContext';

// Protected Route Wrapper
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
};

// Layout Wrapper to interact with Auth Context
const LayoutWrapper = ({ children }: { children: React.ReactNode }) => {
    const { user, logout } = useAuth();
    return <Layout user={user} onLogout={logout}>{children}</Layout>;
};

function App() {
  return (
    <AuthProvider>
      <HashRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          
          <Route path="/*" element={
            <ProtectedRoute>
              <LayoutWrapper>
                 <Routes>
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/monitor" element={<LiveMonitor />} />
                    <Route path="/incidents" element={<Incidents />} />
                    <Route path="/analytics" element={<Analytics />} />
                    {/* Redirect unknown routes to Dashboard */}
                    <Route path="*" element={<Navigate to="/" replace />} />
                 </Routes>
              </LayoutWrapper>
            </ProtectedRoute>
          } />
        </Routes>
      </HashRouter>
    </AuthProvider>
  );
}

export default App;