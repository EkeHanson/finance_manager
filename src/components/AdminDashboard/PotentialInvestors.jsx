// src/components/AdminDashboard/PotentialInvestors.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext'; // Adjust path as needed
import useInvestmentApi from '../../services/InvestmentApiService';
import ConfirmModal from '../../components/ConfirmModal'; // Adjust path as needed
import StepModal from '../../components/StepModal';
import MessageModal from '../../components/MessageModal'; // Adjust path as needed
import './PotentialInvestors.css';

const PotentialInvestors = ({ potentialInvestors, onInvestorUpdate }) => { // Added onInvestorUpdate prop for parent updates if needed    
  // console.log('Potential Investors:', potentialInvestors); // Debugging line

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [viewMode, setViewMode] = useState('card'); // 'card' or 'table'
  const [selectedInvestor, setSelectedInvestor] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const filteredInvestors = potentialInvestors.filter(investor => {
    const matchesSearch = (
      investor.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      investor.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      investor.phoneNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      investor.uniquePolicy?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    const matchesStatus = statusFilter === 'All' || investor.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Pagination
  const totalPages = Math.ceil(filteredInvestors.length / pageSize);
  const paginatedInvestors = filteredInvestors.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const handlePrev = () => setCurrentPage((prev) => Math.max(prev - 1, 1));
  const handleNext = () => setCurrentPage((prev) => Math.min(prev + 1, totalPages));

  const handleStatusUpdate = async (investorId, newStatus) => {
    // This would typically call an API to update the status
    console.log(`Updating investor ${investorId} status to ${newStatus}`);
    // In a real implementation, you would make an API call here
  };

  const handleInvestorClick = (investor) => {
    setSelectedInvestor(investor);
  };

  const handleBackToList = () => {
    setSelectedInvestor(null);
  };

  const handleInvestorUpdate = (updatedInvestor) => {
    setSelectedInvestor(updatedInvestor);
    if (onInvestorUpdate) {
      onInvestorUpdate(updatedInvestor);
    }
  };

  // If an investor is selected, show the detail view
  if (selectedInvestor) {
    return (
      <PotentialInvestorDetail 
        investor={selectedInvestor} 
        onBack={handleBackToList}
        onUpdate={handleInvestorUpdate}
      />
    );
  }

  return (
    <div className="potential-investors-container">
      <div className="potential-investors-header">
        <div className="header-left">
          <h2 className="potential-investors-title">
            <span className="material-icons">person_add</span> Potential Investors ({potentialInvestors.length})
          </h2>
        </div>

        <div className="header-right">
          <div className="potential-investors-filters">
            <div className="filter-group compact">
              <input
                id="search-potential"
                type="text"
                placeholder="Search investors..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
              />
              <span className="material-icons search-icon">search</span>
            </div>
            <select
              id="status-filter"
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="status-filter-compact"
            >
              <option value="All">All Status</option>
              <option value="Active">Active</option>
              <option value="Pending">Pending</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>

          <div className="view-controls">
            <button
              className={`view-btn ${viewMode === 'card' ? 'active' : ''}`}
              onClick={() => setViewMode('card')}
              title="Card View"
            >
              <span className="material-icons">view_module</span>
            </button>
            <button
              className={`view-btn ${viewMode === 'table' ? 'active' : ''}`}
              onClick={() => setViewMode('table')}
              title="Table View"
            >
              <span className="material-icons">view_list</span>
            </button>
          </div>
        </div>
      </div>

      {viewMode === 'card' ? (
        <CardView 
          investors={paginatedInvestors}
          onInvestorClick={handleInvestorClick}
          onStatusUpdate={handleStatusUpdate}
        />
      ) : (
        <TableView 
          investors={paginatedInvestors}
          onInvestorClick={handleInvestorClick}
          onStatusUpdate={handleStatusUpdate}
        />
      )}

      {/* Pagination */}
      {filteredInvestors.length > 0 && (
        <div className="pagination">
          <button className="pagination-btn" onClick={handlePrev} disabled={currentPage === 1}>
            &lt;
          </button>
          {[...Array(totalPages)].map((_, i) => (
            <button
              key={i}
              className={`pagination-btn${currentPage === i + 1 ? ' active' : ''}`}
              onClick={() => setCurrentPage(i + 1)}
            >
              {i + 1}
            </button>
          ))}
          <button className="pagination-btn" onClick={handleNext} disabled={currentPage === totalPages}>
            &gt;
          </button>
        </div>
      )}
    </div>
  );
};

// Card View Component
const CardView = ({ investors, onInvestorClick, onStatusUpdate }) => {
  return (
    <div className="potential-investors-grid">
      {investors.length === 0 ? (
        <div className="no-investors-found">
          <span className="material-icons">search_off</span>
          <p>No potential investors found matching your criteria.</p>
        </div>
      ) : (
        investors.map((investor) => (
          <div key={investor.id} className="potential-investor-card" onClick={() => onInvestorClick(investor)}>
            <div className="card-header">
              <div className="investor-info">
                <h3 className="investor-name">{investor.name || 'Unknown'}</h3>
                <p className="investor-email">{investor.email}</p>
                <p className="investor-meta">
                  <span className="meta-item">
                    {investor.phoneNumber || 'No phone'}
                  </span>
                  <span className="meta-item">
                    <span className="material-icons">calendar_today</span>
                    {investor.date ? new Date(investor.date).toLocaleDateString() : 'Unknown'}
                  </span>
                </p>
              </div>
              <div className={`status-badge status-${(investor.status || 'Active').toLowerCase()}`}>
                {investor.status || 'Active'}
              </div>
            </div>

            <div className="card-actions">
              <div className="quick-actions">
                <button
                  className="action-btn icon-only primary"
                  title="View profile"
                  onClick={(e) => {
                    e.stopPropagation();
                    onInvestorClick(investor);
                  }}
                >
                  <span className="material-icons">visibility</span>
                </button>
              </div>

              <select
                value={investor.status || 'Active'}
                onChange={(e) => onStatusUpdate(investor.id, e.target.value)}
                className="status-select-compact"
                onClick={(e) => e.stopPropagation()}
              >
                <option value="Active">Active</option>
                <option value="Pending">Pending</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
          </div>
        ))
      )}
    </div>
  );
};

// Table View Component
const TableView = ({ investors, onInvestorClick, onStatusUpdate }) => {
  return (
    <div className="potential-investors-table-container">
      <table className="potential-investors-table">
        <thead>
          <tr>
            <th>Investor</th>
            <th>Contact</th>
            <th>Status</th>
            <th>Registered</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {investors.length === 0 ? (
            <tr>
              <td colSpan="5" className="no-data">
                <span className="material-icons">search_off</span>
                <span>No potential investors found matching your criteria.</span>
              </td>
            </tr>
          ) : (
            investors.map((investor) => (
              <tr key={investor.id} className="investor-table-row">
                <td>
                  <div className="investor-cell">
                    <button
                      className="investor-name-link"
                      onClick={() => onInvestorClick(investor)}
                    >
                      {investor.name || 'Unknown'}
                    </button>
                    <div className="investor-role">{investor.role || 'User'}</div>
                  </div>
                </td>
                <td>
                  <div className="contact-cell">
                    <div className="investor-email">{investor.email}</div>
                    <div className="investor-phone">
                      {investor.phoneNumber || 'N/A'}
                    </div>
                  </div>
                </td>
                <td>
                  <select
                    value={investor.status || 'Active'}
                    onChange={(e) => onStatusUpdate(investor.id, e.target.value)}
                    className="status-select-table"
                  >
                    <option value="Active">Active</option>
                    <option value="Pending">Pending</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </td>
                <td>
                  <div className="date-cell">
                    <span className="material-icons">calendar_today</span>
                    {investor.date ? new Date(investor.date).toLocaleDateString() : 'Unknown'}
                  </div>
                </td>
                <td>
                  <div className="table-actions">
                    <button
                      className="action-btn icon-only primary"
                      title="View profile"
                      onClick={() => onInvestorClick(investor)}
                    >
                      <span className="material-icons">visibility</span>
                    </button>
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

// Investor Detail Component
const PotentialInvestorDetail = ({ investor, onBack, onUpdate }) => {
  const { apiFetch } = useAuth();
  const { createPolicy } = useInvestmentApi();
  const [showConfirm, setShowConfirm] = useState(false);
  const [showStepModal, setShowStepModal] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [stepError, setStepError] = useState('');
  const [message, setMessage] = useState('');
  const [editing, setEditing] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [localInvestor, setLocalInvestor] = useState(investor);
  const [originalInvestor, setOriginalInvestor] = useState(investor);

  useEffect(() => {
    setOriginalInvestor(investor);
    setLocalInvestor(investor);
  }, [investor]);

  const handleConfirmInvestor = async () => {
    setShowStepModal(true);
    setStepIndex(0);
    setStepError('');
    if (!localInvestor.id) {
      console.error('Investor ID not found');
      setShowConfirm(false);
      return;
    }

    try {
      // Step 1: Update user role to investor
      setStepIndex(0);
      const userResponse = await apiFetch(`/api/user/users/${localInvestor.id}/`, {
        method: 'PATCH',
        body: JSON.stringify({ role: 'investor' })
      });
      if (!userResponse.ok) {
        setStepError('Failed to confirm investor. Please try again.');
        setShowConfirm(false);
        return;
      }
      // Get updated user data (with policy_number)
      const updatedUser = await userResponse.json();
      const policyNumber = updatedUser?.profile?.policy_number;

      // Step 2: Create investment policy (may be multiple)
      setStepIndex(1);
      let policyCount = 0;
      // Always use the policy number returned from the backend after role update
      if (Array.isArray(localInvestor.profile?.investment_details) && localInvestor.profile.investment_details.length > 0) {
        for (const [idx, detail] of localInvestor.profile.investment_details.entries()) {
          if (!detail.investment_amount) continue;
          setStepIndex(1 + idx); // Show progress for each policy
          const policyData = {
            user: localInvestor.id,
            principal_amount: detail.investment_amount,
            roi_rate: detail.roi_rate && !isNaN(Number(detail.roi_rate)) ? Number(detail.roi_rate) : 40.00,
            roi_frequency: typeof detail.roi_rate === 'string' && isNaN(Number(detail.roi_rate)) ? detail.roi_rate : 'monthly',
            min_withdrawal_months: 4,
            allow_partial_withdrawals: true,
            auto_rollover: false,
            rollover_option: 'principal_only',
            policy_number: policyNumber // Always use backend-provided policy number
          };
          // console.log('Creating policy with data:', policyData);
          try {
            const result = await createPolicy(policyData);
            // console.log('Policy creation result:', result);
            if (!result.success) {
              let msg = 'Failed to create investment policy.';
              if (typeof result.error === 'string') {
                if (result.error.includes('duplicate key value')) {
                  msg = 'A policy with this policy number already exists.';
                } else if (result.error.startsWith('Unexpected token')) {
                  msg = 'Server error: received invalid response. Please check backend logs.';
                } else {
                  msg = result.error;
                }
              }
              setStepError(msg);
              setShowConfirm(false);
              return;
            }
            policyCount++;
          } catch (error) {
            let msg = 'Failed to create investment policy.';
            if (error?.message) {
              if (error.message.includes('duplicate key value')) {
                msg = 'A policy with this policy number already exists.';
              } else if (error.message.startsWith('Unexpected token')) {
                msg = 'Server error: received invalid response. Please check backend logs.';
              } else {
                msg = error.message;
              }
            }
            setStepError(msg);
            setShowConfirm(false);
            return;
          }
        }
      } else if (localInvestor.profile?.investment_amount) {
        // fallback for old structure
        setStepIndex(1);
        const policyData = {
          user: localInvestor.id,
          principal_amount: localInvestor.profile.investment_amount,
          roi_rate: 40.00,
          roi_frequency: 'monthly',
          min_withdrawal_months: 4,
          allow_partial_withdrawals: true,
          auto_rollover: false,
          rollover_option: 'principal_only',
          policy_number: policyNumber // Always use backend-provided policy number
        };
        try {
          await createPolicy(policyData);
          policyCount++;
        } catch (error) {
          setStepError('Failed to create investment policy. Please try again.');
          setShowConfirm(false);
          return;
        }
      }

      // Step 3: Done
      setStepIndex(1 + (policyCount > 0 ? policyCount : 1));
      const updatedInvestor = { ...localInvestor, role: 'investor', profile: { ...localInvestor.profile, policy_number: policyNumber } };
      onUpdate(updatedInvestor);
      setShowConfirm(false);
      setMessage('Investor confirmed successfully! Investment policies created.');
    } catch (error) {
      setStepError('Error confirming investor. Please try again.');
      setShowConfirm(false);
    }
  };

  const handleEditProfile = () => {
    setEditing(true);
  };

  const handleSaveEdit = async () => {
    if (!localInvestor.id) return;

    try {
      const userData = {
        first_name: localInvestor.firstName,
        last_name: localInvestor.surname,
        email: localInvestor.email,
      };

      const profileData = {
        gender: localInvestor.sex,
        personal_phone: localInvestor.phoneNumber,
        residential_address: localInvestor.residentialAddress,
        home_address: localInvestor.homeAddress,
        kyc_status: localInvestor.kycStatus,
        roi_frequency: localInvestor.roiFrequency,
        bank_name: localInvestor.disbursementBank,
        account_name: localInvestor.accountName,
        account_number: localInvestor.accountNumber,
        next_of_kin_name: localInvestor.nextOfKinName,
        next_of_kin_address: localInvestor.nextOfKinAddress,
        next_of_kin_phone: localInvestor.nextOfKinPhone,
        next_of_kin_sex: localInvestor.nextOfKinSex,
        referred_by: localInvestor.referredBy,
      };

      const response = await apiFetch(`/api/user/users/${localInvestor.id}/`, {
        method: 'PATCH',
        body: JSON.stringify({ ...userData, profile: profileData })
      });

      if (response.ok) {
        const updatedData = await response.json();
        // Assuming the response includes updated fields; merge for local state
        const updatedLocal = {
          ...localInvestor,
          ...userData,
          profile: { ...localInvestor.profile, ...profileData }
        };
        setLocalInvestor(updatedLocal);
        onUpdate(updatedLocal);
        setEditing(false);
        setMessage('Profile updated successfully!');
      } else {
        const errorText = await response.text();
        setMessage(`Failed to update profile: ${errorText}`);
      }
    } catch (error) {
      setMessage(`Error updating profile: ${error.message}`);
    }
  };

  const handleCancelEdit = () => {
    setLocalInvestor(originalInvestor);
    setEditing(false);
  };

  const handleCancelConfirm = () => {
    setShowConfirm(false);
  };

  const handleCloseMessage = () => {
    setMessage('');
  };

  const EditableField = ({ label, value, field, type = 'text', options, editing: fieldEditing }) => (
    <div className="form-field">
      <label className="field-label">{label}</label>
      {fieldEditing ? (
        type === 'select' ? (
          <select
            value={localInvestor[field] || ''}
            onChange={(e) => setLocalInvestor(prev => ({ ...prev, [field]: e.target.value }))}
            className="field-input select-input"
          >
            {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
          </select>
        ) : (
          <input
            type={type}
            value={localInvestor[field] || ''}
            onChange={(e) => setLocalInvestor(prev => ({ ...prev, [field]: e.target.value }))}
            className="field-input"
          />
        )
      ) : (
        <div className="field-value">{value || 'N/A'}</div>
      )}
    </div>
  );

  const kycOptions = ['Pending', 'Approved', 'Rejected'];
  const sexOptions = ['Male', 'Female', 'Other'];
  const roiOptions = ['Monthly', 'Quarterly', 'Annually'];

  const tabs = [
    { id: 'overview', label: 'Overview', icon: 'dashboard' },
    { id: 'personal', label: 'Personal', icon: 'person' },
    { id: 'financial', label: 'Financial', icon: 'account_balance' },
    { id: 'documents', label: 'Documents', icon: 'description' },
  ];

  return (
    <div className="investor-detail-container">
      {/* Header */}
      <div className="detail-header">
        <button className="back-btn-modern" onClick={onBack}>
          <span className="material-icons">arrow_back</span>
          Back to Investors
        </button>

        <div className="investor-summary">
          <div className="investor-avatar-modern">
            <span className="material-icons">person</span>
          </div>
          <div className="investor-info-modern">
            <h1 className="investor-name-modern">{localInvestor.name || 'Unknown Investor'}</h1>
            <div className="investor-meta-modern">
              <span className="investor-email-modern">{localInvestor.email}</span>
              <span className={`status-badge-modern status-${(localInvestor.status || 'Active').toLowerCase()}`}>
                {localInvestor.status || 'Active'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="tab-navigation">
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            <span className="material-icons">{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="tab-content">
        {activeTab === 'overview' && (
          <div className="overview-tab">
            <div className="overview-grid">
              <div className="overview-card">
                <div className="card-icon">
                  <span className="material-icons">person</span>
                </div>
                <div className="card-content">
                  <h3>Personal Information</h3>
                  <div className="info-row">
                    <span className="label">Full Name:</span>
                    <span className="value">{`${localInvestor.firstName || ''} ${localInvestor.surname || ''}`.trim() || 'N/A'}</span>
                  </div>
                  <div className="info-row">
                    <span className="label">Phone:</span>
                    <span className="value">{localInvestor.phoneNumber || 'N/A'}</span>
                  </div>
                  <div className="info-row">
                    <span className="label">Email:</span>
                    <span className="value">{localInvestor.email || 'N/A'}</span>
                  </div>
                </div>
              </div>

              <div className="overview-card">
                <div className="card-icon">
                  <span className="material-icons">account_balance</span>
                </div>
                <div className="card-content">
                  <h3>Account Status</h3>
                  <div className="info-row">
                    <span className="label">Role:</span>
                    <span className="value">{localInvestor.role || 'User'}</span>
                  </div>
                  <div className="info-row">
                    <span className="label">KYC Status:</span>
                    <span className={`value status-${(localInvestor.kycStatus || 'Pending').toLowerCase()}`}>
                      {localInvestor.kycStatus || 'Pending'}
                    </span>
                  </div>
                  <div className="info-row">
                    <span className="label">Registered:</span>
                    <span className="value">
                      {localInvestor.date ? new Date(localInvestor.date).toLocaleDateString() : 'Unknown'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="overview-card">
                <div className="card-icon">
                  <span className="material-icons">trending_up</span>
                </div>
                <div className="card-content">
                  <h3>Investment Summary</h3>
                  <div className="info-row">
                    <span className="label">Principal Amount:</span>
                    <span className="value">{localInvestor.principal_amount ? `₦${parseFloat(localInvestor.principal_amount).toLocaleString()}` : 'N/A'}</span>
                  </div>
                  <div className="info-row">
                    <span className="label">Current Balance:</span>
                    <span className="value">{localInvestor.current_balance ? `₦${parseFloat(localInvestor.current_balance).toLocaleString()}` : 'N/A'}</span>
                  </div>
                  <div className="info-row">
                    <span className="label">ROI Balance:</span>
                    <span className="value">{localInvestor.roi_balance ? `₦${parseFloat(localInvestor.roi_balance).toLocaleString()}` : '₦0.00'}</span>
                  </div>
                  <div className="info-row">
                    <span className="label">ROI Frequency:</span>
                    <span className="value">{localInvestor.roi_frequency || 'Monthly'}</span>
                  </div>
                </div>
              </div>

              <div className="overview-card">
                <div className="card-icon">
                  <span className="material-icons">account_balance_wallet</span>
                </div>
                <div className="card-content">
                  <h3>Banking Information</h3>
                  <div className="info-row">
                    <span className="label">Bank:</span>
                    <span className="value">{localInvestor.disbursementBank || 'N/A'}</span>
                  </div>
                  <div className="info-row">
                    <span className="label">Account Name:</span>
                    <span className="value">{localInvestor.accountName || 'N/A'}</span>
                  </div>
                  <div className="info-row">
                    <span className="label">Account Number:</span>
                    <span className="value">{localInvestor.accountNumber || 'N/A'}</span>
                  </div>
                </div>
              </div>
            </div>

            {localInvestor.emergencyContact && (
              <div className="overview-card full-width">
                <div className="card-icon">
                  <span className="material-icons">contact_emergency</span>
                </div>
                <div className="card-content">
                  <h3>Emergency Contact</h3>
                  <div className="info-row">
                    <span className="label">Name:</span>
                    <span className="value">{localInvestor.emergencyContact.name || 'N/A'}</span>
                  </div>
                  <div className="info-row">
                    <span className="label">Phone:</span>
                    <span className="value">{localInvestor.emergencyContact.phone || 'N/A'}</span>
                  </div>
                  <div className="info-row">
                    <span className="label">Relationship:</span>
                    <span className="value">{localInvestor.emergencyContact.relationship || 'N/A'}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'personal' && (
          <div className="personal-tab">
            <div className="form-section">
              <h3>Basic Information</h3>
              <div className="form-grid">
                <EditableField label="Surname" value={localInvestor.surname} field="surname" editing={editing} />
                <EditableField label="First Name" value={localInvestor.firstName} field="firstName" editing={editing} />
                {/* <EditableField label="Other Name" value={localInvestor.otherName} field="otherName" editing={editing} /> */}
                <EditableField label="Sex" value={localInvestor.sex} field="sex" type="select" options={sexOptions} editing={editing} />
              </div>
            </div>

            <div className="form-section">
              <h3>Contact Information</h3>
              <div className="form-grid">
                <EditableField label="Email" value={localInvestor.email} field="email" type="email" editing={editing} />
                <EditableField label="Phone Number" value={localInvestor.phoneNumber} field="phoneNumber" type="tel" editing={editing} />
              </div>
            </div>

            <div className="form-section">
              <h3>Addresses</h3>
              <div className="form-grid">
                {/* <EditableField label="Residential Address" value={localInvestor.residentialAddress} field="residentialAddress" editing={editing} /> */}
                <EditableField label="Residential Address" value={localInvestor.address} field="homeAddress" editing={editing} />
              </div>
            </div>

            <div className="form-section">
              <h3>Next of Kin</h3>
              <div className="form-grid">
                <EditableField label="Next of Kin Name" value={localInvestor.profile?.next_of_kin} field="nextOfKinName" editing={editing} />
                <EditableField label="Next of Kin Phone" value={localInvestor.profile?.next_of_kin_phone_number} field="nextOfKinPhone" type="tel" editing={editing} />
                <EditableField label="Next of Kin Address" value={localInvestor.profile?.next_of_kin_address} field="nextOfKinAddress" editing={editing} />
                <EditableField label="Relationship to Next of Kin" value={localInvestor.profile?.relationship_to_next_of_kin} field="profile.relationship_to_next_of_kin" editing={editing} />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'financial' && (
          <div className="financial-tab">
            {/* <div className="form-section">
              <h3>Investment Details</h3>
              <div className="form-grid">
                <EditableField label="Investment Amount (₦)" value={localInvestor.investmentAmount} field="investmentAmount" type="number" editing={editing} />
                <EditableField label="Interest Amount (₦)" value={localInvestor.interestAmount} field="interestAmount" type="number" editing={editing} />
                <EditableField label="ROI Frequency" value={localInvestor.roiFrequency} field="roiFrequency" type="select" options={roiOptions} editing={editing} />
                <div className="form-field">
                  <label className="field-label">Policy Date</label>
                  <div className="field-value">
                    {localInvestor.policyDate ? new Date(localInvestor.policyDate).toLocaleDateString() : 'N/A'}
                  </div>
                </div>
              </div>
            </div> */}

            <div className="form-section">
              <h3>Policy Summary</h3>
              <div className="form-grid">
                <div className="form-field">
                  <label className="field-label">Policy Number</label>
                  <div className="field-value">{localInvestor.policy_number || 'N/A'}</div>
                </div>
                <div className="form-field">
                  <label className="field-label">Principal Amount</label>
                  <div className="field-value">{localInvestor.principal_amount ? `₦${parseFloat(localInvestor.principal_amount).toLocaleString()}` : 'N/A'}</div>
                </div>
                <div className="form-field">
                  <label className="field-label">Current Balance</label>
                  <div className="field-value">{localInvestor.current_balance ? `₦${parseFloat(localInvestor.current_balance).toLocaleString()}` : 'N/A'}</div>
                </div>
                <div className="form-field">
                  <label className="field-label">ROI Balance</label>
                  <div className="field-value">{localInvestor.roi_balance ? `₦${parseFloat(localInvestor.roi_balance).toLocaleString()}` : '₦0.00'}</div>
                </div>
                <div className="form-field">
                  <label className="field-label">ROI Rate</label>
                  <div className="field-value">{localInvestor.roi_rate ? `${localInvestor.roi_rate}%` : 'N/A'}</div>
                </div>
                <div className="form-field">
                  <label className="field-label">ROI Frequency</label>
                  <div className="field-value">{localInvestor.roi_frequency || 'Monthly'}</div>
                </div>
              </div>
            </div>

            {localInvestor.profile?.investment_details && localInvestor.profile.investment_details.length > 0 && (
              <div className="form-section">
                <h3>Investment Details</h3>
                {localInvestor.profile.investment_details.map((detail, index) => (
                  <div key={index} className="investment-detail-item">
                    <h4>Investment {index + 1}</h4>
                    <div className="form-grid">
                      <div className="form-field">
                        <label className="field-label">ROI Rate</label>
                        <div className="field-value">{detail.roi_rate || 'N/A'}</div>
                      </div>
                      {/* <div className="form-field">
                        <label className="field-label">Custom ROI Rate</label>
                        <div className="field-value">{detail.custom_roi_rate || 'N/A'}</div>
                      </div> */}
                      <div className="form-field">
                        <label className="field-label">Investment Amount</label>
                        <div className="field-value">{detail.investment_amount ? `₦${detail.investment_amount}` : 'N/A'}</div>
                      </div>
                      <div className="form-field">
                        <label className="field-label">Investment Start Date</label>
                        <div className="field-value">
                          {detail.investment_start_date ? new Date(detail.investment_start_date).toLocaleDateString() : 'N/A'}
                        </div>
                      </div>
                      {/* <div className="form-field">
                        <label className="field-label">Remaining Balance</label>
                        <div className="field-value">{detail.remaining_balance ? `₦${detail.remaining_balance}` : 'N/A'}</div>
                      </div> */}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="form-section">
              <h3>Banking Information</h3>
              <div className="form-grid">
                <EditableField label="Disbursement Bank" value={localInvestor.disbursementBank} field="disbursementBank" editing={editing} />
                <EditableField label="Account Name" value={localInvestor.accountName} field="accountName" editing={editing} />
                <EditableField label="Account Number" value={localInvestor.accountNumber} field="accountNumber" type="number" editing={editing} />
              </div>
            </div>

            <div className="form-section">
              <h3>Account Settings</h3>
              <div className="form-grid">
                <div className="form-field">
                  <label className="field-label">Role</label>
                  <div className="field-value">{localInvestor.role || 'User'}</div>
                </div>
                <EditableField label="KYC Status" value={localInvestor.kycStatus} field="kycStatus" type="select" options={kycOptions} editing={editing} />
                <EditableField label="Referred By" value={localInvestor.referredBy} field="referredBy" editing={editing} />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'documents' && (
          <div className="documents-tab">
            <div className="form-section">
              <h3>Document Management</h3>
              <div className="documents-grid">
                {localInvestor.passportPhoto && (
                  <div className="document-item">
                    <div className="document-icon">
                      <span className="material-icons">photo_camera</span>
                    </div>
                    <div className="document-info">
                      <h4>Passport Photo</h4>
                      <img src={localInvestor.passportPhoto} alt="Passport Photo" className="document-preview" />
                    </div>
                  </div>
                )}

                {localInvestor.investorSignature && (
                  <div className="document-item">
                    <div className="document-icon">
                      <span className="material-icons">draw</span>
                    </div>
                    <div className="document-info">
                      <h4>Investor Signature</h4>
                      <img src={localInvestor.investorSignature} alt="Investor Signature" className="document-preview" />
                    </div>
                  </div>
                )}

                {localInvestor.directorSignature && (
                  <div className="document-item">
                    <div className="document-icon">
                      <span className="material-icons">assignment</span>
                    </div>
                    <div className="document-info">
                      <h4>Director Signature</h4>
                      <img src={localInvestor.directorSignature} alt="Director Signature" className="document-preview" />
                    </div>
                  </div>
                )}

                {(!localInvestor.passportPhoto && !localInvestor.investorSignature && !localInvestor.directorSignature) && (
                  <div className="no-documents">
                    <span className="material-icons">description</span>
                    <p>No documents uploaded yet</p>
                  </div>
                )}
              </div>
            </div>

            <div className="form-section">
              <h3>Additional Information</h3>
              <div className="form-grid">
                <div className="form-field">
                  <label className="field-label">Signature Date</label>
                  <div className="field-value">
                    {localInvestor.signatureDate ? new Date(localInvestor.signatureDate).toLocaleDateString() : 'N/A'}
                  </div>
                </div>
              </div>
            </div>

            {localInvestor.qualifications && localInvestor.qualifications.length > 0 && (
              <div className="form-section">
                <h3>Professional Qualifications</h3>
                <div className="qualifications-display">
                  {localInvestor.qualifications.map((qual, index) => (
                    <span key={index} className="qualification-badge">
                      {qual}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Action Bar */}
      <div className="action-bar">
        <div className="action-buttons">
          <button className="action-btn-modern outline" onClick={handleEditProfile}>
            <span className="material-icons">edit</span>
            {editing ? 'Save Changes' : 'Edit Profile'}
          </button>
          {localInvestor.role === 'user' && (
            <button
              className="action-btn-modern success"
              onClick={() => setShowConfirm(true)}
            >
              <span className="material-icons">check_circle</span>
              Confirm as Investor
            </button>
          )}
        </div>

        {editing && (
          <div className="edit-actions">
            <button className="action-btn-modern success" onClick={handleSaveEdit}>
              <span className="material-icons">save</span>
              Save Changes
            </button>
            <button className="action-btn-modern danger" onClick={handleCancelEdit}>
              <span className="material-icons">cancel</span>
              Cancel
            </button>
          </div>
        )}
      </div>


      {showConfirm && (
        <ConfirmModal
          message="Are you sure you want to confirm this user as an investor?"
          onConfirm={handleConfirmInvestor}
          onCancel={handleCancelConfirm}
        />
      )}

      {showStepModal && (
        <StepModal
          steps={[
            'Converting user to investor',
            ...(Array.isArray(localInvestor.profile?.investment_details) && localInvestor.profile.investment_details.length > 0
              ? localInvestor.profile.investment_details.map((_, idx) => `Creating investment policy ${idx + 1}`)
              : ['Creating investment policy']
            ),
            'Process complete!'
          ]}
          currentStep={stepError ? stepIndex : Math.min(stepIndex, (Array.isArray(localInvestor.profile?.investment_details) && localInvestor.profile.investment_details.length > 0
            ? 2 + localInvestor.profile.investment_details.length
            : 3))}
          error={stepError}
          onClose={() => { setShowStepModal(false); setStepError(''); }}
        />
      )}

      <MessageModal
        message={message}
        type={message.includes('Failed') || message.includes('Error') ? 'error' : 'success'}
        onClose={handleCloseMessage}
      />
    </div>
  );
};

export default PotentialInvestors;
