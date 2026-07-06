import { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import Swiper from 'swiper';
import { Autoplay } from 'swiper/modules';
import { api } from '../../services/api';
import ProductCard from '../../components/product/ProductCard';
import Section from '../../components/ui/Section';
import { useCart } from '../../context/CartContext';

const HERO_SLIDES = [
  {
    className: 'hero-card-a',
    eyebrow: 'Weekend special',
    title: 'Next-Gen Electronics Up to 40% Off',
    copy: 'Explore top headphones, wearables, smart displays and premium accessories at limited-time prices.',
    secondaryCta: 'Learn More',
    image: 'https://images.unsplash.com/photo-1546435770-a3e426bf472b?auto=format&fit=crop&w=1400&q=80',
  },
  {
    className: 'hero-card-b',
    eyebrow: 'Fresh arrivals',
    title: 'Smartphones Built for Work and Play',
    copy: 'Fast cameras, all-day batteries and flagship performance across our newest mobile lineup.',
    secondaryCta: 'Compare Models',
    image: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=1400&q=80',
  },
];

export default function Home() {
  const { addToCart } = useCart();
  const [timeLeft, setTimeLeft] = useState('');
  const [newArrivals, setNewArrivals] = useState<any[]>([]);
  const [bestSellers, setBestSellers] = useState<any[]>([]);
  const [popularProducts, setPopularProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [dealsProducts, setDealsProducts] = useState<any[]>([]);
  const [brands, setBrands] = useState<string[]>([]);
  const [moreProducts, setMoreProducts] = useState<any[]>([]);

  const CATEGORY_ICONS: Record<string, string> = {
    Electronics: 'bi-phone', Gaming: 'bi-controller', Audio: 'bi-speaker',
    Wearables: 'bi-smartwatch', Lifestyle: 'bi-lightning-charge', Accessories: 'bi-laptop',
    Home: 'bi-house', Shoes: 'bi-bag',
  };

  useEffect(() => {
    const loadHomeProducts = async () => {
      try {
        const [newest, popular, rating] = await Promise.all([
          api.getProducts({ sortBy: 'newest' }),
          api.getProducts({ sortBy: 'popular' }),
          api.getProducts({ sortBy: 'rating' }),
        ]);

        const arrivalProducts = newest.slice(0, 8);
        setNewArrivals(arrivalProducts);

        const newArrivalIds = new Set(arrivalProducts.map((p: any) => p.id));
        const bestSellerProducts = popular.filter((p: any) => !newArrivalIds.has(p.id)).slice(0, 8);
        setBestSellers(bestSellerProducts);

        const bestSellerIds = new Set(bestSellerProducts.map((p: any) => p.id));
        setPopularProducts(rating.filter((p: any) => !newArrivalIds.has(p.id) && !bestSellerIds.has(p.id)).slice(0, 5));

        const allDeals = newest.filter((p: any) => p.originalPrice && p.originalPrice > p.price);
        setDealsProducts(allDeals.slice(0, 3));
        setMoreProducts(newest.filter((p: any) => !p.badgeType).slice(0, 2));
        const cats = [...new Set(newest.map((p: any) => p.category).filter(Boolean))] as string[];
        setCategories(cats.slice(0, 6));
        const brandsSet = [...new Set(newest.map((p: any) => p.brand).filter(Boolean))] as string[];
        setBrands(brandsSet.slice(0, 7));
      } catch {
        // silently ignore product load errors
      }
    };

    loadHomeProducts();
  }, []);

  const quickCategories = categories.length > 0
    ? categories.map((cat) => ({
        label: cat,
        icon: CATEGORY_ICONS[cat] || 'bi-tag',
        to: `/shop?category=${encodeURIComponent(cat)}`,
      }))
    : [
        { label: 'Electronics', icon: 'bi-phone', to: '/shop?category=Electronics' },
        { label: 'Gaming', icon: 'bi-controller', to: '/shop?category=Gaming' },
        { label: 'Audio', icon: 'bi-speaker', to: '/shop?category=Audio' },
        { label: 'Wearables', icon: 'bi-smartwatch', to: '/shop?category=Wearables' },
        { label: 'Lifestyle', icon: 'bi-lightning-charge', to: '/shop?category=Lifestyle' },
        { label: 'Accessories', icon: 'bi-laptop', to: '/shop?category=Accessories' },
      ];

  // Refs for Swiper instances
  const heroRef = useRef<HTMLDivElement>(null);
  const arrivalsRef = useRef<HTMLDivElement>(null);
  const bestSellersRef = useRef<HTMLDivElement>(null);
  const brandsRef = useRef<HTMLDivElement>(null);
  const popularRef = useRef<HTMLDivElement>(null);

  // Dynamic countdown timer targeting end of the day (midnight)
  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date();
      const midnight = new Date();
      midnight.setHours(24, 0, 0, 0);
      const diff = midnight.getTime() - now.getTime();

      if (diff <= 0) {
        return '24h : 00m : 00s';
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff / (1000 * 60)) % 60);
      const seconds = Math.floor((diff / 1000) % 60);

      return `${String(hours).padStart(2, '0')}h : ${String(minutes).padStart(2, '0')}m : ${String(seconds).padStart(2, '0')}s`;
    };

    setTimeLeft(calculateTimeLeft());
    const interval = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Swiper sliders initialization
  useEffect(() => {
    let heroSwiper: Swiper | null = null;
    let arrivalsSwiper: Swiper | null = null;
    let bestSellersSwiper: Swiper | null = null;
    let brandsSwiper: Swiper | null = null;
    let popularSwiper: Swiper | null = null;

    const timer = setTimeout(() => {
      if (heroRef.current) {
        heroSwiper = new Swiper(heroRef.current, {
          modules: [Autoplay],
          loop: true,
          autoplay: {
            delay: 4500,
            disableOnInteraction: false,
          },
        });
      }

      if (arrivalsRef.current) {
        arrivalsSwiper = new Swiper(arrivalsRef.current, {
          spaceBetween: 24,
          breakpoints: {
            0: { slidesPerView: 1.15 },
            576: { slidesPerView: 1.8 },
            768: { slidesPerView: 2.2 },
            1200: { slidesPerView: 4.5 },
          },
        });
      }

      if (bestSellersRef.current) {
        bestSellersSwiper = new Swiper(bestSellersRef.current, {
          spaceBetween: 24,
          breakpoints: {
            0: { slidesPerView: 1.2 },
            576: { slidesPerView: 2.1 },
            768: { slidesPerView: 3.1 },
            1200: { slidesPerView: 4.5 },
          },
        });
      }

      if (brandsRef.current) {
        brandsSwiper = new Swiper(brandsRef.current, {
          modules: [Autoplay],
          loop: true,
          speed: 600,
          spaceBetween: 24,
          autoplay: {
            delay: 1800,
            disableOnInteraction: false,
          },
          breakpoints: {
            0: { slidesPerView: 2.1 },
            576: { slidesPerView: 3.2 },
            992: { slidesPerView: 5.4 },
          },
        });
      }

      if (popularRef.current) {
        popularSwiper = new Swiper(popularRef.current, {
          spaceBetween: 24,
          breakpoints: {
            0: { slidesPerView: 1.2 },
            576: { slidesPerView: 2.2 },
            768: { slidesPerView: 3.2 },
            1200: { slidesPerView: 4.5 },
          },
        });
      }
    }, 50);

    return () => {
      clearTimeout(timer);
      heroSwiper?.destroy(true, true);
      arrivalsSwiper?.destroy(true, true);
      bestSellersSwiper?.destroy(true, true);
      brandsSwiper?.destroy(true, true);
      popularSwiper?.destroy(true, true);
    };
  }, []);

  return (
    <main className="container">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="swiper hero-swiper" ref={heroRef}>
          <div className="swiper-wrapper">
            {HERO_SLIDES.map((slide) => (
              <div className="swiper-slide" key={slide.title}>
                <article className={`hero-card ${slide.className}`} style={{ backgroundImage: `linear-gradient(90deg, rgba(7,10,16,.92) 0%, rgba(7,10,16,.56) 52%, rgba(7,10,16,.25) 100%), url('${slide.image}')` }}>
                  <div className="hero-content">
                    <span className="eyebrow">{slide.eyebrow}</span>
                    <h1>{slide.title}</h1>
                    <p className="mb-5 mt-4">{slide.copy}</p>
                    <div className="d-flex flex-wrap gap-3">
                      <Link className="btn btn-primary btn-shop" to="/shop">Shop Now</Link>
                      <Link className="btn btn-soft" to="/shop">{slide.secondaryCta}</Link>
                    </div>
                  </div>
                </article>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Quick Categories */}
      <section className="quick-categories m-50">
        <div className="row gy-4">
          {quickCategories.map((category) => (
            <div className="col-4 col-md-2" key={category.label}>
              <Link to={category.to} className="text-decoration-none">
                <div className="quick-pill">
                  <i className={`bi ${category.icon}`}></i>
                  <span>{category.label}</span>
                </div>
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* Deals of the Day */}
      <section className="content-section">
        <div className="section-head">
          <div className="deals-heading">
            <h2>Deals of the Day</h2>
            <div className="deal-timer" id="dealTimer" aria-label="Daily countdown">
              <i className="bi bi-clock"></i>
              <span id="dealTimerValue">{timeLeft}</span>
            </div>
          </div>
          <Link to="/shop">View All</Link>
        </div>
        <div className="deals-layout">
          {dealsProducts[0] && (() => {
            const deal = dealsProducts[0];
            const discount = deal.originalPrice ? Math.round((1 - deal.price / deal.originalPrice) * 100) : 0;
            return (
              <article className="deals-feature">
                <Link to={`/product/${deal.id}`} className="deals-feature-link">
                  <span className="tag tag-deal-main">{discount}% Off</span>
                  <img
                    src={deal.image}
                    alt={deal.name}
                    onError={(e) => { (e.target as HTMLImageElement).src = 'https://via.placeholder.com/600x400?text=Product+Image'; }}
                  />
                  <div className="deals-feature-copy">
                    <h3>{deal.name}</h3>
                    <p>{deal.description?.slice(0, 60) || ''}</p>
                    <div className="deals-feature-price">
                      <strong>${deal.price.toFixed(2)}</strong>
                      {deal.originalPrice && <span>${deal.originalPrice.toFixed(2)}</span>}
                    </div>
                  </div>
                </Link>
                <button className="deals-cart-btn" onClick={(e) => { e.preventDefault(); addToCart(deal, 1); }} aria-label="Add to cart">
                  <i className="bi bi-cart-plus"></i>
                </button>
              </article>
            );
          })()}
          <div className="deals-side">
            {dealsProducts.slice(1, 3).map((deal) => (
              <Link key={deal.id} to={`/product/${deal.id}`} className="deals-mini-card-link">
                <article className="deals-mini-card">
                  <img
                    src={deal.image}
                    alt={deal.name}
                    onError={(e) => { (e.target as HTMLImageElement).src = 'https://via.placeholder.com/400x400?text=Product+Image'; }}
                  />
                  <div className="deals-mini-copy">
                    <h3>{deal.name}</h3>
                    <div className="deals-mini-meta">
                      <strong>${deal.price.toFixed(2)}</strong>
                    </div>
                  </div>
                </article>
              </Link>
            ))}
            <article className="deals-bundle-card">
              <div className="deals-bundle-copy">
                <span className="bundle-tag">Bundle &amp; Save</span>
                <h3>Bundle &amp; Save</h3>
                <p>Pick complementary products for a discount</p>
                <Link to="/shop">Shop Bundles <i className="bi bi-arrow-right"></i></Link>
              </div>
              <img src="https://images.unsplash.com/photo-1511467687858-23d96c32e4ae?auto=format&fit=crop&w=900&q=80" alt="Bundle" />
            </article>
          </div>
        </div>
      </section>

      {/* New Arrivals */}
      <Section title="New Arrivals" subtitle="Just landed this week" linkTo="/shop" linkText="View All" className="m-50">
        <div className="swiper catalog-swiper new-arrivals-swiper" ref={arrivalsRef}>
          <div className="swiper-wrapper">
            {newArrivals.map(product => (
              <div key={product.id} className="swiper-slide">
                <ProductCard product={product} />
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* Best Sellers */}
      <Section title="Best Sellers" subtitle="Customer favorites across categories" linkTo="/shop" linkText="View All" className="m-50">
        <div className="swiper catalog-swiper best-sellers-swiper" ref={bestSellersRef}>
          <div className="swiper-wrapper">
            {bestSellers.map(product => (
              <div key={product.id} className="swiper-slide">
                <ProductCard product={product} />
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* Brands Showcase */}
      <Section title="Top Brands Showcase" subtitle="Brands powering the future">
        <div className="swiper brands-swiper" ref={brandsRef}>
          <div className="swiper-wrapper">
            {(brands.length > 0 ? brands : ['SONIQ', 'NOVA', 'ORBIT', 'ZENIX', 'LUMA', 'AXON', 'PULSE']).map((brand) => (
              <div className="swiper-slide" key={brand}>
                <div className="brand-tile">{brand}</div>
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* More Products */}
      <Section title="More Products" subtitle="Design-forward tech for every room" className="m-50">
        <div className="row g-3">
          {(moreProducts.length > 0 ? moreProducts : []).map((item: any, idx: number) => (
            <div className={idx === 0 ? 'col-12 col-md-7' : 'col-12 col-md-5'} key={item.id || idx}>
              <Link to={`/product/${item.id}`} className="banner-card more-product-card more-product-card-link">
                <img
                  src={item.image}
                  alt={item.name}
                  onError={(e) => { (e.target as HTMLImageElement).src = 'https://via.placeholder.com/600x600?text=Product+Image'; }}
                />
                <div className="more-product-copy">
                  <div>
                    <h3>{item.name}</h3>
                    <p>{item.description?.slice(0, 60) || item.category || ''}</p>
                    <strong>${item.price.toFixed(2)}</strong>
                  </div>
                </div>
              </Link>
            </div>
          ))}
        </div>
      </Section>

      {/* Popular Products */}
      <Section title="Popular Products" linkTo="/shop" linkText="View All" className="pb-50">
        <div className="swiper popular-swiper" ref={popularRef}>
          <div className="swiper-wrapper">
            {popularProducts.map(product => (
              <div key={product.id} className="swiper-slide">
                <ProductCard product={product} />
              </div>
            ))}
          </div>
        </div>
      </Section>
    </main>
  );
}
