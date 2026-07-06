import { useState, useEffect, useRef, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';
import Swiper from 'swiper/bundle';

/* Colour map — matches the HTML's --swatch CSS variable approach */
const COLOR_HEX: Record<string, string> = {
  'black': '#0d0d10',
  'space gray': '#4a4a4a',
  'silver': '#c9c6bd',
  'midnight': '#1a1a2e',
  'midnight black': '#0d0d10',
  'pearl white': '#f0f0f0',
  'white': '#ffffff',
  'navy': '#1b2a4a',
  'rose gold': '#e8c4b8',
  'storm blue': '#5b6578',
};
const getSwatchColor = (color: string) => COLOR_HEX[color.toLowerCase()] || '#333';



interface DetailPanelData {
  highlights: string[];
  specs: { label: string; value: string }[];
}

function getProductDetails(product: any): DetailPanelData {
  // If product already defines them, use them
  if (product.highlights && product.specs) {
    return { highlights: product.highlights, specs: product.specs };
  }

  // Fallbacks based on category/name
  switch (product.category) {
    case 'Electronics':
      if (product.name.toLowerCase().includes('laptop')) {
        return {
          highlights: [
            'Supercharged by next-gen processing power',
            'Stunning high-resolution display with narrow bezels',
            'Ultra-quiet thermal system for peak efficiency',
            'All-day battery life with fast-charging support'
          ],
          specs: [
            { label: 'Processor', value: '8-Core CPU / 10-Core GPU' },
            { label: 'Memory', value: '16GB Unified RAM' },
            { label: 'Storage', value: '512GB NVMe SSD' },
            { label: 'Battery', value: 'Up to 18 hours' }
          ]
        };
      }
      if (product.name.toLowerCase().includes('tablet')) {
        return {
          highlights: [
            'Ultra-thin and lightweight aluminum chassis',
            'Vibrant edge-to-edge OLED display',
            'Supports active stylus and magnetic keyboard',
            'Powerful processor for seamless multitasking'
          ],
          specs: [
            { label: 'Display', value: '12.9" OLED 120Hz' },
            { label: 'Storage', value: '256GB High-Speed' },
            { label: 'Camera', value: '12MP Wide / 10MP Ultra-Wide' },
            { label: 'Battery', value: 'Up to 10 hours' }
          ]
        };
      }
      if (product.name.toLowerCase().includes('drone')) {
        return {
          highlights: [
            'Stunning 4K HDR camera with 3-axis gimbal stability',
            'Omnidirectional obstacle sensing for safety',
            'Extended flight range with HD video transmission',
            'Compact, folding design for easy portability'
          ],
          specs: [
            { label: 'Resolution', value: '4K HDR at 60fps' },
            { label: 'Flight Time', value: 'Up to 34 minutes' },
            { label: 'Range', value: '12 km Transmission' },
            { label: 'Weight', value: '249g Ultra-light' }
          ]
        };
      }
      return {
        highlights: [
          'Engineered for premium performance and durability',
          'Sleek modern design that complements any space',
          'Smart features with easy plug-and-play setup',
          'Energy-efficient operation with robust reliability'
        ],
        specs: [
          { label: 'Compatibility', value: 'Universal Sync' },
          { label: 'Power Input', value: 'USB-C / DC Charging' },
          { label: 'Material', value: 'Premium Grade Polycarbonate' },
          { label: 'Warranty', value: '2-Year Limited' }
        ]
      };
    case 'Gaming':
      return {
        highlights: [
          'Ultra-high refresh rate support for competitive play',
          'Advanced cooling technology for marathon sessions',
          'Customizable RGB lighting and programmable controls',
          'Zero-latency connection for split-second decisions'
        ],
        specs: [
          { label: 'Latency', value: 'Less than 1ms' },
          { label: 'Connectivity', value: 'Ultra-Fast Wireless / USB' },
          { label: 'Ergonomics', value: 'Pro-Grip Design' },
          { label: 'Compatibility', value: 'PC, Mac, and Consoles' }
        ]
      };
    case 'Audio':
      return {
        highlights: [
          'Adaptive ANC with transparent listening mode',
          'Up to 38 hours of battery life with quick charge',
          'Low-latency Bluetooth 5.3 for calls, games, and music',
          'Fold-flat design with soft-touch travel case'
        ],
        specs: [
          { label: 'Driver', value: '40mm Graphene' },
          { label: 'Battery', value: '38 hours' },
          { label: 'Weight', value: '254g' },
          { label: 'Connectivity', value: 'Bluetooth 5.3, USB-C' }
        ]
      };
    case 'Wearables':
      return {
        highlights: [
          'Continuous health tracking (heart rate, SpO2, sleep)',
          'Bright, always-on display with custom watch faces',
          'Waterproof design suitable for swimming and tracking',
          'Smart notifications and wireless sync capabilities'
        ],
        specs: [
          { label: 'Display', value: 'Always-On AMOLED' },
          { label: 'Waterproof', value: '5ATM (up to 50m)' },
          { label: 'Battery Life', value: 'Up to 7 days' },
          { label: 'Sensors', value: 'ECG, SpO2, Accelerometer' }
        ]
      };
    default:
      return {
        highlights: [
          'Premium materials chosen for style and durability',
          'Designed to enhance your day-to-day lifestyle',
          'Eco-friendly manufacturing processes and packaging',
          'Satisfaction guaranteed with hassle-free returns'
        ],
        specs: [
          { label: 'Material', value: 'Eco-Friendly & Sustainable' },
          { label: 'Dimensions', value: 'Standard Fit' },
          { label: 'Care', value: 'Easy Clean' },
          { label: 'Origin', value: 'Imported Premium' }
        ]
      };
  }
}

export default function ProductDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();

  const [product, setProduct] = useState<any>(null);
  const [loadingProduct, setLoadingProduct] = useState(true);
  const [relatedProducts, setRelatedProducts] = useState<any[]>([]);
  const images = useMemo(() => product ? product.images ?? [product.image] : [], [product]);

  const [selectedColor, setSelectedColor] = useState<string | undefined>(undefined);
  const [quantity, setQuantity] = useState(1);
  const [addedToCart, setAddedToCart] = useState(false);

  useEffect(() => {
    const productId = Number(id);
    if (!productId) { setLoadingProduct(false); return; }
    api.getProduct(productId).then((p) => {
      setProduct(p);
      if (p?.colors?.[0]) setSelectedColor(p.colors[0]);
      setLoadingProduct(false);
    }).catch(() => setLoadingProduct(false));
  }, [id]);

  useEffect(() => {
    if (product) {
      api.getRelatedProducts(product.id, 5).then(setRelatedProducts).catch(() => {});
    }
  }, [product]);

  /* Swiper refs */
  const galleryRef = useRef<HTMLDivElement>(null);
  const thumbsRef = useRef<HTMLDivElement>(null);
  const relatedRef = useRef<HTMLDivElement>(null);
  
  const gallerySwiper = useRef<Swiper | null>(null);
  const thumbsSwiper = useRef<Swiper | null>(null);
  const relatedSwiper = useRef<Swiper | null>(null);

  // Sync selected color and quantity when product changes
  useEffect(() => {
    if (product) {
      setSelectedColor(product.colors?.[0]);
      setQuantity(1);
    }
  }, [product]);

  // Gallery Swiper Initialization — mirrors script.js exactly
  useEffect(() => {
    // Destroy any previous instances first
    gallerySwiper.current?.destroy(true, true);
    thumbsSwiper.current?.destroy(true, true);
    gallerySwiper.current = null;
    thumbsSwiper.current = null;

    if (!product || images.length < 2) return;

    const timer = setTimeout(() => {
      if (!thumbsRef.current || !galleryRef.current) return;

      // 1. Thumbs swiper first — exactly like script.js productThumbsSwiper
      const productThumbsSwiper = new Swiper(thumbsRef.current, {
        spaceBetween: 12,
        slidesPerView: 4,
        watchSlidesProgress: true,
        breakpoints: {
          0: { slidesPerView: 3.2 },
          576: { slidesPerView: 4 },
        },
      });
      thumbsSwiper.current = productThumbsSwiper;

      // 2. Main gallery swiper — exactly like script.js
      const mainGallery = new Swiper(galleryRef.current, {
        spaceBetween: 16,
        loop: true,
        observer: true,
        observeParents: true,
        resizeObserver: true,
        navigation: {
          nextEl: '.product-gallery-swiper .swiper-button-next',
          prevEl: '.product-gallery-swiper .swiper-button-prev',
        },
        thumbs: {
          swiper: productThumbsSwiper,
        },
      });
      gallerySwiper.current = mainGallery;
    }, 100);

    return () => {
      clearTimeout(timer);
      gallerySwiper.current?.destroy(true, true);
      thumbsSwiper.current?.destroy(true, true);
      gallerySwiper.current = null;
      thumbsSwiper.current = null;
    };
  }, [images, product]);

  // Related Products Swiper Initialization — mirrors script.js
  useEffect(() => {
    relatedSwiper.current?.destroy(true, true);
    relatedSwiper.current = null;

    if (!relatedRef.current) return;

    const timer = setTimeout(() => {
      const sw = new Swiper(relatedRef.current!, {
        spaceBetween: 16,
        navigation: {
          nextEl: '.product-related-swiper .swiper-button-next',
          prevEl: '.product-related-swiper .swiper-button-prev',
        },
        breakpoints: {
          0: { slidesPerView: 1.15 },
          576: { slidesPerView: 2.1 },
          992: { slidesPerView: 3.1 },
          1400: { slidesPerView: 4.1 },
        },
      });
      relatedSwiper.current = sw;
    }, 100);

    return () => {
      clearTimeout(timer);
      relatedSwiper.current?.destroy(true, true);
      relatedSwiper.current = null;
    };
  }, [product, id]);

  if (loadingProduct) {
    return (
      <div className="container">
        <div className="empty-state empty-state-spacious">
          <i className="bi bi-box-seam" />
          <h3>Loading...</h3>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container">
        <div className="empty-state empty-state-spacious">
          <i className="bi bi-box-seam" />
          <h3>Product Not Found</h3>
          <p>The product you're looking for doesn't exist or has been removed.</p>
          <Link to="/shop" className="apply-filters-btn apply-filters-link">
            Back to Shop
          </Link>
        </div>
      </div>
    );
  }

  const inWishlist = isInWishlist(product.id);
  const discount = product.originalPrice
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;

  const handleAddToCart = () => {
    addToCart(product, quantity, selectedColor);
    setAddedToCart(true);
    setTimeout(() => setAddedToCart(false), 2500);
  };

  const handleBuyNow = () => {
    addToCart(product, quantity, selectedColor);
    navigate('/checkout');
  };

  /* Derive highlights & specs from product data */
  const { highlights, specs } = getProductDetails(product);

  return (
    <main className="container product-detail-page">
      {/* Breadcrumb */}
      <nav className="product-breadcrumb" aria-label="Breadcrumb">
        <Link to="/">Home</Link>
        <i className="bi bi-chevron-right" />
        <Link to={`/shop?category=${encodeURIComponent(product.category)}`}>{product.category}</Link>
        <i className="bi bi-chevron-right" />
        <span>{product.name}</span>
      </nav>

      {/* ── Main layout ───────────────────────────────────────── */}
      <section className="product-detail-layout">

        {/* Gallery */}
        <div className="product-gallery-wrap">
          {images.length > 1 ? (
            <>
              {/* Main swiper */}
              <div className="swiper product-gallery-swiper" ref={galleryRef}>
                <div className="swiper-wrapper">
                    {images.map((src: string, i: number) => (
                      <div key={i} className="swiper-slide">
                        <img src={src} alt={`${product.name} view ${i + 1}`} />
                      </div>
                    ))}
                  </div>
                  <div className="swiper-button-prev" />
                  <div className="swiper-button-next" />
                </div>

                {/* Thumbnails swiper */}
                <div className="swiper product-thumbs-swiper" ref={thumbsRef}>
                  <div className="swiper-wrapper">
                    {images.map((src: string, i: number) => (
                    <div key={i} className="swiper-slide">
                      <img src={src} alt={`${product.name} thumbnail ${i + 1}`} />
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            /* Single image — no swiper needed */
            <div className="swiper product-gallery-swiper product-gallery-static">
              <div className="swiper-wrapper">
                <div className="swiper-slide">
                  <img src={images[0]} alt={product.name} />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── Product info ───────────────────────────────────── */}
        <article className="product-detail-info">

          {/* Kicker / category label */}
          <span className="product-detail-kicker">
            {product.category}
          </span>

          <h1>{product.name}</h1>

          {/* Rating row */}
          <div className="product-rating-row">
            <div className="product-stars" aria-label={`Rated ${product.rating} out of 5 stars`}>
              {[1, 2, 3, 4, 5].map((i) => (
                <i
                  key={i}
                  className={
                    i <= Math.floor(product.rating)
                      ? 'bi bi-star-fill'
                      : i - 0.5 <= product.rating
                      ? 'bi bi-star-half'
                      : 'bi bi-star'
                  }
                />
              ))}
            </div>
            <span>{product.rating.toFixed(1)}</span>
            <a href="#reviews">{product.reviewCount.toLocaleString()} reviews</a>
          </div>

          {/* Summary */}
          {product.description && (
            <p className="product-detail-summary">{product.description}</p>
          )}

          {/* Price row */}
          <div className="product-price-row">
            <strong>${product.price.toFixed(2)}</strong>
            {product.originalPrice && (
              <span>${product.originalPrice.toFixed(2)}</span>
            )}
            {discount > 0 && <small>Save {discount}%</small>}
          </div>

          {/* Options */}
          <div className="product-options">

            {/* Color */}
            {product.colors && product.colors.length > 0 && (
              <div className="product-option-group">
                <div className="product-option-head">
                  <span>Color</span>
                  <strong data-selected-color="">{selectedColor}</strong>
                </div>
                <div className="color-swatches" aria-label="Choose color">
                  {product.colors.map((color: string) => (
                    <button
                      key={color}
                      type="button"
                      className={`color-swatch${selectedColor === color ? ' active' : ''}`}
                      style={{ '--swatch': getSwatchColor(color) } as React.CSSProperties}
                      data-color={color}
                      aria-label={color}
                      aria-pressed={selectedColor === color}
                      onClick={() => setSelectedColor(color)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Quantity */}
            <div className="product-option-group">
              <div className="product-option-head">
                <span>Quantity</span>
                <strong className={product.inStock ? 'stock-text in-stock' : 'stock-text out-of-stock'}>
                  {product.inStock ? 'In stock' : product.isPreOrder ? 'Pre-order' : 'Out of stock'}
                </strong>
              </div>
              <div className="qty-stepper product-qty-stepper" data-qty-stepper="">
                <button
                  type="button"
                  data-qty-action="decrease"
                  aria-label="Decrease quantity"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                >
                  -
                </button>
                <span data-qty-value="">{quantity}</span>
                <button
                  type="button"
                  data-qty-action="increase"
                  aria-label="Increase quantity"
                  onClick={() => setQuantity((q) => Math.min(99, q + 1))}
                >
                  +
                </button>
              </div>
            </div>

          </div>

          {/* Action buttons */}
          <div className="product-action-row">
            <button
              className={`add-to-cart-btn${product.isPreOrder ? ' pre-order' : ''}${(!product.inStock && !product.isPreOrder) ? ' disabled' : ''}`}
              onClick={handleAddToCart}
              disabled={!product.inStock && !product.isPreOrder}
              type="button"
            >
              <i className={`bi ${addedToCart ? 'bi-check-lg' : 'bi-cart-plus'}`} />
              {addedToCart ? 'Added!' : product.isPreOrder ? 'Pre-Order' : 'Add to Cart'}
            </button>

            <button
              className="add-to-cart-btn"
              onClick={handleBuyNow}
              disabled={!product.inStock && !product.isPreOrder}
              type="button"
            >
              Buy Now
            </button>

            <button
              className="product-wishlist-btn"
              type="button"
              aria-label={inWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
              onClick={() => toggleWishlist(product)}
            >
              <i className={`bi ${inWishlist ? 'bi-heart-fill' : 'bi-heart'}`} />
            </button>
          </div>

          {/* Service grid */}
          <div className="product-service-grid">
            <div>
              <i className="bi bi-truck" />
              <span>Free express delivery</span>
            </div>
            <div>
              <i className="bi bi-arrow-repeat" />
              <span>30-day easy returns</span>
            </div>
            <div>
              <i className="bi bi-shield-check" />
              <span>2-year warranty</span>
            </div>
          </div>

        </article>
      </section>

      {/* ── Detail panels ─────────────────────────────────────── */}
      <section className="product-detail-panels">
        <article>
          <h2>Highlights</h2>
          <ul>
            {highlights.map((h, i) => <li key={i}>{h}</li>)}
          </ul>
        </article>
        <article>
          <h2>Specifications</h2>
          <div className="product-spec-list">
            {specs.map((s) => (
              <div key={s.label}>
                <span>{s.label}</span>
                <strong>{s.value}</strong>
              </div>
            ))}
          </div>
        </article>
      </section>

      {/* ── Related Products ──────────────────────────────────── */}
      <section className="content-section pb-50" id="reviews">
        <div className="section-head">
          <div>
            <h2>You May Also Like</h2>
            <p>Pair it with these customer favorites</p>
          </div>
          <Link to="/shop">View All</Link>
        </div>

        <div className="swiper product-related-swiper" ref={relatedRef}>
          <div className="swiper-wrapper">
            {relatedProducts.map((item) => (
              <div key={item.id} className="swiper-slide">
                <Link to={`/product/${item.id}`} className="text-decoration-none">
                  <article className="product-card">
                    {(item.badge || item.tag) && (
                      <span className={`tag ${item.badgeType || item.tagClass || 'new'}`}>
                        {item.badge || item.tag}
                      </span>
                    )}
                    <img src={item.image} alt={item.name} />
                    <div className="product-body">
                      <h3>{item.name}</h3>
                      <p>{item.description || item.desc}</p>
                      <strong>${item.price.toFixed(2)}</strong>
                    </div>
                  </article>
                </Link>
              </div>
            ))}
          </div>
          <div className="swiper-button-prev" />
          <div className="swiper-button-next" />
        </div>
      </section>
    </main>
  );
}
