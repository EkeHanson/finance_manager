// src/components/AdminDashboard/StatementGenerator.jsx
import React, { useRef, useState, useEffect } from 'react';
import { useReactToPrint } from 'react-to-print';
import * as XLSX from 'xlsx';
import useInvestmentApi from '../../services/InvestmentApiService';
import { useAuth } from '../../contexts/AuthContext';
import './StatementGenerator.css';

const StatementGenerator = ({ investors }) => {
  const { tenantData } = useAuth();
  const { generateStatement, getPolicies } = useInvestmentApi();
  
  const [company, setCompany] = useState({
    name: tenantData?.tenant_name || 'Investment Company',
    logo: 'https://rodrimine.com/assets/images/logo.jpg',
  });
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedInvestor, setSelectedInvestor] = useState(null);
  const [selectedPolicy, setSelectedPolicy] = useState(null);
  const [duration, setDuration] = useState('3_months');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [statementData, setStatementData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [modal, setModal] = useState({ show: false, message: '', type: '' });
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 5;

  const componentRef = useRef();

  // Update company info from tenant
  useEffect(() => {
    if (tenantData?.tenant_name) {
      setCompany(prev => ({
        ...prev,
        name: tenantData.tenant_name
      }));
    }
  }, [tenantData]);

  // Filtered investors
  const filteredInvestors = investors.filter(inv =>
    inv.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    inv.uniquePolicy?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Pagination
  const totalPages = Math.ceil(filteredInvestors.length / pageSize);
  const paginatedInvestors = filteredInvestors.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const handlePrev = () => setCurrentPage((prev) => Math.max(prev - 1, 1));
  const handleNext = () => setCurrentPage((prev) => Math.min(prev + 1, totalPages));

  // Show success/error modal
  const showModal = (message, type = 'success') => {
    setModal({ show: true, message, type });
    setTimeout(() => setModal({ show: false, message: '', type: '' }), 7000);
  };

  // Generate statement from backend
  const handleGenerateStatement = async (investor) => {
    if (!investor.policies || investor.policies.length === 0) {
      showModal('No policies found for this investor', 'error');
      return;
    }

    // If multiple policies, let user select one
    if (investor.policies.length > 1) {
      setSelectedInvestor(investor);
      setSelectedPolicy(null);
      return;
    }

    // Single policy - generate directly
    await generateStatementForPolicy(investor, investor.policies[0].id);
  };

  const generateStatementForPolicy = async (investor, policyId) => {
    setLoading(true);
    try {
      const requestData = {
        policy_id: policyId,
        duration: duration,
      };

      if (duration === 'custom') {
        if (!customStartDate || !customEndDate) {
          showModal('Please select both start and end dates for custom range', 'error');
          setLoading(false);
          return;
        }
        requestData.start_date = customStartDate;
        requestData.end_date = customEndDate;
      }

      const result = await generateStatement(requestData);
      
      if (result.success) {
        setStatementData(result.data);
        showModal('Statement generated successfully!', 'success');
      } else {
        showModal(result.error || 'Failed to generate statement', 'error');
      }
    } catch (error) {
      console.error('Error generating statement:', error);
      showModal('Error generating statement', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Print statement
  const handlePrint = useReactToPrint({
    content: () => componentRef.current,
    onAfterPrint: () => {
      showModal('Statement ready for printing!', 'success');
    },
    removeAfterPrint: true,
  });

  // Export to Excel
  const handleExcelExport = () => {
    if (!statementData) {
      showModal('No statement data to export', 'error');
      return;
    }

    try {
      const { policy_details, entries, summary } = statementData;
      
      // Prepare data rows
      const headerRow = [
        `${company.name} Statement`,
        '',
        '',
        '',
        '',
        ''
      ];
      
      const policyInfoRows = [
        ['Policy Number:', policy_details.policy_number],
        ['Investor:', policy_details.investor_name],
        ['Period:', statementData.statement_period],
        ['Start Balance:', `₦${parseFloat(policy_details.start_balance).toLocaleString()}`],
        ['End Balance:', `₦${parseFloat(policy_details.end_balance).toLocaleString()}`],
        [],
      ];

      const tableHeader = [
        'Date',
        'Description',
        'Type',
        'Inflow (₦)',
        'Outflow (₦)',
        'Principal Balance (₦)',
        'ROI Balance (₦)',
        'Total Balance (₦)'
      ];

      const dataRows = entries.map(entry => [
        formatDate(entry.entry_date),
        entry.description,
        entry.entry_type,
        parseFloat(entry.inflow || 0).toLocaleString(),
        parseFloat(entry.outflow || 0).toLocaleString(),
        parseFloat(entry.principal_balance || 0).toLocaleString(),
        parseFloat(entry.roi_balance || 0).toLocaleString(),
        parseFloat(entry.total_balance || 0).toLocaleString(),
      ]);

      const summaryRows = [
        [],
        ['Summary'],
        ['Total Inflow:', `₦${parseFloat(summary.total_inflow).toLocaleString()}`],
        ['Total Outflow:', `₦${parseFloat(summary.total_outflow).toLocaleString()}`],
        ['Net Flow:', `₦${parseFloat(summary.net_flow).toLocaleString()}`],
        ['ROI Accrued:', `₦${parseFloat(summary.roi_accrued).toLocaleString()}`],
        ['Total Withdrawals:', `₦${parseFloat(summary.withdrawals).toLocaleString()}`],
      ];

      const data = [
        headerRow,
        ...policyInfoRows,
        tableHeader,
        ...dataRows,
        ...summaryRows
      ];

      const ws = XLSX.utils.aoa_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Statement');
      XLSX.writeFile(wb, `${policy_details.policy_number}_statement.xlsx`);
      
      showModal('Excel exported successfully!', 'success');
    } catch (err) {
      console.error('Excel export error:', err);
      showModal('Excel export failed', 'error');
    }
  };

  return (
    <div className="statement-generator">
      {/* Success/Error Modal */}
      {modal.show && (
        <div className={`statement-modal ${modal.type}`}>
          {modal.message}
          <button onClick={() => setModal({ show: false, message: '', type: '' })}>
            Close
          </button>
        </div>
      )}

      {/* Header */}
      <div className="statement-header">
        {company.logo && (
          <img src={company.logo} alt={company.name + ' Logo'} />
        )}
        <h2>{company.name} Statement Generator</h2>
      </div>

      {/* Search and Duration Controls */}
      <div className="statement-controls">
        <input
          type="text"
          placeholder="Search by investor name or policy number..."
          value={searchTerm}
          onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }}
          style={{ padding: '0.5rem', borderRadius: '5px', border: '1px solid #ccc', flex: 1, minWidth: '200px' }}
        />
        
        <select
          value={duration}
          onChange={e => setDuration(e.target.value)}
          style={{ padding: '0.5rem', borderRadius: '5px', border: '1px solid #ccc' }}
        >
          <option value="1_month">1 Month</option>
          <option value="3_months">3 Months</option>
          <option value="6_months">6 Months</option>
          <option value="1_year">1 Year</option>
          <option value="custom">Custom Range</option>
        </select>

        {duration === 'custom' && (
          <>
            <input
              type="date"
              value={customStartDate}
              onChange={e => setCustomStartDate(e.target.value)}
              style={{ padding: '0.5rem', borderRadius: '5px', border: '1px solid #ccc' }}
            />
            <input
              type="date"
              value={customEndDate}
              onChange={e => setCustomEndDate(e.target.value)}
              style={{ padding: '0.5rem', borderRadius: '5px', border: '1px solid #ccc' }}
            />
          </>
        )}
      </div>

      {/* Policy Selection Modal */}
      {selectedInvestor && (
        <div className="policy-selection-modal">
          <div className="modal-content">
            <h3>Select Policy for {selectedInvestor.name}</h3>
            <div className="policy-list">
              {selectedInvestor.policies.map(policy => (
                <button
                  key={policy.id}
                  className="policy-option"
                  onClick={() => {
                    generateStatementForPolicy(selectedInvestor, policy.id);
                    setSelectedInvestor(null);
                  }}
                >
                  <strong>{policy.policy_number}</strong>
                  <br />
                  Principal: ₦{parseFloat(policy.principal_amount).toLocaleString()}
                  <br />
                  Balance: ₦{parseFloat(policy.total_balance).toLocaleString()}
                </button>
              ))}
            </div>
            <button onClick={() => setSelectedInvestor(null)} className="modal-close-btn">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Investors Table */}
      <table className="statement-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Policy Number</th>
            <th>Total Policies</th>
            <th>Total Balance (₦)</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {paginatedInvestors.length === 0 ? (
            <tr>
              <td colSpan={5} style={{ textAlign: 'center', padding: '2rem', color: '#888' }}>
                No investors found.
              </td>
            </tr>
          ) : (
            paginatedInvestors.map(investor => (
              <tr key={investor.id}>
                <td>{investor.name}</td>
                <td>{investor.uniquePolicy}</td>
                <td>{investor.policies?.length || 0}</td>
                <td>₦{(investor.remainingBalance || 0).toLocaleString()}</td>
                <td>
                  <button
                    onClick={() => handleGenerateStatement(investor)}
                    className="action-btn"
                    disabled={loading}
                  >
                    {loading ? 'Generating...' : 'Generate'}
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      {/* Pagination */}
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

      {/* Statement Preview and Actions */}
      {statementData && (
        <div className="statement-preview">
          <h3>Statement Preview</h3>
          <div className="statement-actions">
            <button onClick={handlePrint} className="action-btn">
              <span className="material-icons">print</span> Print/PDF
            </button>
            <button onClick={handleExcelExport} className="action-btn">
              <span className="material-icons">table_chart</span> Export Excel
            </button>
          </div>
          
          <div ref={componentRef} className="printable-statement">
            <div className="statement-content">
              {company.logo && <img src={company.logo} alt={company.name} />}
              <h3>{company.name}</h3>
              <h4>Investment Statement</h4>
              
              <div className="statement-info">
                <p><strong>Policy Number:</strong> {statementData.policy_details.policy_number}</p>
                <p><strong>Investor:</strong> {statementData.policy_details.investor_name}</p>
                <p><strong>Period:</strong> {statementData.statement_period}</p>
                <p><strong>Start Balance:</strong> ₦{parseFloat(statementData.policy_details.start_balance).toLocaleString()}</p>
                <p><strong>End Balance:</strong> ₦{parseFloat(statementData.policy_details.end_balance).toLocaleString()}</p>
              </div>

              <table className="statement-detail-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Description</th>
                    <th>Inflow</th>
                    <th>Outflow</th>
                    <th>Balance</th>
                  </tr>
                </thead>
                <tbody>
                  {statementData.entries.map((entry, index) => (
                    <tr key={index}>
                      <td>{formatDate(entry.entry_date)}</td>
                      <td>{entry.description}</td>
                      <td>₦{parseFloat(entry.inflow || 0).toLocaleString()}</td>
                      <td>₦{parseFloat(entry.outflow || 0).toLocaleString()}</td>
                      <td>₦{parseFloat(entry.total_balance || 0).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan={2}><strong>Summary</strong></td>
                    <td><strong>₦{parseFloat(statementData.summary.total_inflow).toLocaleString()}</strong></td>
                    <td><strong>₦{parseFloat(statementData.summary.total_outflow).toLocaleString()}</strong></td>
                    <td><strong>₦{parseFloat(statementData.summary.net_flow).toLocaleString()}</strong></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Helper function
const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
};

export default StatementGenerator;