import { memo, useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';

const navLinks = [
  { label: 'Home', to: '/' },
  { label: 'Shop', to: '/shop' },
];

const Header = memo(function Header() {
  const { itemCount } = useCart();
  const { isLoggedIn } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [searchValue, setSearchValue] = useState('');

  useEffect(() => {
    setSearchValue(searchParams.get('search') ?? '');
  }, [searchParams]);

  const handleSearchSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedValue = searchValue.trim();
    navigate(trimmedValue ? `/shop?search=${encodeURIComponent(trimmedValue)}` : '/shop');
  };

  return (
    <header className="position-sticky top-0">
      <nav className="navbar navbar-expand-lg navbar-dark top-nav px-3 px-lg-4 py-3">
        <div className="container">
          <Link className="navbar-brand fw-bold" to="/">
            <span className="brand-mark" aria-hidden="true"></span>
            ShopPrime
          </Link>

          <div className="d-flex align-items-center gap-2 order-lg-3">
            <Link className="btn icon-btn" to={isLoggedIn ? '/my-account' : '/auth'}>
              <i className="bi bi-person"></i>
            </Link>

            <Link className="btn icon-btn" to="/wishlist">
              <i className="bi bi-heart"></i>
            </Link>

            <Link className="btn icon-btn position-relative" to="/cart">
              <i className="bi bi-cart3"></i>
              {itemCount > 0 && (
                <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger cart-badge" style={{ fontSize: '1rem' }}>
                  {itemCount}
                </span>
              )}
            </Link>

            <button
              className="btn icon-btn d-lg-none"
              type="button"
              data-bs-toggle="offcanvas"
              data-bs-target="#mobileMenu"
              aria-controls="mobileMenu"
            >
              <i className="bi bi-list"></i>
            </button>
          </div>

          <div
            className="collapse navbar-collapse order-lg-2"
            id="mainNav"
          >
            <form className="search-wrap mx-lg-auto my-3 my-lg-0" onSubmit={handleSearchSubmit}>
              <i className="bi bi-search"></i>
              <input
                className="form-control"
                type="search"
                placeholder="Search for products, brands and more"
                value={searchValue}
                onChange={(event) => setSearchValue(event.target.value)}
                aria-label="Search products"
              />
            </form>

            <ul className="navbar-nav d-flex align-items-lg-center">
              {navLinks.map(({ label, to }) => (
                <li className="nav-item" key={label}>
                  <Link className="nav-link" to={to}>{label}</Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </nav>

      <div
        className="offcanvas offcanvas-start text-bg-dark"
        tabIndex={-1}
        id="mobileMenu"
        aria-labelledby="mobileMenuLabel"
      >
        <div className="offcanvas-header">
          <h5 className="offcanvas-title" id="mobileMenuLabel">ShopPrime</h5>
          <button
            type="button"
            className="btn-close btn-close-white"
            data-bs-dismiss="offcanvas"
          ></button>
        </div>

        <div className="offcanvas-body">
          <form className="search-wrap mb-4" onSubmit={handleSearchSubmit}>
            <i className="bi bi-search"></i>
            <input
              className="form-control"
              type="search"
              placeholder="Search everything"
              value={searchValue}
              onChange={(event) => setSearchValue(event.target.value)}
              aria-label="Search products"
            />
          </form>

          <div className="list-group list-group-flush mobile-links">
            {navLinks.map(({ label, to }) => (
              <Link key={label} to={to} className="list-group-item list-group-item-action">{label}</Link>
            ))}
            <Link to="/cart" className="list-group-item list-group-item-action">Cart</Link>
            <Link to="/wishlist" className="list-group-item list-group-item-action">Wishlist</Link>
            <Link to={isLoggedIn ? '/my-account' : '/auth'} className="list-group-item list-group-item-action">{isLoggedIn ? 'My Account' : 'Sign In'}</Link>
          </div>
        </div>
      </div>
    </header>
  );
});

export default Header;
