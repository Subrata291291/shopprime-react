import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import OrderItemCard from '../../components/ui/OrderItemCard';
import type { Address } from '../../services/api';

type CheckoutMode = 'guest' | 'logged-in';
type ShippingMethod = 'xpressbees_surface' | 'xpressbees_air' | 'delhivery_surface' | 'delhivery_air' | 'blue_dart_air';

const shippingOptions: { id: ShippingMethod; name: string; delivery: string; price: number }[] = [
  { id: 'xpressbees_surface', name: 'Xpressbees Surface', delivery: 'Delivery by Sep 15, 2026', price: 118.36 },
  { id: 'xpressbees_air', name: 'Xpressbees Air', delivery: 'Delivery by Sep 13, 2026', price: 147.36 },
  { id: 'delhivery_surface', name: 'Delhivery Surface', delivery: 'Delivery by Sep 15, 2026', price: 131.36 },
  { id: 'delhivery_air', name: 'Delhivery Air', delivery: 'Delivery by Sep 13, 2026', price: 164.36 },
  { id: 'blue_dart_air', name: 'Blue Dart Air', delivery: 'Delivery by Sep 12, 2026', price: 215.25 },
];

const defaultShipping = shippingOptions[0];

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

const GuestCheckout = ({ items, subtotal, onComplete, onLogin, submitting }: {
  items: any[];
  subtotal: number;
  onComplete: (data: any) => void;
  onLogin: () => void;
  submitting: boolean;
}) => {
  const [deliveryMethod, setDeliveryMethod] = useState<ShippingMethod>(defaultShipping.id);
  const [promoCode, setPromoCode] = useState('');
  const [promoApplied, setPromoApplied] = useState(false);
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [phone, setPhone] = useState('');

  const shipping = shippingOptions.find((option) => option.id === deliveryMethod) || defaultShipping;
  const discount = promoApplied ? subtotal * 0.1 : 0;
  const finalSubtotal = subtotal - discount;
  const total = finalSubtotal + shipping.price;

  const applyPromo = () => {
    const code = promoCode.trim().toUpperCase();
    if (code === 'PRIME10' || code === 'WELCOME10') {
      setPromoApplied(true);
    }
  };

  const handleGuestSubmit = () => {
    // Basic validation
    if (!email.trim() || !firstName.trim() || !lastName.trim() || !address.trim() || !city.trim() || !postalCode.trim() || !phone.trim()) {
      window.alert('Please fill out all required fields before completing purchase.');
      return;
    }

    onComplete({
      total,
      subtotal: finalSubtotal,
      shipping: shipping.price,
      shippingMethod: shipping.name,
      tax: 0,
      email,
      firstName,
      lastName,
      address,
      city,
      postalCode,
      phone,
      deliveryMethod,
      paymentMethod: 'Razorpay',
    });
  };

  return (
    <div className="checkout-container">
      <div>
        {/* Contact Information */}
        <div className="checkout-section guest-only">
          <div className="section-header">
            <h2 className="section-title"><i className="bi bi-envelope me-2"></i>Contact Information</h2>
            <a href="#" className="section-action" style={{ color: '#4d7fff' }} onClick={(e) => { e.preventDefault(); onLogin(); }}>Login for faster checkout</a>
          </div>
          <div className="form-group mb-3">
            <label>Email Address</label>
            <input type="email" className="form-control guest-input" placeholder="email@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="form-check">
            <input className="form-check-input" type="checkbox" id="guest-email-offers" />
            <label className="form-check-label" htmlFor="guest-email-offers" style={{ fontSize: '1.3rem', color: '#aaaaaa' }}>
              Email me with news and offers
            </label>
          </div>
        </div>

        {/* Shipping Address */}
        <div className="checkout-section guest-only">
          <div className="section-header">
            <h2 className="section-title"><i className="bi bi-truck me-2"></i>Shipping Address</h2>
          </div>
          <div className="form-row mb-3">
            <div className="form-group">
            <label>First Name</label>
                  <input type="text" className="form-control guest-input" placeholder="John" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
                </div>
                <div className="form-group">
                  <label>Last Name</label>
                  <input type="text" className="form-control guest-input" placeholder="Doe" value={lastName} onChange={(e) => setLastName(e.target.value)} />
            </div>
          </div>
          <div className="form-group mb-3">
            <label>Address</label>
            <input type="text" className="form-control guest-input" placeholder="Apartment, suite, etc." value={address} onChange={(e) => setAddress(e.target.value)} />
          </div>
          <div className="form-row mb-3">
            <div className="form-group">
              <label>City</label>
              <input type="text" className="form-control guest-input" placeholder="New York" value={city} onChange={(e) => setCity(e.target.value)} />
            </div>
            <div className="form-group">
              <label>Postal Code</label>
              <input type="text" className="form-control guest-input" placeholder="10001" value={postalCode} onChange={(e) => setPostalCode(e.target.value)} />
            </div>
          </div>
          <div className="form-group">
            <label>Phone Number</label>
            <input type="text" className="form-control guest-input" placeholder="+1 (555) 000-0000" value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>
        </div>

        {/* Delivery Method */}
        <div className="checkout-section guest-only">
          <div className="section-header">
            <h2 className="section-title"><i className="bi bi-box-seam me-2"></i>Delivery Method</h2>
          </div>
          <div className="delivery-options">
            {shippingOptions.map((option) => (
            <div key={option.id} className={`delivery-option${deliveryMethod === option.id ? ' active' : ''}`} onClick={() => setDeliveryMethod(option.id)}>
              <div className="d-flex align-items-center gap-3 w-100">
                <input type="radio" name="delivery-method" checked={deliveryMethod === option.id} readOnly />
                <label className="delivery-label flex-grow-1">
                  <span className="delivery-name">{option.name}</span>
                  <span className="delivery-desc">{option.delivery}</span>
                </label>
                <span className="delivery-price">₹{option.price.toFixed(2)}</span>
              </div>
            </div>
            ))}
          </div>
        </div>

        {/* Payment Details */}
        <div className="checkout-section guest-only">
          <div className="section-header">
            <h2 className="section-title"><i className="bi bi-credit-card-2-front me-2"></i>Payment Details</h2>
          </div>
          <div className="payment-option active">
            <input type="radio" name="guest-payment" checked readOnly />
            <label className="payment-label"><i className="bi bi-wallet2"></i> Pay by Razorpay</label>
          </div>
        </div>
      </div>

      {/* Sidebar */}
      <div className="checkout-sidebar">
        <div className="price-section guest-only">
          <h3 className="price-section-title" style={{ marginBottom: '2rem' }}>Order Summary</h3>
          <div className="guest-order-items mb-4" style={{ borderBottom: '1px solid #2a2a2a', paddingBottom: '1.6rem' }}>
            {items.map((item: any) => (
              <OrderItemCard
                key={`${item.product.id}-${item.selectedColor}`}
                image={item.product.image}
                name={item.product.name}
                specs={item.selectedColor || 'Standard'}
                qty={item.quantity}
                price={item.product.price * item.quantity}
              />
            ))}
          </div>
          <div className="price-line"><span className="price-label">Subtotal</span><span className="price-value" id="guest-subtotal">{promoApplied ? <><span style={{ textDecoration: 'line-through', color: '#777' }}>${subtotal.toFixed(2)}</span> <span style={{ color: '#4dff4d' }}>${finalSubtotal.toFixed(2)}</span></> : `$${subtotal.toFixed(2)}`}</span></div>
          <div className="price-line"><span className="price-label">Delivery</span><span className="price-value">₹{shipping.price.toFixed(2)}</span></div>
          <div className="price-total"><span className="price-total-label">Total</span><span className="price-total-value guest-total-amount">${total.toFixed(2)}</span></div>
          <button className="confirm-btn guest-purchase-btn" style={{ background: '#ff6b35' }} onClick={handleGuestSubmit} disabled={submitting}>
            {submitting ? 'Processing...' : 'Complete Purchase'} <i className="bi bi-lock-fill"></i>
          </button>
          <div className="security-message" style={{ textTransform: 'uppercase', fontSize: '1rem', fontWeight: 700, letterSpacing: '0.5px' }}>
            <i className="bi bi-shield-lock-fill"></i> Secure Encrypted Checkout
          </div>
        </div>
        <div className="price-section guest-only mt-3">
          <div className="promo-box d-flex gap-2">
            <input type="text" className="form-control promo-input flex-grow-1" placeholder="Promo code" value={promoCode} onChange={(e) => setPromoCode(e.target.value)} disabled={promoApplied} />
            <button className="btn btn-outline-light promo-btn" type="button" onClick={applyPromo} disabled={promoApplied}>
              {promoApplied ? 'Applied' : 'Apply'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function Checkout() {
  const { items, subtotal, clearCart, updateQuantity, removeFromCart } = useCart();
  const { user, isLoggedIn } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<CheckoutMode>(isLoggedIn ? 'logged-in' : 'guest');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [selectedShipping, setSelectedShipping] = useState<ShippingMethod>(defaultShipping.id);
  const [savedAddresses, setSavedAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(null);
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

  useEffect(() => {
    if (isLoggedIn) {
      api.getAddresses().then((addresses) => {
        setSavedAddresses(addresses);
        if (addresses.length > 0) {
          setSelectedAddressId(addresses[0].id);
        }
      }).catch(() => {});
    }
  }, [isLoggedIn]);

  const closeAddressModal = () => {
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
  };

  const openAddressModal = () => {
    setShowAddressModal(true);
  };

  const handleAddressInputChange = (key: keyof AddressForm, value: string | boolean) => {
    setAddressForm(prev => ({ ...prev, [key]: value }));
  };

  const handleSaveAddress = () => {
    if (!addressForm.name.trim() || !addressForm.phone.trim() || !addressForm.street.trim() || !addressForm.city.trim() || !addressForm.state.trim()) {
      window.alert('Please fill out all required address fields.');
      return;
    }

    const tags = [addressForm.type === 'HOME' ? 'Home' : 'Office'];
    if (addressForm.isDefault) tags.unshift('Default');

    const newAddress: Address = {
      id: Date.now(),
      name: addressForm.name,
      tags,
      line1: addressForm.street,
      line2: `${addressForm.locality}${addressForm.locality && addressForm.city ? ', ' : ''}${addressForm.city}`,
      country: addressForm.state === 'California' || addressForm.state === 'New York' || addressForm.state === 'Texas' ? 'United States' : 'India',
      phone: addressForm.phone,
    };

    setSavedAddresses(prev => {
      const next = addressForm.isDefault ? prev.map(addr => ({ ...addr, tags: addr.tags.filter(tag => tag.toLowerCase() !== 'default') })) : prev;
      return [...next, newAddress];
    });
    setSelectedAddressId(newAddress.id);
    closeAddressModal();
  };

  const handleSelectAddress = (id: number) => {
    setSelectedAddressId(id);
  };

  const handleRemoveAddress = (id: number) => {
    setSavedAddresses(prev => {
      const remaining = prev.filter(addr => addr.id !== id);
      if (selectedAddressId === id) {
        setSelectedAddressId(remaining.length ? remaining[0].id : null);
      }
      return remaining;
    });
  };

  const handleChangeQuantity = (id: number, delta: number) => {
    const item = items.find((i) => i.product.id === id);
    if (!item) return;
    const nextQty = item.quantity + delta;
    if (nextQty < 1) return;
    updateQuantity(id, nextQty);
  };

  const selectedAddress = savedAddresses.find((addr) => addr.id === selectedAddressId) || null;
  const loggedInShippingOption = shippingOptions.find((option) => option.id === selectedShipping) || defaultShipping;
  const loggedInShipping = loggedInShippingOption.price;
  const loggedInTotal = subtotal + loggedInShipping;

  const handleComplete = async (data: any) => {
    setSubmitting(true);
    setSubmitError('');
    const name = data.firstName && data.lastName ? `${data.firstName} ${data.lastName}` : user?.name || 'Guest User';
    const orderAddress = selectedAddress ? selectedAddress.line1 : data.address || 'Default Address';
    const orderCity = selectedAddress ? selectedAddress.line2 : data.city || 'City';
    const orderEmail = user?.email || data.email;
    const orderPhone = selectedAddress?.phone || data.phone || '';
    const paymentMethodLabel = data.paymentMethod || 'Razorpay';
    const paymentBrandLabel = data.paymentBrand || 'Razorpay';
    const orderPayload = {
      items: items.map((item) => ({
        product: item.product,
        quantity: item.quantity,
        selectedColor: item.selectedColor,
      })),
      shippingMethod: data.shippingMethod || loggedInShippingOption.name,
      shippingCost: data.shipping || loggedInShipping,
      shippingAddress: {
        name,
        address: orderAddress,
        city: orderCity,
        postcode: selectedAddress ? '' : data.postalCode || '',
        country: selectedAddress?.country || 'United States',
      },
      total: data.total,
      subtotal: data.subtotal,
      tax: data.tax || 0,
      email: orderEmail,
      phone: orderPhone,
      paymentMethod: paymentMethodLabel,
      paymentBrand: paymentBrandLabel,
      paymentGateway: 'razorpay',
      billingNote: `Paid via ${paymentBrandLabel}`,
    };
    try {
      const result = await api.createOrder(orderPayload);
      if (result.paymentUrl && paymentMethodLabel === 'Razorpay') {
        clearCart();
        window.location.assign(result.paymentUrl);
        return;
      }
      const orderDate = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      const estDeliveryDate = new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      const orderData = {
        id: result.id,
        date: orderDate,
        estimatedDelivery: estDeliveryDate,
        status: 'Ordered' as const,
        total: data.total,
        subtotal: data.subtotal,
        shipping: data.shipping || loggedInShipping,
        shippingMethod: data.shippingMethod || loggedInShippingOption.name,
        tax: data.tax || 0,
        paymentMethod: paymentMethodLabel,
        paymentBrand: paymentBrandLabel,
        billingNote: `Paid via ${paymentBrandLabel}`,
        shippingAddress: { name, address: orderAddress, city: orderCity, country: selectedAddress?.country || 'United States' },
        items: items.map((item) => ({
          id: `${item.product.id}-${item.selectedColor || 'standard'}`,
          name: item.product.name,
          image: item.product.image,
          variant: item.selectedColor || 'Standard',
          specs: item.selectedColor ? `Color: ${item.selectedColor}` : 'Standard',
          qty: item.quantity,
          price: item.product.price,
        })),
        lastSeenPlace: 'Order received at warehouse',
        lastSeenTime: 'Just now',
        activity: [
          { time: 'Just now', desc: 'Order confirmed and received', type: 'primary', icon: 'bi-check-lg' },
          { time: 'Packing', desc: 'Your order is being packed', type: 'secondary', icon: 'bi-box-seam' },
          { time: 'Ready for dispatch', desc: 'Shipment will leave soon', type: 'secondary', icon: 'bi-truck' },
        ],
      };
      window.sessionStorage.setItem('shopprime_last_order', JSON.stringify(orderData));
      clearCart();
      navigate('/thank-you', { state: { order: orderData } });
    } catch {
      setSubmitError('Failed to place order. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="container checkout-page">
        <div className="empty-state empty-state-checkout">
          <i className="bi bi-bag-x" />
          <h3>No items to checkout</h3>
          <p>Your cart is empty.</p>
          <Link to="/shop" className="btn add-to-cart-btn" style={{ display: 'inline-block' }}>Shop Now</Link>
        </div>
      </div>
    );
  }

  return (
    <main className="checkout-page">
      <div className="container">
        <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
          <div style={{ fontSize: '1.4rem', color: '#888' }}>
            <Link to="/cart" style={{ color: '#888', textDecoration: 'none' }}>Cart</Link> <span style={{ color: '#fff' }}>&rarr; Checkout</span>
          </div>
          <div className="checkout-toggle-container">
            <button className={`checkout-toggle-btn${mode === 'logged-in' ? ' active' : ''}`} onClick={() => setMode('logged-in')}>Logged-in User</button>
            <button className={`checkout-toggle-btn${mode === 'guest' ? ' active' : ''}`} onClick={() => setMode('guest')}>Guest User</button>
          </div>
        </div>

        <div style={{ display: mode === 'logged-in' ? 'block' : 'none' }}>
          <div className="checkout-header logged-in-only">
            <i className="bi bi-lock-fill"></i>
            <h1>Secure Checkout</h1>
          </div>
        </div>
        <div style={{ display: mode === 'guest' ? 'block' : 'none' }}>
          <div className="checkout-header guest-only">
            <div>
              <h1 className="mb-1">Guest Checkout</h1>
              <p className="mb-0" style={{ fontSize: '1.4rem', color: '#aaaaaa' }}>Review your information to complete your order.</p>
            </div>
          </div>
        </div>

        {mode === 'guest' ? (
          <>
            {submitError && <div className="alert alert-danger py-2 mb-3" style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', color: '#ef4444', borderRadius: '8px', fontSize: '1.3rem' }}>{submitError}</div>}
            <GuestCheckout items={items} subtotal={subtotal} onComplete={handleComplete} onLogin={() => setMode('logged-in')} submitting={submitting} />
          </>
        ) : (
          <div className="checkout-container">
            <div>
              <div className="checkout-section">
                <div className="section-header">
                  <div className="section-number">1</div>
                  <h2 className="section-title">LOGIN</h2>
                  <a href="#" className="section-action" onClick={(e) => { e.preventDefault(); setMode('guest'); }}>CHANGE</a>
                </div>
                <div className="login-info">
                  <div className="login-details">
                    <span className="login-label">Email</span>
                    <span className="login-value">{user?.email || 'user@example.com'}</span>
                  </div>
                  <div className="login-details">
                    <span className="login-label">Name</span>
                    <span className="login-value">{user?.name || 'User'}</span>
                  </div>
                </div>
              </div>
              <div className="checkout-section">
                <div className="section-header">
                  <div className="section-number">2</div>
                  <h2 className="section-title">DELIVERY ADDRESS</h2>
                </div>
                <div className="delivery-header">Delivery Address</div>
                <div className="delivery-content">
                  {savedAddresses.length > 0 ? savedAddresses.map((addr) => (
                    <div key={addr.id} className={`address-card${selectedAddressId === addr.id ? ' selected' : ''}`} onClick={() => handleSelectAddress(addr.id)}>
                      <div className="address-check"><i className={`bi ${selectedAddressId === addr.id ? 'bi-check-lg' : 'bi-circle'}`}></i></div>
                      <div className="address-type">{addr.tags?.find((t: string) => t !== 'Default') || 'HOME'}</div>
                      <div className="address-name">{addr.name}</div>
                      <div className="address-text">{addr.line1}<br />{addr.line2}</div>
                      {addr.phone && <div className="address-phone">{addr.phone}</div>}
                      <button className="deliver-btn" type="button" onClick={() => handleSelectAddress(addr.id)}>Deliver Here</button>
                      <button className="addr-delete-btn" title="Delete address" onClick={(e) => { e.stopPropagation(); handleRemoveAddress(addr.id); }}>
                        <i className="bi bi-trash3"></i>
                      </button>
                    </div>
                  )) : (
                    <div className="address-card no-address" style={{ borderColor: '#4d7fff' }}>
                      <div className="address-check"><i className="bi bi-circle"></i></div>
                      <div className="address-type">HOME</div>
                      <div className="address-name">{user?.name || 'User'}</div>
                      <div className="address-text">Default Address<br />Add a shipping address</div>
                    </div>
                  )}
                  <div className="add-address" onClick={openAddressModal}>
                    <i className="bi bi-plus-circle"></i>
                    <span className="add-address-text">Add New Address</span>
                  </div>
                </div>
              </div>
              <div className="checkout-section">
                <div className="section-header">
                  <div className="section-number">3</div>
                  <h2 className="section-title">SHIPPING OPTIONS</h2>
                </div>
                <div className="delivery-options">
                  {shippingOptions.map((option) => (
                    <div key={option.id} className={`delivery-option${selectedShipping === option.id ? ' active' : ''}`} onClick={() => setSelectedShipping(option.id)}>
                      <div className="d-flex align-items-center gap-3 w-100">
                        <input type="radio" name="logged-in-delivery" checked={selectedShipping === option.id} readOnly />
                        <label className="delivery-label flex-grow-1">
                          <span className="delivery-name">{option.name}</span>
                          <span className="delivery-desc">{option.delivery}</span>
                        </label>
                        <span className="delivery-price">₹{option.price.toFixed(2)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="checkout-section">
                <div className="section-header">
                  <div className="section-number">4</div>
                  <h2 className="section-title">ORDER SUMMARY</h2>
                </div>
                {items.map((item) => (
                  <div key={`${item.product.id}-${item.selectedColor}`} className="order-item">
                    <div className="item-image"><img src={item.product.image} alt={item.product.name} /></div>
                    <div className="item-details">
                      <div className="item-name">{item.product.name}</div>
                      <div className="item-specs">{item.selectedColor ? `Color: ${item.selectedColor}` : ''}</div>
                      <div className="item-controls">
                        <div className="qty-control">
                          <button className="qty-btn" type="button" onClick={() => handleChangeQuantity(item.product.id, -1)}>-</button>
                          <span className="qty-value">{item.quantity}</span>
                          <button className="qty-btn" type="button" onClick={() => handleChangeQuantity(item.product.id, 1)}>+</button>
                        </div>
                        <button className="remove-btn" type="button" onClick={() => removeFromCart(item.product.id)}>REMOVE</button>
                      </div>
                    </div>
                    <div className="item-price">${(item.product.price * item.quantity).toFixed(2)}</div>
                  </div>
                ))}
              </div>
            </div>
            <div className="checkout-sidebar">
              <div className="payment-section">
                <div className="payment-option active">
                  <input type="radio" name="payment" checked readOnly />
                  <label className="payment-label"><i className="bi bi-wallet2"></i> Pay by Razorpay</label>
                </div>
              </div>
              <div className="price-section">
                <h3 className="price-section-title">PRICE DETAILS</h3>
                <div className="price-line"><span className="price-label">Price ({items.length} {items.length === 1 ? 'item' : 'items'})</span><span className="price-value">${subtotal.toFixed(2)}</span></div>
                <div className="price-line"><span className="price-label">Discount</span><span className="price-value discount">-$0.00</span></div>
                <div className="price-line"><span className="price-label">Delivery ({loggedInShippingOption.name})</span><span className="price-value">₹{loggedInShipping.toFixed(2)}</span></div>
                <div className="price-total"><span className="price-total-label">Total Amount</span><span className="price-total-value">${loggedInTotal.toFixed(2)}</span></div>
                <button
                  className="confirm-btn"
                  onClick={() => handleComplete({
                    total: loggedInTotal,
                    subtotal,
                    shipping: loggedInShipping,
                    tax: 0,
                    paymentMethod: 'Razorpay',
                    paymentBrand: 'Razorpay',
                    shippingMethod: loggedInShippingOption.name,
                    email: user?.email,
                    phone: selectedAddress?.phone || '',
                    address: selectedAddress?.line1 || '',
                    city: selectedAddress?.line2 || '',
                  })}
                  disabled={submitting || (mode === 'logged-in' && !selectedAddress)}
                >
                  {submitting ? 'Processing...' : 'CONFIRM ORDER'} <i className="bi bi-arrow-right"></i>
                </button>
                <div className="security-message"><i className="bi bi-shield-check"></i> Safe and Secure Payments. Easy returns.</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Add Address Modal */}
      {showAddressModal && (
        <div className="modal fade show" id="addAddressModal" tabIndex={-1} aria-labelledby="addAddressModalLabel" aria-modal="true" role="dialog" style={{ display: 'block', paddingLeft: 0 }} onClick={closeAddressModal}>
          <div className="modal-dialog modal-dialog-centered modal-lg" onClick={(e) => e.stopPropagation()}>
            <div className="modal-content address-modal-content">
              <div className="modal-header address-modal-header">
                <h5 className="modal-title address-modal-title" id="addAddressModalLabel">Add New Address</h5>
                <button type="button" className="btn-close btn-close-white" aria-label="Close" onClick={closeAddressModal}></button>
              </div>
              <div className="modal-body address-modal-body">
                <form id="addAddressForm" noValidate onSubmit={(e) => { e.preventDefault(); handleSaveAddress(); }}>
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
                        <i className="bi bi-house-door"></i> Home
                      </button>
                      <button type="button" className={`addr-type-btn ${addressForm.type === 'WORK/OFFICE' ? 'active' : ''}`} onClick={() => handleAddressInputChange('type', 'WORK/OFFICE')}>
                        <i className="bi bi-briefcase"></i> Work/Office
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
    </main>
  );
}
