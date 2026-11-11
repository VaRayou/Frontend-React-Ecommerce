import React from "react";
import { Product } from "../../types";
import { ProductCard } from "./ProductCard";

interface ProductGridProps {
  products: Product[];
  emptyMessage?: string;
  columns?: 3 | 4;
}

export const ProductGrid: React.FC<ProductGridProps> = ({
  products,
  emptyMessage = "No products found matching your criteria.",
  columns = 4,
}) => {
  if (products.length === 0) {
    return (
      <div className="text-center py-16 px-4 bg-white rounded-3xl border border-gray-100">
        <h4 className="font-bold text-black text-lg mb-1">No items found</h4>
        <p className="text-xs text-gray-500 max-w-sm mx-auto">{emptyMessage}</p>
      </div>
    );
  }

  const gridCols =
    columns === 3
      ? "grid-cols-2 md:grid-cols-3"
      : "grid-cols-2 md:grid-cols-3 lg:grid-cols-4";

  return (
    <div className={`grid ${gridCols} gap-x-2.5 sm:gap-x-6 gap-y-4 sm:gap-y-10`}>
      {products.map((product, idx) => (
        <ProductCard key={product.id} product={product} index={idx} />
      ))}
    </div>
  );
};

