import React, { useState } from 'react';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useAuth } from '../../contexts/AuthContext';
import useInvestmentApi from '../../services/InvestmentApiService';
import './AddUser.css';

const AddUser = ({ onUserAdded }) => {
  const { apiFetch } = useAuth();
  const { createPolicy } = useInvestmentApi();
  const [userType, setUserType] = useState('staff'); // 'staff' or 'investor'
  const [activeTab, setActiveTab] = useState('basic');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  // Always send credentials via email
  const shouldSendCredentials = true;
  const [showPasswordRequirements, setShowPasswordRequirements] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0); // 0-4: none, weak, fair, good, strong
  const [showCredentialsModal, setShowCredentialsModal] = useState(false);
  const [createdUser, setCreatedUser] = useState(null);

  // Common fields for both user types
  const [formData, setFormData] = useState({
    email: '',
    firstName: '',
    lastName: '',
    phoneNumber: '',
    password: '',
    confirmPassword: '',
  });

  // Staff-specific fields
  const [staffData, setStaffData] = useState({
    jobRole: '',
    department: '',
  });

  // Investor-specific fields
  const [investorData, setInvestorData] = useState({
    investmentAmount: '',
    roiFrequency: 'Monthly',
    residentialAddress: '',
    homeAddress: '',
  });

  const generatePassword = () => {
    const length = 12;
    const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()";
    let password = "";
    for (let i = 0; i < length; i++) {
      password += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    return password;
  };

  const calculatePasswordStrength = (password) => {
    let score = 0;
    if (password.length >= 8) score++;
    if (/[a-z]/.test(password)) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;
    return Math.min(score, 4);
  };

  const getStrengthText = (strength) => {
    const levels = ['', 'Weak', 'Fair', 'Good', 'Strong'];
    return levels[strength];
  };

  const getStrengthColor = (strength) => {
    const colors = ['', '#ff4757', '#ffa502', '#2ed573', '#3742fa'];
    return colors[strength];
  };

  const validateForm = () => {
    const newErrors = {};

    // Common validations
    if (!formData.email) newErrors.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email address';
    }

    if (!formData.firstName) newErrors.firstName = 'First name is required';
    if (!formData.lastName) newErrors.lastName = 'Last name is required';
    if (!formData.phoneNumber) newErrors.phoneNumber = 'Phone number is required';
    if (!formData.password) newErrors.password = 'Password is required';
    else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    // Staff-specific validations
    if (userType === 'staff') {
      if (!staffData.jobRole) newErrors.jobRole = 'Job role is required';
      if (!staffData.department) newErrors.department = 'Department is required';
    }

    // Investor-specific validations
    if (userType === 'investor') {
      if (!investorData.investmentAmount) newErrors.investmentAmount = 'Investment amount is required';
      else if (investorData.investmentAmount <= 0) {
        newErrors.investmentAmount = 'Investment amount must be greater than 0';
      }
      if (!investorData.residentialAddress) newErrors.residentialAddress = 'Residential address is required';
      if (!investorData.homeAddress) newErrors.homeAddress = 'Home address is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCommonChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (name === 'password') {
      const strength = calculatePasswordStrength(value);
      setPasswordStrength(strength);
    }
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const handleStaffChange = (e) => {
    const { name, value } = e.target;
    setStaffData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const handleInvestorChange = (e) => {
    const { name, value } = e.target;
    setInvestorData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      const submissionData = {
        email: formData.email,
        first_name: formData.firstName,
        last_name: formData.lastName,
        password: formData.password,
        role: userType,
        job_role: userType === 'staff' ? staffData.jobRole : 'investor',
        status: 'active',
        send_credentials: shouldSendCredentials,
      };

      // Add type-specific data
      if (userType === 'staff') {
        submissionData.profile = {
          personal_phone: formData.phoneNumber,
          department: staffData.department,
        };
      } else if (userType === 'investor') {
        submissionData.profile = {
          personal_phone: formData.phoneNumber,
        };
        submissionData.investment_data = {
          investment_amount: investorData.investmentAmount,
          roi_frequency: investorData.roiFrequency,
          residential_address: investorData.residentialAddress,
          home_address: investorData.homeAddress,
        };
      }

      const response = await apiFetch('/api/user/users/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submissionData),
      });

      if (response.ok) {
        const userData = await response.json();

        // For investors, create an investment policy
        if (userType === 'investor') {
          try {
            const policyData = {
              user: userData.id,
              principal_amount: investorData.investmentAmount,
              roi_frequency: investorData.roiFrequency.toLowerCase().replace(' ', '_'), // Convert "On Demand" to "on_demand"
              min_withdrawal_months: 4,
              allow_partial_withdrawals: true,
              auto_rollover: false,
            };

            const policyResult = await createPolicy(policyData);
            if (!policyResult.success) {
              console.warn('Investment policy creation failed:', policyResult.error);
              // Don't fail the entire process, just log the warning
            }
          } catch (policyError) {
            console.warn('Error creating investment policy:', policyError);
            // Don't fail the entire process for policy creation issues
          }
        }

        // Store created user data for modal
        setCreatedUser({
          email: userData.email,
          username: userData.username,
          password: formData.password,
          firstName: userData.first_name,
          lastName: userData.last_name,
          role: userType,
        });
        setShowCredentialsModal(true);
      } else {
        const errorData = await response.json();
        alert(`Error: ${errorData.detail || 'Failed to create user'}`);
      }
    } catch (error) {
      alert('Network error. Please try again.');
      console.error('Create user error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const tabs = [
    { id: 'user-type', label: 'User Type' },
    { id: 'basic', label: 'Basic Information' },
    { id: 'additional', label: userType === 'staff' ? 'Staff Details' : 'Investment Details' },
    { id: 'credentials', label: 'Credentials' }
  ];

  const handleCopyCredentials = async () => {
    const credentialsText = `Email: ${createdUser.email}\nUsername: ${createdUser.username}\nPassword: ${createdUser.password}`;
    try {
      await navigator.clipboard.writeText(credentialsText);
      toast.success('Credentials copied to clipboard!');
    } catch (err) {
      console.error('Failed to copy credentials:', err);
      toast.error('Failed to copy credentials. Please copy manually.');
    }
  };

  const handleSendEmail = () => {
    // Since the backend already handles sending email if send_credentials is true,
    // we can just show a message
    toast.success('Account credentials have been sent to the user\'s email address.');
  };

  const closeModal = () => {
    setShowCredentialsModal(false);
    setCreatedUser(null);

    // Reset form after modal closes
    setFormData({
      email: '',
      firstName: '',
      lastName: '',
      phoneNumber: '',
      password: '',
      confirmPassword: '',
    });
    setStaffData({ jobRole: '', department: '' });
    setInvestorData({
      investmentAmount: '',
      roiFrequency: 'Monthly',
      residentialAddress: '',
      homeAddress: '',
    });
    setPasswordStrength(0);
    setShowPasswordRequirements(false);
    setActiveTab('basic');

    if (onUserAdded) {
      onUserAdded();
    }
  };

  return (
    <div className="add-user-container">
      <div className="add-user-header">
        <h2>Add New User</h2>
        <p>Create a new staff member or investor account</p>
      </div>

      {success && (
        <div className="success-message">
          <span className="material-icons">check_circle</span>
          User created successfully!
        </div>
      )}

      <div className="tabs-container">
        <div className="tabs-wrapper">
          <div className="tabs">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
                disabled={tab.id === 'additional' && userType === 'investor' && activeTab !== 'basic' ? false : false}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="add-user-form">
          {activeTab === 'user-type' && (
            <div className="form-section">
              <h3>User Type</h3>
              <div className="user-type-selector">
                <label className={`user-type-option ${userType === 'staff' ? 'active' : ''}`}>
                  <input
                    type="radio"
                    name="userType"
                    value="staff"
                    checked={userType === 'staff'}
                    onChange={(e) => {
                      setUserType(e.target.value);
                      setActiveTab('basic');
                    }}
                  />
                  <span className="option-content">
                    <span className="material-icons">group</span>
                    <span>Staff Member</span>
                  </span>
                </label>
                
                <label className={`user-type-option ${userType === 'investor' ? 'active' : ''}`}>
                  <input
                    type="radio"
                    name="userType"
                    value="investor"
                    checked={userType === 'investor'}
                    onChange={(e) => {
                      setUserType(e.target.value);
                      setActiveTab('basic');
                    }}
                  />
                  <span className="option-content">
                    <span className="material-icons">person</span>
                    <span>Investor</span>
                  </span>
                </label>
              </div>
              <div className="tab-navigation">
                <button 
                  type="button" 
                  className="nav-btn next-btn"
                  onClick={() => setActiveTab('basic')}
                >
                  Next: Basic Information
                </button>
              </div>
            </div>
          )}

          {activeTab === 'basic' && (
            <div className="form-section">
              <h3>Basic Information</h3>
              <div className="form-grid">
                <div className="form-group">
                  <label htmlFor="email">Email Address *</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleCommonChange}
                    placeholder="Enter email address"
                  />
                  {errors.email && <span className="error">{errors.email}</span>}
                </div>

                <div className="form-group">
                  <label htmlFor="firstName">First Name *</label>
                  <input
                    type="text"
                    id="firstName"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleCommonChange}
                    placeholder="Enter first name"
                  />
                  {errors.firstName && <span className="error">{errors.firstName}</span>}
                </div>

                <div className="form-group">
                  <label htmlFor="lastName">Last Name *</label>
                  <input
                    type="text"
                    id="lastName"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleCommonChange}
                    placeholder="Enter last name"
                  />
                  {errors.lastName && <span className="error">{errors.lastName}</span>}
                </div>

                <div className="form-group">
                  <label htmlFor="phoneNumber">Phone Number *</label>
                  <input
                    type="tel"
                    id="phoneNumber"
                    name="phoneNumber"
                    value={formData.phoneNumber}
                    onChange={handleCommonChange}
                    placeholder="Enter phone number"
                  />
                  {errors.phoneNumber && <span className="error">{errors.phoneNumber}</span>}
                </div>

                <div className="form-group">
                  <label htmlFor="password">Password * 
                    <span 
                      className="info-icon" 
                      onMouseEnter={() => setShowPasswordRequirements(true)}
                      onMouseLeave={() => setShowPasswordRequirements(false)}
                    >
                      ℹ
                    </span>
                  </label>
                  <div className="password-input-wrapper">
                    <input
                      type={showPassword ? "text" : "password"}
                      id="password"
                      name="password"
                      value={formData.password}
                      onChange={handleCommonChange}
                      placeholder="Enter password"
                    />
                    <button
                      type="button"
                      className="toggle-password-btn"
                      tabIndex={-1}
                      onClick={() => setShowPassword((prev) => !prev)}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      <span className="material-icons">
                        {showPassword ? "visibility_off" : "visibility"}
                      </span>
                    </button>
                  </div>
                  {errors.password && <span className="error">{errors.password}</span>}
                  {showPasswordRequirements && (
                    <div className="password-requirements">
                      <ul>
                        <li>At least 8 characters long</li>
                        <li>One lowercase letter (a-z)</li>
                        <li>One uppercase letter (A-Z)</li>
                        <li>One number (0-9)</li>
                        <li>One special character (!@#$%^&*())</li>
                      </ul>
                    </div>
                  )}
                  <button 
                    type="button" 
                    className="generate-password-btn"
                    onClick={() => {
                      const pw = generatePassword();
                      setFormData(prev => ({ ...prev, password: pw, confirmPassword: pw }));
                    }}
                  >
                    <span className="material-icons">autorenew</span> Generate Password
                  </button>
                  {formData.password && (
                    <div className="password-strength">
                      <div className="strength-bar">
                        <div 
                          className="strength-fill" 
                          style={{ 
                            width: `${(passwordStrength / 4) * 100}%`,
                            backgroundColor: getStrengthColor(passwordStrength)
                          }} 
                        />
                      </div>
                      <span className="strength-text">{getStrengthText(passwordStrength)}</span>
                    </div>
                  )}
                </div>

                <div className="form-group">
                  <label htmlFor="confirmPassword">Confirm Password *</label>
                  <div className="password-input-wrapper">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      id="confirmPassword"
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleCommonChange}
                      placeholder="Confirm password"
                    />
                    <button
                      type="button"
                      className="toggle-password-btn"
                      tabIndex={-1}
                      onClick={() => setShowConfirmPassword((prev) => !prev)}
                      aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                    >
                      <span className="material-icons">
                        {showConfirmPassword ? "visibility_off" : "visibility"}
                      </span>
                    </button>
                  </div>
                  {errors.confirmPassword && <span className="error">{errors.confirmPassword}</span>}
                </div>
              </div>
              <div className="tab-navigation">
                <button 
                  type="button" 
                  className="nav-btn prev-btn"
                  onClick={() => setActiveTab('user-type')}
                >
                  Previous
                </button>
                <button 
                  type="button" 
                  className="nav-btn next-btn"
                  onClick={() => setActiveTab('additional')}
                >
                  Next: {userType === 'staff' ? 'Staff Details' : 'Investment Details'}
                </button>
              </div>
            </div>
          )}

          {activeTab === 'additional' && (
            <div className="form-section">
              <h3>{userType === 'staff' ? 'Staff Information' : 'Investment Information'}</h3>
              {userType === 'staff' ? (
                <div className="form-grid">
                  <div className="form-group">
                    <label htmlFor="jobRole">Job Role *</label>
                    <input
                      type="text"
                      id="jobRole"
                      name="jobRole"
                      value={staffData.jobRole}
                      onChange={handleStaffChange}
                      placeholder="e.g., Manager, Assistant"
                    />
                    {errors.jobRole && <span className="error">{errors.jobRole}</span>}
                  </div>

                  <div className="form-group">
                    <label htmlFor="department">Department *</label>
                    <input
                      type="text"
                      id="department"
                      name="department"
                      value={staffData.department}
                      onChange={handleStaffChange}
                      placeholder="e.g., Finance, Operations"
                    />
                    {errors.department && <span className="error">{errors.department}</span>}
                  </div>
                </div>
              ) : (
                <div className="form-grid">
                  <div className="form-group">
                    <label htmlFor="investmentAmount">Investment Amount (₦) *</label>
                    <input
                      type="number"
                      id="investmentAmount"
                      name="investmentAmount"
                      value={investorData.investmentAmount}
                      onChange={handleInvestorChange}
                      placeholder="Enter investment amount"
                    />
                    {errors.investmentAmount && <span className="error">{errors.investmentAmount}</span>}
                  </div>

                  <div className="form-group">
                    <label htmlFor="roiFrequency">ROI Frequency *</label>
                    <select
                      id="roiFrequency"
                      name="roiFrequency"
                      value={investorData.roiFrequency}
                      onChange={handleInvestorChange}
                    >
                      <option value="Monthly">Monthly</option>
                      <option value="On Demand">On Demand</option>
                    </select>
                  </div>

                  <div className="form-group full-width">
                    <label htmlFor="residentialAddress">Residential Address *</label>
                    <input
                      type="text"
                      id="residentialAddress"
                      name="residentialAddress"
                      value={investorData.residentialAddress}
                      onChange={handleInvestorChange}
                      placeholder="Enter residential address"
                    />
                    {errors.residentialAddress && <span className="error">{errors.residentialAddress}</span>}
                  </div>

                  <div className="form-group full-width">
                    <label htmlFor="homeAddress">Home Address *</label>
                    <input
                      type="text"
                      id="homeAddress"
                      name="homeAddress"
                      value={investorData.homeAddress}
                      onChange={handleInvestorChange}
                      placeholder="Enter home address"
                    />
                    {errors.homeAddress && <span className="error">{errors.homeAddress}</span>}
                  </div>
                </div>
              )}
              <div className="tab-navigation">
                <button 
                  type="button" 
                  className="nav-btn prev-btn"
                  onClick={() => setActiveTab('basic')}
                >
                  Previous
                </button>
                <button 
                  type="button" 
                  className="nav-btn next-btn"
                  onClick={() => setActiveTab('credentials')}
                >
                  Next: Credentials
                </button>
              </div>
            </div>
          )}

          {activeTab === 'credentials' && (
            <div className="form-section">
              <h3>Review & Create</h3>
              <div className="tab-navigation">
                <button
                  type="button"
                  className="nav-btn prev-btn"
                  onClick={() => setActiveTab('additional')}
                >
                  Previous
                </button>
                <button type="submit" className="nav-btn submit-btn" disabled={isSubmitting}>
                  {isSubmitting ? 'Creating User...' : `Create ${userType === 'staff' ? 'Staff' : 'Investor'}`}
                </button>
              </div>
            </div>
          )}
        </form>
      </div>

      {showCredentialsModal && createdUser && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="credentials-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>User Created Successfully</h3>
              <button className="close-button" onClick={closeModal}>×</button>
            </div>
            <div className="modal-body">
              <div className="credentials-info">
                <div className="credential-item">
                  <label>Email:</label>
                  <span>{createdUser.email}</span>
                </div>
                <div className="credential-item">
                  <label>Username:</label>
                  <span>{createdUser.username}</span>
                </div>
                <div className="credential-item">
                  <label>Password:</label>
                  <span className="password-text">{createdUser.password}</span>
                </div>
              </div>
              <div className="modal-actions">
                <button className="action-btn copy-btn" onClick={handleCopyCredentials}>
                  <span className="material-icons">content_copy</span>
                  Copy to Clipboard
                </button>
                <button className="action-btn email-btn" onClick={handleSendEmail}>
                  <span className="material-icons">email</span>
                  Send to Email
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      <ToastContainer />
    </div>
  );
};

export default AddUser;