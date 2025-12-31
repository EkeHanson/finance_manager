import React from 'react';


const spinnerStyle = {
  display: 'inline-block',
  width: 18,
  height: 18,
  border: '3px solid #f3f3f3',
  borderTop: '3px solid #007bff',
  borderRadius: '50%',
  animation: 'spin 1s linear infinite',
  marginLeft: 8,
  verticalAlign: 'middle',
};

const spinnerKeyframes = `@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`;

const StepModal = ({ steps, currentStep, error, onClose }) => {
  if (!steps || steps.length === 0) return null;

  const bigSpinnerStyle = {
    display: 'block',
    margin: '40px auto 20px auto',
    width: 70,
    height: 70,
    border: '10px solid #f3f3f3',
    borderTop: '10px solid #007bff',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  };

  return (
    <div className="confirm-modal-backdrop">
      <style>{spinnerKeyframes}</style>
      <div className="confirm-modal" style={{ minWidth: 350, minHeight: 220, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
        {(!error && currentStep < steps.length - 1) ? (
          <>
            <span style={bigSpinnerStyle} />
            <div style={{ fontSize: 22, fontWeight: 600, textAlign: 'center', marginBottom: 10 }}>{steps[currentStep]}</div>
          </>
        ) : (
          <div className="confirm-message" style={{ width: '100%' }}>
            <ol style={{ paddingLeft: 20 }}>
              {steps.map((step, idx) => (
                <li key={idx} style={{
                  fontWeight: idx === currentStep ? 'bold' : 'normal',
                  color: idx < currentStep ? 'green' : idx === currentStep ? '#007bff' : '#888',
                  marginBottom: 8,
                  display: 'flex',
                  alignItems: 'center',
                  fontSize: 18
                }}>
                  <span>{step}</span>
                  {idx < currentStep && <span style={{ marginLeft: 8, color: 'green', fontSize: 22 }}>✓</span>}
                </li>
              ))}
            </ol>
            {error && <div style={{ color: 'red', marginTop: 10 }}>{error}</div>}
          </div>
        )}
        <div className="confirm-actions" style={{ marginTop: 20 }}>
          <button className="confirm-btn" onClick={onClose} disabled={currentStep < steps.length - 1 && !error}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default StepModal;
