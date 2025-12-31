import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './Auth.css';

const Login = () => {
  const navigate = useNavigate();
  const { login, verifyOTP, isAuthenticated, isLoading: authLoading, user } = useAuth();

  const [isSignup, setIsSignup] = useState(false);
  const [form, setForm] = useState({
    name: '',
    email: '',
    company: '',
    companyEmail: '',
    password: '',
    identifier: '',
  });

  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [formLoading, setFormLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false); // 👁 Password toggle state

  // OTP related state
  const [otpRequired, setOtpRequired] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [otpMethod, setOtpMethod] = useState('email');
  const [otpEmail, setOtpEmail] = useState('');
  const [otpMessage, setOtpMessage] = useState('');
  const [verificationIdentifier, setVerificationIdentifier] = useState(null);
  const [storedCredentials, setStoredCredentials] = useState(null);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [resendLoading, setResendLoading] = useState(false);
  const [otpExpiryTime, setOtpExpiryTime] = useState(null);
  const [otpTimeLeft, setOtpTimeLeft] = useState(300); // 5 minutes in seconds

  // Load saved rememberMe from localStorage
  useEffect(() => {
    const savedRememberMe = localStorage.getItem('rememberMe');
    if (savedRememberMe === 'true') {
      setRememberMe(true);
    }
  }, []);

  // Role-based redirect after login
  useEffect(() => {
    if (isAuthenticated && user) {
      if (user.role === 'investor') {
        navigate('/user-dashboard');
      } else {
        navigate('/admin');
      }
    }
  }, [isAuthenticated, user, navigate]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    if (error) setError('');
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    setError('');

    const identifier = form.companyEmail.trim();
    if (!identifier || !form.password) {
      setError('Please fill all required fields.');
      setFormLoading(false);
      return;
    }

    // Handle remember me
    if (rememberMe) {
      localStorage.setItem('rememberMe', 'true');
    } else {
      localStorage.removeItem('rememberMe');
    }

    const credentials = { identifier, password: form.password, rememberMe };
    const result = await login(credentials);

    if (result.requires_otp) {
      // OTP required - switch to OTP input mode
      setOtpRequired(true);
      setOtpEmail(result.email);
      setOtpMethod(result.otp_method);
      setOtpMessage(result.message);
      setVerificationIdentifier(identifier); // Store identifier for verification
      setStoredCredentials(credentials); // Store for resend
      setOtpExpiryTime(Date.now() + 300000); // 5 minutes from now
      setOtpTimeLeft(300); // Reset countdown
      setFormLoading(false);
      return;
    }

    if (!result.success && result.error) {
      setError(result.error);
    }

    setFormLoading(false);
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    setError('');

    if (!otpCode.trim()) {
      setError('Please enter the OTP code.');
      setFormLoading(false);
      return;
    }

    const result = await verifyOTP(verificationIdentifier, otpCode.trim());

    if (!result.success && result.error) {
      setError(result.error);
    }

    setFormLoading(false);
  };

  const handleBackToLogin = () => {
    setOtpRequired(false);
    setOtpCode('');
    setOtpEmail('');
    setOtpMessage('');
    setVerificationIdentifier(null);
    setError('');
    setStoredCredentials(null);
    setResendCooldown(0);
  };

  const handleResendOTP = async () => {
    if (!storedCredentials || resendCooldown > 0) return;

    setResendLoading(true);
    setError('');

    const result = await login(storedCredentials);

    if (result.requires_otp) {
      // New OTP sent successfully
      setOtpMessage(result.message);
      setOtpMethod(result.otp_method);
      setOtpCode(''); // Clear previous code
      setOtpExpiryTime(Date.now() + 300000); // Reset 5-minute timer
      setOtpTimeLeft(300); // Reset countdown
      setResendCooldown(30); // 30 second cooldown
    } else if (result.error) {
      setError(result.error);
    }

    setResendLoading(false);
  };

  // Cooldown timer effect
  useEffect(() => {
    let timer;
    if (resendCooldown > 0) {
      timer = setTimeout(() => {
        setResendCooldown(prev => prev - 1);
      }, 1000);
    }
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  // OTP expiry countdown effect
  useEffect(() => {
    let timer;
    if (otpRequired && otpTimeLeft > 0) {
      timer = setTimeout(() => {
        const newTimeLeft = Math.max(0, Math.floor((otpExpiryTime - Date.now()) / 1000));
        setOtpTimeLeft(newTimeLeft);
      }, 1000);
    }
    return () => clearTimeout(timer);
  }, [otpRequired, otpTimeLeft, otpExpiryTime]);

// Signup placeholder
  const handleSignup = async (e) => {
    e.preventDefault();
    setError('Signup functionality to be implemented.');
  };

  if (authLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="auth-container">
      <form className="auth-form" onSubmit={handleLogin}>
        <h2 className="auth-title">{isSignup ? 'Sign Up' : 'Login'}</h2>

        {/* --- SIGN UP MODE --- */}
        {isSignup && (
          <>
            <div className="auth-input-group">
              <span className="material-icons auth-icon">person</span>
              <input
                type="text"
                name="name"
                placeholder="Full Name"
                value={form.name}
                onChange={handleChange}
                className="auth-input"
                autoComplete="name"
              />
            </div>

            <div className="auth-input-group">
              <span className="material-icons auth-icon">business</span>
              <input
                type="text"
                name="company"
                placeholder="Company Name"
                value={form.company}
                onChange={handleChange}
                className="auth-input"
                autoComplete="organization"
              />
            </div>

            <div className="auth-input-group">
              <span className="material-icons auth-icon">email</span>
              <input
                type="email"
                name="companyEmail"
                placeholder="Company Email"
                value={form.companyEmail}
                onChange={handleChange}
                className="auth-input"
                autoComplete="email"
              />
            </div>

            <div className="auth-note">
              <span
                className="material-icons"
                style={{
                  fontSize: '1.1rem',
                  verticalAlign: 'middle',
                  color: '#3b82f6',
                }}
              >
                info
              </span>
              <span style={{ marginLeft: '0.4rem' }}>
                Note: The company email will be used for authentication when logging in.
              </span>
            </div>

            <div className="auth-input-group">
              <span className="material-icons auth-icon">email</span>
              <input
                type="email"
                name="email"
                placeholder="Personal Email"
                value={form.email}
                onChange={handleChange}
                className="auth-input"
                autoComplete="email"
              />
            </div>

            <button
              className="auth-btn"
              type="button"
              onClick={handleSignup}
              disabled={formLoading}
            >
              {formLoading ? 'Signing up...' : 'Sign Up'}
            </button>
          </>
        )}

        {/* --- LOGIN MODE --- */}
        {!isSignup && !otpRequired && (
           <>
             <div className="auth-input-group">
               <span className="material-icons auth-icon">person</span>
               <input
                 type="text"
                 name="companyEmail"
                 placeholder="Email or Username"
                 value={form.companyEmail}
                 onChange={handleChange}
                 className="auth-input"
                 autoComplete="username email"
               />
             </div>

             <div className="auth-input-group password-group">
               <span className="material-icons auth-icon">lock</span>
               <input
                 type={showPassword ? 'text' : 'password'}
                 name="password"
                 placeholder="Password"
                 value={form.password}
                 onChange={handleChange}
                 className="auth-input"
                 autoComplete="current-password"
               />
               <span
                 className="material-icons toggle-password"
                 onClick={() => setShowPassword((prev) => !prev)}
                 title={showPassword ? 'Hide Password' : 'Show Password'}
               >
                 {showPassword ? 'visibility_off' : 'visibility'}
               </span>
             </div>

             <div className="auth-remember">
               <label>
                 <input
                   type="checkbox"
                   checked={rememberMe}
                   onChange={(e) => setRememberMe(e.target.checked)}
                 />
                 Remember Me
               </label>
               <Link to="/forgot-password" className="auth-link">
                 Forgot Password?
               </Link>
             </div>

             {error && <div className="auth-error">{error}</div>}

             <button className="auth-btn" type="submit" disabled={formLoading}>
               {formLoading ? 'Logging in...' : 'Login'}
             </button>
           </>
         )}

        {/* --- OTP VERIFICATION MODE --- */}
        {!isSignup && otpRequired && (
           <>
             <div className="auth-otp-header">
               <h3>Verify Your Identity</h3>
               {otpMessage && <p className="auth-otp-message">{otpMessage}</p>}
               <p className="auth-otp-info">
                 Enter the 6-digit code sent to your {otpMethod === 'email' ? 'email' : 'phone'}: <strong>{otpEmail}</strong>
               </p>
             </div>

             <div className="auth-input-group">
               <span className="material-icons auth-icon">security</span>
               <input
                 type="text"
                 placeholder="Enter 6-digit OTP"
                 value={otpCode}
                 onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                 className="auth-input"
                 autoComplete="one-time-code"
                 maxLength="6"
               />
             </div>

             {error && <div className="auth-error">{error}</div>}

             <div className="auth-otp-actions">
               <button
                 className="auth-btn auth-btn-secondary"
                 type="button"
                 onClick={handleBackToLogin}
                 disabled={formLoading || resendLoading}
               >
                 Back to Login
               </button>
               <button
                 className="auth-btn"
                 type="button"
                 onClick={handleVerifyOTP}
                 disabled={formLoading || resendLoading || otpCode.length !== 6 || otpTimeLeft === 0}
               >
                 {formLoading ? 'Verifying...' : otpTimeLeft === 0 ? 'OTP Expired' : 'Verify OTP'}
               </button>
             </div>

             <div className="auth-resend-section">
               <p className="auth-resend-text">
                 Didn't receive the code?{' '}
                 <button
                   className="auth-link auth-resend-link"
                   type="button"
                   onClick={handleResendOTP}
                   disabled={resendLoading || (resendCooldown > 0 && otpTimeLeft > 0)}
                 >
                   {resendLoading ? 'Sending...' :
                    resendCooldown > 0 && otpTimeLeft > 0 ? `Resend in ${resendCooldown}s` :
                    otpTimeLeft === 0 ? 'Resend Expired OTP' : 'Resend OTP'}
                 </button>
               </p>
               <p className={`auth-otp-expiry ${otpTimeLeft === 0 ? 'auth-otp-expired' : ''}`}>
                 {otpTimeLeft > 0
                   ? `OTP expires in ${Math.floor(otpTimeLeft / 60)}:${(otpTimeLeft % 60).toString().padStart(2, '0')}`
                   : 'OTP has expired. Please resend.'}
               </p>
             </div>
           </>
         )}

        {/* --- SWITCH BETWEEN LOGIN & SIGNUP --- */}
        {!isSignup && (
          <div className="auth-switch">
            Don't have an account?{' '}
            <button
              type="button"
              className="auth-link"
              onClick={() => setIsSignup(true)}
            >
              Sign Up
            </button>
          </div>
        )}

        {isSignup && (
          <div className="auth-switch">
            Already have an account?{' '}
            <button
              type="button"
              className="auth-link"
              onClick={() => setIsSignup(false)}
            >
              Login
            </button>
          </div>
        )}
      </form>

      {/* Material Icons CDN */}
      <link
        href="https://fonts.googleapis.com/icon?family=Material+Icons"
        rel="stylesheet"
      />
    </div>
  );
};

export default Login;
