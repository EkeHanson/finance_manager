import React, { useState } from 'react';
import './KYCVerificationModal.css';

const KYCVerificationModal = ({ investor, onClose, onSubmit }) => {
  const [kycData, setKycData] = useState({
    idCard: null,
    proofOfAddress: null,
    notes: '',
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validate = () => {
    const newErrors = {};
    if (!kycData.idCard) newErrors.idCard = 'ID card is required';
    if (kycData.idCard && !['image/jpeg', 'image/png'].includes(kycData.idCard.type)) {
      newErrors.idCard = 'Only JPEG or PNG files are allowed';
    }
    if (kycData.idCard && kycData.idCard.size > 2 * 1024 * 1024) {
      newErrors.idCard = 'File size must be less than 2MB';
    }
    if (!kycData.proofOfAddress) newErrors.proofOfAddress = 'Proof of address is required';
    if (kycData.proofOfAddress && !['image/jpeg', 'image/png'].includes(kycData.proofOfAddress.type)) {
      newErrors.proofOfAddress = 'Only JPEG or PNG files are allowed';
    }
    if (kycData.proofOfAddress && kycData.proofOfAddress.size > 2 * 1024 * 1024) {
      newErrors.proofOfAddress = 'File size must be less than 2MB';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    setKycData(prev => ({ ...prev, [name]: files ? files[0] : value }));
    setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const handleSubmit = async (status) => {
    if (!validate()) return;
    setIsSubmitting(true);

    const formData = new FormData();
    formData.append('idCard', kycData.idCard);
    formData.append('proofOfAddress', kycData.proofOfAddress);
    formData.append('notes', kycData.notes);
    formData.append('investorId', investor.id);
    formData.append('status', status);

    try {
      // Replace with actual API endpoint
      const response = await fetch('https://rodrimine.com/api/kyc', {
        method: 'POST',
        body: formData,
      });
      if (response.ok) {
        onSubmit(investor.id, status, kycData.notes);
      } else {
        alert('Error submitting KYC. Please try again.');
      }
    } catch (error) {
      alert('Network error. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" role="dialog" aria-labelledby="kyc-modal-title">
      <div className="modal-content">
        <h2 id="kyc-modal-title">KYC Verification for {investor.name}</h2>
        <button className="modal-close" onClick={onClose} aria-label="Close modal">
          <span className="material-icons">close</span>
        </button>
        <form>
          <div className="form-group">
            <label htmlFor="idCard">ID Card (JPEG/PNG) *</label>
            <input
              type="file"
              id="idCard"
              name="idCard"
              accept="image/jpeg,image/png"
              onChange={handleChange}
              required
            />
            {errors.idCard && <span className="error">{errors.idCard}</span>}
          </div>
          <div className="form-group">
            <label htmlFor="proofOfAddress">Proof of Address (JPEG/PNG) *</label>
            <input
              type="file"
              id="proofOfAddress"
              name="proofOfAddress"
              accept="image/jpeg,image/png"
              onChange={handleChange}
              required
            />
            {errors.proofOfAddress && <span className="error">{errors.proofOfAddress}</span>}
          </div>
          <div className="form-group">
            <label htmlFor="notes">Verification Notes</label>
            <textarea
              id="notes"
              name="notes"
              value={kycData.notes}
              onChange={handleChange}
              placeholder="Add any notes (optional)"
            />
          </div>
          <div className="modal-actions">
            <button
              type="button"
              className="action-btn approve"
              onClick={() => handleSubmit('Approved')}
              disabled={isSubmitting}
            >
              Approve
            </button>
            <button
              type="button"
              className="action-btn reject"
              onClick={() => handleSubmit('Rejected')}
              disabled={isSubmitting}
            >
              Reject
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default KYCVerificationModal;