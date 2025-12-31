// src/App.jsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import './App.css';
import Login from './pages/Login';
import Home from './pages/Home';
import Demo from './pages/Demo';
import AdminDashboard from './components/AdminDashboard/AdminDashboard';
import ReviewsAdminDashboard from './components/ReviewsAdminDashboard.jsx';
import UserDashboard from './components/UserDashboard/UserDashboard';
import InvestmentForm from './pages/InvestmentForm';
import ReviewSubmission from './pages/ReviewSubmission';
import Navbar from './components/Navbar';
import AuthProvider from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <div className="App">
          {/* <Navbar /> */}
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={<Home />} />
            <Route path="/demo" element={<Demo />} />
            <Route path="/admin" element={
              <ProtectedRoute allowedRoles={['super-admin', 'admin', 'root-admin', 'co-admin', 'hr', 'staff', 'auditor', 'team_manager']}>
                <AdminDashboard />
              </ProtectedRoute>
            } />
            <Route path="/admin/reviews" element={
              <ProtectedRoute allowedRoles={['super-admin', 'admin', 'root-admin', 'co-admin', 'hr', 'staff', 'auditor', 'team_manager']}>
                <ReviewsAdminDashboard />
              </ProtectedRoute>
            } />
            <Route path="/user-dashboard" element={
              <ProtectedRoute>
                <UserDashboard />
              </ProtectedRoute>
            } />
            <Route path="/investment-form/:encoded?" element={<InvestmentForm />} />

            {/* Add these new routes to handle your URL structure */}
            <Route path="/submit" element={<ReviewSubmission />} />
            <Route path="/submit/:tenantId/submit" element={<ReviewSubmission />} />
          </Routes>
        </div>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;