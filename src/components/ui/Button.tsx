import { memo } from 'react';
import { Link } from 'react-router-dom';
import './Button.css';

interface ButtonProps {
  children?: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  icon?: string;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
  loading?: boolean;
  to?: string;
  href?: string;
  className?: string;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  type?: 'button' | 'submit' | 'reset';
  disabled?: boolean;
  ariaLabel?: string;
}

const Button = memo(function Button({
  children,
  variant = 'primary',
  size = 'md',
  icon,
  iconPosition = 'left',
  fullWidth,
  loading,
  to,
  href,
  className = '',
  onClick,
  type = 'button',
  disabled,
  ariaLabel,
}: ButtonProps) {
  const classes = [
    'btn',
    `btn-${variant}`,
    `btn-${size}`,
    fullWidth ? 'btn-full' : '',
    loading ? 'btn-loading' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  const iconEl = icon ? <i className={`bi bi-${icon}`} /> : null;

  const content = (
    <>
      {loading && <span className="btn-spinner" />}
      {icon && iconPosition === 'left' ? iconEl : null}
      <span className={loading ? 'btn-text-hidden' : ''}>{children}</span>
      {icon && iconPosition === 'right' ? iconEl : null}
    </>
  );

  if (to) {
    return (
      <Link to={to} className={classes} aria-label={ariaLabel}>
        {content}
      </Link>
    );
  }

  if (href) {
    return (
      <a href={href} className={classes} aria-label={ariaLabel}>
        {content}
      </a>
    );
  }

  return (
    <button
      type={type}
      className={classes}
      onClick={onClick}
      disabled={disabled || loading}
      aria-label={ariaLabel}
    >
      {content}
    </button>
  );
});

export default Button;
