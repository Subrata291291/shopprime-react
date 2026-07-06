import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api } from '../../services/api';
import ActivityLogItem from '../../components/ui/ActivityLogItem';
import type { Order } from '../../services/api';


/* Step config matching the 4-step HTML layout */
const STEP_DEFS = [
  { label: 'Ordered',    icon: 'bi-check-lg',    status: 'Ordered'    },
  { label: 'Shipped',    icon: 'bi-truck',        status: 'Shipped'    },
  { label: 'In Transit', icon: 'bi-box-seam',     status: 'In Transit' },
  { label: 'Delivered',  icon: 'bi-house-door',   status: 'Delivered'  },
];

const STATUS_RANK: Record<string, number> = {
  Ordered: 0, Shipped: 1, 'In Transit': 2, Delivered: 3,
};

import './TrackOrder.css';

export default function TrackOrder() {
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get('order');
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const fallbackOrder = () => {
      const stored = window.sessionStorage.getItem('shopprime_last_order');
      if (!stored) return null;
      try {
        return JSON.parse(stored) as Order;
      } catch {
        return null;
      }
    };

    if (orderId) {
      api.getOrder(orderId).then((data) => {
        if (cancelled) return;
        if (data) {
          setOrder(data);
        } else {
          const stored = fallbackOrder();
          if (stored && stored.id === orderId) setOrder(stored);
        }
        setLoading(false);
      }).catch(() => {
        if (cancelled) return;
        const stored = fallbackOrder();
        if (stored && stored.id === orderId) setOrder(stored);
        setLoading(false);
      });
    } else {
      const stored = fallbackOrder();
      if (stored) setOrder(stored);
      setLoading(false);
    }

    return () => {
      cancelled = true;
    };
  }, [orderId]);

  if (loading) {
    return (
      <div className="container page-message">
        <p>Loading order details…</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="container page-message">
        <p>Order not found.</p>
      </div>
    );
  }

  const currentRank = STATUS_RANK[order.status] ?? 0;

  /* Dynamic step dates from activity or order date */
  const stepDates = [
    order.activity?.[0]?.time?.split(':')[0]?.trim() || order.date,
    order.activity?.[1]?.time?.split(':')[0]?.trim() || 'Pending',
    currentRank >= 2 ? 'Today' : 'Pending',
    currentRank >= 3 ? 'Delivered' : 'Pending',
  ];

  return (
    <div className="container to-page">

        {/* Breadcrumb */}
        <nav className="to-breadcrumb" aria-label="breadcrumb">
          <Link to="/">Home</Link>
          <i className="bi bi-chevron-right" />
          <span>Track Order</span>
        </nav>

        {/* Title row */}
        <div className="to-title-row">
          <div>
            <h1>Track Your Order</h1>
            <div className="to-order-meta">
              <span className="to-order-id-badge">Order ID: #{order.id}</span>
              <span className="to-order-date">Order Date: {order.date}</span>
            </div>
          </div>
          <div className="to-est-delivery">
            <div className="to-est-label">Estimated Delivery</div>
            <div className="to-est-date">{order.estimatedDelivery}</div>
          </div>
        </div>

        {/* Progress tracker card */}
        <div className="to-tracker-card">
          <div className="to-steps" style={{ '--progress-width': `${currentRank * 25 + 12.5}%`, '--progress-height': `calc(${currentRank * 25 + 12.5}% - 1.2rem)` } as React.CSSProperties}>
            {STEP_DEFS.map((step, idx) => {
              const rank = STATUS_RANK[step.status] ?? idx;
              let iconClass = 'pending';
              if (rank < currentRank) iconClass = 'done';
              else if (rank === currentRank) iconClass = 'active';

              const dateHighlight = rank === currentRank;
              const labelPending = rank > currentRank;

              return (
                <div key={step.label} className="to-step">
                  <div className={`to-step-icon ${iconClass}`}>
                    <i className={`bi ${step.icon}`} />
                  </div>
                  <div className={`to-step-label${labelPending ? ' pending-text' : ''}`}>
                    {step.label}
                  </div>
                  <div className={`to-step-date${dateHighlight ? ' highlight' : ''}`}>
                    {rank > currentRank ? 'Pending' : stepDates[idx]}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Two-column layout */}
        <div className="to-layout">

          {/* LEFT: Map + Activity */}
          <div className="to-map-card">
            <div className="to-map-header">
              <div className="to-map-title">
                <i className="bi bi-geo-alt-fill" />
                Arriving Today
              </div>
              <span className="to-on-schedule">On Schedule</span>
            </div>

            {/* Map visual */}
            <div className="to-map-visual">
              {/* Decorative road lines */}
              <div className="to-road-h" style={{ top: '30%' }} />
              <div className="to-road-h" style={{ top: '55%' }} />
              <div className="to-road-h" style={{ top: '78%' }} />
              <div className="to-road-v" style={{ left: '20%' }} />
              <div className="to-road-v" style={{ left: '50%' }} />
              <div className="to-road-v" style={{ left: '75%' }} />

              {/* Route line */}
              <div className="to-map-route" />

              {/* Pin marker */}
              <div className="to-map-pin">
                <div className="to-map-pin-dot">
                  <i className="bi bi-geo-alt-fill" />
                </div>
                <div className="to-map-pin-shadow" />
              </div>

              {/* Last seen label */}
              <div className="to-map-last-seen">
                <div className="to-last-seen-label">Last Seen</div>
                <div className="to-last-seen-place">{order.lastSeenPlace}</div>
                <div className="to-last-seen-time">{order.lastSeenTime}</div>
              </div>
            </div>

            {/* Activity Log */}
            <div className="to-activity">
              <div className="to-activity-title">Activity Log</div>
              {order.activity.map((item, i) => (
                <ActivityLogItem key={i} icon={item.icon} iconType={item.type} time={item.time} description={item.desc} />
              ))}
            </div>
          </div>

          {/* RIGHT: Sidebar */}
          <div className="to-sidebar">

            {/* In This Shipment */}
            <div className="to-card">
              <div className="to-card-title">In This Shipment</div>

              {order.items.map((item) => (
                <div key={item.id} className="to-ship-item">
                  <div className="to-ship-img">
                    <img src={item.image} alt={item.name} />
                  </div>
                  <div>
                    <div className="to-ship-name">{item.name}</div>
                    <div className="to-ship-meta">Qty: {item.qty} &bull; {item.variant}</div>
                    <div className="to-ship-meta to-ship-price-meta">
                      ${item.price.toFixed(2)}
                    </div>
                  </div>
                </div>
              ))}

              <div className="to-price-line">
                <span className="to-price-label">Subtotal</span>
                <span className="to-price-val">${order.subtotal.toFixed(2)}</span>
              </div>
              <div className="to-price-line">
                <span className="to-price-label">Shipping</span>
                <span className={`to-price-val${order.shipping === 'FREE' ? ' free' : ''}`}>
                  {order.shipping === 'FREE' ? 'FREE' : `$${(order.shipping as number).toFixed(2)}`}
                </span>
              </div>

              <div className="to-total-row">
                <span className="to-total-label">Total</span>
                <span className="to-total-val">${order.total.toFixed(2)}</span>
              </div>
            </div>

            {/* Need Help */}
            <div className="to-help-card">
              <div className="to-help-title">
                <i className="bi bi-question-circle-fill" />
                Need Help?
              </div>
              <p className="to-help-text">
                Encountering issues with your delivery or have a question about your order?
                Our support team is here 24/7.
              </p>
              <a href="#" className="to-help-btn">Visit Help Center</a>
            </div>

          </div>
        </div>
      </div>
  );
}
