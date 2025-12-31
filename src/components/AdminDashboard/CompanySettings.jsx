// src/components/AdminDashboard/CompanySettings.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import config from '../../config';
import './CompanySettings.css';
import MessageModal from '../MessageModal';
import ConfirmModal from '../ConfirmModal';
import pako from 'pako';

const CompanySettings = () => {
  const { apiFetch, tenantData } = useAuth();
  const [form, setForm] = useState({});
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('success');
  const [showConfirm, setShowConfirm] = useState(false);
  const [pendingForm, setPendingForm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [registrationLink, setRegistrationLink] = useState('');
  const [copied, setCopied] = useState(false);
  const [activeDocTab, setActiveDocTab] = useState('instructions');
  const [activeFeatureTab, setActiveFeatureTab] = useState('core');
  const [activeInstructionTab, setActiveInstructionTab] = useState('onboarding');
  const [showDocumentation, setShowDocumentation] = useState(false);

  // Generate registration link
  useEffect(() => {
    if (tenantData?.tenant_unique_id && tenantData?.tenant_schema && form.companyName) {
      const companyData = {
        name: form.companyName,
        aboutUs: form.aboutUs,
        logoUrl: form.logoUrl,
        primaryColor: form.primaryColor,
        secondaryColor: form.secondaryColor,
        accountName: form.accountName,
        bankName: form.bankName,
        accountNumber: form.accountNumber,
      };
      const json = JSON.stringify(companyData);
      const compressed = pako.deflate(json);
      const base64Compressed = btoa(String.fromCharCode(...compressed));
      const encoded = btoa(`${tenantData.tenant_unique_id}:${tenantData.tenant_schema}:${base64Compressed}`);
      setRegistrationLink(`${config.WEB_PAGE_URL}/investment-form/${encoded}`);
    }
  }, [tenantData, form]);

  // Fetch tenant settings and populate form
  useEffect(() => {
    const fetchTenantSettings = async () => {
      try {
        setLoading(true);
        const uniqueId = tenantData?.tenant_unique_id;
        if (!uniqueId) {
          setLoading(false);
          return;
        }
        const response = await apiFetch(`/api/tenant/tenants/${uniqueId}/`);
        if (response.ok) {
          const data = await response.json();
          setForm({
            companyName: data.name || '',
            title: data.title || '',
            logoUrl: data.logo || 'https://rodrimine.com/assets/images/logo.jpg',
            accountName: data.account_name || '',
            bankName: data.bank_name || '',
            accountNumber: data.account_number || '',
            roiPercent: data.roi_percent ? parseFloat(data.roi_percent) : 40,
            roiFrequency: data.roi_frequency || 'Monthly',
            minWithdrawalMonths: data.min_withdrawal_months || 4,
            kycMethod: data.kyc_method || 'passport',
            kycCustom: data.kyc_custom || '',
            primaryColor: data.primary_color || '#FF0000',
            secondaryColor: data.secondary_color || '#FADBD8',
            emailHost: data.email_host || '',
            emailPort: data.email_port || '',
            emailUseSSL: typeof data.email_use_ssl === 'boolean' ? data.email_use_ssl : true,
            emailHostUser: data.email_host_user || '',
            defaultFromEmail: data.default_from_email || '',
            aboutUs: data.about_us || '',
          });
        } else {
          console.error('Failed to fetch tenant settings');
        }
      } catch (err) {
        console.error('Error fetching tenant settings:', err);
      } finally {
        setLoading(false);
      }
    };

    if (tenantData?.tenant_unique_id) {
      fetchTenantSettings();
    }
  }, [apiFetch, tenantData]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = ev => {
        setForm(prev => ({
          ...prev,
          logoUrl: ev.target.result,
          logoFile: file
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  // Rich text editor handlers
  const handleFormat = (command, value = null) => {
    document.execCommand(command, false, value);
    updateAboutUsContent();
  };

  const updateAboutUsContent = () => {
    const content = document.getElementById('aboutUsEditor').innerHTML;
    setForm(prev => ({ ...prev, aboutUs: content }));
  };

  const handleAboutUsChange = (e) => {
    setForm(prev => ({ ...prev, aboutUs: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setPendingForm({ ...form });
    setShowConfirm(true);
  };

  const handleConfirm = async () => {
    setShowConfirm(false);
    try {
      const formData = new FormData();

      // Map form fields to backend fields
      const apiData = {
        name: pendingForm.companyName,
        title: pendingForm.title,
        account_name: pendingForm.accountName,
        bank_name: pendingForm.bankName,
        account_number: pendingForm.accountNumber,
        roi_percent: parseFloat(pendingForm.roiPercent),
        roi_frequency: pendingForm.roiFrequency,
        min_withdrawal_months: parseInt(pendingForm.minWithdrawalMonths),
        kyc_method: pendingForm.kycMethod,
        kyc_custom: pendingForm.kycCustom,
        primary_color: pendingForm.primaryColor,
        secondary_color: pendingForm.secondaryColor,
        email_host: pendingForm.emailHost,
        email_port: pendingForm.emailPort ? parseInt(pendingForm.emailPort) : null,
        email_use_ssl: pendingForm.emailUseSSL,
        email_host_user: pendingForm.emailHostUser,
        default_from_email: pendingForm.defaultFromEmail,
        about_us: pendingForm.aboutUs,
      };

      // Append all fields individually
      Object.entries(apiData).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          formData.append(key, value);
        }
      });

      // Handle logo file upload
      if (pendingForm.logoFile) {
        formData.append('logo', pendingForm.logoFile);
      }

      const response = await apiFetch(`/api/tenant/tenants/${tenantData.tenant_unique_id}/`, {
        method: 'PATCH',
        body: formData,
      });

      if (response.ok) {
        setMessage('Company settings saved successfully!');
        setMessageType('success');
        const updatedData = await response.json();
        setForm(prev => ({
          ...prev,
          ...updatedData,
          companyName: updatedData.name,
          title: updatedData.title,
          logoUrl: updatedData.logo,
        }));
      } else {
        const errorData = await response.json();
        setMessage(errorData.detail || 'Failed to save settings');
        setMessageType('error');
      }
    } catch (err) {
      console.error('Error saving settings:', err);
      setMessage('Error saving company settings');
      setMessageType('error');
    }
  };

  const handleCancel = () => {
    setShowConfirm(false);
    setPendingForm(null);
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(registrationLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  if (loading) {
    return <div className="company-settings-container">Loading company settings...</div>;
  }

  return (
    <div className="company-settings-container">
      <MessageModal
        message={message}
        type={messageType}
        onClose={() => setMessage('')}
      />
      <ConfirmModal
        message={showConfirm ? "Are you sure you want to save these company settings?" : ""}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
      />

      <h2>Company Settings</h2>

      <form className="company-settings-form" onSubmit={handleSubmit}>
        {/* Company Name & Logo */}
        <div className="form-row">
          <div className="form-group company-name-group">
            <label>Company Name</label>
            <input
              name="companyName"
              value={form.companyName || ''}
              onChange={handleChange}
              required
            />
          </div>
          {/* <div className="form-group company-name-group">
            <label>Company Title</label>
            <input
              name="title"
              value={form.title || ''}
              onChange={handleChange}
              placeholder="Company tagline or title"
            />
          </div> */}
          <div className="form-group logo-group">
            <label>Logo</label>
            <div className="logo-preview">
              <img src={form.logoUrl} alt="Logo" />
              <label className="change-logo-btn">
                Change
                <input
                  type="file"
                  name="logoFile"
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={handleLogoChange}
                />
              </label>
            </div>
          </div>
        </div>

        {/* Brand Colors */}
        <div className="form-row">
          <div className="form-group">
            <label>Primary Color</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <input
                type="color"
                name="primaryColor"
                value={form.primaryColor || '#FF0000'}
                onChange={handleChange}
                style={{ width: '60px', height: '40px' }}
              />
              <input
                type="text"
                name="primaryColor"
                value={form.primaryColor || '#FF0000'}
                onChange={handleChange}
                placeholder="#FF0000"
              />
            </div>
          </div>
          <div className="form-group">
            <label>Secondary Color</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <input
                type="color"
                name="secondaryColor"
                value={form.secondaryColor || '#FADBD8'}
                onChange={handleChange}
                style={{ width: '60px', height: '40px' }}
              />
              <input
                type="text"
                name="secondaryColor"
                value={form.secondaryColor || '#FADBD8'}
                onChange={handleChange}
                placeholder="#FADBD8"
              />
            </div>
          </div>
        </div>

        {/* Bank Account Details */}
        <div className="form-row account-row">
          <div className="form-group account-input">
            <label>Account Name</label>
            <input
              name="accountName"
              value={form.accountName || ''}
              onChange={handleChange}
              placeholder="Account Name"
              required
            />
          </div>
          <div className="form-group account-input">
            <label>Bank Name</label>
            <input
              name="bankName"
              value={form.bankName || ''}
              onChange={handleChange}
              placeholder="Bank Name"
              required
            />
          </div>
          <div className="form-group account-input">
            <label>Account Number</label>
            <input
              name="accountNumber"
              value={form.accountNumber || ''}
              onChange={handleChange}
              placeholder="Account Number"
              required
            />
          </div>
        </div>

        {/* ROI Settings */}
        <div className="roi-row">
          <div className="form-group roi-input">
            <label>ROI Percentage (Annual)</label>
            <div style={{ position: 'relative' }}>
              <input
                name="roiPercent"
                type="number"
                min="1"
                max="100"
                step="0.01"
                value={form.roiPercent || 40}
                onChange={handleChange}
                required
              />
              <span className="input-addon">%</span>
            </div>
          </div>
          <div className="form-group roi-input">
            <label>ROI Frequency</label>
            <select
              name="roiFrequency"
              value={form.roiFrequency || 'Monthly'}
              onChange={handleChange}
            >
              <option value="Monthly">Monthly</option>
              <option value="On Demand">On Demand</option>
            </select>
          </div>
          <div className="form-group roi-input">
            <label>Minimum Withdrawal Months</label>
            <input
              name="minWithdrawalMonths"
              type="number"
              min="1"
              value={form.minWithdrawalMonths || 4}
              onChange={handleChange}
              required
            />
          </div>
        </div>

        {/* KYC Settings */}
        <div className="form-group">
          <label>KYC Requirement</label>
          <select
            name="kycMethod"
            value={form.kycMethod || 'passport'}
            onChange={handleChange}
          >
            <option value="passport">Passport Only</option>
            <option value="passport_utility">Passport + Utility Bill</option>
            <option value="passport_id">Passport + Government ID</option>
            <option value="passport_utility_id">Passport + Utility Bill + Government ID</option>
            <option value="custom">Other (specify)</option>
          </select>
          {form.kycMethod === 'custom' && (
            <input
              type="text"
              name="kycCustom"
              value={form.kycCustom || ''}
              onChange={handleChange}
              placeholder="Enter custom KYC requirement"
              style={{ marginTop: 8 }}
              required
            />
          )}
        </div>

        {/* Email Settings */}
        <div className="form-section">
          <h3>Email Settings</h3>
          <div className="form-row">
            <div className="form-group">
              <label>Email Host</label>
              <input
                name="emailHost"
                value={form.emailHost || ''}
                onChange={handleChange}
                placeholder="smtp.example.com"
              />
            </div>
            <div className="form-group">
              <label>Email Port</label>
              <input
                name="emailPort"
                type="number"
                value={form.emailPort || ''}
                onChange={handleChange}
                placeholder="587"
              />
            </div>
            <div className="form-group">
              <label>Use SSL</label>
              <input
                name="emailUseSSL"
                type="checkbox"
                checked={form.emailUseSSL || true}
                onChange={handleChange}
                style={{ marginLeft: '10px' }}
              />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Email Username</label>
              <input
                name="emailHostUser"
                value={form.emailHostUser || ''}
                onChange={handleChange}
                placeholder="user@example.com"
              />
            </div>
            <div className="form-group">
              <label>Default From Email</label>
              <input
                name="defaultFromEmail"
                value={form.defaultFromEmail || ''}
                onChange={handleChange}
                placeholder="noreply@example.com"
              />
            </div>
          </div>
        </div>

        {/* About Us */}
        <div className="form-group">
          <label>About Us</label>
          <div className="rich-text-editor">
            <div className="rich-text-toolbar">
              <button type="button" className="toolbar-button" onClick={() => handleFormat('bold')}><strong>B</strong></button>
              <button type="button" className="toolbar-button" onClick={() => handleFormat('italic')}><em>I</em></button>
              <button type="button" className="toolbar-button" onClick={() => handleFormat('underline')}><u>U</u></button>
              <button type="button" className="toolbar-button" onClick={() => handleFormat('insertUnorderedList')}>• List</button>
              <button type="button" className="toolbar-button" onClick={() => handleFormat('insertOrderedList')}>1. List</button>
              <button type="button" className="toolbar-button" onClick={() => handleFormat('formatBlock', '<h1>')}>H1</button>
              <button type="button" className="toolbar-button" onClick={() => handleFormat('formatBlock', '<h2>')}>H2</button>
              <button type="button" className="toolbar-button" onClick={() => handleFormat('formatBlock', '<h3>')}>H3</button>
              <button type="button" className="toolbar-button" onClick={() => handleFormat('formatBlock', '<blockquote>')}>"</button>
              <button type="button" className="toolbar-button" onClick={() => handleFormat('justifyLeft')}>⬅</button>
              <button type="button" className="toolbar-button" onClick={() => handleFormat('justifyCenter')}>⬌</button>
              <button type="button" className="toolbar-button" onClick={() => handleFormat('justifyRight')}>➡</button>
            </div>
            <div
              id="aboutUsEditor"
              className="rich-text-content"
              contentEditable
              dangerouslySetInnerHTML={{ __html: form.aboutUs || '' }}
              onInput={updateAboutUsContent}
              onBlur={updateAboutUsContent}
            />
          </div>
          <textarea
            name="aboutUs"
            value={form.aboutUs || ''}
            onChange={handleAboutUsChange}
            style={{ display: 'none' }}
          />
        </div>

        <button type="submit" className="save-btn">Save Settings</button>
      </form>

      {/* Registration Link */}
      <div className="form-section">
        <h3>Public Registration Link</h3>
        <p>Share this link with potential investors to allow them to register directly into your tenant schema without authentication.</p>
        <div className="registration-link-group">
          <input
            type="text"
            value={registrationLink}
            readOnly
            placeholder="Registration link will appear here..."
            className="registration-link-input"
          />
          <button onClick={copyToClipboard} className="copy-link-btn">
            {copied ? 'Copied!' : 'Copy Link'}
          </button>
        </div>
      </div>

      {/* Settings Summary */}
      <div className="settings-summary">
        <h3>Settings Summary</h3>
        <p><strong>ROI:</strong> {form.roiPercent}% ({form.roiFrequency})</p>
        <p><strong>Min Withdrawal:</strong> {form.minWithdrawalMonths} months</p>
        <p><strong>KYC:</strong> {form.kycMethod === 'custom' ? form.kycCustom : form.kycMethod}</p>
      </div>

      {/* System Documentation Toggle */}
      <div className="documentation-toggle-header">
        <button
          className="documentation-toggle-btn"
          onClick={() => setShowDocumentation(!showDocumentation)}
        >
          <span className="toggle-icon">
            {showDocumentation ? '🔽' : '▶️'}
          </span>
          <span className="toggle-text">📚 System User Guide</span>
        </button>
      </div>

      {/* System Documentation */}
      {showDocumentation && (
        <div className="system-documentation">
          {/* Tab Navigation */}
          <div className="documentation-tabs">
            <button
              className={`doc-tab ${activeDocTab === 'instructions' ? 'active' : ''}`}
              onClick={() => setActiveDocTab('instructions')}
            >
              🚀 How to Use the System
            </button>
            <button
              className={`doc-tab ${activeDocTab === 'features' ? 'active' : ''}`}
              onClick={() => setActiveDocTab('features')}
            >
              ✅ What Has Been Implemented
            </button>
          </div>

          {/* Tab Content */}
          <div className="documentation-content">
            {activeDocTab === 'instructions' && (
              <div className="documentation-section">
                <h4>🚀 How to Use the Investment System</h4>

                {/* Instruction Category Tabs */}
                <div className="instruction-category-tabs">
                  <button
                    className={`instruction-tab ${activeInstructionTab === 'onboarding' ? 'active' : ''}`}
                    onClick={() => setActiveInstructionTab('onboarding')}
                  >
                    🎯 Onboarding
                  </button>
                  <button
                    className={`instruction-tab ${activeInstructionTab === 'operations' ? 'active' : ''}`}
                    onClick={() => setActiveInstructionTab('operations')}
                  >
                    ⚙️ Operations
                  </button>
                  <button
                    className={`instruction-tab ${activeInstructionTab === 'compliance' ? 'active' : ''}`}
                    onClick={() => setActiveInstructionTab('compliance')}
                  >
                    📋 Compliance
                  </button>
                  <button
                    className={`instruction-tab ${activeInstructionTab === 'administration' ? 'active' : ''}`}
                    onClick={() => setActiveInstructionTab('administration')}
                  >
                    👑 Administration
                  </button>
                </div>

                {/* Instruction Content */}
                <div className="instruction-content">
                  {activeInstructionTab === 'onboarding' && (
                    <div className="instruction-details">
                      <h5>🎯 Getting Started - Investor Onboarding</h5>
                      <div className="instruction-steps">
                        <div className="instruction-item">
                          <h6>1. Investor Registration</h6>
                          <p>Use the public registration link above to allow investors to sign up. They will fill out a comprehensive form including personal details, banking information, and KYC documents.</p>
                        </div>
                        <div className="instruction-item">
                          <h6>2. Investment Creation</h6>
                          <p>Once registered, investors can create investment policies through the system. Each policy gets a unique number and starts earning ROI based on the configured rate.</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeInstructionTab === 'operations' && (
                    <div className="instruction-details">
                      <h5>⚙️ Day-to-Day Operations</h5>
                      <div className="instruction-steps">
                        <div className="instruction-item">
                          <h6>3. ROI Management</h6>
                          <p>ROI accrues automatically monthly for eligible investments. You can view upcoming accruals and manually trigger processing if needed.</p>
                        </div>
                        <div className="instruction-item">
                          <h6>4. Withdrawal Processing</h6>
                          <p>Investors can request withdrawals (ROI anytime, principal after minimum period). Admin approval is required before processing.</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeInstructionTab === 'compliance' && (
                    <div className="instruction-details">
                      <h5>📋 Compliance & Reporting</h5>
                      <div className="instruction-steps">
                        <div className="instruction-item">
                          <h6>5. Tax Compliance</h6>
                          <p>All transactions include automatic Nigerian tax calculations (WHT, PIT, CGT, VAT). Tax certificates can be generated for compliance.</p>
                        </div>
                        <div className="instruction-item">
                          <h6>6. Reporting & Statements</h6>
                          <p>Generate custom period statements, view complete transaction ledgers, and export data for accounting purposes.</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeInstructionTab === 'administration' && (
                    <div className="instruction-details">
                      <h5>👑 System Administration</h5>
                      <div className="instruction-steps">
                        <div className="instruction-item">
                          <h6>7. User Management</h6>
                          <p>Manage investors, staff, and potential investors through the admin dashboard. Update profiles and track user activity.</p>
                        </div>
                        <div className="instruction-item">
                          <h6>8. System Monitoring</h6>
                          <p>Use the activity dashboard to monitor system usage, view real-time metrics, and track important events.</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeDocTab === 'features' && (
              <div className="documentation-section">
                <h4>✅ What Has Been Implemented</h4>

                {/* Feature Category Tabs */}
                <div className="feature-category-tabs">
                  <button
                    className={`feature-tab ${activeFeatureTab === 'core' ? 'active' : ''}`}
                    onClick={() => setActiveFeatureTab('core')}
                  >
                    🏦 Core Features
                  </button>
                  <button
                    className={`feature-tab ${activeFeatureTab === 'withdrawals' ? 'active' : ''}`}
                    onClick={() => setActiveFeatureTab('withdrawals')}
                  >
                    💰 Transactions
                  </button>
                  <button
                    className={`feature-tab ${activeFeatureTab === 'reporting' ? 'active' : ''}`}
                    onClick={() => setActiveFeatureTab('reporting')}
                  >
                    📊 Analytics
                  </button>
                  <button
                    className={`feature-tab ${activeFeatureTab === 'tax' ? 'active' : ''}`}
                    onClick={() => setActiveFeatureTab('tax')}
                  >
                    🇳🇬 Tax System
                  </button>
                  <button
                    className={`feature-tab ${activeFeatureTab === 'users' ? 'active' : ''}`}
                    onClick={() => setActiveFeatureTab('users')}
                  >
                    👥 User Mgmt
                  </button>
                  <button
                    className={`feature-tab ${activeFeatureTab === 'admin' ? 'active' : ''}`}
                    onClick={() => setActiveFeatureTab('admin')}
                  >
                    🔧 Admin
                  </button>
                  <button
                    className={`feature-tab ${activeFeatureTab === 'ui' ? 'active' : ''}`}
                    onClick={() => setActiveFeatureTab('ui')}
                  >
                    📱 Interface
                  </button>
                  <button
                    className={`feature-tab ${activeFeatureTab === 'security' ? 'active' : ''}`}
                    onClick={() => setActiveFeatureTab('security')}
                  >
                    🔒 Security
                  </button>
                </div>

                {/* Feature Content */}
                <div className="feature-content">
                  {activeFeatureTab === 'core' && (
                    <div className="feature-details">
                      <h5>🏦 Core Investment Features</h5>
                      <ul>
                        <li>✅ Complete investor onboarding with KYC</li>
                        <li>✅ Investment policy creation and management</li>
                        <li>✅ Unique policy numbering system</li>
                        <li>✅ Principal and ROI balance tracking</li>
                        <li>✅ Investment top-ups and additional deposits</li>
                        <li>✅ Automated monthly ROI accrual (40% annual)</li>
                        <li>✅ Date-based ROI eligibility rules</li>
                        <li>✅ ROI frequency control (monthly/on-demand)</li>
                      </ul>
                    </div>
                  )}

                  {activeFeatureTab === 'withdrawals' && (
                    <div className="feature-details">
                      <h5>💰 Withdrawal & Transactions</h5>
                      <ul>
                        <li>✅ Multiple withdrawal types (ROI, principal, composite)</li>
                        <li>✅ 4-month minimum holding period for principal</li>
                        <li>✅ Admin approval workflow for withdrawals</li>
                        <li>✅ Automatic tax deductions on withdrawals</li>
                        <li>✅ Bank account validation and disbursement</li>
                        <li>✅ Complete transaction ledger with audit trail</li>
                        <li>✅ CSV export for accounting integration</li>
                      </ul>
                    </div>
                  )}

                  {activeFeatureTab === 'reporting' && (
                    <div className="feature-details">
                      <h5>📊 Reporting & Analytics</h5>
                      <ul>
                        <li>✅ Custom period statement generation</li>
                        <li>✅ Real-time dashboard metrics</li>
                        <li>✅ Investment performance reports</li>
                        <li>✅ ROI due reports for payment planning</li>
                        <li>✅ Activity monitoring and analytics</li>
                        <li>✅ Transaction filtering and search</li>
                        <li>✅ Monthly and annual summaries</li>
                      </ul>
                    </div>
                  )}

                  {activeFeatureTab === 'tax' && (
                    <div className="feature-details">
                      <h5>🇳🇬 Nigerian Tax Compliance</h5>
                      <ul>
                        <li>✅ Withholding Tax (WHT) - 10% on ROI payments</li>
                        <li>✅ Personal Income Tax (PIT) calculations</li>
                        <li>✅ Capital Gains Tax (CGT) - 10% on gains</li>
                        <li>✅ Value Added Tax (VAT) - 7.5% on services</li>
                        <li>✅ Tertiary Education Tax (TET) - 2.5%</li>
                        <li>✅ FIRS-compliant tax certificates</li>
                        <li>✅ Automatic tax record keeping</li>
                        <li>✅ Tax report generation and summaries</li>
                      </ul>
                    </div>
                  )}

                  {activeFeatureTab === 'users' && (
                    <div className="feature-details">
                      <h5>👥 User Management</h5>
                      <ul>
                        <li>✅ Multi-tenant architecture</li>
                        <li>✅ Role-based access control</li>
                        <li>✅ Investor and staff profile management</li>
                        <li>✅ Potential investor tracking</li>
                        <li>✅ User activity logging</li>
                        <li>✅ Bulk user operations</li>
                        <li>✅ Profile update restrictions</li>
                      </ul>
                    </div>
                  )}

                  {activeFeatureTab === 'admin' && (
                    <div className="feature-details">
                      <h5>🔧 Administrative Features</h5>
                      <ul>
                        <li>✅ Company settings configuration</li>
                        <li>✅ ROI rate and frequency settings</li>
                        <li>✅ Email notification system</li>
                        <li>✅ KYC requirement customization</li>
                        <li>✅ Public registration link generation</li>
                        <li>✅ System health monitoring</li>
                        <li>✅ Automated scheduled tasks</li>
                      </ul>
                    </div>
                  )}

                  {activeFeatureTab === 'ui' && (
                    <div className="feature-details">
                      <h5>📱 User Interface</h5>
                      <ul>
                        <li>✅ Responsive admin dashboard</li>
                        <li>✅ Investor user dashboard</li>
                        <li>✅ Mobile-optimized design</li>
                        <li>✅ Real-time notifications</li>
                        <li>✅ Modal-based interactions</li>
                        <li>✅ Advanced search and filtering</li>
                        <li>✅ Data export capabilities</li>
                      </ul>
                    </div>
                  )}

                  {activeFeatureTab === 'security' && (
                    <div className="feature-details">
                      <h5>🔒 Security & Compliance</h5>
                      <ul>
                        <li>✅ JWT authentication</li>
                        <li>✅ Data encryption</li>
                        <li>✅ Tenant data isolation</li>
                        <li>✅ Audit trail logging</li>
                        <li>✅ Secure file uploads</li>
                        <li>✅ Input validation and sanitization</li>
                        <li>✅ FIRS tax compliance</li>
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CompanySettings;
