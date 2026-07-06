import { memo } from 'react';
import { Link } from 'react-router-dom';

interface SectionProps {
  title: string;
  subtitle?: string;
  linkTo?: string;
  linkText?: string;
  className?: string;
  children: React.ReactNode;
}

const Section = memo(function Section({ title, subtitle, linkTo, linkText, className = '', children }: SectionProps) {
  return (
    <section className={`content-section${className ? ' ' + className : ''}`}>
      <div className="section-head">
        <div>
          <h2>{title}</h2>
          {subtitle && <p>{subtitle}</p>}
        </div>
        {linkTo && linkText && <Link to={linkTo}>{linkText}</Link>}
      </div>
      {children}
    </section>
  );
});

export default Section;
