import React, { useState, useEffect } from 'react';
import './TaxReportModal.css';
import useInvestmentApi from '../../services/InvestmentApiService';
import { useAuth } from '../../contexts/AuthContext';

const TaxReportModal = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const {
    getTaxRecords,
    getTaxSummary,
    getTaxCertificates,
    calculateTax,
    generateTaxCertificate
  } = useInvestmentApi();

  const [activeTab, setActiveTab] = useState('summary');
  const [taxRecords, setTaxRecords] = useState([]);
  const [taxSummary, setTaxSummary] = useState(null);
  const [taxCertificates, setTaxCertificates] = useState([]);
  const [taxCalculation, setTaxCalculation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState('');

  const [calcAmount, setCalcAmount] = useState('');
  const [calcTaxType, setCalcTaxType] = useState('wht');
  const [annualIncome, setAnnualIncome] = useState('');
  const [certType, setCertType] = useState('annual_summary');
  const [certYear, setCertYear] = useState(new Date().getFullYear());

  useEffect(() => {
    if (isOpen) {
      fetchTaxData();
    }
  }, [isOpen]);

  // Set tenant colors as CSS variables
  useEffect(() => {
    if (user?.tenant_primary_color) {
      document.documentElement.style.setProperty('--tenant-primary', user.tenant_primary_color);
    }
    if (user?.tenant_secondary_color) {
      document.documentElement.style.setProperty('--tenant-secondary', user.tenant_secondary_color);
    }
  }, [user]);

  const fetchTaxData = async () => {
    setLoading(true);
    try {
      const [recordsRes, summaryRes, certRes] = await Promise.all([
        getTaxRecords(),
        getTaxSummary(),
        getTaxCertificates()
      ]);

      setTaxRecords(recordsRes.results || []);
      setTaxSummary(summaryRes);
      setTaxCertificates(certRes.results || []);
    } catch (err) {
      console.error('Error fetching tax data:', err);
      setError('Failed to load tax data');
    } finally {
      setLoading(false);
    }
  };

  const handleTaxCalculation = async (e) => {
    e.preventDefault();

    if (!calcAmount || isNaN(calcAmount)) {
      setMessage('Please enter a valid amount');
      setTimeout(() => setMessage(''), 3000);
      return;
    }

    setLoading(true);
    try {
      const result = await calculateTax(calcAmount, calcTaxType, annualIncome || null);
      if (result.success) {
        setTaxCalculation(result.data);
        setMessage('Tax calculated successfully');
      } else {
        setError(result.error);
      }
    } catch (err) {
      console.error('Error calculating tax:', err);
      setError('Failed to calculate tax');
    } finally {
      setLoading(false);
      setTimeout(() => setMessage(''), 3000);
    }
  };

  const handleGenerateCertificate = async (e) => {
    e.preventDefault();

    setLoading(true);
    try {
      const result = await generateTaxCertificate(certType, certYear);
      if (result.success) {
        setMessage('Tax certificate generated successfully');
        const certRes = await getTaxCertificates();
        setTaxCertificates(certRes.results || []);
      } else {
        setError(result.error);
      }
    } catch (err) {
      console.error('Error generating certificate:', err);
      setError('Failed to generate certificate');
    } finally {
      setLoading(false);
      setTimeout(() => setMessage(''), 3000);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN'
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-GB');
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="tax-modal light" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>🏛️ Nigerian Tax Management</h3>
          <button className="close-button" onClick={onClose}>×</button>
        </div>

        <div className="modal-tabs">
          <button
            className={`tab-button ${activeTab === 'summary' ? 'active' : ''}`}
            onClick={() => setActiveTab('summary')}
          >
            <span className="tab-icon">📊</span>
            <span className="tab-text">Summary</span>
          </button>
          <button
            className={`tab-button ${activeTab === 'records' ? 'active' : ''}`}
            onClick={() => setActiveTab('records')}
          >
            <span className="tab-icon">📜</span>
            <span className="tab-text">Records</span>
          </button>
          <button
            className={`tab-button ${activeTab === 'calculator' ? 'active' : ''}`}
            onClick={() => setActiveTab('calculator')}
          >
            <span className="tab-icon">🧮</span>
            <span className="tab-text">Calculator</span>
          </button>
          <button
            className={`tab-button ${activeTab === 'certificates' ? 'active' : ''}`}
            onClick={() => setActiveTab('certificates')}
          >
            <span className="tab-icon">📄</span>
            <span className="tab-text">Certificates</span>
          </button>
        </div>

        <div className="modal-content">
          {message && <div className="message success">{message}</div>}
          {error && <div className="message error">{error}</div>}

          {activeTab === 'summary' && (
            <div className="tax-summary">
              <div className="tab-header">
                <h4>📊 Tax Summary</h4>
                <span className="tab-subtitle">Overview of your tax information</span>
              </div>
              {loading ? (
                <div className="loading">
                  <div className="spinner"></div>
                  Loading tax summary...
                </div>
              ) : taxSummary ? (
                <div className="summary-cards">
                  <div className="summary-card">
                    <div className="card-icon">💰</div>
                    <div className="card-content">
                      <h5>Total Gross Income</h5>
                      <p>{formatCurrency(taxSummary.total_gross_income || 0)}</p>
                    </div>
                  </div>
                  <div className="summary-card">
                    <div className="card-icon">💸</div>
                    <div className="card-content">
                      <h5>Total Tax Deducted</h5>
                      <p>{formatCurrency(taxSummary.total_tax_deducted || 0)}</p>
                    </div>
                  </div>
                  <div className="summary-card">
                    <div className="card-icon">✅</div>
                    <div className="card-content">
                      <h5>Total Tax Paid</h5>
                      <p>{formatCurrency(taxSummary.total_tax_paid || 0)}</p>
                    </div>
                  </div>
                  <div className="summary-card">
                    <div className="card-icon">📈</div>
                    <div className="card-content">
                      <h5>Net Income After Tax</h5>
                      <p>{formatCurrency(taxSummary.net_income_after_tax || 0)}</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="empty-state">
                  <span className="empty-icon">📊</span>
                  <p>No tax summary available</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'records' && (
            <div className="tax-records">
              <div className="tab-header">
                <h4>📜 Tax Records</h4>
                <span className="tab-subtitle">Your complete tax history</span>
              </div>
              {loading ? (
                <div className="loading">
                  <div className="spinner"></div>
                  Loading tax records...
                </div>
              ) : taxRecords.length > 0 ? (
                <div className="table-wrapper">
                  <table className="tax-table">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Tax Type</th>
                        <th>Gross Amount</th>
                        <th>Tax Amount</th>
                        <th>Net Amount</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {taxRecords.map((record, idx) => (
                        <tr key={idx}>
                          <td className="date">{formatDate(record.calculation_date)}</td>
                          <td className="tax-type">{record.tax_type.toUpperCase()}</td>
                          <td className="amount">{formatCurrency(record.gross_amount)}</td>
                          <td className="amount">{formatCurrency(record.tax_amount)}</td>
                          <td className="amount">{formatCurrency(record.net_amount)}</td>
                          <td>
                            <span className={`status-badge ${record.is_paid ? 'paid' : 'pending'}`}>
                              {record.is_paid ? 'Paid' : 'Pending'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="empty-state">
                  <span className="empty-icon">📜</span>
                  <p>No tax records found</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'calculator' && (
            <div className="tax-calculator">
              <div className="tab-header">
                <h4>🧮 Tax Calculator</h4>
                <span className="tab-subtitle">Calculate your tax obligations</span>
              </div>
              <form onSubmit={handleTaxCalculation} className="calculator-form">
                <div className="form-row">
                  <div className="form-group">
                    <label>💵 Amount (₦)</label>
                    <input
                      type="number"
                      value={calcAmount}
                      onChange={(e) => setCalcAmount(e.target.value)}
                      placeholder="Enter amount"
                      required
                      min="0"
                      step="0.01"
                    />
                  </div>
                  <div className="form-group">
                    <label>📋 Tax Type</label>
                    <select
                      value={calcTaxType}
                      onChange={(e) => setCalcTaxType(e.target.value)}
                    >
                      <option value="wht">Withholding Tax (10%)</option>
                      <option value="pit">Personal Income Tax</option>
                      <option value="cgt">Capital Gains Tax (10%)</option>
                      <option value="vat">Value Added Tax (7.5%)</option>
                      <option value="tet">Tertiary Education Tax (2.5%)</option>
                    </select>
                  </div>
                </div>

                {calcTaxType === 'pit' && (
                  <div className="form-group">
                    <label>💰 Annual Income (₦)</label>
                    <input
                      type="number"
                      value={annualIncome}
                      onChange={(e) => setAnnualIncome(e.target.value)}
                      placeholder="Enter annual income for PIT calculation"
                      min="0"
                      step="0.01"
                    />
                  </div>
                )}

                <button type="submit" className="calculate-button" disabled={loading}>
                  <span className="button-icon">{loading ? '⏳' : '🧮'}</span>
                  {loading ? 'Calculating...' : 'Calculate Tax'}
                </button>
              </form>

              {taxCalculation && (
                <div className="calculation-result">
                  <h5>✨ Calculation Result</h5>
                  <div className="result-grid">
                    <div className="result-item">
                      <span className="result-label">Gross Amount:</span>
                      <span className="result-value">{formatCurrency(taxCalculation.gross_amount)}</span>
                    </div>
                    <div className="result-item">
                      <span className="result-label">Tax Rate:</span>
                      <span className="result-value">{(taxCalculation.tax_rate * 100).toFixed(2)}%</span>
                    </div>
                    <div className="result-item">
                      <span className="result-label">Tax Amount:</span>
                      <span className="result-value">{formatCurrency(taxCalculation.tax_amount)}</span>
                    </div>
                    <div className="result-item total">
                      <span className="result-label">Net Amount:</span>
                      <span className="result-value">{formatCurrency(taxCalculation.net_amount)}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'certificates' && (
            <div className="tax-certificates">
              <div className="certificates-section">
                <div className="tab-header">
                  <h4>📄 Generate Certificate</h4>
                  <span className="tab-subtitle">Create tax compliance certificates</span>
                </div>
                <form onSubmit={handleGenerateCertificate} className="certificate-form">
                  <div className="form-row">
                    <div className="form-group">
                      <label>📋 Certificate Type</label>
                      <select
                        value={certType}
                        onChange={(e) => setCertType(e.target.value)}
                      >
                        <option value="annual_summary">Annual Summary</option>
                        <option value="transaction_specific">Transaction Specific</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label>📅 Tax Year</label>
                      <input
                        type="number"
                        value={certYear}
                        onChange={(e) => setCertYear(e.target.value)}
                        min="2020"
                        max={new Date().getFullYear()}
                      />
                    </div>
                  </div>
                  <button type="submit" className="generate-button" disabled={loading}>
                    <span className="button-icon">{loading ? '⏳' : '✨'}</span>
                    {loading ? 'Generating...' : 'Generate Certificate'}
                  </button>
                </form>
              </div>

              <div className="certificates-list">
                <div className="tab-header">
                  <h4>📁 Your Certificates</h4>
                  <span className="tab-subtitle">Issued tax certificates</span>
                </div>
                {loading ? (
                  <div className="loading">
                    <div className="spinner"></div>
                    Loading certificates...
                  </div>
                ) : taxCertificates.length > 0 ? (
                  <div className="certificates-grid">
                    {taxCertificates.map((cert, idx) => (
                      <div key={idx} className="certificate-card">
                        <div className="cert-header">
                          <span className="cert-icon">📜</span>
                          <h5>{cert.certificate_type.replace('_', ' ').toUpperCase()}</h5>
                        </div>
                        <div className="cert-details">
                          <div className="cert-info">
                            <strong>Number:</strong> {cert.certificate_number}
                          </div>
                          <div className="cert-info">
                            <strong>Year:</strong> {cert.tax_year}
                          </div>
                          <div className="cert-info">
                            <strong>Status:</strong> 
                            <span className={`status-badge ${cert.verification_code ? 'verified' : 'pending'}`}>
                              {cert.verification_code ? 'Verified' : 'Pending'}
                            </span>
                          </div>
                          <div className="cert-info">
                            <strong>Issued:</strong> {formatDate(cert.issue_date)}
                          </div>
                        </div>
                        <button className="download-cert-button">
                          <span className="button-icon">📥</span>
                          Download PDF
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="empty-state">
                    <span className="empty-icon">📄</span>
                    <p>No certificates available</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TaxReportModal;