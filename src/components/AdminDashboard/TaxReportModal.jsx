import React, { useState, useEffect } from 'react';
import { formatCurrency, formatPercentage } from '../../utils/nigerianTaxCalculator';
import useInvestmentApi from '../../services/InvestmentApiService';
import './TaxReportModal.css';

const TaxReportModal = ({ investor, onClose }) => {
  const [taxData, setTaxData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { calculateTax, getTaxSummary } = useInvestmentApi();

  useEffect(() => {
    const loadTaxData = async () => {
      if (!investor) return;

      try {
        setLoading(true);
        setError(null);

        const roiAmount = investor.roiDue || 0;
        const annualIncome = investor.annualIncome || 0;

        // Calculate WHT on ROI
        const whtResult = await calculateTax(roiAmount, 'wht_interest');
        if (!whtResult.success) {
          throw new Error('Failed to calculate WHT: ' + whtResult.error);
        }

        // Calculate PIT if annual income is available
        let pitResult = null;
        if (annualIncome > 0) {
          pitResult = await calculateTax(roiAmount * 0.9, 'pit', annualIncome);
          if (!pitResult.success) {
            console.warn('PIT calculation failed:', pitResult.error);
          }
        }

        // Get tax summary for the investor
        const summaryResult = await getTaxSummary(investor.id);

        setTaxData({
          wht: whtResult.data.calculation,
          pit: pitResult?.data?.calculation || null,
          summary: summaryResult,
          roiAmount,
          annualIncome
        });

      } catch (err) {
        console.error('Error loading tax data:', err);
        setError(err.message);

        // Fallback to mock data if API fails
        const roiAmount = investor.roiDue || 0;
        const annualIncome = investor.annualIncome || 0;

        setTaxData({
          wht: {
            gross_amount: roiAmount,
            tax_rate: 0.10,
            tax_amount: roiAmount * 0.10,
            net_amount: roiAmount * 0.90
          },
          pit: annualIncome > 0 ? {
            annual_income: annualIncome + (roiAmount * 0.90),
            tax_amount: calculateProgressiveTax(annualIncome + (roiAmount * 0.90)),
            effective_rate: 0
          } : null,
          summary: null,
          roiAmount,
          annualIncome
        });
      } finally {
        setLoading(false);
      }
    };

    loadTaxData();
  }, [investor, calculateTax, getTaxSummary]);

  if (!investor) return null;
  if (loading) return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content tax-report-modal">
        <div className="modal-header">
          <h2>Loading Tax Report...</h2>
          <button className="close-btn" onClick={onClose}>&times;</button>
        </div>
        <div className="modal-body" style={{ textAlign: 'center', padding: '2rem' }}>
          <div>Loading tax calculations...</div>
        </div>
      </div>
    </div>
  );

  if (error && !taxData) return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content tax-report-modal">
        <div className="modal-header">
          <h2>Tax Report Error</h2>
          <button className="close-btn" onClick={onClose}>&times;</button>
        </div>
        <div className="modal-body" style={{ textAlign: 'center', padding: '2rem' }}>
          <div style={{ color: 'red' }}>Error loading tax data: {error}</div>
        </div>
      </div>
    </div>
  );

  const totalTax = (taxData.wht?.tax_amount || 0) + (taxData.pit?.tax_amount || 0);
  const netAfterTax = taxData.roiAmount - totalTax;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content tax-report-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Tax Report - {investor.name}</h2>
          <button className="close-btn" onClick={onClose}>&times;</button>
        </div>

        <div className="modal-body">
          <div className="investor-info">
            <h3>Investor Information</h3>
            <div className="info-grid">
              <div><strong>Name:</strong> {investor.name}</div>
              <div><strong>Email:</strong> {investor.email}</div>
              <div><strong>TIN:</strong> {investor.tin || 'Not Provided'}</div>
              <div><strong>Phone:</strong> {investor.phoneNumber}</div>
            </div>
          </div>

          <div className="tax-summary">
            <h3>Tax Summary</h3>
            <div className="summary-cards">
              <div className="summary-card">
                <h4>Gross ROI Amount</h4>
                <p className="amount">{formatCurrency(taxData.roiAmount)}</p>
              </div>
              <div className="summary-card">
                <h4>Total Tax</h4>
                <p className="amount tax-amount">{formatCurrency(totalTax)}</p>
              </div>
              <div className="summary-card">
                <h4>Net After Tax</h4>
                <p className="amount net-amount">{formatCurrency(netAfterTax)}</p>
              </div>
              <div className="summary-card">
                <h4>Effective Tax Rate</h4>
                <p className="amount">{formatPercentage(taxData.roiAmount > 0 ? totalTax / taxData.roiAmount : 0)}</p>
              </div>
            </div>
          </div>

          <div className="tax-breakdown">
            <h3>Tax Breakdown</h3>

            <div className="tax-section">
              <h4>Withholding Tax (WHT) - {formatPercentage(taxData.wht?.tax_rate || 0.10)}</h4>
              <div className="tax-details">
                <div className="detail-row">
                  <span>Gross Amount:</span>
                  <span>{formatCurrency(taxData.wht?.gross_amount || taxData.roiAmount)}</span>
                </div>
                <div className="detail-row">
                  <span>WHT Rate:</span>
                  <span>{formatPercentage(taxData.wht?.tax_rate || 0.10)}</span>
                </div>
                <div className="detail-row">
                  <span>WHT Amount:</span>
                  <span className="tax-amount">{formatCurrency(taxData.wht?.tax_amount || 0)}</span>
                </div>
                <div className="detail-row">
                  <span>Net Amount:</span>
                  <span>{formatCurrency(taxData.wht?.net_amount || taxData.roiAmount)}</span>
                </div>
              </div>
            </div>

            {taxData.pit && (
              <div className="tax-section">
                <h4>Personal Income Tax (PIT)</h4>
                <div className="tax-details">
                  <div className="detail-row">
                    <span>Annual Income (including ROI):</span>
                    <span>{formatCurrency(taxData.pit.annual_income || taxData.annualIncome)}</span>
                  </div>
                  <div className="detail-row">
                    <span>PIT Amount:</span>
                    <span className="tax-amount">{formatCurrency(taxData.pit.tax_amount || 0)}</span>
                  </div>
                  <div className="detail-row">
                    <span>Effective PIT Rate:</span>
                    <span>{formatPercentage(taxData.pit.effective_rate || 0)}</span>
                  </div>
                </div>
              </div>
            )}

            {taxData.pit && taxData.pit.bracket_breakdown && (
              <div className="pit-breakdown">
                <h4>PIT Calculation Breakdown</h4>
                <div className="pit-brackets">
                  {taxData.pit.bracket_breakdown.map((bracket, index) => (
                    <div key={index} className="bracket-row">
                      <span>{bracket.range}</span>
                      <span>{formatPercentage(bracket.rate)}</span>
                      <span>{formatCurrency(bracket.tax_amount)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {!taxData.pit && taxData.annualIncome > 0 && (
              <div className="pit-breakdown">
                <h4>PIT Calculation Breakdown (Estimated)</h4>
                <div className="pit-brackets">
                  {getPITBrackets(taxData.annualIncome + (taxData.roiAmount * 0.9)).map((bracket, index) => (
                    <div key={index} className="bracket-row">
                      <span>{bracket.range}</span>
                      <span>{bracket.rate}</span>
                      <span>{formatCurrency(bracket.taxAmount)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {taxData.summary && (
            <div className="tax-history">
              <h3>Tax History Summary</h3>
              <div className="summary-info">
                <div className="detail-row">
                  <span>Total Gross Income:</span>
                  <span>{formatCurrency(taxData.summary.total_gross_income || 0)}</span>
                </div>
                <div className="detail-row">
                  <span>Total Tax Deducted:</span>
                  <span>{formatCurrency(taxData.summary.total_tax_deducted || 0)}</span>
                </div>
                <div className="detail-row">
                  <span>Total Tax Paid:</span>
                  <span>{formatCurrency(taxData.summary.total_tax_paid || 0)}</span>
                </div>
                <div className="detail-row">
                  <span>Net Income After Tax:</span>
                  <span>{formatCurrency(taxData.summary.net_income_after_tax || 0)}</span>
                </div>
              </div>
            </div>
          )}

          <div className="tax-compliance">
            <h3>Tax Compliance Information</h3>
            <div className="compliance-info">
              <p><strong>Filing Requirements:</strong> Annual tax returns must be filed with FIRS</p>
              <p><strong>WHT Remittance:</strong> Withholding tax must be remitted within 21 days</p>
              <p><strong>Record Keeping:</strong> Maintain tax records for 5 years</p>
              <p><strong>TIN Requirement:</strong> Tax Identification Number is mandatory</p>
              {error && <p style={{ color: 'orange' }}><strong>Note:</strong> Some calculations may be estimates due to API unavailability</p>}
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>Close</button>
          <button className="btn btn-primary" onClick={() => window.print()}>
            Print Tax Report
          </button>
        </div>
      </div>
    </div>
  );
};

// Helper function to calculate progressive PIT
function calculateProgressiveTax(income) {
  const brackets = [
    { min: 0, max: 300000, rate: 0.07 },
    { min: 300001, max: 600000, rate: 0.11 },
    { min: 600001, max: 1100000, rate: 0.15 },
    { min: 1100001, max: 1600000, rate: 0.19 },
    { min: 1600001, max: 3200000, rate: 0.21 },
    { min: 3200001, max: Infinity, rate: 0.24 },
  ];

  let tax = 0;
  let remainingIncome = income;

  for (const bracket of brackets) {
    if (remainingIncome <= 0) break;

    const taxableAmount = Math.min(remainingIncome, bracket.max - bracket.min + 1);
    tax += taxableAmount * bracket.rate;
    remainingIncome -= taxableAmount;
  }

  return tax;
}

// Helper function to get PIT bracket breakdown
function getPITBrackets(income) {
  const brackets = [
    { min: 0, max: 300000, rate: 0.07, label: '₦0 - ₦300,000' },
    { min: 300001, max: 600000, rate: 0.11, label: '₦300,001 - ₦600,000' },
    { min: 600001, max: 1100000, rate: 0.15, label: '₦600,001 - ₦1,100,000' },
    { min: 1100001, max: 1600000, rate: 0.19, label: '₦1,100,001 - ₦1,600,000' },
    { min: 1600001, max: 3200000, rate: 0.21, label: '₦1,600,001 - ₦3,200,000' },
    { min: 3200001, max: Infinity, rate: 0.24, label: 'Above ₦3,200,000' },
  ];

  const breakdown = [];
  let remainingIncome = income;

  for (const bracket of brackets) {
    if (remainingIncome <= 0) break;

    const taxableAmount = Math.min(remainingIncome, bracket.max - bracket.min + 1);
    const taxAmount = taxableAmount * bracket.rate;

    if (taxAmount > 0) {
      breakdown.push({
        range: bracket.label,
        rate: formatPercentage(bracket.rate),
        taxAmount: taxAmount
      });
    }

    remainingIncome -= taxableAmount;
  }

  return breakdown;
}

export default TaxReportModal;