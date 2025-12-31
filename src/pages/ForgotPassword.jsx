// src/pages/ForgotPassword.jsx (New component)
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import config from '../config';
import './Auth.css'; // Reuse styles

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setMessage('');

    try {
      const response = await fetch(`${config.API_BASE_URL}/api/user/password/reset/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      if (response.ok) {
        setMessage('Password reset email sent! Check your inbox.');
      } else {
        const errorData = await response.json();
        setError(errorData.detail || 'Failed to send reset email.');
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
        <h2 className="auth-title">Forgot Password?</h2>
        <p>Enter your email to receive a reset link.</p>
        <div className="auth-input-group">
          <span className="material-icons auth-icon">email</span>
          <input
            type="email"
            placeholder="Email Address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="auth-input"
            required
          />
        </div>
        {error && <div className="auth-error">{error}</div>}
        {message && <div className="auth-success">{message}</div>}
        <button className="auth-btn" type="submit" disabled={isLoading}>
          {isLoading ? 'Sending...' : 'Send Reset Link'}
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

export default ForgotPassword;