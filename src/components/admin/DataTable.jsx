import React, { useState } from "react";
import { Search, Inbox, ChevronLeft, ChevronRight, X } from "lucide-react";

export function DataTable({
  columns = [],
  data = [],
  searchKey = "name",
  searchPlaceholder = "Search records...",
  itemsPerPage = 8,
  renderActions,
  renderMobileCard,
  headerAction,
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const filteredData = data.filter((item) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    const val = item[searchKey];
    if (typeof val === "string" && val.toLowerCase().includes(term)) {
      return true;
    }
    if (typeof val === "number" && String(val).includes(term)) {
      return true;
    }
    // Also search across name, category, brand, email, orderNumber, phone, code, description
    const emailMatch = (item.customerEmail || item.customer_email || item.email || "").toLowerCase().includes(term);
    const orderNumMatch = (item.orderNumber || item.order_number || String(item.id || "")).toLowerCase().includes(term);
    const phoneMatch = (item.customerPhone || item.customer_phone || item.phone || "").toLowerCase().includes(term);
    const nameMatch = (item.name || item.customerName || item.code || "").toLowerCase().includes(term);
    const catMatch = (item.category || item.description || "").toLowerCase().includes(term);
    const brandMatch = (item.brand || "").toLowerCase().includes(term);
    return emailMatch || orderNumMatch || phoneMatch || nameMatch || catMatch || brandMatch;
  });

  const totalPages = Math.ceil(filteredData.length / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentItems = filteredData.slice(startIndex, startIndex + itemsPerPage);

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200/80 shadow-xs overflow-hidden mb-6 sm:mb-8 transition-all">
      {/* Table Toolbar Header */}
      <div className="p-3.5 sm:p-5 border-b border-gray-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4 bg-white">
        <div className="relative flex-1 max-w-full sm:max-w-md">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder={searchPlaceholder}
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-10 pr-9 py-2.5 text-xs sm:text-sm bg-gray-50/70 hover:bg-gray-50 focus:bg-white border border-gray-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-[#111111]/15 focus:border-[#111111] transition-all placeholder:text-gray-400"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700"
              title="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-3 justify-between sm:justify-end">
          <div className="text-xs font-semibold text-gray-500">
            <span>Showing: </span>
            <span className="font-bold text-gray-900 bg-gray-100 px-2 py-0.5 rounded-md">
              {filteredData.length} records
            </span>
          </div>
          {headerAction && <div>{headerAction}</div>}
        </div>
      </div>

      {/* Empty State (Shared for Mobile & Desktop) */}
      {currentItems.length === 0 ? (
        <div className="px-6 py-14 text-center text-gray-400">
          <div className="flex flex-col items-center justify-center gap-2">
            <div className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center text-gray-400 mb-1">
              <Inbox className="w-6 h-6" />
            </div>
            <span className="font-bold text-gray-700 text-sm">No Matching Records Found</span>
            <p className="text-xs text-gray-500 max-w-xs">
              Try adjusting your search criteria or clear your current query filter.
            </p>
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm("")}
                className="mt-2 text-xs font-bold text-black underline underline-offset-4 cursor-pointer"
              >
                Clear search query
              </button>
            )}
          </div>
        </div>
      ) : (
        <>
          {/* 1. Mobile Responsive Card View (< md screens) */}
          <div className="block md:hidden divide-y divide-gray-100">
            {currentItems.map((item, rowIndex) => {
              const absoluteIndex = startIndex + rowIndex;
              if (renderMobileCard) {
                return (
                  <div
                    key={item.id || item._id || rowIndex}
                    className="p-3.5 hover:bg-gray-50/60 transition-colors"
                  >
                    {renderMobileCard(item, absoluteIndex)}
                  </div>
                );
              }

              return (
                <div
                  key={item.id || item._id || rowIndex}
                  className="p-4 space-y-3 hover:bg-gray-50/60 transition-colors"
                >
                  <div className="space-y-2.5">
                    {columns.map((col, colIndex) => {
                      const content = col.render
                        ? col.render(item, absoluteIndex)
                        : item[col.key];
                      const isPrimary =
                        colIndex === 0 ||
                        col.key === "name" ||
                        col.key === "customerName" ||
                        col.key === "code";

                      if (isPrimary) {
                        return (
                          <div
                            key={colIndex}
                            className="flex items-center justify-between gap-2 pb-1"
                          >
                            <div className="min-w-0 flex-1">{content}</div>
                          </div>
                        );
                      }

                      return (
                        <div
                          key={colIndex}
                          className="flex items-center justify-between gap-3 text-xs py-1 border-t border-gray-50"
                        >
                          <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400 shrink-0">
                            {col.title}
                          </span>
                          <div className="text-right min-w-0">{content}</div>
                        </div>
                      );
                    })}
                  </div>

                  {renderActions && (
                    <div className="pt-2.5 border-t border-gray-100 flex items-center justify-between gap-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                        Manage
                      </span>
                      <div className="flex items-center justify-end gap-1.5">
                        {renderActions(item)}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* 2. Desktop & Tablet Full Table View (>= md screens) */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm text-gray-700 border-collapse">
              <thead>
                <tr className="bg-gray-50/75 border-b border-gray-200 text-[11px] uppercase tracking-wider font-bold text-gray-500 select-none">
                  {columns.map((col, idx) => (
                    <th
                      key={idx}
                      style={{ width: col.width }}
                      className="px-5 py-3.5 whitespace-nowrap"
                    >
                      {col.title}
                    </th>
                  ))}
                  {renderActions && (
                    <th className="px-5 py-3.5 text-right whitespace-nowrap" style={{ width: 140 }}>
                      Actions
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-normal">
                {currentItems.map((item, rowIndex) => (
                  <tr
                    key={item.id || item._id || rowIndex}
                    className="hover:bg-gray-50/80 transition-colors group"
                  >
                    {columns.map((col, colIndex) => (
                      <td key={colIndex} className="px-5 py-4 align-middle whitespace-nowrap">
                        {col.render ? col.render(item, startIndex + rowIndex) : item[col.key]}
                      </td>
                    ))}
                    {renderActions && (
                      <td className="px-5 py-4 align-middle text-right whitespace-nowrap">
                        {renderActions(item)}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Pagination Bar */}
      {totalPages > 1 && (
        <div className="px-4 sm:px-5 py-3.5 sm:py-4 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-500 bg-gray-50/30">
          <div className="text-[11px] sm:text-xs">
            Showing <strong className="text-gray-900 font-semibold">{startIndex + 1}</strong> to{" "}
            <strong className="text-gray-900 font-semibold">
              {Math.min(startIndex + itemsPerPage, filteredData.length)}
            </strong>{" "}
            of <strong className="text-gray-900 font-semibold">{filteredData.length}</strong> entries
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              disabled={currentPage === 1}
              onClick={() => handlePageChange(currentPage - 1)}
              className="inline-flex items-center justify-center w-8 h-8 rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
              title="Previous Page"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => {
              if (
                p === 1 ||
                p === totalPages ||
                (p >= currentPage - 1 && p <= currentPage + 1)
              ) {
                const isActive = currentPage === p;
                return (
                  <button
                    key={p}
                    type="button"
                    onClick={() => handlePageChange(p)}
                    className={`inline-flex items-center justify-center min-w-8 h-8 px-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      isActive
                        ? "bg-[#111111] text-[#D6FF00] shadow-xs"
                        : "border border-gray-200 bg-white text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    {p}
                  </button>
                );
              }
              if (p === currentPage - 2 || p === currentPage + 2) {
                return (
                  <span key={p} className="px-1 text-gray-400">
                    ...
                  </span>
                );
              }
              return null;
            })}

            <button
              type="button"
              disabled={currentPage === totalPages}
              onClick={() => handlePageChange(currentPage + 1)}
              className="inline-flex items-center justify-center w-8 h-8 rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
              title="Next Page"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default DataTable;
