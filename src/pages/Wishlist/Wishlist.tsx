import { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useWishlist } from '../../context/WishlistContext';
import { useCart } from '../../context/CartContext';
import { api } from '../../services/api';
import EmptyState from '../../components/ui/EmptyState';

export default function Wishlist() {
  const { items, removeFromWishlist, itemCount } = useWishlist();
  const { addToCart } = useCart();
  const [products, setProducts] = useState<any[]>([]);
  const fetchIdRef = useRef(0);

  useEffect(() => {
    document.title = 'My Wishlist - ShopPrime';
    if (items.length === 0) {
      setProducts([]);
      return;
    }

    // Fetch fresh product data from API
    const currentFetchId = ++fetchIdRef.current;

    // Immediately show local items while fetching fresh data
    setProducts(items);

    api.getProducts().then((all: any) => {
      // Ignore stale responses
      if (currentFetchId !== fetchIdRef.current) return;
      
      const wishlisted = all.filter((p: any) => items.find((w) => w.id === p.id));
      setProducts(wishlisted.length > 0 ? wishlisted : items);
    }).catch(() => {
      if (currentFetchId !== fetchIdRef.current) return;
      setProducts(items);
    });
  }, [items]);

  const displayItems = products.length > 0 ? products : items;

  if (displayItems.length === 0) {
    return (
      <main className="container py-5">
        <EmptyState
          icon="bi-heart"
          title="Your wishlist is empty"
          description="Save items you love and check back later."
          linkTo="/shop"
          linkText="Browse Products"
        />
      </main>
    );
  }

  return (
    <main className="container py-5">
      <div className="wishlist-page">
        <div className="wishlist-header">
          <h1>My Wishlist</h1>
          <span className="wishlist-count">{itemCount} items</span>
        </div>

        <div className="wishlist-grid">
          {displayItems.map((item: any) => (
            <div className="product-card wishlist-card" key={item.id}>
              <Link to={`/product/${item.id}`} className="product-image d-block">
                <img src={item.image} alt={item.name} />
              </Link>
              <div className="product-body">
                <Link to={`/product/${item.id}`} className="text-decoration-none text-white">
                  <h3>{item.name}</h3>
                </Link>
                <div className="product-price">
                  <strong>${item.price.toFixed(2)}</strong>
                  {item.originalPrice && (
                    <span className="old-price">${item.originalPrice.toFixed(2)}</span>
                  )}
                </div>
                <div className="wishlist-actions">
                  <button
                    className="add-to-cart-btn"
                    onClick={() => {
                      addToCart(item, 1);
                      removeFromWishlist(item.id);
                    }}
                  >
                    <i className="bi bi-cart-plus"></i> Add to Cart
                  </button>
                  <button
                    className="wishlist-remove-btn"
                    onClick={() => removeFromWishlist(item.id)}
                    title="Remove from wishlist"
                  >
                    <i className="bi bi-trash3"></i>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
