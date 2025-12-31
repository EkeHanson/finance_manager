import React from 'react';
import './StaffProfile.css';

// Helper function to format date as DD MMM YYYY (e.g., 21 Sep 2025)
const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  const options = { day: '2-digit', month: 'short', year: 'numeric' };
  return date.toLocaleDateString('en-GB', options).replace(/ /g, ' ');
};

const StaffProfile = ({ staff, onBack, onEdit }) => {
  if (!staff) return null;

  return (
    <div className="staff-detail-container">
      <div className="staff-detail-header">
        <button onClick={onBack} className="back-btn">
          <span className="material-icons">arrow_back</span> Back
        </button>
        <button onClick={onEdit} className="edit-btn">
          <span className="material-icons">edit</span> Edit Profile
        </button>
      </div>
      <div className="staff-detail-card">
        <h3 className="staff-detail-title">
          <span className="material-icons staff-avatar">
            {staff.gender === 'Male' ? 'person' : 'person_2'}
          </span>
          {staff.name}
          <span className="staff-contact">
            {staff.phoneNumber && (
              <>
                <span className="material-icons" style={{ fontSize: '1.1em', verticalAlign: 'middle', marginLeft: 10, marginRight: 2 }}>call</span>
                <span>{staff.phoneNumber}</span>
              </>
            )}
            {staff.email && (
              <>
                <span className="material-icons" style={{ fontSize: '1.1em', verticalAlign: 'middle', marginLeft: 10, marginRight: 2 }}>mail</span>
                <span>{staff.email}</span>
              </>
            )}
          </span>
        </h3>
        <div className="staff-detail-grid">
          <div>
            <div className="detail-label">Role</div>
            <div className="detail-value">{staff.role || 'N/A'}</div>
          </div>
          <div>
            <div className="detail-label">Department</div>
            <div className="detail-value">{staff.department || 'N/A'}</div>
          </div>
          <div>
            <div className="detail-label">Joining Date</div>
            <div className="detail-value">{formatDate(staff.date)}</div>
          </div>
          <div>
            <div className="detail-label">Address</div>
            <div className="detail-value">{staff.address || 'N/A'}</div>
          </div>
          <div>
            <div className="detail-label">Date of Birth</div>
            <div className="detail-value">{formatDate(staff.dateOfBirth)}</div>
          </div>
          <div>
            <div className="detail-label">Gender</div>
            <div className="detail-value">{staff.gender || 'N/A'}</div>
          </div>
          <div>
            <div className="detail-label">Qualifications</div>
            <div className="detail-value">{staff.qualifications?.join(', ') || 'N/A'}</div>
          </div>
          <div>
            <div className="detail-label">Emergency Contact Name</div>
            <div className="detail-value">{staff.emergencyContact?.name || 'N/A'}</div>
          </div>
          <div>
            <div className="detail-label">Emergency Contact Phone</div>
            <div className="detail-value">{staff.emergencyContact?.phone || 'N/A'}</div>
          </div>
          <div>
            <div className="detail-label">Emergency Contact Relationship</div>
            <div className="detail-value">{staff.emergencyContact?.relationship || 'N/A'}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StaffProfile;