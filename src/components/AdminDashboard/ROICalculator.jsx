import React from 'react';
import './ROICalculator.css';

const ROICalculator = ({ investment, lastActivity }) => {
  const calculateROI = () => {
    const monthlyROI = investment * 0.033; // 3.3% monthly
    const monthsSinceLastActivity = Math.floor((Date.now() - new Date(lastActivity)) / (1000 * 60 * 60 * 24 * 30));
    if (monthsSinceLastActivity >= 12) {
      return investment * 0.4; // 40% annual ROI
    }
    return monthlyROI;
  };

  return (
    <div className="roi-calculator">
      <h3>ROI Calculation</h3>
      <p>Monthly ROI (3.3%): ₦{(investment * 0.033).toLocaleString()}</p>
      <p>Annual ROI (40% if no activity for 12 months): ₦{calculateROI().toLocaleString()}</p>
    </div>
  );
};

export default ROICalculator;