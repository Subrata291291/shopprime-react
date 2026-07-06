import { useState, useMemo, useCallback, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../../services/api';
import ShopSidebar from '../../components/shop/ShopSidebar';
import Pagination from '../../components/shop/Pagination';
import ProductCard from '../../components/product/ProductCard';
import Breadcrumb from '../../components/ui/Breadcrumb';
import EmptyState from '../../components/ui/EmptyState';
import FilterChips from '../../components/ui/FilterChips';
import type { Product, ShopFilters } from '../../types';

const PRODUCTS_PER_PAGE = 12;
const MAX_FILTER_PRICE = 2000;

const DEFAULT_FILTERS: ShopFilters = {
  category: 'All',
  brands: [],
  minPrice: 0,
  maxPrice: MAX_FILTER_PRICE,
  minRating: 0,
  sortBy: 'relevance',
};

const SORT_OPTIONS: { value: ShopFilters['sortBy']; label: string }[] = [
  { value: 'relevance', label: 'Relevance' },
  { value: 'price-asc', label: 'Price: Low to High' },
  { value: 'price-desc', label: 'Price: High to Low' },
  { value: 'newest', label: 'Newest' },
  { value: 'popular', label: 'Most Popular' },
  { value: 'rating', label: 'Best Rating' },
];

export default function Shop() {
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<ShopFilters>(DEFAULT_FILTERS);
  const [appliedFilters, setAppliedFilters] = useState<ShopFilters>(DEFAULT_FILTERS);
  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    setSearchTerm(searchParams.get('search')?.trim() ?? '');
  }, [searchParams]);

  useEffect(() => {
    document.title = 'Shop - ShopPrime';
    api.getProducts(appliedFilters).then((products) => {
      setAllProducts(products as Product[]);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [appliedFilters]);

  const filteredProducts = useMemo(() => {
    let result = [...allProducts];

    if (appliedFilters.category !== 'All') {
      result = result.filter((p) => p.category === appliedFilters.category);
    }

    if (appliedFilters.brands.length > 0) {
      result = result.filter((p) => p.brand && appliedFilters.brands.includes(p.brand));
    }

    result = result.filter(
      (p) => p.price >= appliedFilters.minPrice && p.price <= appliedFilters.maxPrice
    );

    if (appliedFilters.minRating > 0) {
      result = result.filter((p) => p.rating >= appliedFilters.minRating);
    }

    if (searchTerm) {
      const normalizedSearch = searchTerm.toLowerCase();
      result = result.filter((p) =>
        p.name.toLowerCase().includes(normalizedSearch)
        || p.category.toLowerCase().includes(normalizedSearch)
        || (p.brand?.toLowerCase() ?? '').includes(normalizedSearch)
        || (p.description?.toLowerCase() ?? '').includes(normalizedSearch)
      );
    }

    switch (appliedFilters.sortBy) {
      case 'price-asc':
        result.sort((a, b) => a.price - b.price);
        break;
      case 'price-desc':
        result.sort((a, b) => b.price - a.price);
        break;
      case 'popular':
        result.sort((a, b) => b.reviewCount - a.reviewCount);
        break;
      case 'rating':
        result.sort((a, b) => b.rating - a.rating);
        break;
      default:
        break;
    }

    return result;
  }, [allProducts, appliedFilters]);

  const totalPages = Math.ceil(filteredProducts.length / PRODUCTS_PER_PAGE);
  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * PRODUCTS_PER_PAGE,
    currentPage * PRODUCTS_PER_PAGE
  );

  const handleFilterChange = useCallback((updated: Partial<ShopFilters>) => {
    setFilters((prev) => ({ ...prev, ...updated }));
  }, []);

  const handleApplyFilters = useCallback(() => {
    setAppliedFilters(filters);
    setCurrentPage(1);
  }, [filters]);

  const handleReset = useCallback(() => {
    setFilters(DEFAULT_FILTERS);
    setAppliedFilters(DEFAULT_FILTERS);
    setCurrentPage(1);
  }, []);

  const handleSortChange = useCallback((sortBy: ShopFilters['sortBy']) => {
    setAppliedFilters((prev) => {
      const updated = { ...prev, sortBy };
      setCurrentPage(1);
      return updated;
    });
  }, []);

  const removeFilter = useCallback((updated: Partial<ShopFilters>) => {
    setAppliedFilters((prev) => {
      const next = { ...prev, ...updated };
      setCurrentPage(1);
      return next;
    });
  }, []);

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const categoryTitle = appliedFilters.category === 'All' ? 'All Products' : appliedFilters.category;
  const start = (currentPage - 1) * PRODUCTS_PER_PAGE + 1;
  const end = Math.min(currentPage * PRODUCTS_PER_PAGE, filteredProducts.length);
  const hasActiveFilters = appliedFilters.category !== 'All' ||
    appliedFilters.brands.length > 0 ||
    appliedFilters.maxPrice < MAX_FILTER_PRICE ||
    appliedFilters.minRating > 0;
  const hasSearchTerm = Boolean(searchTerm);

  return (
    <>
      <div className="container">
        <div className="shop-page">
          <ShopSidebar
            filters={filters}
            onFilterChange={handleFilterChange}
            onApply={handleApplyFilters}
            onReset={handleReset}
          />

          <div className="shop-main">
            <div className="shop-header">
              <div>
                <Breadcrumb items={[
                  { label: 'Home', to: '/' },
                  { label: 'Shop', to: '/shop' },
                  ...(appliedFilters.category !== 'All' ? [{ label: appliedFilters.category }] : []),
                ]} />
                <div className="shop-title">
                  <h1>{categoryTitle}</h1>
                </div>
                <div className="shop-subtitle">
                  {loading
                    ? 'Loading products...'
                    : filteredProducts.length === 0
                    ? 'No products found'
                    : `Showing ${start}-${end} of ${filteredProducts.length} products`}
                </div>
              </div>

              <div className="shop-header-actions">
                <div className="shop-search-summary">
                  {hasSearchTerm ? (
                    <span>
                      Showing results for <strong>"{searchTerm}"</strong>
                    </span>
                  ) : (
                    <span>Search products or filter by category, brand, and price.</span>
                  )}
                </div>

                <div className="view-toggle">
                  <button
                    onClick={() => setViewMode('grid')}
                    title="Grid view"
                    className={viewMode === 'grid' ? 'active' : ''}
                  >
                    <i className="bi bi-grid-3x3-gap" />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    title="List view"
                    className={viewMode === 'list' ? 'active' : ''}
                  >
                    <i className="bi bi-list-ul" />
                  </button>
                </div>

                <div className="sort-wrap">
                  <label htmlFor="shop-sort">Sort by:</label>
                  <select
                    id="shop-sort"
                    value={appliedFilters.sortBy}
                    onChange={(e) => handleSortChange(e.target.value as ShopFilters['sortBy'])}
                  >
                    {SORT_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {hasActiveFilters && (
              <FilterChips chips={[
                ...(appliedFilters.category !== 'All' ? [{ label: appliedFilters.category, type: 'category' as const, onRemove: () => removeFilter({ category: 'All' }) }] : []),
                ...appliedFilters.brands.map((brand) => ({ label: brand, type: 'brand' as const, onRemove: () => removeFilter({ brands: appliedFilters.brands.filter((item) => item !== brand) }) })),
                ...(appliedFilters.maxPrice < MAX_FILTER_PRICE ? [{ label: `Under $${appliedFilters.maxPrice.toLocaleString()}`, type: 'price' as const, onRemove: () => removeFilter({ maxPrice: MAX_FILTER_PRICE }) }] : []),
              ]}>
                <button className="clear-all-filters" onClick={handleReset}>Clear All</button>
              </FilterChips>
            )}

            {loading ? (
              <div className="shop-empty-state">
                <div className="empty-state"><p>Loading products...</p></div>
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="shop-empty-state">
                <EmptyState
                  icon="bi-search"
                  title="No products found"
                  description="Try adjusting your filters or search terms."
                  linkTo="/shop"
                  linkText="Reset Filters"
                />
              </div>
            ) : viewMode === 'grid' ? (
              <div className="products-grid">
                {paginatedProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            ) : (
              <div className="products-list">
                {paginatedProducts.map((product) => (
                  <ProductCard key={product.id} product={product} listView />
                ))}
              </div>
            )}

            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
            />
          </div>
        </div>
      </div>
    </>
  );
}
