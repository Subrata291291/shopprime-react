import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';
import StatCard from '../../components/ui/StatCard';
import type { User, Order, WishlistItem, Address, Payment } from '../../services/api';

type AddressForm = {
  name: string;
  phone: string;
  pincode: string;
  locality: string;
  street: string;
  city: string;
  state: string;
  type: 'HOME' | 'WORK/OFFICE';
  isDefault: boolean;
};

export default function Account() {
  const { isLoggedIn, user: authUser, logout } = useAuth();
  const { addToCart } = useCart();
  const { items: wishlistCtx, removeFromWishlist } = useWishlist();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('profile');
  const [user, setUser] = useState<User | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [wishlist, setWishlist] = useState<WishlistItem[]>([]);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [editStatus, setEditStatus] = useState('');
  const [settings, setSettings] = useState<Record<string, boolean>>(() => {
    try { return JSON.parse(localStorage.getItem('shopprime_settings') || '{}'); } catch { return {}; }
  });
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showOrderDetail, setShowOrderDetail] = useState(false);
  const [orderPage, setOrderPage] = useState(1);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [addressForm, setAddressForm] = useState<AddressForm>({
    name: '',
    phone: '',
    pincode: '',
    locality: '',
    street: '',
    city: '',
    state: '',
    type: 'HOME',
    isDefault: false,
  });
  const ORDERS_PER_PAGE = 3;

  useEffect(() => {
    if (!isLoggedIn) { navigate('/auth'); return; }
    Promise.allSettled([
      api.getUser(),
      api.getOrders(),
      api.getWishlist(),
      api.getAddresses(),
      api.getPayments()
    ]).then(([u, o, w, a, p]) => {
      if (u.status === 'fulfilled') setUser(u.value);
      if (o.status === 'fulfilled') {
        const fetchedOrders = o.value as Order[];
        const storedOrderJson = window.sessionStorage.getItem('shopprime_last_order');
        if (storedOrderJson) {
          try {
            const storedOrder = JSON.parse(storedOrderJson) as Order;
            if (storedOrder && !fetchedOrders.find((ord) => ord.id === storedOrder.id)) {
              fetchedOrders.unshift(storedOrder);
            }
          } catch {
            // ignore invalid stored order data
          }
        }
        setOrders(fetchedOrders);
      }
      if (w.status === 'fulfilled') {
        if (w.value.length > 0) {
          setWishlist(w.value);
        } else if (wishlistCtx.length > 0) {
          setWishlist(wishlistCtx.map(item => ({
            id: item.id,
            name: item.name,
            image: item.image,
            price: item.price,
            oldPrice: item.originalPrice,
            stock: item.inStock !== false ? 'in' : 'out',
            badge: item.originalPrice && item.price < item.originalPrice ? 'price-drop' : undefined,
            rating: 5,
            ratingCount: 1,
          })));
        }
      }
      if (a.status === 'fulfilled') setAddresses(a.value);
      if (p.status === 'fulfilled') setPayments(p.value);
      setLoading(false);
    });
  }, [isLoggedIn, navigate, wishlistCtx]);

  const toggleSetting = useCallback((key: string) => {
    setSettings(prev => {
      const next = { ...prev, [key]: !prev[key] };
      localStorage.setItem('shopprime_settings', JSON.stringify(next));
      return next;
    });
  }, []);

  const switchTab = useCallback((tab: string) => setActiveTab(tab), []);

  const handleLogout = useCallback(() => {
    logout();
    navigate('/');
  }, [logout, navigate]);

  const handleDeactivate = useCallback(() => {
    if (window.confirm('Are you sure you want to deactivate your account? This action cannot be undone.')) {
      api.getUser().then(() => {
        logout();
        navigate('/');
      }).catch(() => {
        logout();
        navigate('/');
      });
    }
  }, [logout, navigate]);

  const closeAddressModal = useCallback(() => {
    setShowAddressModal(false);
    setAddressForm({
      name: '',
      phone: '',
      pincode: '',
      locality: '',
      street: '',
      city: '',
      state: '',
      type: 'HOME',
      isDefault: false,
    });
  }, []);

  const openAddressModal = useCallback(() => {
    setShowAddressModal(true);
  }, []);

  const handleAddressInputChange = useCallback((field: keyof AddressForm, value: string | boolean) => {
    setAddressForm(prev => ({ ...prev, [field]: value }));
  }, []);

  const resolveCountry = useCallback((state: string) => {
    const usStates = ['California', 'New York', 'Texas'];
    return usStates.includes(state) ? 'United States' : 'India';
  }, []);

  const handleSaveAddress = useCallback(() => {
    if (!addressForm.name.trim() || !addressForm.phone.trim() || !addressForm.street.trim() || !addressForm.city.trim() || !addressForm.state.trim()) {
      window.alert('Please complete all required address fields.');
      return;
    }

    setAddresses(prev => {
      const next = prev.map(addr => {
        if (addressForm.isDefault) {
          return { ...addr, tags: addr.tags.filter(tag => tag.toLowerCase() !== 'default') };
        }
        return addr;
      });

      const typeTag = addressForm.type === 'HOME' ? 'Home' : 'Office';
      const tags = addressForm.isDefault ? ['Default', typeTag] : [typeTag];
      const newAddress: Address = {
        id: Date.now(),
        name: addressForm.name,
        tags,
        line1: addressForm.street,
        line2: `${addressForm.locality}${addressForm.locality && addressForm.city ? ', ' : ''}${addressForm.city}`,
        country: resolveCountry(addressForm.state),
        phone: addressForm.phone,
      };

      return [...next, newAddress];
    });

    closeAddressModal();
  }, [addressForm, closeAddressModal, resolveCountry]);

  const handleRemoveAddress = useCallback((id: number) => {
    setAddresses(prev => prev.filter(addr => addr.id !== id));
  }, []);

  const startEdit = useCallback((field: string, currentValue: string) => {
    setEditing(field);
    setEditValue(currentValue);
    setEditStatus('');
  }, []);

  const saveEdit = useCallback(() => {
    if (!editValue.trim()) return;
    setEditStatus('Saved!');
    setEditing(null);
    if (user) {
      setUser({ ...user, name: editValue });
    }
    setTimeout(() => setEditStatus(''), 2000);
  }, [editValue, user]);

  const cancelEdit = useCallback(() => {
    setEditing(null);
    setEditStatus('');
  }, []);

  const handleWishlistAddToCart = useCallback((item: WishlistItem) => {
    addToCart({ id: item.id, name: item.name, price: item.price, image: item.image } as any, 1);
  }, [addToCart]);

  const handleWishlistAddAll = useCallback(() => {
    wishlist.forEach(item => addToCart({ id: item.id, name: item.name, price: item.price, image: item.image } as any, 1));
  }, [wishlist, addToCart]);

  const handleWishlistRemove = useCallback((itemId: number) => {
    removeFromWishlist(itemId);
    setWishlist(prev => prev.filter(item => item.id !== itemId));
  }, [removeFromWishlist]);

  const memberSince = authUser?.id ? `2024` : '2024';

  if (loading || !user) {
    return (
      <div className="container page-message">
        <p>Loading account data...</p>
      </div>
    );
  }

  return (
    <>
      <div className="db-section">
        <div className="container">
          <div className="db-layout">
          <aside className="db-sidebar">
            <div className="db-user-block">
              <div className="db-avatar"><img src={user.avatar} alt={user.name} /></div>
              <div className="db-user-info">
                <div className="db-hello">Hello,</div>
                <div className="db-name">{user.name}</div>
              </div>
            </div>
            <div className="db-nav-card">
              <nav className="db-nav">
                {['profile','orders','wishlist','addresses','payments','settings'].map(tab => (
                  <button
                    key={tab}
                    className={`db-nav-item ${activeTab===tab?'active':''}`}
                    data-tab={tab}
                    onClick={() => switchTab(tab)}
                  >
                    <i className={`bi bi-${tab === 'profile' ? 'person' : tab === 'orders' ? 'box-seam' : tab === 'wishlist' ? 'heart' : tab === 'addresses' ? 'geo-alt' : tab === 'payments' ? 'credit-card-2-front' : 'gear'}`} />
                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                  </button>
                ))}
              </nav>
            </div>
            <div className="db-premium-sidebar">
              <div className="db-premium-sidebar-title">Account</div>
              <div className="db-premium-sidebar-text">{user.email}</div>
              <button className="db-premium-sidebar-btn" onClick={handleLogout}>
                <i className="bi bi-box-arrow-right"></i> Logout
              </button>
            </div>
          </aside>

          <main className="db-main">
            {/* Profile Tab */}
            <section className={`db-tab ${activeTab==='profile'?'active':''}`} id="tab-profile">
              <div className="db-greeting-row">
                <div className="db-greeting">
                  <h1>Hello, {user.name.split(' ')[0]}!</h1>
                  <p>Manage your profile and account settings here.</p>
                </div>
                <span className="db-premium-badge"><i className="bi bi-gear-fill"></i> PREMIUM MEMBER</span>
              </div>
              <div className="db-stats-row">
                <StatCard icon="bi-truck" iconColor="blue" label="Total Orders" value={orders.length} />
                <StatCard icon="bi-heart-fill" iconColor="yellow" label="Wishlist Items" value={wishlist.length} />
                <StatCard icon="bi-calendar3" iconColor="orange" label="Member Since" value={memberSince} />
              </div>
              <div className="db-content-grid">
                <div>
                  <div className="db-card">
                    <div className="db-card-header">
                      <div className="db-card-title">Personal Information</div>
                      {editStatus && <span style={{ color: '#4dff4d', fontSize: '1.2rem' }}>{editStatus}</span>}
                    </div>
                    <div className="db-fields-grid">
                      <div className="db-field">
                        <label>Full Name</label>
                        {editing === 'name' ? (
                          <div className="db-field-edit">
                            <input type="text" className="form-control" value={editValue} onChange={e => setEditValue(e.target.value)} autoFocus onKeyDown={e => { if (e.key === 'Enter') saveEdit(); if (e.key === 'Escape') cancelEdit(); }} />
                            <button className="db-save-btn" onClick={saveEdit}><i className="bi bi-check-lg"></i></button>
                            <button className="db-cancel-btn" onClick={cancelEdit}><i className="bi bi-x-lg"></i></button>
                          </div>
                        ) : (
                          <div className="db-field-input">
                            <span>{user.name}</span>
                            <i className="bi bi-pencil db-pencil" onClick={() => startEdit('name', user.name)} style={{ cursor: 'pointer' }} />
                          </div>
                        )}
                      </div>
                      <div className="db-field">
                        <label>Email Address</label>
                        <div className="db-field-input"><span>{user.email}</span></div>
                      </div>
                    </div>
                  </div>

                  <div className="db-card">
                    <div className="db-card-header"><div className="db-card-title">Recent Orders ({orders.length})</div>{orders.length > 0 && <button className="db-edit-all" onClick={() => switchTab('orders')}>View All</button>}</div>
                    {orders.length > 0 ? (
                      <table className="db-orders-table">
                        <thead><tr><th>Order ID</th><th>Date</th><th>Status</th><th>Total</th><th></th></tr></thead>
                        <tbody>
                          {orders.slice(0, 5).map(o => (
                            <tr key={o.id}>
                              <td>{o.id}</td>
                              <td>{o.date}</td>
                              <td><span className={`db-status-badge ${('' + o.status).toLowerCase().replace(/\s+/g,'-')}`}>{o.status.toLowerCase()}</span></td>
                              <td>${typeof o.total === 'number' ? o.total.toFixed(2) : o.total}</td>
                              <td><button className="db-btn-track" onClick={() => navigate(`/track-order?order=${o.id}`)}>Track</button></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    ) : (
                      <p style={{ color: '#9aa8b8', padding: '1rem' }}>No orders yet.</p>
                    )}
                  </div>
                </div>

                <div>
                  <div className="db-card">
                    <div className="db-card-title" style={{ marginBottom: '1.4rem' }}>Security</div>
                    <div className="db-security-item">
                      <div className="db-security-left"><i className="bi bi-lock"></i> Change Password</div>
                      <i className="bi bi-chevron-right db-chevron"></i>
                    </div>
                    <div className="db-security-item">
                      <div className="db-security-left"><i className="bi bi-shield-check"></i> Enable 2FA</div>
                      <label className="db-toggle">
                        <input type="checkbox" checked={!!settings.twoFa} onChange={() => toggleSetting('twoFa')} />
                        <span className="db-toggle-slider" />
                      </label>
                    </div>
                  </div>

                  <div className="db-upgrade-card">
                    <div className="db-upgrade-title">Upgrade Plan</div>
                    <div className="db-upgrade-text">Get unlimited free shipping on all orders and extra discounts across premium collections.</div>
                    <button className="db-upgrade-btn">Learn More</button>
                  </div>
                </div>
              </div>
            </section>

            {/* Orders Tab */}
            <section className={`db-tab ${activeTab==='orders'?'active':''}`} id="tab-orders">
              <h2 className="db-tab-heading"><span>All Orders ({orders.length})</span></h2>
              {orders.length > 0 ? (
                <>
                  <div className="db-orders-list">
                    {orders.slice((orderPage - 1) * ORDERS_PER_PAGE, orderPage * ORDERS_PER_PAGE).map(order => {
                      const normalizedStatus = order.status.toLowerCase();
                      const statusIcon = normalizedStatus === 'delivered'
                        ? 'bi-check-circle-fill'
                        : normalizedStatus === 'shipped'
                          ? 'bi-truck'
                          : normalizedStatus === 'ordered'
                            ? 'bi-hourglass-split'
                            : normalizedStatus === 'in transit'
                              ? 'bi-truck'
                              : 'bi-arrow-repeat';
                      const statusLabel = order.status.toLowerCase();

                      return (
                        <article key={order.id} className="db-order-card">
                          <div className="db-order-card-header">
                            <div className="db-order-meta-group">
                              <span className="db-order-meta-label">Order ID</span>
                              <span className="db-order-meta-value">{order.id}</span>
                            </div>
                            <div className="db-order-meta-group">
                              <span className="db-order-meta-label">Placed On</span>
                              <span className="db-order-meta-value">{order.date}</span>
                            </div>
                            <div className="db-order-meta-group">
                              <span className="db-order-meta-label">Total Amount</span>
                              <span className="db-order-meta-value amount">${typeof order.total === 'number' ? order.total.toFixed(2) : order.total}</span>
                            </div>
                            <div className={`db-order-card-status ${order.status.toLowerCase().replace(/\s+/g, '-')}`}>
                              <i className={`bi ${statusIcon}`}></i> {statusLabel}
                            </div>
                          </div>

                          <div className="db-order-card-body">
                            <div className="db-order-thumb-wrap">
                              {order.items.slice(0, 2).map(item => (
                                <div key={item.id} className="db-order-thumb">
                                  <img src={item.image} alt={item.name} />
                                </div>
                              ))}
                              {order.items.length > 2 && (
                                <div className="db-order-thumb db-order-thumb-more">
                                  +{order.items.length - 2}
                                </div>
                              )}
                            </div>
                            <div className="db-order-product-info">
                              <div className="db-order-product-name">
                                {order.items.length > 1 ? `Multiple Items (${order.items.length})` : order.items[0]?.name}
                              </div>
                              <div className="db-order-product-sub">
                                {order.items.length > 1
                                  ? order.items.slice(0, 3).map(item => item.name).join(' • ')
                                  : order.items[0]?.variant || 'Single item order'}
                              </div>
                            </div>
                            <div className="db-order-actions">
                              <button className="db-btn-ghost" onClick={() => { setSelectedOrder(order); setShowOrderDetail(true); }}>
                                View Order Details
                              </button>
                              {normalizedStatus === 'cancelled' ? (
                                <button className="db-btn-ghost" onClick={() => order.items.forEach(i => addToCart({ id: i.id, name: i.name, price: i.price, image: i.image } as any, i.qty))}>
                                  Reorder
                                </button>
                              ) : normalizedStatus === 'shipped' || normalizedStatus === 'in transit' || normalizedStatus === 'ordered' ? (
                                <button className="db-btn-track" onClick={() => navigate(`/track-order?order=${order.id}`)}>
                                  Track Package
                                </button>
                              ) : (
                                <button className="db-btn-primary" onClick={() => order.items.forEach(i => addToCart({ id: i.id, name: i.name, price: i.price, image: i.image } as any, i.qty))}>
                                  Buy it again
                                </button>
                              )}
                            </div>
                          </div>
                        </article>
                      );
                    })}
                  </div>

                  {Math.ceil(orders.length / ORDERS_PER_PAGE) > 1 && (
                    <div className="db-pagination">
                      <button className="db-page-btn" onClick={() => setOrderPage(prev => Math.max(1, prev - 1))}>
                        <i className="bi bi-chevron-left"></i>
                      </button>
                      {Array.from({ length: Math.ceil(orders.length / ORDERS_PER_PAGE) }, (_, index) => (
                        <button
                          key={index + 1}
                          className={`db-page-btn${orderPage === index + 1 ? ' active' : ''}`}
                          onClick={() => setOrderPage(index + 1)}
                        >
                          {index + 1}
                        </button>
                      ))}
                      <button className="db-page-btn" onClick={() => setOrderPage(prev => Math.min(Math.ceil(orders.length / ORDERS_PER_PAGE), prev + 1))}>
                        <i className="bi bi-chevron-right"></i>
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <p style={{ color: '#9aa8b8', padding: '1rem' }}>No orders found.</p>
              )}
            </section>

            {/* Wishlist Tab */}
            <section className={`db-tab ${activeTab==='wishlist'?'active':''}`} id="tab-wishlist">
              <div className="db-wishlist-header">
                <div><h2>My Wishlist ({wishlist.length})</h2><p>Keep track of products you love.</p></div>
                {wishlist.length > 0 && (
                  <div className="db-wishlist-header-actions">
                    <button className="db-wishlist-share-btn" onClick={() => navigator.clipboard?.writeText(window.location.origin + '/wishlist')}><i className="bi bi-share"></i> Share Wishlist</button>
                    <button className="db-wishlist-add-all-btn" onClick={handleWishlistAddAll}><i className="bi bi-cart-plus"></i> Add All to Cart</button>
                  </div>
                )}
              </div>
              {wishlist.length > 0 ? (
                <div className="db-wishlist-grid">
                  {wishlist.map(item => (
                    <div key={item.id} className="db-wishlist-card">
                      <button className="db-wishlist-remove" aria-label="Remove from wishlist" title="Remove from wishlist" onClick={() => handleWishlistRemove(item.id)}><i className="bi bi-x-lg"></i></button>
                      <div className="db-wishlist-img" onClick={() => navigate(`/product/${item.id}`)} style={{ cursor: 'pointer' }}>
                        <img src={item.image} alt={item.name} />
                        {item.badge && (
                          <span className={`db-wishlist-badge ${item.badge}`}>
                            <i className={`bi ${item.badge === 'price-drop' ? 'bi-arrow-down-short' : item.badge === 'best-seller' ? 'bi-award' : 'bi-lightning-charge'}`} />
                            {item.badge === 'price-drop' ? 'Price Drop' : item.badge === 'best-seller' ? 'Best Seller' : 'Trending'}
                          </span>
                        )}
                      </div>
                      <div className="db-wishlist-body">
                        <div className="db-wishlist-rating">
                          <span className="stars">{Array.from({ length: 5 }, (_, index) => index < item.rating ? '★' : '☆').join(' ')}</span>
                          <span className="rating-count">({item.ratingCount})</span>
                        </div>
                        <div className="db-wishlist-name">{item.name}</div>
                        <div className="db-wishlist-price-row">
                          <span className="db-wishlist-price">${item.price.toFixed(2)}</span>
                          {item.oldPrice && <span className="db-wishlist-price-old">${item.oldPrice.toFixed(2)}</span>}
                        </div>
                        <div className={`db-wishlist-stock ${item.stock==='in'?'in-stock':item.stock==='low'?'low-stock':'out-of-stock'}`}>
                          {item.stock==='in' && <><i className="bi bi-check-circle-fill" /> In Stock</>}
                          {item.stock==='low' && <><i className="bi bi-exclamation-triangle-fill" /> Only 2 Left</>}
                          {item.stock==='out' && <><i className="bi bi-x-circle-fill" /> Out of Stock</>}
                        </div>
                        <button className={`db-wishlist-add-btn${item.stock==='out'?' disabled':''}`} disabled={item.stock==='out'} onClick={() => handleWishlistAddToCart(item)}>
                          <i className={`bi ${item.stock==='out' ? 'bi-bell' : 'bi-cart3'}`}></i> {item.stock==='out' ? 'Notify Me' : 'Add to Cart'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ color: '#9aa8b8', padding: '1rem' }}>Your wishlist is empty.</p>
              )}
            </section>

            {/* Addresses Tab */}
            <section className={`db-tab ${activeTab==='addresses'?'active':''}`} id="tab-addresses">
              <div className="db-addr-header">
                <div><h2>Manage Addresses ({addresses.length})</h2><p>Add, edit, or remove your shipping destinations.</p></div>
                <button className="db-addr-add-btn" onClick={openAddressModal}><i className="bi bi-plus-lg"></i> Add New Address</button>
              </div>
              {addresses.length > 0 ? (
                <div className="db-address-grid">
                  {addresses.map(addr => (
                    <div key={addr.id} className="db-address-card">
                      <div className="db-addr-tags">
                        {addr.tags.map(tag => (<span key={tag} className={`db-addr-tag tag-${tag.toLowerCase()}`}>{tag}</span>))}
                      </div>
                      <button className="remove-btn db-address-remove" onClick={() => handleRemoveAddress(addr.id)} aria-label="Remove address"><i className="bi bi-trash3"></i></button>
                      <div className="db-addr-name">{addr.name}</div>
                      <div className="db-addr-text">{addr.line1}<br />{addr.line2}<br />{addr.country}</div>
                      <div className="db-addr-phone"><i className="bi bi-telephone" /> {addr.phone}</div>
                    </div>
                  ))}
                  <div className="db-add-addr-card" onClick={openAddressModal}><i className="bi bi-geo-alt" /><span>Add another address</span></div>
                </div>
              ) : (
                <p style={{ color: '#9aa8b8', padding: '1rem' }}>No saved addresses. <button className="db-addr-add-btn" style={{ display: 'inline', marginLeft: '0.5rem' }} onClick={openAddressModal}>Add one</button></p>
              )}
            </section>

            {/* Payments Tab */}
            <section className={`db-tab ${activeTab==='payments'?'active':''}`} id="tab-payments">
              <div className="db-tab-heading"><h2>Payment Methods ({payments.length})</h2><p>Manage your saved cards</p></div>
              {payments.length > 0 ? (
                <>
                  {payments.map(p => (
                    <div key={p.id} className="db-payment-card">
                      <div className="db-card-icon">{p.type === 'Visa' ? '💳' : '🏦'}</div>
                      <div>
                        <div className="db-card-num">{p.type} •••• {p.last4}</div>
                        <div className="db-card-exp">Expires {p.expires}</div>
                      </div>
                      {p.default && <span className="db-default-tag">Default</span>}
                    </div>
                  ))}
                  <button className="db-add-card-btn" onClick={() => navigate('/checkout')}><i className="bi bi-plus-circle"></i> Add New Card</button>
                </>
              ) : (
                <p style={{ color: '#9aa8b8', padding: '1rem' }}>No payment methods saved. <button className="db-add-card-btn" style={{ display: 'inline', marginLeft: '0.5rem' }} onClick={() => navigate('/checkout')}>Add one</button></p>
              )}
            </section>

            {/* Settings Tab */}
            <section className={`db-tab ${activeTab==='settings'?'active':''}`} id="tab-settings">
              <div className="db-tab-heading"><h2>Settings</h2><p>Manage your account preferences</p></div>
              <div className="db-card">
                <div className="db-card-heading db-card-heading-spaced">
                  <div className="db-settings-group-title">Notifications</div>
                </div>
                {[
                  { key: 'email', label: 'Email Notifications', sub: 'Receive order updates and offers via email' },
                  { key: 'push', label: 'Push Notifications', sub: 'Browser push alerts for your orders' },
                  { key: 'sms', label: 'SMS Notifications', sub: 'Get text updates for shipping status' },
                ].map(item => (
                  <div className="db-settings-row" key={item.key}>
                    <div>
                      <div className="db-settings-row-label">{item.label}</div>
                      <div className="db-settings-row-sub">{item.sub}</div>
                    </div>
                    <label className="db-toggle"><input type="checkbox" checked={!!settings[item.key]} onChange={() => toggleSetting(item.key)} /><span className="db-toggle-slider" /></label>
                  </div>
                ))}
                <div className="db-card-heading db-card-heading-offset">
                  <div className="db-settings-group-title">Privacy</div>
                </div>
                {[
                  { key: 'profile_visible', label: 'Profile Visibility', sub: 'Make your profile visible to other users' },
                  { key: 'activity_status', label: 'Activity Status', sub: 'Show when you\'re active on the platform' },
                ].map(item => (
                  <div className="db-settings-row" key={item.key}>
                    <div>
                      <div className="db-settings-row-label">{item.label}</div>
                      <div className="db-settings-row-sub">{item.sub}</div>
                    </div>
                    <label className="db-toggle"><input type="checkbox" checked={!!settings[item.key]} onChange={() => toggleSetting(item.key)} /><span className="db-toggle-slider" /></label>
                  </div>
                ))}
                <button className="db-danger-btn" onClick={handleDeactivate}><i className="bi bi-exclamation-triangle"></i> Deactivate Account</button>
              </div>
            </section>
          </main>
        </div>
      </div>
    </div>

      {/* Order Detail Modal */}
      {showOrderDetail && selectedOrder && (
      <div className="modal-overlay" onClick={() => setShowOrderDetail(false)}>
        <div className="modal-container" onClick={e => e.stopPropagation()}>
          <div className="modal-header">
            <h3>Order Details</h3>
            <button className="modal-close" onClick={() => setShowOrderDetail(false)}>
              <i className="bi bi-x-lg" />
            </button>
          </div>
          <div className="modal-body">
            <div className="order-detail-section">
              <h4>Order Summary</h4>
              <div className="order-summary-grid">
                <div className="order-summary-item">
                  <span className="order-summary-label">Order ID</span>
                  <span className="order-summary-value">{selectedOrder.id}</span>
                </div>
                <div className="order-summary-item">
                  <span className="order-summary-label">Date</span>
                  <span className="order-summary-value">{selectedOrder.date}</span>
                </div>
                <div className="order-summary-item">
                  <span className="order-summary-label">Status</span>
                  <span className={`order-summary-value db-status-badge ${('' + selectedOrder.status).toLowerCase().replace(/\s+/g,'-')}`}>{selectedOrder.status.toLowerCase()}</span>
                </div>
                <div className="order-summary-item">
                  <span className="order-summary-label">Estimated Delivery</span>
                  <span className="order-summary-value">{selectedOrder.estimatedDelivery}</span>
                </div>
              </div>
            </div>

            <div className="order-detail-section">
              <h4>Shipping Address</h4>
              <div className="order-address">
                {selectedOrder.shippingAddress ? (
                  <>
                    <div className="order-address-line order-address-name">{selectedOrder.shippingAddress.name}</div>
                    <div className="order-address-line">{selectedOrder.shippingAddress.address}</div>
                    <div className="order-address-line">{selectedOrder.shippingAddress.city}</div>
                    <div className="order-address-line">{selectedOrder.shippingAddress.country}</div>
                  </>
                ) : null}
              </div>
            </div>

            <div className="order-detail-section">
              <h4>Payment Details</h4>
              <div className="order-payment">
                <div className="order-payment-row">
                  <span>Method</span>
                  <span>{selectedOrder.paymentMethod}</span>
                </div>
                <div className="order-payment-row">
                  <span>Brand</span>
                  <span>{selectedOrder.paymentBrand}</span>
                </div>
                <div className="order-payment-row">
                  <span>Billing</span>
                  <span>{selectedOrder.billingNote}</span>
                </div>
              </div>
            </div>

            <div className="order-detail-section">
              <h4>Items ({selectedOrder.items.length})</h4>
              <div className="order-items-list">
                {selectedOrder.items.map(item => (
                  <div key={item.id} className="order-item-row">
                    <img src={item.image} alt={item.name} className="order-item-img" />
                    <div className="order-item-info">
                      <div className="order-item-name">{item.name}</div>
                      <div className="order-item-meta">{item.variant} • Qty: {item.qty}</div>
                    </div>
                    <div className="order-item-price">${(item.price * item.qty).toFixed(2)}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="order-detail-section order-totals">
              <div className="order-total-row">
                <span>Subtotal</span>
                <span>${typeof selectedOrder.subtotal === 'number' ? selectedOrder.subtotal.toFixed(2) : selectedOrder.subtotal}</span>
              </div>
              <div className="order-total-row">
                <span>Shipping</span>
                <span>{selectedOrder.shipping === 'FREE' ? 'FREE' : `$${(selectedOrder.shipping as number).toFixed(2)}`}</span>
              </div>
              <div className="order-total-row">
                <span>Tax</span>
                <span>${typeof selectedOrder.tax === 'number' ? selectedOrder.tax.toFixed(2) : selectedOrder.tax}</span>
              </div>
              <div className="order-total-row order-total-final">
                <span>Total</span>
                <span>${typeof selectedOrder.total === 'number' ? selectedOrder.total.toFixed(2) : selectedOrder.total}</span>
              </div>
            </div>

            <div className="order-detail-section">
              <h4>Tracking Activity</h4>
              <div className="order-activity">
                {selectedOrder.activity.map((activity, idx) => (
                  <div key={idx} className="order-activity-item">
                    <div className="order-activity-icon">
                      <i className={`bi ${activity.icon}`} />
                    </div>
                    <div className="order-activity-content">
                      <div className="order-activity-time">{activity.time}</div>
                      <div className="order-activity-desc">{activity.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="modal-footer">
            <button className="modal-btn-secondary" onClick={() => setShowOrderDetail(false)}>Close</button>
            <button className="modal-btn-primary" onClick={() => { setShowOrderDetail(false); navigate(`/track-order?order=${selectedOrder.id}`); }}>
              <i className="bi bi-truck me-1" />Track Package
            </button>
          </div>
        </div>
      </div>
    )}

      {showAddressModal && (
        <div className="modal fade show modal-overlay" id="addAddressModal" tabIndex={-1} aria-labelledby="addAddressModalLabel" aria-modal="true" role="dialog" style={{ display: 'block', paddingLeft: 0 }} onClick={closeAddressModal}>
          <div className="modal-dialog modal-dialog-centered modal-lg" onClick={e => e.stopPropagation()}>
            <div className="modal-content address-modal-content">
              <div className="modal-header address-modal-header">
                <h5 className="modal-title address-modal-title" id="addAddressModalLabel">Add New Address</h5>
                <button type="button" className="btn-close btn-close-white" aria-label="Close" onClick={closeAddressModal}></button>
              </div>
              <div className="modal-body address-modal-body">
                <form id="addAddressForm" noValidate onSubmit={e => { e.preventDefault(); handleSaveAddress(); }}>
                  <div className="row g-3 mb-3">
                    <div className="col-md-6">
                      <label className="addr-label">FULL NAME</label>
                      <input type="text" className="form-control addr-input" placeholder="e.g. Alex Rivers" value={addressForm.name} onChange={e => handleAddressInputChange('name', e.target.value)} />
                    </div>
                    <div className="col-md-6">
                      <label className="addr-label">PHONE NUMBER</label>
                      <input type="tel" className="form-control addr-input" placeholder="10-digit mobile number" value={addressForm.phone} onChange={e => handleAddressInputChange('phone', e.target.value)} />
                    </div>
                  </div>
                  <div className="row g-3 mb-3">
                    <div className="col-md-6">
                      <label className="addr-label">PIN CODE (ZIP CODE)</label>
                      <input type="text" className="form-control addr-input" placeholder="6-digit code" value={addressForm.pincode} onChange={e => handleAddressInputChange('pincode', e.target.value)} />
                    </div>
                    <div className="col-md-6">
                      <label className="addr-label">LOCALITY</label>
                      <input type="text" className="form-control addr-input" placeholder="e.g. Sector 12, Area" value={addressForm.locality} onChange={e => handleAddressInputChange('locality', e.target.value)} />
                    </div>
                  </div>
                  <div className="mb-3">
                    <label className="addr-label">ADDRESS (AREA AND STREET)</label>
                    <textarea className="form-control addr-input addr-textarea" rows={3} placeholder="Flat, House no., Building, Company, Apartment" value={addressForm.street} onChange={e => handleAddressInputChange('street', e.target.value)} />
                  </div>
                  <div className="row g-3 mb-3">
                    <div className="col-md-6">
                      <label className="addr-label">CITY / DISTRICT / TOWN</label>
                      <input type="text" className="form-control addr-input" placeholder="Enter City" value={addressForm.city} onChange={e => handleAddressInputChange('city', e.target.value)} />
                    </div>
                    <div className="col-md-6">
                      <label className="addr-label">STATE</label>
                      <select className="form-select addr-input" value={addressForm.state} onChange={e => handleAddressInputChange('state', e.target.value)}>
                        <option value="">Select State</option>
                        <option>Andhra Pradesh</option>
                        <option>California</option>
                        <option>Delhi</option>
                        <option>Gujarat</option>
                        <option>Karnataka</option>
                        <option>Maharashtra</option>
                        <option>New York</option>
                        <option>Rajasthan</option>
                        <option>Tamil Nadu</option>
                        <option>Texas</option>
                        <option>Uttar Pradesh</option>
                        <option>West Bengal</option>
                      </select>
                    </div>
                  </div>
                  <div className="mb-3">
                    <label className="addr-label">ADDRESS TYPE</label>
                    <div className="d-flex gap-3 mt-2">
                      <button type="button" className={`addr-type-btn ${addressForm.type === 'HOME' ? 'active' : ''}`} onClick={() => handleAddressInputChange('type', 'HOME')}>
                        <i className="bi bi-house-door" /> Home
                      </button>
                      <button type="button" className={`addr-type-btn ${addressForm.type === 'WORK/OFFICE' ? 'active' : ''}`} onClick={() => handleAddressInputChange('type', 'WORK/OFFICE')}>
                        <i className="bi bi-briefcase" /> Work/Office
                      </button>
                    </div>
                  </div>
                  <div className="form-check">
                    <input className="form-check-input" type="checkbox" id="addr-default" checked={addressForm.isDefault} onChange={e => handleAddressInputChange('isDefault', e.target.checked)} />
                    <label className="form-check-label" htmlFor="addr-default" style={{ color: '#aaa', fontSize: '1.3rem' }}>
                      Set as Default Address
                    </label>
                  </div>
                </form>
              </div>
              <div className="modal-footer address-modal-footer">
                <button type="button" className="btn addr-cancel-btn" onClick={closeAddressModal}>Cancel</button>
                <button type="button" className="btn addr-save-btn" onClick={handleSaveAddress}>Save Address</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
