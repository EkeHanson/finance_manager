import React, { useState, useEffect, useRef } from 'react';
import './EditStaffModal.css';

// Helper function to format date for input (YYYY-MM-DD)
const formatDateForInput = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '';
  return date.toISOString().split('T')[0];
};

const EditStaffModal = ({ staff, onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    name: staff?.name || '',
    email: staff?.email || '',
    phoneNumber: staff?.phoneNumber || '',
    role: staff?.role || '',
    department: staff?.department || '',
    date: formatDateForInput(staff?.date) || '',
    address: staff?.address || '',
    dateOfBirth: formatDateForInput(staff?.dateOfBirth) || '',
    gender: staff?.gender || '',
    qualifications: staff?.qualifications?.join(', ') || '',
    emergencyContactName: staff?.emergencyContact?.name || '',
    emergencyContactPhone: staff?.emergencyContact?.phone || '',
    emergencyContactRelationship: staff?.emergencyContact?.relationship || '',
  });

  const modalRef = useRef();

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const updatedData = {
      name: formData.name,
      email: formData.email,
      phoneNumber: formData.phoneNumber,
      role: formData.role,
      department: formData.department,
      date: formData.date,
      address: formData.address,
      dateOfBirth: formData.dateOfBirth,
      gender: formData.gender,
      qualifications: formData.qualifications.split(',').map(q => q.trim()).filter(q => q),
      emergencyContact: {
        name: formData.emergencyContactName,
        phone: formData.emergencyContactPhone,
        relationship: formData.emergencyContactRelationship,
      },
    };
    onSubmit(staff.id, updatedData);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" ref={modalRef}>
        <button className="modal-close-btn" onClick={onClose} aria-label="Close">
          <span className="material-icons">close</span>
        </button>
        <h2>Edit Staff Profile</h2>
        <form onSubmit={handleSubmit} className="edit-staff-form">
          <div className="form-section">
            <h3>Personal Information</h3>
            <div className="form-group">
              <label htmlFor="name">Name</label>
              <input
                id="name"
                name="name"
                type="text"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
              />
            </div>
            <div className="form-group">
              <label htmlFor="phoneNumber">Phone Number</label>
              <input
                id="phoneNumber"
                name="phoneNumber"
                type="tel"
                value={formData.phoneNumber}
                onChange={handleChange}
              />
            </div>
            <div className="form-group">
              <label htmlFor="address">Address</label>
              <input
                id="address"
                name="address"
                type="text"
                value={formData.address}
                onChange={handleChange}
              />
            </div>
            <div className="form-group">
              <label htmlFor="dateOfBirth">Date of Birth</label>
              <input
                id="dateOfBirth"
                name="dateOfBirth"
                type="date"
                value={formData.dateOfBirth}
                onChange={handleChange}
              />
            </div>
            <div className="form-group">
              <label htmlFor="gender">Gender</label>
              <select
                id="gender"
                name="gender"
                value={formData.gender}
                onChange={handleChange}
              >
                <option value="">Select Gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>
          <div className="form-section">
            <h3>Professional Information</h3>
            <div className="form-group">
              <label htmlFor="role">Role</label>
              <input
                id="role"
                name="role"
                type="text"
                value={formData.role}
                onChange={handleChange}
              />
            </div>
            <div className="form-group">
              <label htmlFor="department">Department</label>
              <input
                id="department"
                name="department"
                type="text"
                value={formData.department}
                onChange={handleChange}
              />
            </div>
            <div className="form-group">
              <label htmlFor="date">Joining Date</label>
              <input
                id="date"
                name="date"
                type="date"
                value={formData.date}
                onChange={handleChange}
              />
            </div>
            <div className="form-group">
              <label htmlFor="qualifications">Qualifications (comma-separated)</label>
              <input
                id="qualifications"
                name="qualifications"
                type="text"
                value={formData.qualifications}
                onChange={handleChange}
                placeholder="e.g., BSc Computer Science, AWS Certified"
              />
            </div>
          </div>
          <div className="form-section">
            <h3>Emergency Contact</h3>
            <div className="form-group">
              <label htmlFor="emergencyContactName">Name</label>
              <input
                id="emergencyContactName"
                name="emergencyContactName"
                type="text"
                value={formData.emergencyContactName}
                onChange={handleChange}
              />
            </div>
            <div className="form-group">
              <label htmlFor="emergencyContactPhone">Phone</label>
              <input
                id="emergencyContactPhone"
                name="emergencyContactPhone"
                type="tel"
                value={formData.emergencyContactPhone}
                onChange={handleChange}
              />
            </div>
            <div className="form-group">
              <label htmlFor="emergencyContactRelationship">Relationship</label>
              <input
                id="emergencyContactRelationship"
                name="emergencyContactRelationship"
                type="text"
                value={formData.emergencyContactRelationship}
                onChange={handleChange}
              />
            </div>
          </div>
          <div className="form-actions">
            <button type="button" className="cancel-btn" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="submit-btn">
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditStaffModal;