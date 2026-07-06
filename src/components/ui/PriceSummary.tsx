import { memo } from 'react';

interface PriceLine {
  label: string;
  value: string;
  accent?: boolean;
  free?: boolean;
  discount?: boolean;
}

interface PriceSummaryProps {
  lines: PriceLine[];
  totalLabel: string;
  totalValue: string;
  totalSubtext?: string;
  buttonLabel?: string;
  onButtonClick?: () => void;
  buttonIcon?: string;
  secureText?: string;
  children?: React.ReactNode;
}

const PriceSummary = memo(function PriceSummary({
  lines, totalLabel, totalValue, totalSubtext,
  buttonLabel, onButtonClick, buttonIcon, secureText, children
}: PriceSummaryProps) {
  return (
    <div className="price-section">
      <h3 className="price-section-title" style={{ marginBottom: '2rem' }}>Order Summary</h3>
      {children}
      {lines.map((line) => (
        <div className="price-line" key={line.label}>
          <span className="price-label">{line.label}</span>
          <span className={`price-value${line.accent ? ' summary-accent' : ''}${line.free ? ' free' : ''}${line.discount ? ' discount' : ''}`}>
            {line.value}
          </span>
        </div>
      ))}
      <div className="price-total">
        <span className="price-total-label">{totalLabel}</span>
        <span className="price-total-value">{totalValue}</span>
      </div>
      {totalSubtext && <small style={{ color: '#d0aa2f', fontSize: '1.05rem', display: 'block', marginTop: '-1rem', marginBottom: '1rem' }}>{totalSubtext}</small>}
      {buttonLabel && onButtonClick && (
        <button className="confirm-btn" onClick={onButtonClick}>
          {buttonIcon && <i className={`bi ${buttonIcon} me-2`}></i>}
          {buttonLabel}
        </button>
      )}
      {secureText && (
        <div className="security-message" style={{ textTransform: 'uppercase', fontSize: '1rem', fontWeight: 700, letterSpacing: '0.5px' }}>
          <i className="bi bi-shield-lock-fill"></i> {secureText}
        </div>
      )}
    </div>
  );
});

export default PriceSummary;
