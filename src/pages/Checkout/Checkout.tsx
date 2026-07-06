import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import OrderItemCard from '../../components/ui/OrderItemCard';
import type { Address } from '../../services/api';

type CheckoutMode = 'guest' | 'logged-in';

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
  const [deliveryMethod, setDeliveryMethod] = useState<'standard' | 'express'>('standard');
  const [paymentTab, setPaymentTab] = useState<'card' | 'upi'>('card');
  const [promoCode, setPromoCode] = useState('');
  const [promoApplied, setPromoApplied] = useState(false);
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [phone, setPhone] = useState('');

  const shipping = deliveryMethod === 'express' ? 15 : 0;
  const discount = promoApplied ? subtotal * 0.1 : 0;
  const finalSubtotal = subtotal - discount;
  const tax = finalSubtotal * 0.08;
  const total = finalSubtotal + shipping + tax;

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

    const paymentMethodLabel = paymentTab === 'card' ? 'Credit / Debit Card' : 'UPI / Wallet';
    onComplete({
      total,
      subtotal: finalSubtotal,
      shipping,
      tax,
      email,
      firstName,
      lastName,
      address,
      city,
      postalCode,
      phone,
      deliveryMethod,
      paymentMethod: paymentMethodLabel,
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
            <div className={`delivery-option${deliveryMethod === 'standard' ? ' active' : ''}`} onClick={() => setDeliveryMethod('standard')}>
              <div className="d-flex align-items-center gap-3 w-100">
                <input type="radio" name="delivery-method" checked={deliveryMethod === 'standard'} readOnly />
                <label className="delivery-label flex-grow-1">
                  <span className="delivery-name">Standard Shipping</span>
                  <span className="delivery-desc">3-5 Business Days</span>
                </label>
                <span className="delivery-price">FREE</span>
              </div>
            </div>
            <div className={`delivery-option${deliveryMethod === 'express' ? ' active' : ''}`} onClick={() => setDeliveryMethod('express')}>
              <div className="d-flex align-items-center gap-3 w-100">
                <input type="radio" name="delivery-method" checked={deliveryMethod === 'express'} readOnly />
                <label className="delivery-label flex-grow-1">
                  <span className="delivery-name">Express Delivery</span>
                  <span className="delivery-desc">Next Day Delivery</span>
                </label>
                <span className="delivery-price">$15.00</span>
              </div>
            </div>
          </div>
        </div>

        {/* Payment Details */}
        <div className="checkout-section guest-only">
          <div className="section-header">
            <h2 className="section-title"><i className="bi bi-credit-card-2-front me-2"></i>Payment Details</h2>
          </div>
          <div className="payment-tabs mb-4">
            <button className={`payment-tab${paymentTab === 'card' ? ' active' : ''}`} onClick={() => setPaymentTab('card')}>
              <i className="bi bi-credit-card"></i> Credit Card
            </button>
            <button className={`payment-tab${paymentTab === 'upi' ? ' active' : ''}`} onClick={() => setPaymentTab('upi')}>
              <i className="bi bi-wallet2"></i> UPI / Wallet
            </button>
          </div>
          {paymentTab === 'card' ? (
            <div>
              <div className="form-group mb-3">
                <label>Card Number</label>
                <div className="input-icon-wrapper">
                  <input type="text" className="form-control guest-input" placeholder="0000 0000 0000 0000" />
                  <i className="bi bi-credit-card"></i>
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Expiry Date</label>
                  <input type="text" className="form-control guest-input" placeholder="MM/YY" />
                </div>
                <div className="form-group">
                  <label>CVV</label>
                  <input type="text" className="form-control guest-input" placeholder="123" />
                </div>
              </div>
            </div>
          ) : (
            <div className="upi-placeholder text-center p-4 border border-secondary rounded" style={{ borderStyle: 'dashed', borderColor: 'rgba(255,255,255,0.15)' }}>
              <i className="bi bi-qr-code-scan" style={{ fontSize: '3rem', color: '#4d7fff' }}></i>
              <p className="mt-2 mb-0" style={{ fontSize: '1.4rem', color: '#bbb' }}>Select your UPI app or scan QR at next step</p>
            </div>
          )}
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
          <div className="price-line"><span className="price-label">Shipping</span><span className={`price-value${shipping === 0 ? ' free' : ''}`} style={{ color: shipping === 0 ? '#4dff4d' : '#fff' }}>{shipping === 0 ? 'FREE' : `$${shipping.toFixed(2)}`}</span></div>
          <div className="price-line"><span className="price-label">Estimated Tax</span><span className="price-value">${tax.toFixed(2)}</span></div>
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
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'upi' | 'netbank'>('card');
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
  const loggedInShipping = 0;
  const loggedInTax = subtotal * 0.08;
  const loggedInTotal = subtotal + loggedInShipping + loggedInTax;

  const handleComplete = async (data: any) => {
    setSubmitting(true);
    setSubmitError('');
    const name = data.firstName && data.lastName ? `${data.firstName} ${data.lastName}` : user?.name || 'Guest User';
    const orderAddress = selectedAddress ? `${selectedAddress.line1}, ${selectedAddress.line2}` : 'Default Address';
    const orderCity = selectedAddress ? selectedAddress.line2 : 'City';
    const orderEmail = user?.email || data.email;
    const orderPhone = selectedAddress?.phone || data.phone || '';
    const paymentMethodLabel = data.paymentMethod || (paymentMethod === 'card' ? 'Credit / Debit Card' : paymentMethod === 'upi' ? 'UPI / Wallet' : 'Net Banking');
    const paymentBrandLabel = data.paymentBrand || (paymentMethod === 'card' ? 'Card' : paymentMethod === 'upi' ? 'UPI' : 'Net Banking');
    const orderPayload = {
      items: items.map((item) => ({
        product: item.product,
        quantity: item.quantity,
        selectedColor: item.selectedColor,
      })),
      shippingMethod: (data.shipping || loggedInShipping) > 0 ? 'Express Delivery' : 'Standard Shipping',
      shippingCost: data.shipping || loggedInShipping,
      shippingAddress: {
        name,
        address: orderAddress,
        city: orderCity,
        country: selectedAddress?.country || 'United States',
      },
      total: data.total,
      subtotal: data.subtotal,
      tax: data.tax || loggedInTax,
      email: orderEmail,
      phone: orderPhone,
      paymentMethod: paymentMethodLabel,
      paymentBrand: paymentBrandLabel,
      billingNote: `Paid via ${paymentBrandLabel}`,
    };
    try {
      const result = await api.createOrder(orderPayload);
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
        shippingMethod: (data.shipping || loggedInShipping) > 0 ? 'Express Delivery' : 'Standard Shipping',
        tax: data.tax || loggedInTax,
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
                <div className="payment-section-title"><i className="bi bi-credit-card"></i> PAYMENT OPTIONS</div>
                <div className={`payment-option${paymentMethod === 'card' ? ' active' : ''}`} onClick={() => setPaymentMethod('card')}>
                  <input type="radio" name="payment" checked={paymentMethod === 'card'} onChange={() => setPaymentMethod('card')} />
                  <label className="payment-label"><i className="bi bi-credit-card"></i> Credit / Debit Card</label>
                </div>
                <div className={`payment-option${paymentMethod === 'upi' ? ' active' : ''}`} onClick={() => setPaymentMethod('upi')}>
                  <input type="radio" name="payment" checked={paymentMethod === 'upi'} onChange={() => setPaymentMethod('upi')} />
                  <label className="payment-label"><i className="bi bi-wallet2"></i> UPI (iPhone / Google Pay)</label>
                </div>
                <div className={`payment-option${paymentMethod === 'netbank' ? ' active' : ''}`} onClick={() => setPaymentMethod('netbank')}>
                  <input type="radio" name="payment" checked={paymentMethod === 'netbank'} onChange={() => setPaymentMethod('netbank')} />
                  <label className="payment-label"><i className="bi bi-bank"></i> Net Banking</label>
                </div>
                {paymentMethod === 'card' ? (
                  <div className="card-form">
                    <div className="form-group" style={{ marginBottom: '12px' }}>
                      <label>Card Number</label>
                      <input type="text" placeholder="1234 5678 9012 3456" />
                    </div>
                    <div className="form-row">
                      <div className="form-group"><label>MM/YY</label><input type="text" placeholder="MM/YY" /></div>
                      <div className="form-group"><label>CVV</label><input type="text" placeholder="CVV" /></div>
                    </div>
                  </div>
                ) : paymentMethod === 'upi' ? (
                  <div className="upi-placeholder text-center p-4 border border-secondary rounded" style={{ borderStyle: 'dashed', borderColor: 'rgba(255,255,255,0.15)' }}>
                    <i className="bi bi-qr-code-scan" style={{ fontSize: '3rem', color: '#4d7fff' }}></i>
                    <p className="mt-2 mb-0" style={{ fontSize: '1.4rem', color: '#bbb' }}>Use your UPI app after clicking Confirm Order.</p>
                  </div>
                ) : (
                  <div className="upi-placeholder text-center p-4 border border-secondary rounded" style={{ borderStyle: 'dashed', borderColor: 'rgba(255,255,255,0.15)' }}>
                    <i className="bi bi-bank" style={{ fontSize: '3rem', color: '#4d7fff' }}></i>
                    <p className="mt-2 mb-0" style={{ fontSize: '1.4rem', color: '#bbb' }}>Net banking will be processed in the next step.</p>
                  </div>
                )}
              </div>
              <div className="price-section">
                <h3 className="price-section-title">PRICE DETAILS</h3>
                <div className="price-line"><span className="price-label">Price ({items.length} {items.length === 1 ? 'item' : 'items'})</span><span className="price-value">${subtotal.toFixed(2)}</span></div>
                <div className="price-line"><span className="price-label">Discount</span><span className="price-value discount">-$0.00</span></div>
                <div className="price-line"><span className="price-label">Delivery Charges</span><span className="price-value free">FREE</span></div>
                <div className="price-line"><span className="price-label">Estimated Tax</span><span className="price-value">${loggedInTax.toFixed(2)}</span></div>
                <div className="price-total"><span className="price-total-label">Total Amount</span><span className="price-total-value">${loggedInTotal.toFixed(2)}</span></div>
                <button
                  className="confirm-btn"
                  onClick={() => handleComplete({
                    total: loggedInTotal,
                    subtotal,
                    shipping: loggedInShipping,
                    tax: loggedInTax,
                    paymentMethod,
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
