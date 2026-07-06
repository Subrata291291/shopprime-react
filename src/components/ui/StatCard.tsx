import { memo } from 'react';

interface StatCardProps {
  icon: string;
  iconColor: string;
  label: string;
  value: string | number;
}

const StatCard = memo(function StatCard({ icon, iconColor, label, value }: StatCardProps) {
  return (
    <div className="db-stat-card">
      <div className={`db-stat-icon ${iconColor}`}><i className={`bi ${icon}`} /></div>
      <div>
        <div className="db-stat-label">{label}</div>
        <div className="db-stat-value">{value}</div>
      </div>
    </div>
  );
});

export default StatCard;
