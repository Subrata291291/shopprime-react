import { memo } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import type { Product } from '../../types';

interface ProductCardProps {
  product: Product;
  listView?: boolean;
}

const BADGE_CLASSES: Record<string, string> = {
  'best-seller': 'new',
  'top-rated': '',
  'pre-order': '',
  'sale': 'hot',
};

const ProductCard = memo(function ProductCard({ product, listView = false }: ProductCardProps) {
  const { addToCart } = useCart();

  const handleCartClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart(product, 1);
  };

  if (listView) {
    return (
      <div className="product-card-list d-flex flex-column flex-sm-row align-items-center gap-4 p-4 border border-secondary-subtle rounded-4 mb-3">
        <Link to={`/product/${product.id}`} className="product-list-thumb position-relative flex-shrink-0">
          <img src={product.image} alt={product.name} className="w-100 h-100 object-fit-cover rounded-3" />
          {product.badge && (
            <span className={`tag tag-list ${product.badgeType ?? 'new'}`}>
              {product.badge}
            </span>
          )}
        </Link>
        <div className="flex-grow-1 text-sm-start text-center">
          <Link to={`/product/${product.id}`} className="text-decoration-none text-white">
            <h3 className="fs-4 mb-2">{product.name}</h3>
          </Link>
          <p className="small mb-3 custom-color">{product.description}</p>
          <div className="d-flex align-items-center gap-3 justify-content-sm-start justify-content-center">
            <strong className="fs-4 text-warning">${product.price.toFixed(2)}</strong>
            {product.originalPrice && (
              <span className="text-decoration-line-through custom-color">${product.originalPrice.toFixed(2)}</span>
            )}
          </div>
        </div>
        <div className="flex-shrink-0 mt-3 mt-sm-0">
          <button className="add-to-cart-btn" onClick={handleCartClick}>
            Add to Cart
          </button>
        </div>
      </div>
    );
  }

  return (
    <article className="product-card">
      <Link to={`/product/${product.id}`} className="product-image d-block">
        <img src={product.image} alt={product.name} />
        {product.badge && (
          <span className={`product-badge${product.badgeType ? ' ' + (BADGE_CLASSES[product.badgeType] ?? product.badgeType) : ''}`}>
            {product.badge}
          </span>
        )}
      </Link>
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
        <button
          className={`add-to-cart-btn${product.isPreOrder ? ' pre-order' : ''}`}
          onClick={handleCartClick}
        >
          {product.isPreOrder ? 'PRE-ORDER NOW' : 'Add to Cart'}
        </button>
      </div>
    </article>
  );
});

export default ProductCard;
