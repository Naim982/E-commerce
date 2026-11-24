import React from 'react';
import './shared.css';

const Pagination = ({ currentPage = 1, totalPages = 1, totalItems = 0, limit = 20, onPageChange }) => {
    if (totalPages <= 1 && totalItems <= limit) return null;

    const startItem = (currentPage - 1) * limit + 1;
    const endItem = Math.min(currentPage * limit, totalItems);

    const getPageNumbers = () => {
        const pages = [];
        const maxVisible = 5;
        let start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
        let end = Math.min(totalPages, start + maxVisible - 1);

        if (end - start + 1 < maxVisible) {
            start = Math.max(1, end - maxVisible + 1);
        }

        for (let i = start; i <= end; i++) {
            pages.push(i);
        }
        return pages;
    };

    return (
        <div className="admin-pagination">
            <div className="admin-pagination-info">
                Showing <strong>{startItem}</strong> - <strong>{endItem}</strong> of <strong>{totalItems}</strong> items
            </div>
            <div className="admin-pagination-controls">
                <button
                    type="button"
                    className="admin-page-btn"
                    onClick={() => onPageChange(currentPage - 1)}
                    disabled={currentPage <= 1}
                >
                    Previous
                </button>
                {getPageNumbers().map((pageNum) => (
                    <button
                        key={pageNum}
                        type="button"
                        className={`admin-page-btn ${pageNum === currentPage ? 'active' : ''}`}
                        onClick={() => onPageChange(pageNum)}
                    >
                        {pageNum}
                    </button>
                ))}
                <button
                    type="button"
                    className="admin-page-btn"
                    onClick={() => onPageChange(currentPage + 1)}
                    disabled={currentPage >= totalPages}
                >
                    Next
                </button>
            </div>
        </div>
    );
};

export default Pagination;
