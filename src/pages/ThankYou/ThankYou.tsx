import { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import './ThankYou.css';

interface OrderItem {
  id: string | number;
  name: string;
  image: string;
  specs: string;
  qty: number;
  price: number;
}

interface ShippingAddress {
  name: string;
  address: string;
  city: string;
  country: string;
}

interface Order {
  id: string;
  date: string;
  estimatedDelivery: string;
  total: number;
  subtotal: number;
  shipping: number | 'FREE';
  shippingMethod?: string;
  tax: number;
  paymentMethod: string;
  paymentBrand: string;
  billingNote: string;
  shippingAddress: ShippingAddress;
  items: OrderItem[];
  status?: string;
}

export default function ThankYou() {
  const location = useLocation();
  const navigate = useNavigate();
  const [order, setOrder] = useState<Order | null>(() => {
    return (location.state as any)?.order ?? null;
  });

  const [progressReady, setProgressReady] = useState(false);

  useEffect(() => {
    if (!order) {
      const stored = window.sessionStorage.getItem('shopprime_last_order');
      if (stored) {
        try {
          setOrder(JSON.parse(stored));
          return;
        } catch {
          // ignore parse error
        }
      }
      navigate('/shop', { replace: true });
      return;
    }
    window.scrollTo(0, 0);

    const timer = setTimeout(() => {
      setProgressReady(true);
    }, 300);

    const colors = ['#4d7fff', '#ff6b35', '#4dff4d', '#ffd700', '#ff3b82', '#00d4ff'];
    const container = document.getElementById('confettiContainer');
    if (!container) return;

    const activeTimers: number[] = [];

    const spawnDot = () => {
      const dot = document.createElement('div');
      dot.classList.add('confetti-dot');
      const size = Math.random() * 8 + 4;
      const color = colors[Math.floor(Math.random() * colors.length)];
      const left = Math.random() * 100;
      const duration = Math.random() * 2 + 2;
      const delay = Math.random() * 2;
      dot.style.cssText = `
        width: ${size}px; height: ${size}px;
        left: ${left}vw; background: ${color};
        animation: fall ${duration}s ${delay}s linear forwards;
      `;
      container.appendChild(dot);

      const removeTimer = window.setTimeout(() => {
        dot.remove();
      }, (duration + delay) * 1000);
      activeTimers.push(removeTimer);
    };

    for (let i = 0; i < 60; i++) {
      const spawnTimer = window.setTimeout(spawnDot, i * 40);
      activeTimers.push(spawnTimer);
    }

    return () => {
      clearTimeout(timer);
      activeTimers.forEach(window.clearTimeout);
      if (container) container.innerHTML = '';
    };
  }, [order, navigate]);

  if (!order) return null;

  return (
    <div className="thankyou-page-root">
      <div className="ty-confetti" id="confettiContainer"></div>

      <main className="ty-main">
        <div className="container">
          <div className="ty-hero">
            <div className="ty-check-circle">
              <i className="bi bi-check-lg"></i>
            </div>
            <h1>Order Placed Successfully!</h1>
            <p>Thank you for your purchase. We've sent a confirmation email to your inbox.</p>
            <span className="ty-order-id-badge">Order ID: #{order.id}</span>
          </div>

          <div className="ty-grid">
            <div>
              <div className="ty-delivery-banner">
                <div className="ty-delivery-banner-text">
                  <div className="d-flex justify-content-between align-items-start mb-4">
                    <div>
                      <h2>Arriving by {order.estimatedDelivery}</h2>
                      <p>{order.shippingMethod || ((order.shipping === 0 || order.shipping === 'FREE') ? 'Standard Shipping' : 'Express Delivery')} — Track your package below</p>
                    </div>
                    <i className="bi bi-truck ty-delivery-icon"></i>
                  </div>

                  <div className="ty-progress-wrap">
                    <div className="ty-progress-track">
                      <div
                        className={`ty-progress-fill${progressReady ? ' is-ready' : ''}`}
                        id="progressFill"
                      ></div>
                      <div className="ty-progress-dot ty-progress-0 active"></div>
                      <div className="ty-progress-dot ty-progress-33"></div>
                      <div className="ty-progress-dot ty-progress-66"></div>
                      <div className="ty-progress-dot ty-progress-100"></div>
                    </div>
                    <div className="ty-progress-labels">
                      <span className="ty-progress-label ty-progress-0 active">Confirmed</span>
                      <span className="ty-progress-label ty-progress-33">Preparing</span>
                      <span className="ty-progress-label ty-progress-66">Shipped</span>
                      <span className="ty-progress-label ty-progress-100">Delivered</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="ty-items-card">
                <div className="ty-card-title">Order Items ({order.items.length})</div>
                {order.items.map((item) => (
                  <div className="ty-item" key={item.id}>
                    <div className="ty-item-img">
                      <img src={item.image} alt={item.name} />
                    </div>
                    <div className="ty-item-info">
                      <div className="ty-item-name">{item.name}</div>
                      <div className="ty-item-specs">{item.specs}</div>
                      <div className="ty-item-qty">Qty: {item.qty}</div>
                    </div>
                    <div className="ty-item-price">${item.price.toFixed(2)}</div>
                  </div>
                ))}
              </div>

              <div className="ty-info-row">
                <div className="ty-info-card">
                  <div className="ty-info-label">
                    <i className="bi bi-geo-alt-fill"></i>
                    Shipping Address
                  </div>
                  <div className="ty-addr-name">{order.shippingAddress.name}</div>
                  <div className="ty-addr-text ty-preserve-lines">
                    {order.shippingAddress.address}
                    {'\n'}
                    {order.shippingAddress.city}
                    {'\n'}
                    {order.shippingAddress.country}
                  </div>
                </div>

                <div className="ty-info-card">
                  <div className="ty-info-label">
                    <i className="bi bi-credit-card-2-front-fill"></i>
                    Payment Method
                  </div>
                  <div className="ty-visa-wrap">
                    <span className="ty-visa-badge">{order.paymentBrand}</span>
                    <div>
                      <div className="ty-visa-info">{order.paymentMethod}</div>
                      {order.paymentBrand !== 'UPI' ? (
                        <div className="ty-visa-exp">Paid via {order.paymentBrand}</div>
                      ) : (
                        <div className="ty-visa-exp">UPI payment confirmed</div>
                      )}
                    </div>
                  </div>
                  <div className="ty-billing-note">{order.billingNote}</div>
                </div>
              </div>
            </div>

            <div className="ty-sidebar">
              <div className="ty-card">
                <div className="ty-card-title">Price Summary</div>
                <div className="ty-price-line">
                  <span className="ty-price-label">Subtotal ({order.items.length} items)</span>
                  <span className="ty-price-val">${order.subtotal.toFixed(2)}</span>
                </div>
                <div className="ty-price-line">
                  <span className="ty-price-label">Shipping</span>
                  <span className="ty-price-val free">
                    {order.shipping === 0 || order.shipping === 'FREE' ? 'FREE' : `$${(order.shipping as number).toFixed(2)}`}
                  </span>
                </div>
                <div className="ty-price-line">
                  <span className="ty-price-label">Tax</span>
                  <span className="ty-price-val">${order.tax.toFixed(2)}</span>
                </div>
                <div className="ty-total-row">
                  <span className="ty-total-label">Order Total</span>
                  <span className="ty-total-val">${order.total.toFixed(2)}</span>
                </div>
              </div>

              <div className="d-flex flex-column gap-3">
                <Link to={`/track-order?order=${order.id}`} className="ty-btn-track" id="trackOrderBtn">
                  Track Order <i className="bi bi-arrow-right"></i>
                </Link>
                <Link to="/shop" className="ty-btn-shop">
                  Continue Shopping
                </Link>
                <button className="ty-btn-print" onClick={() => window.print()}>
                  <i className="bi bi-printer"></i> Print Receipt
                </button>
              </div>

              <div className="ty-help-card">
                <div className="ty-help-header">
                  <i className="bi bi-question-circle-fill"></i>
                  Need help?
                </div>
                <p className="ty-help-text">
                  If you have any questions about your order, visit our support center or contact our 24/7 help desk.
                </p>
                <a href="#" className="ty-help-link">
                  Contact Support
                </a>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
