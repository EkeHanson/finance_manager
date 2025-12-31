// src/components/ReviewsAdminDashboard/ReviewsAdminDashboard.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext'; // Adjust path if needed
import './ReviewsAdminDashboard.css'; // Dedicated CSS
import config from '../config'; // Adjust path if needed

const ReviewsAdminDashboard = () => {
  const { isAuthenticated, isLoading: authLoading, user, apiFetch } = useAuth(); // Use apiFetch from context
  const [activeSection, setActiveSection] = useState('qr-generation'); // Default to QR generation
  const [qrCodes, setQrCodes] = useState([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [allCount, setAllCount] = useState(0);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [newQrDescription, setNewQrDescription] = useState('');
  const [isGeneratingQr, setIsGeneratingQr] = useState(false);

  // Pagination and filters for pending reviews
  const [pendingPageData, setPendingPageData] = useState(null);
  const [currentPendingPage, setCurrentPendingPage] = useState(1);
  const [pendingFilters, setPendingFilters] = useState({ dateFrom: '', dateTo: '' });

  // Pagination and filters for all reviews
  const [allPageData, setAllPageData] = useState(null);
  const [currentAllPage, setCurrentAllPage] = useState(1);
  const [allFilters, setAllFilters] = useState({ status: 'all', dateFrom: '', dateTo: '' });

  // Filters for export
  const [exportFilters, setExportFilters] = useState({ status: 'approved', dateFrom: '', dateTo: '' });

  // API base URL (adjust if needed)
  const API_BASE = config.API_BASE_URL;

  useEffect(() => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }
    loadData();
  }, [isAuthenticated, apiFetch]);

  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => {
        setSuccess(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  // Load counts and other non-paginated data
  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      // Load QR codes using apiFetch (handles token)
      const qrRes = await apiFetch('/api/reviews/qrcodes/');
      if (qrRes.ok) {
        const qrData = await qrRes.json();
        setQrCodes(Array.isArray(qrData) ? qrData : (qrData.results || []));
      }

      // Load pending count
      const pendingCountRes = await apiFetch('/api/reviews/reviews/?is_approved=false&page_size=1');
      if (pendingCountRes.ok) {
        const data = await pendingCountRes.json();
        setPendingCount(data.count || 0);
      }

      // Load all count
      const allCountRes = await apiFetch('/api/reviews/reviews/?page_size=1');
      if (allCountRes.ok) {
        const data = await allCountRes.json();
        setAllCount(data.count || 0);
      }

      // Load analytics using apiFetch (fixed path)
      const analyticsRes = await apiFetch('/api/reviews/reviews/analytics/');
      if (analyticsRes.ok) {
        setAnalytics(await analyticsRes.json());
      }
    } catch (err) {
      setError('Failed to load data: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadPendingReviews = useCallback(async (page, filters) => {
    try {
      let params = new URLSearchParams({
        is_approved: 'false',
        page: page.toString()
      });
      if (filters.dateFrom) {
        params.append('submitted_at__gte', `${filters.dateFrom}T00:00:00Z`);
      }
      if (filters.dateTo) {
        params.append('submitted_at__lte', `${filters.dateTo}T23:59:59.999Z`);
      }
      const res = await apiFetch(`/api/reviews/reviews/?${params}`);
      if (res.ok) {
        const data = await res.json();
        setPendingPageData(data);
        setCurrentPendingPage(page);
      }
    } catch (err) {
      setError('Failed to load pending reviews: ' + err.message);
    }
  }, [apiFetch]);

  const loadAllReviews = useCallback(async (page, filters) => {
    try {
      let params = new URLSearchParams({
        page: page.toString()
      });
      if (filters.status !== 'all') {
        params.append('is_approved', filters.status === 'approved' ? 'true' : 'false');
      }
      if (filters.dateFrom) {
        params.append('submitted_at__gte', `${filters.dateFrom}T00:00:00Z`);
      }
      if (filters.dateTo) {
        params.append('submitted_at__lte', `${filters.dateTo}T23:59:59.999Z`);
      }
      const res = await apiFetch(`/api/reviews/reviews/?${params}`);
      if (res.ok) {
        const data = await res.json();
        setAllPageData(data);
        setCurrentAllPage(page);
      }
    } catch (err) {
      setError('Failed to load all reviews: ' + err.message);
    }
  }, [apiFetch]);

  // Effects for loading sections
  useEffect(() => {
    if (activeSection === 'pending-reviews') {
      loadPendingReviews(currentPendingPage, pendingFilters);
    }
  }, [activeSection, loadPendingReviews, currentPendingPage, pendingFilters]);

  useEffect(() => {
    if (activeSection === 'all-reviews') {
      loadAllReviews(currentAllPage, allFilters);
    }
  }, [activeSection, loadAllReviews, currentAllPage, allFilters]);

  // Reset to page 1 on filter change
  useEffect(() => {
    loadPendingReviews(1, pendingFilters);
  }, [pendingFilters, loadPendingReviews]);

  useEffect(() => {
    loadAllReviews(1, allFilters);
  }, [allFilters, loadAllReviews]);

  const handleGenerateQr = async (e) => {
    e.preventDefault();
    if (!newQrDescription.trim()) return;
    setIsGeneratingQr(true);
    try {
      const res = await apiFetch('/api/reviews/qrcodes/', {  // Use apiFetch
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description: newQrDescription }),
      });
      if (res.ok) {
        const newQr = await res.json();
        setQrCodes(prev => [newQr, ...prev]);
        setNewQrDescription(''); // Reset form
        // Optionally reload all data
        loadData();
      } else {
        const data = await res.json();
        setError(data.detail || 'Failed to generate QR code');
      }
    } catch (err) {
      setError('Network error: ' + err.message);
    } finally {
      setIsGeneratingQr(false);
    }
  };

  const handleApproveReview = async (reviewId) => {
    try {
      const res = await apiFetch(`/api/reviews/reviews/${reviewId}/approve/`, { method: 'POST' });  // Use apiFetch, fixed path
      if (res.ok) {
        setSuccess('Review approved successfully!');
        await loadData(); // Refresh counts
        if (activeSection === 'pending-reviews') {
          loadPendingReviews(1, pendingFilters); // Reload pending from page 1
        }
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to approve review');
      }
    } catch (err) {
      setError('Network error: ' + err.message);
    }
  };

  const handleTestSubmission = (qr) => {
    try {
      // qr.qr_data may be a JSON string or object
      const data = typeof qr.qr_data === 'string' ? JSON.parse(qr.qr_data) : qr.qr_data;

      // Try common token keys
      let token = data?.token || data?.qr_id || null;

      // If token not found, try to extract from a url field
      if (!token && data?.url) {
        try {
          const parsed = new URL(data.url, window.location.origin);
          token = parsed.searchParams.get('qr_id') || parsed.searchParams.get('token') || null;
        } catch (e) {
          // ignore URL parse error
        }
      }

      // If still no token, fallback to opening the original url (if present)
      if (!token) {
        if (data?.url) {
          window.open(data.url, '_blank');
          return;
        }
        setError('Unable to extract token for test submission.');
        return;
      }

      // Build the local redirect URL: /submit/<unique_id>/submit?qr_id=<token>
      const target = `${window.location.origin}/submit/${qr.unique_id}/submit?qr_id=${encodeURIComponent(token)}`;
      window.open(target, '_blank');
    } catch (err) {
      setError('Invalid QR data: ' + err.message);
    }
  };

  const handleExport = async () => {
    try {
      let params = new URLSearchParams();
      if (exportFilters.status !== 'all') {
        params.append('is_approved', exportFilters.status === 'approved' ? 'true' : 'false');
      }
      if (exportFilters.dateFrom) {
        params.append('submitted_at__gte', `${exportFilters.dateFrom}T00:00:00Z`);
      }
      if (exportFilters.dateTo) {
        params.append('submitted_at__lte', `${exportFilters.dateTo}T23:59:59.999Z`);
      }
      const url = `/api/reviews/reviews/export/?${params}`;
      const res = await apiFetch(url);  // Use apiFetch
      if (res.ok) {
        const blob = await res.blob();
        const urlObj = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = urlObj;
        a.download = `reviews_export_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        window.URL.revokeObjectURL(urlObj);
      } else {
        const data = await res.json();
        setError(data.error || 'Export failed');
      }
    } catch (err) {
      setError('Export failed: ' + err.message);
    }
  };

  if (authLoading || loading) {
    return <div className="loading">Loading Reviews Dashboard...</div>;
  }

  if (!isAuthenticated) {
    return <div className="error">Please log in to access the dashboard.</div>;
  }

  const pageSize = 20;

  return (
    <div className="reviews-admin-container">
      {/* Sidebar */}
      <nav className="reviews-sidebar">
        <ul>
          <li className={activeSection === 'qr-generation' ? 'active' : ''} onClick={() => setActiveSection('qr-generation')}>
            Generate QR Code
          </li>
          <li className={activeSection === 'qr-list' ? 'active' : ''} onClick={() => setActiveSection('qr-list')}>
            QR Codes ({qrCodes.length})
          </li>
          <li className={activeSection === 'pending-reviews' ? 'active' : ''} onClick={() => setActiveSection('pending-reviews')}>
            Pending Reviews ({pendingCount})
          </li>
          <li className={activeSection === 'all-reviews' ? 'active' : ''} onClick={() => setActiveSection('all-reviews')}>
            All Reviews ({allCount})
          </li>
          <li className={activeSection === 'analytics' ? 'active' : ''} onClick={() => setActiveSection('analytics')}>
            Analytics
          </li>
          <li className={activeSection === 'export' ? 'active' : ''} onClick={() => setActiveSection('export')}>
            Export Data
          </li>
        </ul>
      </nav>

      {/* Main Content */}
      <main className="reviews-main">
        <header className="reviews-header">
          <h1>Reviews Admin Dashboard</h1>
          <p>Manage QR codes, reviews, and analytics for {user?.tenant?.name || 'your organization'}</p>
          {error && <div className="error-banner">{error}</div>}
          {success && <div className="success-banner">{success}</div>}
          <button onClick={loadData} className="refresh-btn">Refresh Data</button>
        </header>

        {/* QR Generation Section */}
        {activeSection === 'qr-generation' && (
          <section className="reviews-section">
            <h2>Generate New QR Code</h2>
            <form onSubmit={handleGenerateQr} className="qr-form">
              <div className="form-group">
                <label htmlFor="description">QR Description (e.g., "Main Office Review")</label>
                <input
                  type="text"
                  id="description"
                  value={newQrDescription}
                  onChange={(e) => setNewQrDescription(e.target.value)}
                  placeholder="Enter a description for this QR code"
                  required
                />
              </div>
              <button type="submit" disabled={isGeneratingQr} className="generate-btn">
                {isGeneratingQr ? 'Generating...' : 'Generate QR Code'}
              </button>
            </form>
            <p className="qr-note">QR codes link to: /reviews/submit?token=&lt;encrypted&gt;</p>
          </section>
        )}

        {/* QR List Section */}
        {activeSection === 'qr-list' && (
          <section className="reviews-section">
            <h2>QR Codes</h2>
            {qrCodes.length === 0 ? (
              <p>No QR codes generated yet. Start by creating one above!</p>
            ) : (
              <div className="qr-list">
                {qrCodes.map((qr) => (
                  <div key={qr.id} className="qr-card">
                    <img src={qr.image_url} alt="QR Code" className="qr-image" />
                    <div className="qr-info">
                      <h3>{JSON.parse(qr.qr_data).description || 'Unnamed QR'}</h3> {/* Parse JSON safely */}
                      <p>ID: {qr.unique_id}</p>
                      <p>Scans: {qr.scan_count}</p>
                      <button onClick={() => handleTestSubmission(qr)} className="test-btn">
                        Test Submission
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* Pending Reviews List Section */}
        {activeSection === 'pending-reviews' && (
          <section className="reviews-section">
            <h2>Pending Reviews ({pendingPageData ? pendingPageData.count : 0})</h2>
            <div className="filters">
              <label>
                Date From:
                <input
                  type="date"
                  value={pendingFilters.dateFrom}
                  onChange={(e) => setPendingFilters((prev) => ({ ...prev, dateFrom: e.target.value }))}
                />
              </label>
              <label>
                Date To:
                <input
                  type="date"
                  value={pendingFilters.dateTo}
                  onChange={(e) => setPendingFilters((prev) => ({ ...prev, dateTo: e.target.value }))}
                />
              </label>
            </div>
            {pendingPageData ? (
              <>
                {pendingPageData.results.length === 0 ? (
                  <p>No pending reviews match the filters.</p>
                ) : (
                  <div className="reviews-list">
                    {pendingPageData.results.map((review) => (
                      <div key={review.id} className="review-card">
                        <div className="review-header">
                          <span className={`rating-${review.rating}`}>★ {review.rating}/5</span>
                          {review.reviewer_name && <h4>{review.reviewer_name}</h4>}
                          {review.reviewer_email && <p>{review.reviewer_email}</p>}
                        </div>
                        <p className="review-comment">{review.comment}</p>
                        {review.attachments && review.attachments.length > 0 && (
                          <div className="attachments">
                            {review.attachments.map((att, idx) => (
                              <a key={idx} href={att.url} target="_blank" rel="noopener noreferrer">
                                Attachment {idx + 1}
                              </a>
                            ))}
                          </div>
                        )}
                        <div className="review-actions">
                          <button onClick={() => handleApproveReview(review.id)} className="approve-btn">
                            Approve
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                <div className="pagination">
                  <button
                    onClick={() => loadPendingReviews(currentPendingPage - 1, pendingFilters)}
                    disabled={currentPendingPage === 1}
                  >
                    Prev
                  </button>
                  <p>
                    Page {currentPendingPage} of {Math.ceil((pendingPageData.count || 0) / pageSize)}
                  </p>
                  <button
                    onClick={() => loadPendingReviews(currentPendingPage + 1, pendingFilters)}
                    disabled={!pendingPageData.next}
                  >
                    Next
                  </button>
                </div>
              </>
            ) : (
              <p>Loading pending reviews...</p>
            )}
          </section>
        )}

        {/* All Reviews List Section */}
        {activeSection === 'all-reviews' && (
          <section className="reviews-section">
            <h2>All Reviews ({allPageData ? allPageData.count : 0})</h2>
            <div className="filters">
              <label>
                Status:
                <select
                  value={allFilters.status}
                  onChange={(e) => setAllFilters((prev) => ({ ...prev, status: e.target.value }))}
                >
                  <option value="all">All</option>
                  <option value="approved">Approved</option>
                  <option value="pending">Pending</option>
                </select>
              </label>
              <label>
                Date From:
                <input
                  type="date"
                  value={allFilters.dateFrom}
                  onChange={(e) => setAllFilters((prev) => ({ ...prev, dateFrom: e.target.value }))}
                />
              </label>
              <label>
                Date To:
                <input
                  type="date"
                  value={allFilters.dateTo}
                  onChange={(e) => setAllFilters((prev) => ({ ...prev, dateTo: e.target.value }))}
                />
              </label>
            </div>
            {allPageData ? (
              <>
                {allPageData.results.length === 0 ? (
                  <p>No reviews match the filters.</p>
                ) : (
                  <div className="reviews-list">
                    {allPageData.results.map((review) => (
                      <div key={review.id} className="review-card">
                        <div className="review-header">
                          <span className={`rating-${review.rating}`}>★ {review.rating}/5</span>
                          {review.reviewer_name && <h4>{review.reviewer_name}</h4>}
                          {review.reviewer_email && <p>{review.reviewer_email}</p>}
                          <span className={`status-badge ${review.is_approved ? 'approved' : 'pending'}`}>
                            {review.is_approved ? 'Approved' : 'Pending'}
                          </span>
                        </div>
                        <p className="review-comment">{review.comment}</p>
                        {review.attachments && review.attachments.length > 0 && (
                          <div className="attachments">
                            {review.attachments.map((att, idx) => (
                              <a key={idx} href={att.url} target="_blank" rel="noopener noreferrer">
                                Attachment {idx + 1}
                              </a>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
                <div className="pagination">
                  <button
                    onClick={() => loadAllReviews(currentAllPage - 1, allFilters)}
                    disabled={currentAllPage === 1}
                  >
                    Prev
                  </button>
                  <p>
                    Page {currentAllPage} of {Math.ceil((allPageData.count || 0) / pageSize)}
                  </p>
                  <button
                    onClick={() => loadAllReviews(currentAllPage + 1, allFilters)}
                    disabled={!allPageData.next}
                  >
                    Next
                  </button>
                </div>
              </>
            ) : (
              <p>Loading all reviews...</p>
            )}
          </section>
        )}

        {/* Analytics Section */}
        {activeSection === 'analytics' && (
          <section className="reviews-section">
            <h2>Analytics</h2>
            {analytics ? (
              <div className="analytics-grid">
                <div className="stat-card" onClick={() => setActiveSection('all-reviews')}>
                  <h3>Total Reviews</h3>
                  <p>{analytics.total_reviews}</p>
                </div>
                <div className="stat-card" onClick={() => setActiveSection('all-reviews')}>
                  <h3>Avg Rating</h3>
                  <p>{analytics.avg_rating}/5</p>
                </div>
                <div className="stat-card" onClick={() => setActiveSection('all-reviews')}>
                  <h3>Avg Sentiment</h3>
                  <p>{analytics.avg_sentiment > 0 ? 'Positive' : 'Negative'}</p>
                </div>
                {/* Add charts here if using a lib like Recharts */}
                <div className="trends-section" onClick={() => setActiveSection('all-reviews')}>
                  <h4>Monthly Trends</h4>
                  <ul>
                    {analytics.trends.map((trend, idx) => (
                      <li key={idx}>
                        {new Date(trend.month).toLocaleDateString('short')}: {trend.count} reviews, Avg {trend.avg_rating}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ) : (
              <p>Loading analytics...</p>
            )}
          </section>
        )}

        {/* Export Section */}
        {activeSection === 'export' && (
          <section className="reviews-section">
            <h2>Export Reviews</h2>
            <div className="filters">
              <label>
                Status:
                <select
                  value={exportFilters.status}
                  onChange={(e) => setExportFilters((prev) => ({ ...prev, status: e.target.value }))}
                >
                  <option value="approved">Approved</option>
                  <option value="all">All</option>
                  <option value="pending">Pending</option>
                </select>
              </label>
              <label>
                Date From:
                <input
                  type="date"
                  value={exportFilters.dateFrom}
                  onChange={(e) => setExportFilters((prev) => ({ ...prev, dateFrom: e.target.value }))}
                />
              </label>
              <label>
                Date To:
                <input
                  type="date"
                  value={exportFilters.dateTo}
                  onChange={(e) => setExportFilters((prev) => ({ ...prev, dateTo: e.target.value }))}
                />
              </label>
            </div>
            <p>Download {exportFilters.status} reviews as CSV.</p>
            <button onClick={handleExport} className="export-btn">Export CSV</button>
          </section>
        )}
      </main>
    </div>
  );
};

export default ReviewsAdminDashboard;