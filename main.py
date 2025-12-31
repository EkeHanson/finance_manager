# // src/pages/InvestmentForm.jsx
# import React, { useState, useRef, useEffect } from 'react';
# import { useNavigate, useParams } from 'react-router-dom';
# import config from '../config';
# import './InvestmentForm.css';

# const InvestmentForm = ({ onSubmit }) => {
#   const navigate = useNavigate();
#   const { encoded } = useParams();
#   const [formData, setFormData] = useState({
#     surname: '',
#     firstName: '',
#     otherName: '',
#     residentialAddress: '',
#     homeAddress: '',
#     phoneNumber: '',
#     sex: '',
#     roiFrequency: '',
#     policyDate: '',
#     investmentAmount: '',
#     interestAmount: '',
#     disbursementBank: '',
#     accountName: '',
#     accountNumber: '',
#     nextOfKinName: '',
#     nextOfKinAddress: '',
#     nextOfKinPhone: '',
#     nextOfKinSex: '',
#     referredBy: '',
#     passportPhoto: null,
#     signatureDate: new Date().toISOString().split('T')[0],
#   });
#   const [errors, setErrors] = useState({});
#   const [isSubmitting, setIsSubmitting] = useState(false);
#   const [tenantInfo, setTenantInfo] = useState(null);
#   const investorSignatureRef = useRef(null);
#   const directorSignatureRef = useRef(null);
#   const [investorSignature, setInvestorSignature] = useState(null);
#   const [directorSignature, setDirectorSignature] = useState(null);

#   // Decode tenant info in useEffect - ALWAYS CALLED
#   useEffect(() => {
#     if (!encoded) {
#       setTenantInfo({ error: 'No tenant information provided. Please use a valid registration link.' });
#       return;
#     }
    
#     // Only decode if we haven't already or if tenantInfo is null
#     if (!tenantInfo) {
#       try {
#         const decoded = atob(encoded);
#         const [id, schema] = decoded.split(':');
#         if (id && schema) {
#           setTenantInfo({ id, schema });
#         } else {
#           throw new Error('Invalid format');
#         }
#       } catch (e) {
#         setTenantInfo({ error: 'Invalid registration link. Please check the URL.' });
#         console.error('Decode error:', e);
#       }
#     }
#   }, [encoded, tenantInfo]); // Added tenantInfo to dependencies

#   // Signature effect - ALWAYS CALLED
#   useEffect(() => {
#     const handleSignature = (canvasRef, setSignature) => {
#       const canvas = canvasRef.current;
#       if (!canvas) return;
      
#       const ctx = canvas.getContext('2d');
#       let isDrawing = false;
#       let lastX = 0;
#       let lastY = 0;

#       const startDrawing = (e) => {
#         isDrawing = true;
#         const rect = canvas.getBoundingClientRect();
#         [lastX, lastY] = [e.clientX - rect.left, e.clientY - rect.top];
#       };

#       const draw = (e) => {
#         if (!isDrawing) return;
#         const rect = canvas.getBoundingClientRect();
#         const x = e.clientX - rect.left;
#         const y = e.clientY - rect.top;
#         ctx.beginPath();
#         ctx.moveTo(lastX, lastY);
#         ctx.lineTo(x, y);
#         ctx.strokeStyle = '#003087';
#         ctx.lineWidth = 2;
#         ctx.stroke();
#         [lastX, lastY] = [x, y];
#         setSignature(canvas.toDataURL());
#       };

#       const stopDrawing = () => {
#         isDrawing = false;
#       };

#       canvas.addEventListener('mousedown', startDrawing);
#       canvas.addEventListener('mousemove', draw);
#       canvas.addEventListener('mouseup', stopDrawing);
#       canvas.addEventListener('mouseout', stopDrawing);

#       // Mobile touch support
#       canvas.addEventListener('touchstart', (e) => {
#         e.preventDefault();
#         const touch = e.touches[0];
#         startDrawing({ clientX: touch.clientX, clientY: touch.clientY });
#       });
#       canvas.addEventListener('touchmove', (e) => {
#         e.preventDefault();
#         const touch = e.touches[0];
#         draw({ clientX: touch.clientX, clientY: touch.clientY });
#       });
#       canvas.addEventListener('touchend', stopDrawing);

#       return () => {
#         canvas.removeEventListener('mousedown', startDrawing);
#         canvas.removeEventListener('mousemove', draw);
#         canvas.removeEventListener('mouseup', stopDrawing);
#         canvas.removeEventListener('mouseout', stopDrawing);
#         canvas.removeEventListener('touchstart', startDrawing);
#         canvas.removeEventListener('touchmove', draw);
#         canvas.removeEventListener('touchend', stopDrawing);
#       };
#     };

#     const cleanup1 = investorSignatureRef.current ? handleSignature(investorSignatureRef, setInvestorSignature) : () => {};
#     const cleanup2 = directorSignatureRef.current ? handleSignature(directorSignatureRef, setDirectorSignature) : () => {};
    
#     return () => {
#       cleanup1();
#       cleanup2();
#     };
#   }, []); // Empty dependency array since we only want to set up once

#   // Render loading state
#   if (!tenantInfo) {
#     return <div className="form-container">Loading...</div>;
#   }

#   // Render error state
#   if (tenantInfo.error) {
#     return (
#       <div className="form-container" style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?ixlib=rb-4.0.3&auto=format&fit=crop&w=1350&q=80)' }}>
#         <div className="form-content">
#           <div className="error-message">
#             <h2>Error</h2>
#             <p>{tenantInfo.error}</p>
#             <button onClick={() => navigate('/')} className="submit-btn">Go Home</button>
#           </div>
#         </div>
#       </div>
#     );
#   }

#   const { id: tenantId, schema: tenantSchema } = tenantInfo;

#   const validateForm = () => {
#     const newErrors = {};
#     const requiredFields = [
#       'surname', 'firstName', 'residentialAddress', 'homeAddress', 'phoneNumber',
#       'sex', 'roiFrequency', 'policyDate', 'investmentAmount', 'disbursementBank',
#       'accountName', 'accountNumber', 'nextOfKinName', 'nextOfKinAddress', 'nextOfKinPhone', 'nextOfKinSex',
#       'signatureDate'
#     ];
#     requiredFields.forEach(field => {
#       if (!formData[field]) {
#         newErrors[field] = `${field.replace(/([A-Z])/g, ' $1').trim()} is required`;
#       }
#     });
#     if (formData.phoneNumber && !/^\+?\d{10,}$/.test(formData.phoneNumber)) {
#       newErrors.phoneNumber = 'Invalid phone number';
#     }
#     if (formData.investmentAmount && formData.investmentAmount <= 0) {
#       newErrors.investmentAmount = 'Investment amount must be greater than 0';
#     }
#     if (formData.interestAmount && formData.interestAmount < 0) {
#       newErrors.interestAmount = 'Interest amount cannot be negative';
#     }
#     if (formData.passportPhoto && !['image/jpeg', 'image/png'].includes(formData.passportPhoto.type)) {
#       newErrors.passportPhoto = 'Only JPEG or PNG files are allowed';
#     }
#     if (formData.passportPhoto && formData.passportPhoto.size > 2 * 1024 * 1024) {
#       newErrors.passportPhoto = 'File size must be less than 2MB';
#     }
#     if (!investorSignature) {
#       newErrors.investorSignature = 'Investor signature is required';
#     }
#     if (!directorSignature) {
#       newErrors.directorSignature = 'Director signature is required';
#     }
#     setErrors(newErrors);
#     return Object.keys(newErrors).length === 0;
#   };

#   const handleChange = (e) => {
#     const { name, value, files } = e.target;
#     setFormData(prev => ({
#       ...prev,
#       [name]: files ? files[0] : value,
#       ...(name === 'investmentAmount' && value
#         ? { interestAmount: ((parseFloat(value) * 0.4) / 12).toFixed(2) }
#         : {})
#     }));
#     setErrors(prev => ({ ...prev, [name]: '' }));
#   };

#   const handleSubmit = async (e) => {
#     e.preventDefault();
#     if (!validateForm()) return;
#     setIsSubmitting(true);

#     const submissionData = new FormData();
#     Object.keys(formData).forEach(key => {
#       if (formData[key] !== null && formData[key] !== '') {
#         submissionData.append(key, formData[key]);
#       }
#     });
#     submissionData.append('investorSignature', investorSignature);
#     submissionData.append('directorSignature', directorSignature);
#     // Append tenant info for backend to set context
#     submissionData.append('tenant_id', tenantId);
#     submissionData.append('tenant_schema', tenantSchema);

#     try {
#       const response = await fetch(`${config.API_BASE_URL}/api/register`, {
#         method: 'POST',
#         body: submissionData,
#       });
#       if (response.ok) {
#         alert('Account created successfully!');
#         // Pass form data to parent if needed (for admin use)
#         if (onSubmit) onSubmit(formData);
#         // Reset form
#         setFormData({
#           surname: '', firstName: '', otherName: '', residentialAddress: '', homeAddress: '',
#           phoneNumber: '', sex: '', roiFrequency: '', policyDate: '', investmentAmount: '',
#           interestAmount: '', disbursementBank: '', accountName: '', accountNumber: '',
#           nextOfKinName: '', nextOfKinAddress: '', nextOfKinPhone: '', nextOfKinSex: '',
#           referredBy: '', passportPhoto: null, signatureDate: new Date().toISOString().split('T')[0]
#         });
#         if (investorSignatureRef.current) {
#           investorSignatureRef.current.getContext('2d').clearRect(0, 0, 300, 150);
#         }
#         if (directorSignatureRef.current) {
#           directorSignatureRef.current.getContext('2d').clearRect(0, 0, 300, 150);
#         }
#         setInvestorSignature(null);
#         setDirectorSignature(null);
#         // Optionally redirect to success page
#         // navigate('/registration-success');
#       } else {
#         const errorData = await response.json();
#         alert(`Error: ${errorData.detail || 'Please try again.'}`);
#       }
#     } catch (error) {
#       alert('Network error. Please try again.');
#       console.error('Submit error:', error);
#     } finally {
#       setIsSubmitting(false);
#     }
#   };

#   return (
#     <div className="form-container" style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?ixlib=rb-4.0.3&auto=format&fit=crop&w=1350&q=80)' }}>
#       <div className="form-content">
#         <div className="about-section">
#           <h2>About Rodrimine Limited</h2>
#           <p>
#             Rodrimine Limited is a trusted financial institution dedicated to empowering individuals and businesses through innovative investment opportunities. With a focus on transparency and reliability, we offer tailored financial solutions including PayDay Loans, SME Micro Credit, and Savings Programs.
#           </p>
#           <h3>Why Choose Us?</h3>
#           <ul>
#             <li>99.9% Success Rate</li>
#             <li>Expert & Certified Team</li>
#             <li>Quick Loan Processing</li>
#             <li>Secure & Transparent Investments</li>
#           </ul>
#           <h3>Our Services</h3>
#           <ul>
#             <li>PayDay Loan: Fast solutions for urgent needs</li>
#             <li>SME Micro Credit: Support for growing businesses</li>
#             <li>Savings Programs: Build your financial future</li>
#           </ul>
#         </div>
#         <div className="form-wrapper">
#           <h1>Investor Onboarding Form</h1>
#           <form onSubmit={handleSubmit} noValidate>
#             <div className="form-section">
#               <h3>Personal Information</h3>
#               <div className="form-group">
#                 <label htmlFor="surname">Surname *</label>
#                 <input type="text" id="surname" name="surname" value={formData.surname} onChange={handleChange} placeholder="Enter surname" required />
#                 {errors.surname && <span className="error">{errors.surname}</span>}
#               </div>
#               <div className="form-group">
#                 <label htmlFor="firstName">First Name *</label>
#                 <input type="text" id="firstName" name="firstName" value={formData.firstName} onChange={handleChange} placeholder="Enter first name" required />
#                 {errors.firstName && <span className="error">{errors.firstName}</span>}
#               </div>
#               <div className="form-group">
#                 <label htmlFor="otherName">Other Name</label>
#                 <input type="text" id="otherName" name="otherName" value={formData.otherName} onChange={handleChange} placeholder="Enter other name" />
#               </div>
#               <div className="form-group">
#                 <label htmlFor="residentialAddress">Residential Address *</label>
#                 <input type="text" id="residentialAddress" name="residentialAddress" value={formData.residentialAddress} onChange={handleChange} placeholder="Enter residential address" required />
#                 {errors.residentialAddress && <span className="error">{errors.residentialAddress}</span>}
#               </div>
#               <div className="form-group">
#                 <label htmlFor="homeAddress">Home Address *</label>
#                 <input type="text" id="homeAddress" name="homeAddress" value={formData.homeAddress} onChange={handleChange} placeholder="Enter home address" required />
#                 {errors.homeAddress && <span className="error">{errors.homeAddress}</span>}
#               </div>
#               <div className="form-group">
#                 <label htmlFor="phoneNumber">Phone Number *</label>
#                 <input type="tel" id="phoneNumber" name="phoneNumber" value={formData.phoneNumber} onChange={handleChange} placeholder="Enter phone number" required />
#                 {errors.phoneNumber && <span className="error">{errors.phoneNumber}</span>}
#               </div>
#               <div className="form-group">
#                 <label htmlFor="sex">Sex *</label>
#                 <select id="sex" name="sex" value={formData.sex} onChange={handleChange} required>
#                   <option value="">Select</option>
#                   <option value="Male">Male</option>
#                   <option value="Female">Female</option>
#                 </select>
#                 {errors.sex && <span className="error">{errors.sex}</span>}
#               </div>
#             </div>
#             <div className="form-section">
#               <h3>Investment Details</h3>
#               <div className="form-group">
#                 <label htmlFor="roiFrequency">ROI Frequency *</label>
#                 <select id="roiFrequency" name="roiFrequency" value={formData.roiFrequency} onChange={handleChange} required>
#                   <option value="">Select</option>
#                   <option value="Monthly">Monthly</option>
#                   <option value="On Demand">On Demand</option>
#                 </select>
#                 {errors.roiFrequency && <span className="error">{errors.roiFrequency}</span>}
#               </div>
#               <div className="form-group">
#                 <label htmlFor="policyDate">Policy Date *</label>
#                 <input type="date" id="policyDate" name="policyDate" value={formData.policyDate} onChange={handleChange} required />
#                 {errors.policyDate && <span className="error">{errors.policyDate}</span>}
#               </div>
#               <div className="form-group">
#                 <label htmlFor="investmentAmount">Investment Amount (₦) *</label>
#                 <input type="number" id="investmentAmount" name="investmentAmount" value={formData.investmentAmount} onChange={handleChange} placeholder="Enter amount" required />
#                 {errors.investmentAmount && <span className="error">{errors.investmentAmount}</span>}
#               </div>
#               <div className="form-group">
#                 <label htmlFor="interestAmount">Interest Amount (₦) *</label>
#                 <input
#                   type="number"
#                   id="interestAmount"
#                   name="interestAmount"
#                   value={formData.interestAmount}
#                   readOnly
#                   placeholder="Auto-calculated"
#                 />
#                 {errors.interestAmount && <span className="error">{errors.interestAmount}</span>}
#               </div>
#             </div>
#             <div className="form-section">
#               <h3>Bank Details</h3>
#               <div className="form-group">
#                 <label htmlFor="disbursementBank">Disbursement Bank *</label>
#                 <input type="text" id="disbursementBank" name="disbursementBank" value={formData.disbursementBank} onChange={handleChange} placeholder="Enter bank name" required />
#                 {errors.disbursementBank && <span className="error">{errors.disbursementBank}</span>}
#               </div>
#               <div className="form-group">
#                 <label htmlFor="accountName">Account Name *</label>
#                 <input type="text" id="accountName" name="accountName" value={formData.accountName} onChange={handleChange} placeholder="Enter account name" required />
#                 {errors.accountName && <span className="error">{errors.accountName}</span>}
#               </div>
#               <div className="form-group">
#                 <label htmlFor="accountNumber">Account Number *</label>
#                 <input type="text" id="accountNumber" name="accountNumber" value={formData.accountNumber} onChange={handleChange} placeholder="Enter account number" required />
#                 {errors.accountNumber && <span className="error">{errors.accountNumber}</span>}
#               </div>
#             </div>
#             <div className="form-section">
#               <h3>Next of Kin</h3>
#               <div className="form-group">
#                 <label htmlFor="nextOfKinName">Next of Kin Name *</label>
#                 <input type="text" id="nextOfKinName" name="nextOfKinName" value={formData.nextOfKinName} onChange={handleChange} placeholder="Enter name" required />
#                 {errors.nextOfKinName && <span className="error">{errors.nextOfKinName}</span>}
#               </div>
#               <div className="form-group">
#                 <label htmlFor="nextOfKinAddress">Next of Kin Address *</label>
#                 <input type="text" id="nextOfKinAddress" name="nextOfKinAddress" value={formData.nextOfKinAddress} onChange={handleChange} placeholder="Enter address" required />
#                 {errors.nextOfKinAddress && <span className="error">{errors.nextOfKinAddress}</span>}
#               </div>
#               <div className="form-group">
#                 <label htmlFor="nextOfKinPhone">Next of Kin Phone *</label>
#                 <input type="tel" id="nextOfKinPhone" name="nextOfKinPhone" value={formData.nextOfKinPhone} onChange={handleChange} placeholder="Enter phone number" required />
#                 {errors.nextOfKinPhone && <span className="error">{errors.nextOfKinPhone}</span>}
#               </div>
#               <div className="form-group">
#                 <label htmlFor="nextOfKinSex">Next of Kin Sex *</label>
#                 <select id="nextOfKinSex" name="nextOfKinSex" value={formData.nextOfKinSex} onChange={handleChange} required>
#                   <option value="">Select</option>
#                   <option value="Male">Male</option>
#                   <option value="Female">Female</option>
#                 </select>
#                 {errors.nextOfKinSex && <span className="error">{errors.nextOfKinSex}</span>}
#               </div>
#             </div>
#             <div className="form-section">
#               <h3>Additional Information</h3>
#               <div className="form-group">
#                 <label htmlFor="referredBy">Referred By</label>
#                 <input type="text" id="referredBy" name="referredBy" value={formData.referredBy} onChange={handleChange} placeholder="Enter referrer name" />
#               </div>
#               <div className="form-group">
#                 <label htmlFor="passportPhoto">Passport Photo (JPEG/PNG, max 2MB) *</label>
#                 <input type="file" id="passportPhoto" name="passportPhoto" accept="image/jpeg,image/png" onChange={handleChange} />
#                 {errors.passportPhoto && <span className="error">{errors.passportPhoto}</span>}
#               </div>
#               <div className="form-group">
#                 <label htmlFor="signatureDate">Signature Date *</label>
#                 <input
#                   type="date"
#                   id="signatureDate"
#                   name="signatureDate"
#                   value={formData.signatureDate}
#                   onChange={handleChange}
#                   required
#                 />
#                 {errors.signatureDate && <span className="error">{errors.signatureDate}</span>}
#               </div>
#               <div className="signature-row">
#                 <div className="form-group signature-group">
#                   <label>Investor Signature *</label>
#                   <canvas ref={investorSignatureRef} width="180" height="80" className="signature-canvas"></canvas>
#                   {errors.investorSignature && <span className="error">{errors.investorSignature}</span>}
#                 </div>
#                 <div className="form-group signature-group">
#                   <label>Rodrimine Director Signature *</label>
#                   <canvas ref={directorSignatureRef} width="180" height="80" className="signature-canvas"></canvas>
#                   {errors.directorSignature && <span className="error">{errors.directorSignature}</span>}
#                 </div>
#               </div>
#             </div>
#             <button type="submit" className="submit-btn" disabled={isSubmitting}>
#               {isSubmitting ? 'Submitting...' : 'Submit Application'}
#             </button>
#           </form>
#         </div>
#       </div>
#     </div>
#   );
# };

# export default InvestmentForm;