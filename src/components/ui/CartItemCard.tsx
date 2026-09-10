import { memo } from 'react';
import { Link } from 'react-router-dom';
import type { CartItem } from '../../types';

interface CartItemCardProps {
  item: CartItem;
  onUpdateQuantity: (id: number, qty: number) => void;
  onRemove: (id: number) => void;
}

const CartItemCard = memo(function CartItemCard({ item, onUpdateQuantity, onRemove }: CartItemCardProps) {
  const { product, quantity } = item;
  return (
    <article className="cart-item-card">
      <div className="cart-item-image-wrap">
        <img src={product.image} alt={product.name} />
      </div>

      <div className="cart-item-main">
        <div className="cart-item-copy">
          <Link to={`/product/${product.id}`} className="text-decoration-none">
            <h3>{product.name}</h3>
          </Link>
          <div className="cart-item-meta">
            <span className="cart-item-price">₹{(product.price * quantity).toFixed(2)}</span>
            <span className="cart-item-qty-label">NET QUANTITY (N-{quantity})</span>
          </div>
        </div>

        <div className="cart-item-controls">
          <div className="qty-stepper qty-stepper-compact">
            <button type="button" onClick={() => onUpdateQuantity(product.id, Math.max(1, quantity - 1))} aria-label="Decrease quantity">-</button>
            <span>{quantity}</span>
            <button type="button" onClick={() => onUpdateQuantity(product.id, Math.min(99, quantity + 1))} aria-label="Increase quantity">+</button>
          </div>

          <button className="cart-remove-btn" onClick={() => onRemove(product.id)} aria-label={`Remove ${product.name}`}>
            <i className="bi bi-trash3" />
          </button>
        </div>
      </div>

      <div className="cart-item-total">
        <span>₹{(product.price * quantity).toFixed(2)}</span>
      </div>
    </article>
  );
});

export default CartItemCard;
