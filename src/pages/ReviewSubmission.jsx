// src/pages/ReviewSubmission.jsx
import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import config from '../config';
import './ReviewSubmission.css';

const ReviewSubmission = () => {
  const [searchParams] = useSearchParams();
  
  const [formData, setFormData] = useState({
    reviewer_name: '',
    reviewer_email: '',
    rating: 5,
    comment: '',
    attachments: [],
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null);
  const [qrId, setQrId] = useState(null);
  const [tenantId, setTenantId] = useState(null);
  const [maxAttachments, setMaxAttachments] = useState(3);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [qrDescription, setQrDescription] = useState('Leave your review below');

  useEffect(() => {
    console.log('🔄 ReviewSubmission mounted');
    console.log('🔍 Search params:', Object.fromEntries(searchParams.entries()));
    
    // Extract token value from either 'qr_id' (test/fallback) or 'token' (real QR scan)
    const tokenValue = searchParams.get('qr_id') || searchParams.get('token');
    console.log('🔑 Token value from URL (qr_id or token):', tokenValue ? 'Present' : 'Missing');
    
    if (tokenValue) {
      // Fetch QR context from backend
      fetchQrContext(tokenValue);
    } else {
      console.log('❌ No token/qr_id found in URL');
      setError('Invalid QR code. No token provided.');
      setIsLoading(false);
    }
  }, [searchParams]);

  // Helper to robustly parse response and extract error
  const parseErrorResponse = async (response) => {
    const contentType = response.headers.get('content-type');
    console.log('📋 Response content-type:', contentType);
    
    if (contentType && contentType.includes('application/json')) {
      const errorData = await response.json();
      return {
        isHtml: false,
        message: errorData.error || errorData.detail || `Server error: ${response.status}`,
        status: response.status
      };
    } else {
      // Likely HTML error page (Django default)
      const text = await response.text();
      console.error('❌ Non-JSON response (likely HTML):', text.substring(0, 200) + '...');
      return {
        isHtml: true,
        message: `Server error (returned HTML page): ${response.status}. Check backend logs if you're the developer. Please try scanning the QR code again.`,
        status: response.status,
        rawText: text
      };
    }
  };

  const fetchQrContext = async (tokenValue) => {
    try {
      console.log('🌐 Fetching QR context for token...');
      // Backend expects ?token=..., so pass the value as 'token' param
      // Add timeout: Abort after 10s
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      
      const response = await fetch(
        `${config.API_BASE_URL}/api/reviews/submit?token=${encodeURIComponent(tokenValue)}`,
        { signal: controller.signal }
      );
      clearTimeout(timeoutId);
      
      if (response.ok) {
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          throw new Error('Unexpected response type (not JSON)');
        }
        
        const data = await response.json();
        console.log('✅ QR context received:', data);
        
        if (data.success) {
          setQrId(data.qr_id);
          setTenantId(data.tenant_id);
          setQrDescription(data.description || 'Leave your review below');
          setMaxAttachments(data.max_attachments || 3);
          setIsLoading(false);
        } else {
          throw new Error(data.error || 'Invalid QR response');
        }
      } else {
        const errorInfo = await parseErrorResponse(response);
        console.error('❌ QR context fetch failed:', errorInfo);
        throw new Error(errorInfo.message);
      }
    } catch (err) {
      console.error('❌ Error fetching QR context:', err);
      let errorMsg = `Failed to load review form: ${err.message}`;
      
      if (err.name === 'AbortError') {
        errorMsg = 'Request timed out. Please check your connection and try again.';
      } else if (err.message.includes('Failed to fetch')) {
        errorMsg = 'Network error: Unable to reach server. Please check your connection.';
      }
      
      setError(errorMsg);
      setIsLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    const currentCount = formData.attachments.length;
    const newCount = files.length;
    
    if (currentCount + newCount > maxAttachments) {
      alert(`Maximum ${maxAttachments} attachments allowed. You have ${currentCount} already.`);
      return;
    }
    setFormData(prev => ({
      ...prev,
      attachments: [...prev.attachments, ...files],
    }));
  };

  const handleRemoveAttachment = (index) => {
    setFormData(prev => ({
      ...prev,
      attachments: prev.attachments.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('📤 Submitting review...', { qrId, tenantId });
    
    if (!qrId || !tenantId) {
      setError('Missing submission data. Please reload the form.');
      return;
    }
    
    // Basic validation
    if (!formData.comment.trim()) {
      setError('Review comment is required.');
      return;
    }
    if (!formData.rating || formData.rating < 1 || formData.rating > 5) {
      setError('Valid rating (1-5) is required.');
      return;
    }
    
    setIsSubmitting(true);
    setError(null);
    setSubmitStatus(null);

    const formDataToSend = new FormData();
    formDataToSend.append('qr_id', qrId);
    formDataToSend.append('tenant_id', tenantId);
    formDataToSend.append('reviewer_name', formData.reviewer_name || '');
    formDataToSend.append('reviewer_email', formData.reviewer_email || '');
    formDataToSend.append('rating', formData.rating);
    formDataToSend.append('comment', formData.comment);
    
    formData.attachments.forEach(file => {
      formDataToSend.append('attachments', file);
    });

    try {
      // POST to public endpoint (no auth required)
      const submitUrl = `${config.API_BASE_URL}/api/reviews/public/submit/`;
      console.log('🌐 Sending review to:', submitUrl);
      console.log('📦 Review data preview:', {
        qr_id: qrId,
        tenant_id: tenantId,
        reviewer_name: formData.reviewer_name,
        reviewer_email: formData.reviewer_email,
        rating: formData.rating,
        comment: formData.comment.substring(0, 50) + '...',
        attachments_count: formData.attachments.length
      });
      
      // Add timeout: Abort after 30s (longer for file upload)
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);
      
      const response = await fetch(submitUrl, {
        method: 'POST',
        body: formDataToSend,
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      console.log('📨 Response status:', response.status);
      console.log('📨 Response headers:', [...response.headers.entries()]);
      
      if (response.ok) {
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          throw new Error('Unexpected response type (not JSON)');
        }
        
        const responseData = await response.json();
        console.log('✅ Review submitted successfully:', responseData);
        setSubmitStatus('success');
        // Reset form
        setFormData({
          reviewer_name: '',
          reviewer_email: '',
          rating: 5,
          comment: '',
          attachments: [],
        });
      } else {
        const errorInfo = await parseErrorResponse(response);
        console.error('❌ Review submission failed:', errorInfo);
        setError(errorInfo.message);
      }
    } catch (err) {
      console.error('❌ Submit error:', err);
      let errorMsg = 'Submission failed. Please try again.';
      
      if (err.name === 'AbortError') {
        errorMsg = 'Upload timed out. Please check your file sizes and connection, then try again.';
      } else if (err.message.includes('Failed to fetch')) {
        errorMsg = 'Network error: Unable to reach server. Please check your connection.';
      } else {
        errorMsg = err.message;
      }
      
      setError(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper to copy URL to clipboard
  const copyUrlToClipboard = () => {
    navigator.clipboard.writeText(window.location.href).then(() => {
      alert('URL copied to clipboard! You can share this for debugging.');
    }).catch(() => {
      // Fallback: Select and copy
      const textArea = document.createElement('textarea');
      textArea.value = window.location.href;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      alert('URL copied to clipboard!');
    });
  };

  console.log('🎨 Rendering component state:', { 
    isLoading, 
    error, 
    qrId, 
    tenantId,
    submitStatus,
    maxAttachments,
    attachmentsCount: formData.attachments.length
  });

  if (error && !isLoading) {
    return (
      <div className="review-submission-container">
        <div className="error-message">
          <h2>Unable to Load Review Form</h2>
          <p>{error}</p>
          <div style={{ marginTop: '20px' }}>
            <p style={{ fontSize: '14px', color: '#666', marginBottom: '10px' }}>
              For debugging: Current URL
            </p>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <input
                type="text"
                value={window.location.href}
                readOnly
                style={{ flex: 1, padding: '8px', fontSize: '12px' }}
              />
              <button onClick={copyUrlToClipboard} style={{ padding: '8px 12px' }}>
                Copy URL
              </button>
            </div>
          </div>
          <button onClick={() => window.location.reload()} style={{ marginTop: '15px', padding: '10px 20px' }}>
            Retry
          </button>
          <button 
            onClick={() => window.location.href = '/'} 
            style={{ marginTop: '10px', padding: '10px 20px', backgroundColor: '#6c757d' }}
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="review-submission-container">
        <div className="loading-message">
          <h2>Loading Review Form...</h2>
          <p>Preparing form for your feedback...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="review-submission-container">
      <div className="review-form-wrapper">
        <h1>Submit Your Review</h1>
        {/* <p className="subtitle">{qrDescription}</p> */}
        <p>Thank you for taking the time to share your feedback! Your input helps us improve and serve you better.</p>
        
        {submitStatus === 'success' ? (
          <div className="success-message">
            <h2>Thank You!</h2>
            <p>Your review has been submitted successfully. It will be reviewed and published soon.</p>
            {/* <button onClick={() => window.location.href = '/'}>Back to Home</button> */}
          </div>
        ) : (
          <form onSubmit={handleSubmit} encType="multipart/form-data">
            <div className="form-group">
              <label htmlFor="reviewer_name">Your Name (Optional)</label>
              <input
                type="text"
                id="reviewer_name"
                name="reviewer_name"
                value={formData.reviewer_name}
                onChange={handleInputChange}
                placeholder="Enter your name"
              />
            </div>

            <div className="form-group">
              <label htmlFor="reviewer_email">Your Email (Optional)</label>
              <input
                type="email"
                id="reviewer_email"
                name="reviewer_email"
                value={formData.reviewer_email}
                onChange={handleInputChange}
                placeholder="Enter your email for follow-up"
              />
            </div>

            <div className="form-group">
              <label>Rating (Required)</label>
              <div className="stars-container">
                {[1, 2, 3, 4, 5].map((star) => (
                  <label key={star} className="star-label">
                    <input
                      type="radio"
                      name="rating"
                      value={star}
                      checked={formData.rating === star}
                      onChange={handleInputChange}
                      required
                    />
                    <span 
                      className={`star ${formData.rating >= star ? 'active' : ''}`} 
                      style={{ color: formData.rating >= star ? '#ffd700' : '#ddd' }}
                    >
                      ★
                    </span>
                  </label>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="comment">Your Review (Required)</label>
              <textarea
                id="comment"
                name="comment"
                value={formData.comment}
                onChange={handleInputChange}
                placeholder="Share your experience..."
                rows={5}
                required
                maxLength={1000}
              />
              <small>{formData.comment.length}/1000 characters</small>
            </div>

            <div className="form-group">
              <label htmlFor="attachments">Attachments (Optional, max {maxAttachments})</label>
              <input
                type="file"
                id="attachments"
                name="attachments"
                multiple
                accept="image/*,.pdf"
                onChange={handleFileChange}
              />
              {formData.attachments.length > 0 && (
                <div className="attachments-preview">
                  <p>Selected files ({formData.attachments.length}/{maxAttachments}):</p>
                  <ul>
                    {formData.attachments.map((file, index) => (
                      <li key={index}>
                        {file.name} 
                        <button 
                          type="button" 
                          onClick={() => handleRemoveAttachment(index)}
                          style={{ marginLeft: '10px', color: '#dc3545' }}
                        >
                          Remove
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <button type="submit" disabled={isSubmitting} className="submit-btn">
              {isSubmitting ? 'Submitting Your Review...' : 'Submit Review'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default ReviewSubmission;