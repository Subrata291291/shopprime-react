import { memo } from 'react';
import { Link } from 'react-router-dom';
import type { CartItem } from '../../types';

interface CartItemCardProps {
  item: CartItem;
  onUpdateQuantity: (id: number, qty: number) => void;
  onRemove: (id: number) => void;
}

const CartItemCard = memo(function CartItemCard({ item, onUpdateQuantity, onRemove }: CartItemCardProps) {
  const { product, quantity, selectedColor } = item;
  return (
    <article className="cart-item-card">
      <img src={product.image} alt={product.name} />
      <div className="cart-item-main">
        <div className="cart-item-copy">
          <Link to={`/product/${product.id}`} className="text-decoration-none text-white">
            <h3>{product.name}</h3>
          </Link>
          {selectedColor && <p>{selectedColor}</p>}
        </div>
        <button className="cart-remove-btn" onClick={() => onRemove(product.id)} aria-label={`Remove ${product.name}`}>
          <i className="bi bi-trash3" />
        </button>
        <div className="cart-item-footer">
          <div className="qty-stepper">
            <button type="button" onClick={() => onUpdateQuantity(product.id, Math.max(1, quantity - 1))} aria-label="Decrease quantity">-</button>
            <span>{quantity}</span>
            <button type="button" onClick={() => onUpdateQuantity(product.id, Math.min(99, quantity + 1))} aria-label="Increase quantity">+</button>
          </div>
          <div className="cart-price-block">
            <strong>${(product.price * quantity).toFixed(2)}</strong>
            {product.originalPrice && <span><del>${(product.originalPrice * quantity).toFixed(2)}</del></span>}
          </div>
        </div>
      </div>
    </article>
  );
});

export default CartItemCard;
