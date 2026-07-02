import { ChevronLeft, ChevronRight } from 'lucide-react';

export const Pagination = ({ currentPage, totalPages, onPageChange, loading = false }) => {
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between border-t border-surface-100 bg-surface-50/20 px-6 py-4">
      <span className="text-[10px] font-bold uppercase tracking-wider text-app-text/50">
        Page {currentPage} of {totalPages}
      </span>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1 || loading}
          className="flex h-8 w-8 items-center justify-center rounded-full border border-surface-200 bg-surface-50 text-app-text disabled:opacity-40 disabled:cursor-not-allowed hover:bg-surface-50/10 transition-colors cursor-pointer"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages || loading}
          className="flex h-8 w-8 items-center justify-center rounded-full border border-surface-200 bg-surface-50 text-app-text disabled:opacity-40 disabled:cursor-not-allowed hover:bg-surface-50/10 transition-colors cursor-pointer"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};
