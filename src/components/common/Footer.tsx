import { memo, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../services/api';

const FOOTER_SOCIALS = [
  { icon: 'bi-globe-americas', label: 'Globe' },
  { icon: 'bi-at', label: 'At' },
  { icon: 'bi-chat-square-text', label: 'Chat' },
  { icon: 'bi-share', label: 'Share' },
];

const FOOTER_SUPPORT = [
  { label: 'Order Tracking', to: '/track-order' },
  { label: 'Shipping Policy', to: '/' },
  { label: 'Returns & Exchanges', to: '/' },
  { label: 'Help Center', to: '/' },
  { label: 'Contact Us', to: '/' },
];

const FOOTER_COMPANY = [
  { label: 'About Our Brand', to: '/' },
  { label: 'Sustainability', to: '/' },
  { label: 'Careers', to: '/' },
  { label: 'Press Media', to: '/' },
  { label: 'Investors', to: '/' },
];

const FOOTER_META_LINKS = ['Privacy', 'Terms', 'Cookies', 'Sitemap'];
const FOOTER_PAYMENT_ICONS = ['bi-credit-card', 'bi-wallet2', 'bi-patch-check', 'bi-shield-check'];

const Footer = memo(function Footer() {
  const [shoppingLinks, setShoppingLinks] = useState<{ label: string; to: string }[]>([
    { label: 'All Products', to: '/shop' },
    { label: 'Flash Deals', to: '/shop' },
    { label: 'New Releases', to: '/shop' },
  ]);

  useEffect(() => {
    api.getProducts().then((products: any) => {
      const cats = [...new Set(products.map((p: any) => p.category).filter(Boolean))] as string[];
      const links = [{ label: 'All Products', to: '/shop' }];
      cats.slice(0, 4).forEach((cat: string) => {
        links.push({ label: cat, to: `/shop?category=${encodeURIComponent(cat)}` });
      });
      setShoppingLinks(links);
    }).catch(() => {});
  }, []);

  return (
    <footer className="footer">
      <div className="container">
        <div className="row g-4 g-lg-5 align-items-start">
          <div className="col-12 col-lg-6">
            <div className="footer-brand">
              <h3>ShopPrime</h3>
              <p>
                The premium destination for the modern technologist. We curate elite hardware and accessories designed to elevate your digital lifestyle. Quality isn't an option; it's our standard.
              </p>
              <div className="d-flex gap-4 social-links">
                {FOOTER_SOCIALS.map((item) => (
                  <a href="#" aria-label={item.label} key={item.label}>
                    <i className={`bi ${item.icon}`}></i>
                  </a>
                ))}
              </div>
            </div>
          </div>

          <div className="col-12 col-lg-6">
            <div className="row g-4">
              <div className="col-4">
                <h4>Shopping</h4>
                <ul className="list-unstyled">
                  {shoppingLinks.map((link) => (
                    <li key={link.label}>
                      <Link to={link.to}>{link.label}</Link>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="col-4">
                <h4>Support</h4>
                <ul className="list-unstyled">
                  {FOOTER_SUPPORT.map((link) => (
                    <li key={link.label}>
                      <Link to={link.to}>{link.label}</Link>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="col-4">
                <h4>Company</h4>
                <ul className="list-unstyled">
                  {FOOTER_COMPANY.map((link) => (
                    <li key={link.label}>
                      <Link to={link.to}>{link.label}</Link>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="footer-bottom">
        <div className="container">
          <div className="footer-meta">
            <div className="footer-meta-left">
              <span>&copy; 2024 ShopPrime. All rights reserved.</span>
              {FOOTER_META_LINKS.map((label) => (
                <Link to="/" key={label}>{label}</Link>
              ))}
            </div>

            <div className="footer-meta-right">
              {FOOTER_PAYMENT_ICONS.map((icon) => (
                <a href="#" aria-label={icon.replace('bi-', '').replace('-', ' ')} key={icon}>
                  <i className={`bi ${icon}`}></i>
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
});

export default Footer;
