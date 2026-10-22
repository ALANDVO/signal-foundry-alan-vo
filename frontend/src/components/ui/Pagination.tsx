import React from 'react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  showPageNumbers?: boolean;
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
  showPageNumbers = true,
}) => {
  if (totalPages <= 1) return null;

  const pages = showPageNumbers
    ? Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
        if (totalPages <= 5) return i + 1;
        if (currentPage <= 3) return i + 1;
        if (currentPage >= totalPages - 2) return totalPages - 4 + i;
        return currentPage - 2 + i;
      })
    : [];

  return (
    <nav className="pagination" aria-label="Pagination">
      <button
        className="page-link"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        aria-label="Previous page"
      >
        ‹
      </button>

      {showPageNumbers && (
        <>
          {currentPage > 3 && totalPages > 5 && (
            <>
              <button className="page-link" onClick={() => onPageChange(1)}>1</button>
              {currentPage > 4 && <span className="page-link" style={{ pointerEvents: 'none' }}>…</span>}
            </>
          )}

          {pages.map((page) => (
            <button
              key={page}
              className={`page-link ${page === currentPage ? 'active' : ''}`}
              onClick={() => onPageChange(page)}
              aria-current={page === currentPage ? 'page' : undefined}
            >
              {page}
            </button>
          ))}

          {currentPage < totalPages - 2 && totalPages > 5 && (
            <>
              {currentPage < totalPages - 3 && <span className="page-link" style={{ pointerEvents: 'none' }}>…</span>}
              <button className="page-link" onClick={() => onPageChange(totalPages)}>{totalPages}</button>
            </>
          )}
        </>
      )}

      <button
        className="page-link"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        aria-label="Next page"
      >
        ›
      </button>
    </nav>
  );
};