import { memo } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import type { Product } from '../../types';

interface ProductCardProps {
  product: Product;
  listView?: boolean;
  showWishlistControls?: boolean;
  onRemove?: () => void;
}

const BADGE_CLASSES: Record<string, string> = {
  'best-seller': 'new',
  'top-rated': '',
  'pre-order': '',
  'sale': 'hot',
};

const ProductCard = memo(function ProductCard({ product, showWishlistControls = false, onRemove }: ProductCardProps) {
  const { addToCart } = useCart();

  const handleCartClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart(product, 1);
  };

  return (
    <article className="product-card wide">
      <div className="product-image-wrap position-relative">
        <Link to={`/product/${product.id}`} className="product-image d-block">
          <img src={product.image} alt={product.name} />
        </Link>
        {product.badge && (
          <span className={`product-badge${product.badgeType ? ' ' + (BADGE_CLASSES[product.badgeType] ?? product.badgeType) : ''}`}>
            {product.badge}
          </span>
        )}
        {showWishlistControls && (
          <button className="product-remove-btn" onClick={(e) => { e.preventDefault(); e.stopPropagation(); onRemove?.(); }} aria-label="Remove">
            <i className="bi bi-x-lg" />
          </button>
        )}
      </div>
      <div className="product-content">
        <Link to={`/product/${product.id}`} className="text-decoration-none text-white">
          <h3 className="product-name">{product.name}</h3>
        </Link>
        <div className="product-rating">
          <span className="stars">{Array.from({ length: Math.floor(product.rating) }, () => '★').join(' ')}{' '}{Array.from({ length: 5 - Math.floor(product.rating) }, () => '☆').join(' ')}</span>
          <span className="rating-count">({product.reviewCount.toLocaleString()})</span>
        </div>
        <div className="product-price">
          <span className="price-current">${product.price.toFixed(2)}</span>
          {product.originalPrice && (
            <span className="price-original">${product.originalPrice.toFixed(2)}</span>
          )}
        </div>

        <div className="product-stock mt-2">
          <span className={`in-stock${product.inStock === false ? ' out-of-stock' : ''}`}>
            <i className={`bi ${product.inStock === false ? 'bi-x-circle-fill' : 'bi-check-circle-fill'}`} />
            {product.inStock === false ? 'Out of Stock' : 'In Stock'}
          </span>
        </div>

        <div className="product-actions mt-3">
          <button
            className={`add-to-cart-btn w-100${product.isPreOrder ? ' pre-order' : ''}`}
            onClick={handleCartClick}
            disabled={!product.inStock && !product.isPreOrder}
          >
            {product.isPreOrder ? 'PRE-ORDER NOW' : 'Add to Cart'}
          </button>
        </div>
      </div>
    </article>
  );
});

export default ProductCard;
