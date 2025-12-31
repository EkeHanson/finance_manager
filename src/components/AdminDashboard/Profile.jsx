import React, { useState } from "react";
import "./Profile.css";

const initialState = {
  name: "",
  email: "",
  contact: "",
  color: "#003087",
  logo: null,
  logoPreview: null,
};

const Profile = () => {
  const [form, setForm] = useState(initialState);

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (name === "logo" && files[0]) {
      setForm({
        ...form,
        logo: files[0],
        logoPreview: URL.createObjectURL(files[0]),
      });
    } else {
      setForm({ ...form, [name]: value });
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Submit logic here
    alert("Profile updated!");
  };

  console.log("Profile")

  return (
    <div className="profile-container">
      <h2>Edit Company Profile</h2>
      <form className="profile-form" onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Name</label>
          <input
            name="name"
            type="text"
            value={form.name}
            onChange={handleChange}
            required
          />
        </div>
        <div className="form-group">
          <label>Email</label>
          <input
            name="email"
            type="email"
            value={form.email}
            onChange={handleChange}
            required
          />
        </div>
        <div className="form-group">
          <label>Contact</label>
          <input
            name="contact"
            type="text"
            value={form.contact}
            onChange={handleChange}
            required
          />
        </div>
        <div className="form-group">
          <label>Company Color</label>
          <input
            name="color"
            type="color"
            value={form.color}
            onChange={handleChange}
          />
        </div>
        <div className="form-group">
          <label>Company Logo</label>
          <input
            name="logo"
            type="file"
            accept="image/*"
            onChange={handleChange}
          />
          {form.logoPreview && (
            <img
              src={form.logoPreview}
              alt="Logo Preview"
              className="logo-preview"
            />
          )}
        </div>
        <div className="profile-actions">
          <button className="submit-btn" type="submit">
            Save Changes
          </button>
        </div>
      </form>
    </div>
  );
};

export default Profile;