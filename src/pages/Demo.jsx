import React, { useState } from 'react';
import './Demo.css';

const Demo = () => {
  const [form, setForm] = useState({
    name: '',
    email: '',
    company: '',
    date: '',
    time: '',
  });
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
    // TODO: Integrate with backend API for demo booking
  };

  return (
    <div className="demo-container">
      <form className="demo-form" onSubmit={handleSubmit}>
        <h2>Book a Demo Session</h2>
        <div className="demo-input-group">
          <label htmlFor="name">Full Name</label>
          <input type="text" id="name" name="name" value={form.name} onChange={handleChange} required />
        </div>
        <div className="demo-input-group">
          <label htmlFor="email">Email</label>
          <input type="email" id="email" name="email" value={form.email} onChange={handleChange} required />
        </div>
        <div className="demo-input-group">
          <label htmlFor="company">Company Name</label>
          <input type="text" id="company" name="company" value={form.company} onChange={handleChange} required />
        </div>
        <div className="demo-input-group">
          <label htmlFor="date">Preferred Date</label>
          <input
            type="date"
            id="date"
            name="date"
            value={form.date}
            onChange={handleChange}
            required
            min={new Date().toISOString().split('T')[0]}
          />
        </div>
        <div className="demo-input-group">
          <label htmlFor="time">Preferred Time</label>
          <input
            type="time"
            id="time"
            name="time"
            value={form.time || ''}
            onChange={handleChange}
            required
            min={form.date === new Date().toISOString().split('T')[0] ? new Date().toTimeString().slice(0,5) : undefined}
          />
        </div>
        <button className="demo-btn" type="submit">Book Demo</button>
        {submitted && <div className="demo-success">Thank you! Your demo session has been booked.</div>}
      </form>
    </div>
  );
};

export default Demo;
