import { memo } from 'react';

interface OrderItemCardProps {
  image: string;
  name: string;
  specs: string;
  qty: number;
  price: number;
}

const OrderItemCard = memo(function OrderItemCard({ image, name, specs, qty, price }: OrderItemCardProps) {
  return (
    <div className="sidebar-item d-flex gap-3 mb-3">
      <div className="sidebar-item-img" style={{ width: '6.4rem', height: '6.4rem', borderRadius: '0.8rem', overflow: 'hidden', background: '#2a2a2a', flexShrink: 0 }}>
        <img src={image} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      </div>
      <div className="sidebar-item-info flex-grow-1">
        <div className="sidebar-item-name" style={{ fontSize: '1.3rem', fontWeight: 600, color: '#fff', marginBottom: '0.2rem' }}>{name}</div>
        <div className="sidebar-item-specs" style={{ fontSize: '1.1rem', color: '#777', marginBottom: '0.4rem' }}>{specs}</div>
        <div className="sidebar-item-qty" style={{ fontSize: '1.1rem', color: '#999' }}>Qty: {qty}</div>
      </div>
      <div className="sidebar-item-price text-end" style={{ fontSize: '1.3rem', fontWeight: 700, color: '#fff' }}>${price.toFixed(2)}</div>
    </div>
  );
});

export default OrderItemCard;
