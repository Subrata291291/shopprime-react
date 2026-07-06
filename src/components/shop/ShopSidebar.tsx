import { memo, useCallback } from 'react';
import { MAX_PRICE } from '../../data/products';
import type { ShopFilters } from '../../types';

interface ShopSidebarProps {
  filters: ShopFilters;
  categories: string[];
  brands: string[];
  priceRangeMax: number;
  onFilterChange: (updated: Partial<ShopFilters>) => void;
  onApply: () => void;
  onReset: () => void;
}

const CATEGORY_ICONS: Record<string, string> = {
  All: 'bi-grid',
  Electronics: 'bi-cpu',
  Gaming: 'bi-controller',
  Audio: 'bi-headphones',
  Wearables: 'bi-watch',
  Lifestyle: 'bi-bag',
  Accessories: 'bi-phone',
  Home: 'bi-house',
  Fashion: 'bi-handbag',
};

const getCategoryColorClass = (category: string) => `category-color-${category.toLowerCase().replace(/\s+/g, '-')}`;

const ShopSidebar = memo(function ShopSidebar({ filters, categories, brands, priceRangeMax, onFilterChange, onApply, onReset }: ShopSidebarProps) {
  const categoryOptions = ['All', ...categories];
  const brandOptions = brands;
  const priceMax = Math.max(priceRangeMax || MAX_PRICE, 1);
  const toggleBrand = useCallback((brand: string) => {
    const brands = filters.brands.includes(brand)
      ? filters.brands.filter((b) => b !== brand)
      : [...filters.brands, brand];
    onFilterChange({ brands });
  }, [filters.brands, onFilterChange]);

  return (
    <aside className="shop-sidebar">
      <h3>Categories</h3>
      <p className="shop-sidebar-subtitle">Browse Departments</p>

      <div className="filter-section">
        {categoryOptions.map((cat) => {
          const isActive = filters.category === cat;
          return (
            <div
              key={cat}
              className={`filter-item${isActive ? ' active' : ''}`}
              onClick={() => onFilterChange({ category: cat })}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && onFilterChange({ category: cat })}
              aria-pressed={isActive}
            >
              <i className={`bi ${CATEGORY_ICONS[cat] || 'bi-tag'} filter-category-icon ${getCategoryColorClass(cat)}`} />
              <label>{cat}</label>
            </div>
          );
        })}
      </div>

      <div className="filter-section">
        <h4>Price Range</h4>
        <div className="price-range-wrap">
          <div className="price-inputs">
            <span className="price-value">$0</span>
            <span className="price-value">${Math.min(filters.maxPrice, priceMax).toLocaleString()}</span>
          </div>
          <input
            type="range"
            min={0}
            max={priceMax}
            step={50}
            value={Math.min(filters.maxPrice, priceMax)}
            onChange={(e) => onFilterChange({ maxPrice: Number(e.target.value) })}
            aria-label="Maximum price filter"
          />
        </div>
      </div>

      <div className="filter-section">
        <h4>Brands</h4>
        {brandOptions.map((brand) => (
          <div key={brand} className="filter-item">
            <input
              type="checkbox"
              id={`brand-${brand.toLowerCase()}`}
              checked={filters.brands.includes(brand)}
              onChange={() => toggleBrand(brand)}
            />
            <label htmlFor={`brand-${brand.toLowerCase()}`}>{brand}</label>
          </div>
        ))}
      </div>

      <div className="filter-section">
        <h4>Ratings</h4>
        {[4, 3, 2].map((rating) => (
          <div key={rating} className="filter-item">
            <input
              type="radio"
              id={`rating-${rating}`}
              name="rating"
              checked={filters.minRating === rating}
              onChange={() => onFilterChange({ minRating: rating })}
            />
            <label htmlFor={`rating-${rating}`} className="rating-filter-label">
              <span className="stars">
                {'★'.repeat(rating)}{'☆'.repeat(5 - rating)}
              </span>
              <span className="rating-count">& Up</span>
            </label>
          </div>
        ))}
        {filters.minRating > 0 && (
          <button className="filter-clear-btn" onClick={() => onFilterChange({ minRating: 0 })}>
            Clear rating filter
          </button>
        )}
      </div>

      <button className="apply-filters-btn" onClick={onApply}>
        Apply Filters
      </button>

      <button className="reset-filters-btn" onClick={onReset}>
        Reset All
      </button>

      <div className="sidebar-footer">
        <a href="#" className="sidebar-footer-link">
          <i className="bi bi-headset" />
          Support
        </a>
        <a href="#" className="sidebar-footer-link">
          <i className="bi bi-gear" />
          Settings
        </a>
      </div>
    </aside>
  );
});

export default ShopSidebar;

