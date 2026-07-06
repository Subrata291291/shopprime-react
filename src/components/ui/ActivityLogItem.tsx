import { memo } from 'react';

interface ActivityLogItemProps {
  icon: string;
  iconType: string;
  time: string;
  description: string;
}

const ActivityLogItem = memo(function ActivityLogItem({ icon, iconType, time, description }: ActivityLogItemProps) {
  return (
    <div className="to-log-item">
      <div className={`to-log-icon ${iconType}`}>
        <i className={`bi ${icon}${icon === 'bi-circle-fill' ? ' to-log-icon-dot' : ''}`} />
      </div>
      <div>
        <div className="to-log-time">{time}</div>
        <div className="to-log-desc">{description}</div>
      </div>
    </div>
  );
});

export default ActivityLogItem;
