
import React, { useState, useEffect } from 'react';
import './ProfilePage.css';
import useInvestmentApi from '../../services/InvestmentApiService';
import { useAuth } from '../../contexts/AuthContext';

const ProfilePage = () => {
  const { user } = useAuth();
  const { getUserProfileData, updateUserProfile } = useInvestmentApi();

  const [profileData, setProfileData] = useState(null);
  const [form, setForm] = useState({});
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        setLoading(true);
        setError(null);

        const data = await getUserProfileData();
        if (data) {
          setProfileData(data);
          // Initialize form with profile data
          if (data.profile && data.profile.message) {
            // Profile not found case
            setForm({
              fullName: `${data.user.first_name} ${data.user.last_name}`,
              residentialAddress: '',
              homeAddress: '',
              phoneNumber: '',
              gender: '',
              nextOfKinName: '',
              nextOfKinAddress: '',
              nextOfKinPhone: '',
              nextOfKinGender: '',
              referredBy: '',
              disbursementBank: '',
              accountName: '',
              accountNumber: '',
            });
          } else if (data.profile) {
            // ✅ FIXED: Match the actual API response fields
            setForm({
              fullName: data.profile.full_name || `${data.user.first_name} ${data.user.last_name}`,
              residentialAddress: data.profile.residential_address || '',
              homeAddress: data.profile.home_address || '',
              phoneNumber: data.profile.phone_number || '',
              gender: data.profile.gender || '',
              nextOfKinName: data.profile.next_of_kin_name || '', // ✅ Changed from next_of_kin
              nextOfKinAddress: data.profile.next_of_kin_address || '',
              nextOfKinPhone: data.profile.next_of_kin_phone || '',
              nextOfKinGender: data.profile.next_of_kin_gender || '',
              referredBy: data.profile.referred_by || '',
              disbursementBank: data.profile.bank_name || '', // ✅ Changed from disbursement_bank
              accountName: data.profile.account_name || '',
              accountNumber: data.profile.account_number || '',
            });
          }
        }
      } catch (err) {
        console.error('Error fetching profile data:', err);
        setError('Failed to load profile data. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchProfileData();
  }, [getUserProfileData]);

  // Set tenant colors as CSS variables
  useEffect(() => {
    if (user?.tenant_primary_color) {
      document.documentElement.style.setProperty('--tenant-primary', user.tenant_primary_color);
    }
    if (user?.tenant_secondary_color) {
      document.documentElement.style.setProperty('--tenant-secondary', user.tenant_secondary_color);
    }
  }, [user]);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile && ['image/jpeg', 'image/png'].includes(selectedFile.type) && selectedFile.size < 5 * 1024 * 1024) {
      setFile(selectedFile);
      setPreview(URL.createObjectURL(selectedFile));
      setMessage('');
    } else {
      setFile(null);
      setPreview(null);
      setMessage('Please upload a valid JPEG/PNG image (max 5MB)');
      setTimeout(() => setMessage(''), 3000);
    }
  };

  const handleKYCSubmit = (e) => {
    e.preventDefault();
    if (!file) {
      setMessage('Please select a file to upload');
      setTimeout(() => setMessage(''), 3000);
      return;
    }
    // For now, simulate KYC submission since we don't have the actual KYC API
    setMessage(`KYC document ${file.name} submitted successfully`);
    setFile(null);
    setPreview(null);
    setTimeout(() => setMessage(''), 3000);
  };

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    const requiredFields = [
      'fullName', 'residentialAddress', 'homeAddress', 'phoneNumber', 'gender',
      'nextOfKinName', 'nextOfKinAddress', 'nextOfKinPhone', 'nextOfKinGender',
      'disbursementBank', 'accountName', 'accountNumber'
    ];
    if (requiredFields.some(field => !form[field])) {
      setMessage('Please fill all required fields');
      setTimeout(() => setMessage(''), 3000);
      return;
    }

    const result = await updateUserProfile(form);
    if (result.success) {
      setMessage('Profile updated successfully');
      // Refetch data to update the form with new data
      const newData = await getUserProfileData();
      if (newData && newData.profile) {
        setProfileData(newData);
        // ✅ FIXED: Match the actual API response fields
        setForm({
          fullName: newData.profile.full_name || `${newData.user.first_name} ${newData.user.last_name}`,
          residentialAddress: newData.profile.residential_address || '',
          homeAddress: newData.profile.home_address || '',
          phoneNumber: newData.profile.phone_number || '',
          gender: newData.profile.gender || '',
          nextOfKinName: newData.profile.next_of_kin_name || '', // ✅ Changed
          nextOfKinAddress: newData.profile.next_of_kin_address || '',
          nextOfKinPhone: newData.profile.next_of_kin_phone || '',
          nextOfKinGender: newData.profile.next_of_kin_gender || '',
          referredBy: newData.profile.referred_by || '',
          disbursementBank: newData.profile.bank_name || '', // ✅ Changed
          accountName: newData.profile.account_name || '',
          accountNumber: newData.profile.account_number || '',
        });
      }
    } else {
      setMessage(result.error);
    }
    setTimeout(() => setMessage(''), 3000);
  };


  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
        Loading profile data...
      </div>
    );
  }

  if (error) {
    return (
      <div className="error">
        <p>{error}</p>
        <button onClick={() => window.location.reload()}>Retry</button>
      </div>
    );
  }

  return (
    <section className="identity-management light">
      <div className="header-section">
        <div className="user-greeting">
          <h3>👋 Welcome back, {user?.first_name}!</h3>
          <p>Manage your profile and KYC documents</p>
        </div>
      </div>

      {message && <div className="message">{message}</div>}

      <div className="content-grid">
        {/* KYC Section */}
        <div className="kyc-section">
          <div className="section-header">
            <h3>📋 KYC Documents</h3>
            <span className="section-subtitle">Upload and manage your verification documents</span>
          </div>

          <div className="kyc-status">
            <div className="status-item">
              <span className="status-icon">🖼️</span>
              <div className="status-info">
                <strong>Passport Photo:</strong> {profileData?.profile?.passport_url ? '✅ Uploaded' : '❌ Not uploaded'}
              </div>
            </div>
            <div className="status-item">
              <span className="status-icon">✓</span>
              <div className="status-info">
                <strong>Verification Status:</strong> {profileData?.profile?.has_accepted_terms ? '✅ Verified' : '⏳ Pending'}
              </div>
            </div>
          </div>

          <form onSubmit={handleKYCSubmit} className="kyc-form">
            <div className="form-group">
              <label>📷 Passport Photo (JPEG/PNG, max 5MB)</label>
              <input
                type="file"
                accept="image/jpeg,image/png"
                onChange={handleFileChange}
                className="file-input"
              />
            </div>
            {preview && (
              <div className="preview-container">
                <img src={preview} alt="Passport Preview" className="preview-image" />
              </div>
            )}
            <button type="submit" className="submit-button primary">📤 Submit KYC Document</button>
          </form>

          {profileData?.profile?.passport_url && (
            <div className="current-kyc">
              <h4>📄 Current Document</h4>
              <img src={profileData.profile.passport_url} alt="Current KYC" className="current-kyc-image" />
            </div>
          )}
        </div>

        {/* Profile Update Section */}
        <div className="profile-section">
          <div className="section-header">
            <h3>👤 Personal Information</h3>
            <span className="section-subtitle">Update your personal and contact details</span>
          </div>

          <form onSubmit={handleProfileSubmit} className="profile-form">
            {/* Personal Details */}
            <div className="form-section">
              <h4>📝 Basic Information</h4>
              <div className="form-row">
                <div className="form-group">
                  <label>Full Name</label>
                  <input
                    type="text"
                    name="fullName"
                    value={form.fullName || ''}
                    onChange={handleProfileChange}
                    placeholder="Enter your full name"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Phone Number</label>
                  <input
                    type="tel"
                    name="phoneNumber"
                    value={form.phoneNumber || ''}
                    onChange={handleProfileChange}
                    placeholder="+234 xxx xxx xxxx"
                    required
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Gender</label>
                  <select name="gender" value={form.gender || ''} onChange={handleProfileChange} required>
                    <option value="">Select Gender</option>
                    <option value="Male">👨 Male</option>
                    <option value="Female">👩 Female</option>
                    <option value="Other">🧑 Other</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Referred By</label>
                  <input
                    type="text"
                    name="referredBy"
                    value={form.referredBy || ''}
                    onChange={handleProfileChange}
                    placeholder="Referral source (optional)"
                  />
                </div>
              </div>
            </div>

            {/* Address Information */}
            <div className="form-section">
              <h4>🏠 Address Information</h4>
              <div className="form-group">
                <label>Residential Address</label>
                <input
                  type="text"
                  name="residentialAddress"
                  value={form.residentialAddress || ''}
                  onChange={handleProfileChange}
                  placeholder="Street, City, State, Country, ZIP"
                  required
                />
              </div>
              <div className="form-group">
                <label>Home Address</label>
                <input
                  type="text"
                  name="homeAddress"
                  value={form.homeAddress || ''}
                  onChange={handleProfileChange}
                  placeholder="Street, City, State, Country, ZIP"
                  required
                />
              </div>
            </div>

            {/* Next of Kin */}
            <div className="form-section">
              <h4>👨‍👩‍👧‍👦 Next of Kin</h4>
              <div className="form-row">
                <div className="form-group">
                  <label>Full Name</label>
                  <input
                    type="text"
                    name="nextOfKinName"
                    value={form.nextOfKinName || ''}
                    onChange={handleProfileChange}
                    placeholder="Next of kin full name"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Phone Number</label>
                  <input
                    type="tel"
                    name="nextOfKinPhone"
                    value={form.nextOfKinPhone || ''}
                    onChange={handleProfileChange}
                    placeholder="+234 xxx xxx xxxx"
                    required
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Address</label>
                  <input
                    type="text"
                    name="nextOfKinAddress"
                    value={form.nextOfKinAddress || ''}
                    onChange={handleProfileChange}
                    placeholder="Next of kin address"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Gender</label>
                  <select
                    name="nextOfKinGender"
                    value={form.nextOfKinGender || ''}
                    onChange={handleProfileChange}
                    required
                  >
                    <option value="">Select Gender</option>
                    <option value="Male">👨 Male</option>
                    <option value="Female">👩 Female</option>
                    <option value="Other">🧑 Other</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Banking Information */}
            <div className="form-section">
              <h4>🏦 Banking Details</h4>
              <div className="form-row">
                <div className="form-group">
                  <label>Bank Name</label>
                  <input
                    type="text"
                    name="disbursementBank"
                    value={form.disbursementBank || ''}
                    onChange={handleProfileChange}
                    placeholder="e.g., Access Bank"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Account Name</label>
                  <input
                    type="text"
                    name="accountName"
                    value={form.accountName || ''}
                    onChange={handleProfileChange}
                    placeholder="Account holder name"
                    required
                  />
                </div>
              </div>
              <div className="form-group">
                <label>Account Number</label>
                <input
                  type="text"
                  name="accountNumber"
                  value={form.accountNumber || ''}
                  onChange={handleProfileChange}
                  placeholder="10-digit account number"
                  required
                />
              </div>
            </div>

            <div className="form-actions">
              <button type="submit" className="submit-button primary">💾 Update Profile</button>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
};

export default ProfilePage;
