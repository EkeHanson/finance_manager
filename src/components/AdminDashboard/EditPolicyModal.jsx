import React, { useState, useEffect } from 'react';
import useInvestmentApi from '../../services/InvestmentApiService';
import './EditPolicyModal.css';

const EditPolicyModal = ({ policy, onClose, onUpdate }) => {
  const { updatePolicy } = useInvestmentApi();
  const [formData, setFormData] = useState({
    roi_frequency: policy?.roi_frequency || 'monthly',
    status: policy?.status || 'active'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const result = await updatePolicy(policy.id, formData);
      if (result) {
        onUpdate(result);
        onClose();
      } else {
        setError('Failed to update policy');
      }
    } catch (err) {
      setError(err.message || 'Failed to update policy');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  if (!policy) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content edit-policy-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Edit Policy: {policy.policy_number}</h2>
          <button className="close-btn" onClick={onClose}>&times;</button>
        </div>

        <form onSubmit={handleSubmit} className="modal-body">
          {error && <div className="error-message">{error}</div>}

          <div className="form-group">
            <label htmlFor="roi_frequency">ROI Frequency:</label>
            <select
              id="roi_frequency"
              name="roi_frequency"
              value={formData.roi_frequency}
              onChange={handleChange}
            >
              <option value="monthly">Monthly</option>
              <option value="on_demand">On Demand</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="status">Status:</label>
            <select
              id="status"
              name="status"
              value={formData.status}
              onChange={handleChange}
            >
              <option value="active">Active</option>
              <option value="suspended">Suspended</option>
              <option value="matured">Matured</option>
              <option value="closed">Closed</option>
            </select>
          </div>

          <div className="policy-info">
            <div className="info-item">
              <span className="label">Policy Number:</span>
              <span className="value">{policy.policy_number}</span>
            </div>
            <div className="info-item">
              <span className="label">Principal Amount:</span>
              <span className="value">₦{parseFloat(policy.principal_amount || 0).toLocaleString()}</span>
            </div>
            <div className="info-item">
              <span className="label">Current Balance:</span>
              <span className="value">₦{parseFloat(policy.current_balance || 0).toLocaleString()}</span>
            </div>
            <div className="info-item">
              <span className="label">ROI Balance:</span>
              <span className="value">₦{parseFloat(policy.roi_balance || 0).toLocaleString()}</span>
            </div>
          </div>

          <div className="modal-actions">
            <button type="button" className="cancel-btn" onClick={onClose} disabled={loading}>
              Cancel
            </button>
            <button type="submit" className="submit-btn" disabled={loading}>
              {loading ? 'Updating...' : 'Update Policy'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditPolicyModal;