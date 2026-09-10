import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { api } from '../../services/api';
import CartItemCard from '../../components/ui/CartItemCard';
import EmptyState from '../../components/ui/EmptyState';
import Swiper from 'swiper/bundle';
import ProductCard from '../../components/product/ProductCard';

export default function Cart() {
  const { items, removeFromCart, updateQuantity, subtotal, itemCount, clearCart } = useCart();
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
        spaceBetween: 15,
        navigation: {
          nextEl: '.cart-recommend-swiper .swiper-button-next',
          prevEl: '.cart-recommend-swiper .swiper-button-prev',
        },
        observer: true,
        observeParents: true,
        observeSlideChildren: true,
        breakpoints: {
          0: { slidesPerView: 1.5 },
          576: { slidesPerView: 2 },
          768: { slidesPerView: 3 },
          1024: { slidesPerView: 4.1 },
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
  const shipping: number = 0;
  const total = subtotal + shipping;

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
        <h1>Cart</h1>
      </div>

      <section className="cart-layout">
        <div className="cart-items-panel">
          <div className="cart-table-header">
            <span>Product</span>
            <span>Total</span>
          </div>

          <div className="cart-items">
            {items.map((item) => (
              <CartItemCard
                key={`${item.product.id}-${item.selectedColor}`}
                item={item}
                onUpdateQuantity={updateQuantity}
                onRemove={removeFromCart}
              />
            ))}
          </div>

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
          <h2>Cart Totals</h2>

          <div className="coupon-section">
            <button type="button" className="coupon-toggle">
              Add coupons
              <i className="bi bi-chevron-down" />
            </button>
          </div>

          <div className="summary-lines">
            <div className="summary-row">
              <span>Subtotal</span>
              <strong>₹{subtotal.toFixed(2)}</strong>
            </div>
            <div className="summary-row">
              <span>Shipping</span>
              <strong>{shipping === 0 ? 'FREE' : `₹${shipping.toFixed(2)}`}</strong>
            </div>
            <div className="summary-row shipping-note-row">
              <span className="shipping-note">Xpressbees Surface ( Delivery by Sep 15, 2026 )</span>
            </div>
          </div>

          <div className="summary-total">
            <span>Estimated total</span>
            <strong>₹{total.toFixed(2)}</strong>
          </div>

          <Link className="btn summary-btn-primary" to="/checkout">
            PROCEED TO CHECKOUT
          </Link>
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
                <ProductCard product={rec} />
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
