import { memo, useMemo } from 'react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

const Pagination = memo(function Pagination({ currentPage, totalPages, onPageChange }: PaginationProps) {
  // eslint-disable-next-line react/display-name -- name set via memo(function)

  const pages = useMemo(() => {
    if (totalPages <= 1) return [];
    const pages: (number | '...')[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage > 3) pages.push('...');
      for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
        pages.push(i);
      }
      if (currentPage < totalPages - 2) pages.push('...');
      pages.push(totalPages);
    }
    return pages;
  }, [currentPage, totalPages]);

  if (totalPages <= 1) return null;

  return (
    <div className="pagination-wrap">
      <button
        className="pagination-btn"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        aria-label="Previous page"
      >
        <i className="bi bi-chevron-left" />
      </button>

      {pages.map((page, idx) =>
        page === '...' ? (
          <button key={`ellipsis-${idx}`} className="pagination-btn pagination-ellipsis" disabled>
            …
          </button>
        ) : (
          <button
            key={page}
            className={`pagination-btn${page === currentPage ? ' active' : ''}`}
            onClick={() => onPageChange(page as number)}
            aria-label={`Page ${page}`}
            aria-current={page === currentPage ? 'page' : undefined}
          >
            {page}
          </button>
        )
      )}

      <button
        className="pagination-btn"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        aria-label="Next page"
      >
        <i className="bi bi-chevron-right" />
      </button>
    </div>
  );
});

export default Pagination;
