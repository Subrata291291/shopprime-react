import { memo } from 'react';
import { Link } from 'react-router-dom';

interface EmptyStateProps {
  icon: string;
  title: string;
  description: string;
  linkTo: string;
  linkText: string;
}

const EmptyState = memo(function EmptyState({ icon, title, description, linkTo, linkText }: EmptyStateProps) {
  return (
    <div className="empty-state">
      <i className={`bi ${icon}`} />
      <h3>{title}</h3>
      <p>{description}</p>
      <Link to={linkTo} className="add-to-cart-btn" style={{ display: 'inline-block' }}>{linkText}</Link>
    </div>
  );
});

export default EmptyState;
