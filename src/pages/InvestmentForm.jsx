// src/pages/InvestmentForm.jsx
import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import config from '../config';
import './InvestmentForm.css';
import pako from 'pako';

const InvestmentForm = ({ onSubmit }) => {
  const navigate = useNavigate();
  const { encoded } = useParams();


  const [formData, setFormData] = useState({
    surname: '',
    firstName: '',
    otherName: '',
    residentialAddress: '',
    homeAddress: '',
    phoneNumber: '',
    email: '',
    sex: '',
    roiFrequency: '',
    policyDate: '',
    investmentAmount: '',
    interestAmount: '',
    disbursementBank: '',
    accountName: '',
    accountNumber: '',
    nextOfKinName: '',
    nextOfKinAddress: '',
    nextOfKinPhone: '',
    nextOfKinSex: '',
    referredBy: '',
    passportPhoto: null,
    signatureDate: new Date().toISOString().split('T')[0],
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tenantInfo, setTenantInfo] = useState(null);
  const investorSignatureRef = useRef(null);
  const directorSignatureRef = useRef(null);
  const [investorSignature, setInvestorSignature] = useState(null);
  const [directorSignature, setDirectorSignature] = useState(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successData, setSuccessData] = useState(null);
  const [errorModal, setErrorModal] = useState({ show: false, message: '' });


  // Decode tenant info in useEffect
  useEffect(() => {
    if (!encoded) {
      setTenantInfo({ error: 'No tenant information provided. Please use a valid registration link.' });
      return;
    }
    try {
      const decoded = atob(encoded);
      const parts = decoded.split(':');
      if (parts.length === 3) {
        const [id, schema, base64Compressed] = parts;
        const compressed = atob(base64Compressed);
        const decompressed = pako.inflate(compressed.split('').map(c => c.charCodeAt(0)), { to: 'string' });
        const companyData = JSON.parse(decompressed);
        setTenantInfo({ id, schema, companyData });
      } else if (parts.length === 2) {
        const [id, schema] = parts;
        setTenantInfo({ id, schema });
      } else {
        throw new Error('Invalid format');
      }
    } catch (e) {
      setTenantInfo({ error: 'Invalid registration link. Please check the URL.' });
      console.error('Decode error:', e);
    }
  }, [encoded]);

  // Signature setup useEffect - always called
  useEffect(() => {
    if (!investorSignatureRef.current || !directorSignatureRef.current) return;

    const canvas1 = investorSignatureRef.current;
    const ctx1 = canvas1.getContext('2d');
    const canvas2 = directorSignatureRef.current;
    const ctx2 = canvas2.getContext('2d');

    let isDrawing1 = false, lastX1 = 0, lastY1 = 0;
    let isDrawing2 = false, lastX2 = 0, lastY2 = 0;

    const startDrawing1 = (e) => {
      isDrawing1 = true;
      const rect = canvas1.getBoundingClientRect();
      [lastX1, lastY1] = [e.clientX - rect.left, e.clientY - rect.top];
    };

    const draw1 = (e) => {
      if (!isDrawing1) return;
      const rect = canvas1.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      ctx1.beginPath();
      ctx1.moveTo(lastX1, lastY1);
      ctx1.lineTo(x, y);
      ctx1.strokeStyle = '#003087';
      ctx1.lineWidth = 2;
      ctx1.stroke();
      [lastX1, lastY1] = [x, y];
      setInvestorSignature(canvas1.toDataURL());
    };

    const stopDrawing1 = () => { isDrawing1 = false; };

    const startDrawing2 = (e) => {
      isDrawing2 = true;
      const rect = canvas2.getBoundingClientRect();
      [lastX2, lastY2] = [e.clientX - rect.left, e.clientY - rect.top];
    };

    const draw2 = (e) => {
      if (!isDrawing2) return;
      const rect = canvas2.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      ctx2.beginPath();
      ctx2.moveTo(lastX2, lastY2);
      ctx2.lineTo(x, y);
      ctx2.strokeStyle = '#003087';
      ctx2.lineWidth = 2;
      ctx2.stroke();
      [lastX2, lastY2] = [x, y];
      setDirectorSignature(canvas2.toDataURL());
    };

    const stopDrawing2 = () => { isDrawing2 = false; };

    // Event listeners for canvas 1
    canvas1.addEventListener('mousedown', startDrawing1);
    canvas1.addEventListener('mousemove', draw1);
    canvas1.addEventListener('mouseup', stopDrawing1);
    canvas1.addEventListener('mouseout', stopDrawing1);
    canvas1.addEventListener('touchstart', (e) => { e.preventDefault(); const touch = e.touches[0]; startDrawing1({ clientX: touch.clientX, clientY: touch.clientY }); });
    canvas1.addEventListener('touchmove', (e) => { e.preventDefault(); const touch = e.touches[0]; draw1({ clientX: touch.clientX, clientY: touch.clientY }); });
    canvas1.addEventListener('touchend', stopDrawing1);

    // Event listeners for canvas 2
    canvas2.addEventListener('mousedown', startDrawing2);
    canvas2.addEventListener('mousemove', draw2);
    canvas2.addEventListener('mouseup', stopDrawing2);
    canvas2.addEventListener('mouseout', stopDrawing2);
    canvas2.addEventListener('touchstart', (e) => { e.preventDefault(); const touch = e.touches[0]; startDrawing2({ clientX: touch.clientX, clientY: touch.clientY }); });
    canvas2.addEventListener('touchmove', (e) => { e.preventDefault(); const touch = e.touches[0]; draw2({ clientX: touch.clientX, clientY: touch.clientY }); });
    canvas2.addEventListener('touchend', stopDrawing2);

    return () => {
      // Cleanup for canvas 1
      canvas1.removeEventListener('mousedown', startDrawing1);
      canvas1.removeEventListener('mousemove', draw1);
      canvas1.removeEventListener('mouseup', stopDrawing1);
      canvas1.removeEventListener('mouseout', stopDrawing1);
      canvas1.removeEventListener('touchstart', startDrawing1);
      canvas1.removeEventListener('touchmove', draw1);
      canvas1.removeEventListener('touchend', stopDrawing1);

      // Cleanup for canvas 2
      canvas2.removeEventListener('mousedown', startDrawing2);
      canvas2.removeEventListener('mousemove', draw2);
      canvas2.removeEventListener('mouseup', stopDrawing2);
      canvas2.removeEventListener('mouseout', stopDrawing2);
      canvas2.removeEventListener('touchstart', startDrawing2);
      canvas2.removeEventListener('touchmove', draw2);
      canvas2.removeEventListener('touchend', stopDrawing2);
    };
  }, []);  // Empty dependency array, always runs once

  // If no tenantInfo yet, show loading
  if (!tenantInfo) {
    return <div className="form-container">Loading...</div>;
  }

  // If decode error, show it
  if (tenantInfo.error) {
    return (
      <div className="form-container" style={{ backgroundImage: 'ur[](https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?ixlib=rb-4.0.3&auto=format&fit=crop&w=1350&q=80)' }}>
        <div className="form-content">
          <div className="error-message">
            <h2>Error</h2>
            <p>{tenantInfo.error}</p>
            <button onClick={() => navigate('/')} className="submit-btn">Go Home</button>
          </div>
        </div>
      </div>
    );
  }

  const { id: tenantId, schema: tenantSchema } = tenantInfo;

  const validateForm = () => {
    const newErrors = {};
    const requiredFields = [
      'surname', 'firstName', 'email', 'residentialAddress', 'homeAddress', 'phoneNumber',
      'sex', 'roiFrequency', 'investmentAmount', 'disbursementBank',
      'accountName', 'accountNumber', 'nextOfKinName', 'nextOfKinAddress', 'nextOfKinPhone', 'nextOfKinSex',
      'signatureDate'
    ];
    requiredFields.forEach(field => {
      if (!formData[field]) {
        newErrors[field] = `${field.replace(/([A-Z])/g, ' $1').trim()} is required`;
      }
    });
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email address';
    }
    if (formData.phoneNumber && !/^\+?\d{10,}$/.test(formData.phoneNumber)) {
      newErrors.phoneNumber = 'Invalid phone number';
    }
    if (formData.investmentAmount && formData.investmentAmount <= 0) {
      newErrors.investmentAmount = 'Investment amount must be greater than 0';
    }
    if (formData.interestAmount && formData.interestAmount < 0) {
      newErrors.interestAmount = 'Interest amount cannot be negative';
    }
    if (formData.passportPhoto && !['image/jpeg', 'image/png'].includes(formData.passportPhoto.type)) {
      newErrors.passportPhoto = 'Only JPEG or PNG files are allowed';
    }
    if (formData.passportPhoto && formData.passportPhoto.size > 2 * 1024 * 1024) {
      newErrors.passportPhoto = 'File size must be less than 2MB';
    }
    // Removed investorSignature and directorSignature validation
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) {
      const firstErrorField = Object.keys(newErrors)[0];
      const element = document.getElementById(firstErrorField);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: files ? files[0] : value,
      ...(name === 'investmentAmount' && value
        ? { interestAmount: ((parseFloat(value) * 0.4) / 12).toFixed(2) }
        : {})
    }));
    setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    setIsSubmitting(true);

    const submissionData = new FormData();
    Object.keys(formData).forEach(key => {
      if (formData[key] !== null && formData[key] !== '') {
        submissionData.append(key, formData[key]);
      }
    });
    submissionData.append('investorSignature', investorSignature);
    submissionData.append('directorSignature', directorSignature);
    // Append tenant info for backend to set context
    submissionData.append('tenant_id', tenantId);
    submissionData.append('tenant_schema', tenantSchema);

    // Append investment details to profile
    submissionData.append('profile[investment_details][0][roi_rate]', formData.roiFrequency === 'On Demand' ? 'on_demand' : 'monthly');
    if (formData.roiFrequency === 'On Demand') {
      submissionData.append('profile[investment_details][0][custom_roi_rate]', formData.interestAmount);
    }
    submissionData.append('profile[investment_details][0][investment_amount]', formData.investmentAmount);
    submissionData.append('profile[investment_details][0][investment_start_date]', new Date().toISOString());
    submissionData.append('profile[investment_details][0][remaining_balance]', formData.investmentAmount);

    try {
      const response = await fetch(`${config.API_BASE_URL}/api/user/public-register/`, {
        method: 'POST',
        body: submissionData,
      });
      if (response.ok) {
        const data = await response.json();

        setSuccessData(data);
        setShowSuccessModal(true);
        // Pass form data to parent if needed (for admin use)
        if (onSubmit) onSubmit(formData);
        // Reset form
        setFormData({
          surname: '', firstName: '', otherName: '', residentialAddress: '', homeAddress: '',
          phoneNumber: '', email: '', sex: '', roiFrequency: '', policyDate: '', investmentAmount: '',
          interestAmount: '', disbursementBank: '', accountName: '', accountNumber: '',
          nextOfKinName: '', nextOfKinAddress: '', nextOfKinPhone: '', nextOfKinSex: '',
          referredBy: '', passportPhoto: null, signatureDate: new Date().toISOString().split('T')[0]
        });
        investorSignatureRef.current.getContext('2d').clearRect(0, 0, 300, 150);
        directorSignatureRef.current.getContext('2d').clearRect(0, 0, 300, 150);
        setInvestorSignature(null);
        setDirectorSignature(null);
        // Optionally redirect to success page
        // navigate('/registration-success');
      } else {
        const errorData = await response.json();
        if (errorData.detail || errorData.error) {
          setErrorModal({ show: true, message: errorData.detail || errorData.error });
        } else {
          // Handle field-specific and non-field errors
          const fieldErrors = {};
          let nonFieldError = '';
          Object.entries(errorData).forEach(([field, messages]) => {
            if (field === 'non_field_errors') {
              nonFieldError = Array.isArray(messages) ? messages.join(' ') : messages;
            } else {
              fieldErrors[field] = Array.isArray(messages) ? messages[0] : messages;
            }
          });
          setErrors(fieldErrors);
          if (nonFieldError) {
            setErrorModal({ show: true, message: nonFieldError });
          }
          // Scroll to first error field
          const firstErrorField = Object.keys(fieldErrors)[0];
          if (firstErrorField) {
            const element = document.getElementById(firstErrorField);
            if (element) {
              element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
          }
        }
      }
    } catch (error) {
      // alert('Network error. Please try again.');
      console.error('Submit error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };




  const primaryColor = tenantInfo.companyData?.primaryColor || '#1a73e8';
  const secondaryColor = tenantInfo.companyData?.secondaryColor || '#34a853';

  return (
    <div className="form-container" style={{ background: `linear-gradient(135deg, ${secondaryColor}80, ${secondaryColor}40), url('https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?ixlib=rb-4.0.3&auto=format&fit=crop&w=1350&q=80') no-repeat center/cover` }}>
      <div className="form-content">
        <div className="header-section" style={{ background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`, color: '#fff', textAlign: 'center', padding: '1rem', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)' }}>
          {tenantInfo.companyData?.logoUrl && <img src={tenantInfo.companyData.logoUrl} alt="Company Logo" style={{ maxWidth: '150px', marginBottom: '10px' }} />}
          <h1 style={{ color: '#fff', fontSize: '1.8rem', margin: '0' }}>Investor Onboarding Form</h1>
          <p style={{ fontSize: '0.9rem', margin: '0.5rem 0 0' }}>For {tenantInfo.companyData?.name || 'Our Company'}</p>
        </div>
        <div className="about-section">
          <h2>About {tenantInfo.companyData?.name || 'Our Company'}</h2>
          <div dangerouslySetInnerHTML={{ __html: tenantInfo.companyData?.aboutUs || '<p>Welcome to our investment platform.</p>' }} />
        </div>
        <div className="form-wrapper">
          <form onSubmit={handleSubmit} noValidate>
            <div className="form-section">
              <h3 style={{ color: primaryColor }}>Personal Information</h3>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="surname">Surname *</label>
                  <input type="text" id="surname" name="surname" value={formData.surname} onChange={handleChange} placeholder="Enter surname" required />
                  {errors.surname && <span className="error">{errors.surname}</span>}
                </div>
                <div className="form-group">
                  <label htmlFor="firstName">First Name *</label>
                  <input type="text" id="firstName" name="firstName" value={formData.firstName} onChange={handleChange} placeholder="Enter first name" required />
                  {errors.firstName && <span className="error">{errors.firstName}</span>}
                </div>
              </div>
              <div className="form-row">
                {/* <div className="form-group">
                  <label htmlFor="otherName">Other Name</label>
                  <input type="text" id="otherName" name="otherName" value={formData.otherName} onChange={handleChange} placeholder="Enter other name" />
                </div> */}
                <div className="form-group">
                  <label htmlFor="sex">Sex *</label>
                  <select id="sex" name="sex" value={formData.sex} onChange={handleChange} required>
                    <option value="">Select</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                  {errors.sex && <span className="error">{errors.sex}</span>}
                </div>
              </div>
              <div className="form-group">
                <label htmlFor="residentialAddress">Residential Address *</label>
                <input type="text" id="residentialAddress" name="residentialAddress" value={formData.residentialAddress} onChange={handleChange} placeholder="Enter residential address" required />
                {errors.residentialAddress && <span className="error">{errors.residentialAddress}</span>}
              </div>
              <div className="form-group">
                <label htmlFor="homeAddress">Home Address *</label>
                <input type="text" id="homeAddress" name="homeAddress" value={formData.homeAddress} onChange={handleChange} placeholder="Enter home address" required />
                {errors.homeAddress && <span className="error">{errors.homeAddress}</span>}
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="phoneNumber">Phone Number *</label>
                  <input type="tel" id="phoneNumber" name="phoneNumber" value={formData.phoneNumber} onChange={handleChange} placeholder="Enter phone number" required />
                  {errors.phoneNumber && <span className="error">{errors.phoneNumber}</span>}
                </div>
                <div className="form-group">
                  <label htmlFor="email">Email Address *</label>
                  <input type="email" id="email" name="email" value={formData.email} onChange={handleChange} placeholder="Enter email address" required />
                  {errors.email && <span className="error">{errors.email}</span>}
                </div>
              </div>
            </div>
            <div className="form-section">
              <h3 style={{ color: primaryColor }}>Investment Details</h3>
              <div className="form-group">
                <label htmlFor="roiFrequency">ROI Frequency *</label>
                <select id="roiFrequency" name="roiFrequency" value={formData.roiFrequency} onChange={handleChange} required>
                  <option value="">Select</option>
                  <option value="Monthly">Monthly</option>
                  <option value="On Demand">On Demand</option>
                </select>
                {errors.roiFrequency && <span className="error">{errors.roiFrequency}</span>}
              </div>
              {/* <div className="form-group">
                <label htmlFor="policyDate">Policy Date *</label>
                <input type="date" id="policyDate" name="policyDate" value={formData.policyDate} onChange={handleChange} required />
                {errors.policyDate && <span className="error">{errors.policyDate}</span>}
              </div> */}
              <div className="form-group">
                <label htmlFor="investmentAmount">Investment Amount (₦) *</label>
                <input type="number" id="investmentAmount" name="investmentAmount" value={formData.investmentAmount} onChange={handleChange} placeholder="Enter amount" required />
                {errors.investmentAmount && <span className="error">{errors.investmentAmount}</span>}
              </div>
              <div className="form-group">
                <label htmlFor="interestAmount">Interest Amount (₦) *</label>
                <input
                  type="number"
                  id="interestAmount"
                  name="interestAmount"
                  value={formData.interestAmount}
                  readOnly
                  placeholder="Auto-calculated"
                />
                {errors.interestAmount && <span className="error">{errors.interestAmount}</span>}
              </div>
            </div>
            <div className="form-section">
              <h3 style={{ color: primaryColor }}>Bank Details</h3>
              <div className="form-group">
                <label htmlFor="disbursementBank">Disbursement Bank *</label>
                <input type="text" id="disbursementBank" name="disbursementBank" value={formData.disbursementBank} onChange={handleChange} placeholder="Enter bank name" required />
                {errors.disbursementBank && <span className="error">{errors.disbursementBank}</span>}
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="accountName">Account Name *</label>
                  <input type="text" id="accountName" name="accountName" value={formData.accountName} onChange={handleChange} placeholder="Enter account name" required />
                  {errors.accountName && <span className="error">{errors.accountName}</span>}
                </div>
                <div className="form-group">
                  <label htmlFor="accountNumber">Account Number *</label>
                  <input type="text" id="accountNumber" name="accountNumber" value={formData.accountNumber} onChange={handleChange} placeholder="Enter account number" required />
                  {errors.accountNumber && <span className="error">{errors.accountNumber}</span>}
                </div>
              </div>
            </div>
            <div className="form-section">
              <h3 style={{ color: primaryColor }}>Next of Kin</h3>
              <div className="form-group">
                <label htmlFor="nextOfKinName">Next of Kin Name *</label>
                <input type="text" id="nextOfKinName" name="nextOfKinName" value={formData.nextOfKinName} onChange={handleChange} placeholder="Enter name" required />
                {errors.nextOfKinName && <span className="error">{errors.nextOfKinName}</span>}
              </div>
              <div className="form-group">
                <label htmlFor="nextOfKinAddress">Next of Kin Address *</label>
                <input type="text" id="nextOfKinAddress" name="nextOfKinAddress" value={formData.nextOfKinAddress} onChange={handleChange} placeholder="Enter address" required />
                {errors.nextOfKinAddress && <span className="error">{errors.nextOfKinAddress}</span>}
              </div>
              <div className="form-group">
                <label htmlFor="nextOfKinPhone">Next of Kin Phone *</label>
                <input type="tel" id="nextOfKinPhone" name="nextOfKinPhone" value={formData.nextOfKinPhone} onChange={handleChange} placeholder="Enter phone number" required />
                {errors.nextOfKinPhone && <span className="error">{errors.nextOfKinPhone}</span>}
              </div>
              <div className="form-group">
                <label htmlFor="nextOfKinSex">Next of Kin Gender *</label>
                <select id="nextOfKinSex" name="nextOfKinSex" value={formData.nextOfKinSex} onChange={handleChange} required>
                  <option value="">Select</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Female">Others</option>
                </select>
                {errors.nextOfKinSex && <span className="error">{errors.nextOfKinSex}</span>}
              </div>
            </div>
            <div className="form-section">
              <h3 style={{ color: primaryColor }}>Additional Information</h3>
              <div className="form-group">
                <label htmlFor="referredBy">Referred By</label>
                <input type="text" id="referredBy" name="referredBy" value={formData.referredBy} onChange={handleChange} placeholder="Enter referrer name" />
              </div>
              <div className="form-group">
                <label htmlFor="passportPhoto">Passport Photo (JPEG/PNG, max 2MB) </label>
                <input type="file" id="passportPhoto" name="passportPhoto" accept="image/jpeg,image/png" onChange={handleChange} />
                {errors.passportPhoto && <span className="error">{errors.passportPhoto}</span>}
              </div>
              <div className="form-group">
                <label htmlFor="signatureDate">Signature Date *</label>
                <input
                  type="date"
                  id="signatureDate"
                  name="signatureDate"
                  value={formData.signatureDate}
                  onChange={handleChange}
                  required
                />
                {errors.signatureDate && <span className="error">{errors.signatureDate}</span>}
              </div>
              {/* Removed Investor Signature and Director Signature fields */}
            </div>
            <button type="submit" className="submit-btn" style={{ background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})` }} disabled={isSubmitting}>
              {isSubmitting ? 'Submitting...' : 'Submit Application'}
            </button>
          </form>
        </div>
      </div>

      {showSuccessModal && successData && (
        <div className="success-modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0, 0, 0, 0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="success-modal-content" style={{ background: '#fff', borderRadius: '12px', padding: '2rem', maxWidth: '400px', width: '90%', textAlign: 'center', boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)', border: `2px solid ${primaryColor}` }}>
            <div style={{ fontSize: '3rem', color: primaryColor, marginBottom: '1rem' }}>✓</div>
            <h2 style={{ color: primaryColor, marginBottom: '1rem' }}>Account Created Successfully!</h2>
            <p style={{ marginBottom: '1rem' }}>Your account has been created. Here are your login credentials:</p>
            <div style={{ textAlign: 'left', marginBottom: '1rem' }}>
              <p><strong>Username:</strong> {successData.username}</p>
              <p><strong>Temporary Password:</strong> {successData.temp_password}</p>
              <p><strong>Login Link:</strong> <a href={`${config.WEB_PAGE_URL}/login`} target="_blank" rel="noopener noreferrer" style={{ color: primaryColor }}>{`${config.WEB_PAGE_URL}/login`}</a></p>
            </div>
            <button onClick={() => setShowSuccessModal(false)} style={{ background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`, color: '#fff', border: 'none', padding: '0.8rem 1.5rem', borderRadius: '8px', cursor: 'pointer', fontSize: '1rem' }}>Close</button>
          </div>
        </div>
      )}

      {errorModal.show && (
        <div className="error-modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0, 0, 0, 0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="error-modal-content" style={{ background: '#fff', borderRadius: '12px', padding: '2rem', maxWidth: '400px', width: '90%', textAlign: 'center', boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)', border: `2px solid ${primaryColor}` }}>
            <div style={{ fontSize: '3rem', color: '#dc3545', marginBottom: '1rem' }}>✕</div>
            <h2 style={{ color: '#dc3545', marginBottom: '1rem' }}>Error</h2>
            <p style={{ marginBottom: '1rem' }}>{errorModal.message}</p>
            <button onClick={() => setErrorModal({ show: false, message: '' })} style={{ background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`, color: '#fff', border: 'none', padding: '0.8rem 1.5rem', borderRadius: '8px', cursor: 'pointer', fontSize: '1rem' }}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default InvestmentForm;