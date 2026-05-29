import { ChevronLeft, ChevronRight } from 'lucide-react'

/**
 * Reusable pagination component for admin tables.
 * 
 * @param {number} currentPage - Current active page (1-indexed)
 * @param {number} totalItems - Total number of items
 * @param {number} perPage - Items per page
 * @param {function} onPageChange - Callback when page changes
 * @param {string} [label] - Label for showing count (e.g. "users", "items")
 */
export default function TablePagination({ currentPage, totalItems, perPage, onPageChange, label = 'data' }) {
  const totalPages = Math.max(1, Math.ceil(totalItems / perPage))

  // Generate page numbers with ellipsis
  const getPageNumbers = () => {
    const pages = []
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) pages.push(i)
    } else {
      pages.push(1)
      if (currentPage > 3) pages.push('...')
      
      const start = Math.max(2, currentPage - 1)
      const end = Math.min(totalPages - 1, currentPage + 1)
      for (let i = start; i <= end; i++) pages.push(i)
      
      if (currentPage < totalPages - 2) pages.push('...')
      pages.push(totalPages)
    }
    return pages
  }

  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * perPage + 1
  const endItem = Math.min(currentPage * perPage, totalItems)

  return (
    <div className="p-4 border-t flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-muted-foreground">
      <div>
        Menampilkan {startItem}–{endItem} dari {totalItems} {label}
      </div>
      {totalPages > 1 && (
        <div className="flex items-center gap-1">
          <button
            onClick={() => onPageChange(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            className="p-1.5 border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50 transition bg-white cursor-pointer disabled:cursor-not-allowed"
          >
            <ChevronLeft size={14} />
          </button>
          {getPageNumbers().map((p, i) =>
            p === '...' ? (
              <span key={`ellipsis-${i}`} className="px-2 text-gray-400">...</span>
            ) : (
              <button
                key={p}
                onClick={() => onPageChange(p)}
                className={`w-8 h-8 text-xs rounded-lg border transition cursor-pointer ${
                  p === currentPage
                    ? 'bg-emerald-700 text-white border-emerald-700 font-bold'
                    : 'border-gray-200 hover:bg-gray-50 bg-white text-gray-600'
                }`}
              >
                {p}
              </button>
            )
          )}
          <button
            onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
            className="p-1.5 border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50 transition bg-white cursor-pointer disabled:cursor-not-allowed"
          >
            <ChevronRight size={14} />
          </button>
        </div>
      )}
    </div>
  )
}

/**
 * Helper hook-like function to paginate an array.
 * Usage: const paginated = paginateArray(items, currentPage, perPage)
 */
export function paginateArray(items, currentPage, perPage) {
  const start = (currentPage - 1) * perPage
  return items.slice(start, start + perPage)
}
