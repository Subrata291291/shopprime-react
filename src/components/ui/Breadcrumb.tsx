import { memo } from 'react';
import { Link } from 'react-router-dom';

interface Crumb {
  label: string;
  to?: string;
}

interface BreadcrumbProps {
  items: Crumb[];
}

const Breadcrumb = memo(function Breadcrumb({ items }: BreadcrumbProps) {
  return (
    <div className="breadcrumb-nav">
      {items.map((item, i) => {
        const isLast = i === items.length - 1;
        return (
          <span key={item.label}>
            {i > 0 && <span className="mx-2">›</span>}
            {item.to && !isLast ? (
              <Link to={item.to}>{item.label}</Link>
            ) : (
              <span className={isLast ? 'text-white' : ''}>{item.label}</span>
            )}
          </span>
        );
      })}
    </div>
  );
});

export default Breadcrumb;
