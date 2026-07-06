import { memo } from 'react';

interface AddressCardData {
  type: string;
  name: string;
  lines: string[];
  phone: string;
  isDefault?: boolean;
  onDelete?: () => void;
  onDeliver?: () => void;
}

const AddressCard = memo(function AddressCard({ type, name, lines, phone, isDefault, onDelete, onDeliver }: AddressCardData) {
  return (
    <div className={`address-card${isDefault ? ' default' : ''}`}>
      {onDelete && (
        <button className="addr-delete-btn" title="Delete address" onClick={onDelete}>
          <i className="bi bi-trash3"></i>
        </button>
      )}
      <div className="address-type">{type}</div>
      <div className="address-name">{name}</div>
      <div className="address-text">
        {lines.map((line, i) => (
          <span key={i}>{line}<br /></span>
        ))}
      </div>
      <div className="address-phone">{phone}</div>
      {onDeliver && <button className="deliver-btn" onClick={onDeliver}>Deliver Here</button>}
    </div>
  );
});

export default AddressCard;
