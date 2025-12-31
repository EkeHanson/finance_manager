// src/pages/ResetPassword.jsx (New component)
import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import config from '../config';
import './Auth.css'; // Reuse styles

const ResetPassword = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setMessage('');

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      setIsLoading(false);
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch(`${config.API_BASE_URL}/api/user/password/reset/confirm/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, new_password: password }),
      });

      if (response.ok) {
        setMessage('Password reset successfully! Redirecting to login...');
        setTimeout(() => navigate('/login'), 2000);
      } else {
        const errorData = await response.json();
        setError(errorData.detail || 'Failed to reset password.');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <form className="auth-form" onSubmit={handleSubmit}>
        <h2 className="auth-title">Reset Password</h2>
        <p>Enter your new password.</p>
        <div className="auth-input-group">
          <span className="material-icons auth-icon">lock</span>
          <input
            type="password"
            placeholder="New Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="auth-input"
            required
            minLength={8}
          />
        </div>
        <div className="auth-input-group">
          <span className="material-icons auth-icon">lock</span>
          <input
            type="password"
            placeholder="Confirm New Password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="auth-input"
            required
          />
        </div>
        {error && <div className="auth-error">{error}</div>}
        {message && <div className="auth-success">{message}</div>}
        <button className="auth-btn" type="submit" disabled={isLoading}>
          {isLoading ? 'Resetting...' : 'Reset Password'}
        </button>
        <div className="auth-switch">
          <Link to="/login">Back to Login</Link>
        </div>
      </form>
      {/* Material Icons CDN */}
      <link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet" />
    </div>
  );
};

export default ResetPassword;