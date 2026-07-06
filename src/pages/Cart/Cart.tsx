import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { api } from '../../services/api';
import CartItemCard from '../../components/ui/CartItemCard';
import EmptyState from '../../components/ui/EmptyState';
import Swiper from 'swiper/bundle';

const PAYMENT_ICONS = ['bi-credit-card', 'bi-wallet2', 'bi-bag-check'];

export default function Cart() {
  const { items, removeFromCart, updateQuantity, subtotal, itemCount, clearCart, addToCart } = useCart();
  const [recommended, setRecommended] = useState<any[]>([]);
  const recommendRef = useRef<HTMLDivElement>(null);
  const recommendSwiper = useRef<Swiper | null>(null);

  useEffect(() => {
    api.getProducts({ sortBy: 'popular' }).then((products: any) => {
      setRecommended(products.slice(0, 5));
    }).catch(() => {});
  }, []);

  // Recommendations Swiper Initialization
  useEffect(() => {
    recommendSwiper.current?.destroy(true, true);
    recommendSwiper.current = null;

    if (!recommendRef.current) return;

    const timer = setTimeout(() => {
      const sw = new Swiper(recommendRef.current!, {
        spaceBetween: 16,
        navigation: {
          nextEl: '.cart-recommend-swiper .swiper-button-next',
          prevEl: '.cart-recommend-swiper .swiper-button-prev',
        },
        observer: true,
        observeParents: true,
        observeSlideChildren: true,
        breakpoints: {
          0: { slidesPerView: 1.15 },
          576: { slidesPerView: 2 },
          768: { slidesPerView: 3 },
          1024: { slidesPerView: 4 },
        },
      });
      recommendSwiper.current = sw;
    }, 100);

    return () => {
      clearTimeout(timer);
      recommendSwiper.current?.destroy(true, true);
      recommendSwiper.current = null;
    };
  }, [recommended]);
  const [couponCode, setCouponCode] = useState('');
  const [couponApplied, setCouponApplied] = useState(false);
  const [couponError, setCouponError] = useState('');

  const shipping = subtotal > 500 ? 0 : subtotal > 0 ? 9.99 : 0;
  const discount = couponApplied ? subtotal * 0.1 : 0;
  const total = subtotal - discount + shipping;

  const handleApplyCoupon = () => {
    if (couponCode.trim().toUpperCase() === 'SAVE10') {
      setCouponApplied(true);
      setCouponError('');
    } else {
      setCouponApplied(false);
      setCouponError('Invalid coupon code. Try SAVE10 for 10% off!');
    }
  };

  if (itemCount === 0) {
    return (
      <div className="container cart-page">
      <div className="cart-header-block">
        <h1>Shopping Cart</h1>
      </div>
      <EmptyState
        icon="bi-cart-x"
        title="Your cart is empty"
        description="Add some products to your cart and they'll show up here."
        linkTo="/shop"
        linkText="Continue Shopping"
      />
      </div>
    );
  }

  return (
    <div className="container cart-page">
      <div className="cart-header-block">
        <h1>Shopping Cart</h1>
        <p>{itemCount} {itemCount === 1 ? 'item' : 'items'} in your bag</p>
      </div>

      <section className="cart-layout">
        <div className="cart-items">
          {items.map((item) => (
            <CartItemCard
              key={`${item.product.id}-${item.selectedColor}`}
              item={item}
              onUpdateQuantity={updateQuantity}
              onRemove={removeFromCart}
            />
          ))}

          <div className="cart-footer-actions">
            <Link to="/shop" className="continue-shopping-link">
              <i className="bi bi-arrow-left me-2" />
              Continue Shopping
            </Link>
            <button className="clear-cart-btn" onClick={clearCart}>
              <i className="bi bi-trash me-1"></i> Clear Cart
            </button>
          </div>
        </div>

        <aside className="order-summary-card">
          <h2>Order Summary</h2>

          <div className="coupon-section">
            <label className="coupon-label">Coupon Code</label>
            <div className="coupon-input-wrapper">
              <input
                type="text"
                className="form-control coupon-input"
                placeholder="Enter code (try SAVE10)"
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                onKeyDown={(e) => e.key === 'Enter' && handleApplyCoupon()}
              />
              <button className={`coupon-btn ${couponApplied ? 'applied' : ''}`} type="button" onClick={handleApplyCoupon}>
                {couponApplied ? 'Applied' : 'Apply'}
              </button>
            </div>
            {couponApplied && (
              <div className="coupon-success">
                <i className="bi bi-check-circle me-1" />SAVE10 applied - 10% off!
              </div>
            )}
            {couponError && (
              <div className="coupon-error">
                <i className="bi bi-x-circle me-1" />{couponError}
              </div>
            )}
          </div>

          <div className="summary-lines">
            <div><span>Total MRP</span><span>${subtotal.toFixed(2)}</span></div>
            {couponApplied && (
              <div><span>Discount (10%)</span><span className="summary-accent">-${discount.toFixed(2)}</span></div>
            )}
            <div>
              <span>Delivery Charges</span>
              <span className={shipping === 0 ? 'summary-accent' : ''}>
                {shipping === 0 ? 'FREE' : `$${shipping.toFixed(2)}`}
              </span>
            </div>
            <div><span>Tax (10%)</span><span>${(subtotal * 0.1).toFixed(2)}</span></div>
          </div>

          <div className="summary-total">
            <div>
              <span>Total Amount</span>
              {couponApplied && <small>You saved ${discount.toFixed(2)} on this order</small>}
            </div>
            <strong>${total.toFixed(2)}</strong>
          </div>

          <Link className="btn summary-btn-primary" to="/checkout">
            Place Order
          </Link>
          <div className="summary-secure">
            Secure Checkout with ShopPrime Vault
          </div>
          <div className="summary-icons">
            {PAYMENT_ICONS.map((icon) => (
              <i key={icon} className={`bi ${icon}`} />
            ))}
          </div>
        </aside>
      </section>

      <section className="content-section m-50">
        <div className="section-head">
          <div>
            <h2>Frequently Bought Together</h2>
          </div>
        </div>

        <div className="swiper cart-recommend-swiper" ref={recommendRef}>
          <div className="swiper-wrapper">
            {recommended.map((rec) => (
              <div key={rec.id} className="swiper-slide">
                <article className="cart-recommend-card">
                  <Link to={`/product/${rec.id}`} className="product-image d-block">
                    <img src={rec.image} alt={rec.name} />
                  </Link>
                  <div className="cart-recommend-copy">
                    <Link to={`/product/${rec.id}`} className="text-decoration-none text-white">
                      <h3>{rec.name}</h3>
                    </Link>
                    <strong>${rec.price.toFixed(2)}</strong>
                  </div>
                  <button
                    className="btn cart-add-btn"
                    onClick={() => addToCart(rec, 1)}
                  >
                    <i className="bi bi-cart-plus me-1" />Add to Cart
                  </button>
                </article>
              </div>
            ))}
          </div>
          <div className="swiper-button-prev" />
          <div className="swiper-button-next" />
        </div>
      </section>
    </div>
  );
}
