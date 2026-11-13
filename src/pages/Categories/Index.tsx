import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles, ArrowUpRight } from "lucide-react";
import { categoryService } from "../../services/categoryService";

export const Categories: React.FC = () => {
  const [categoriesList, setCategoriesList] = useState<any[]>(() => {
    const cached = (categoryService as any).getCachedCategories?.();
    return Array.isArray(cached) ? cached : [];
  });

  useEffect(() => {
    categoryService
      .getCategories()
      .then((cats: any) => {
        if (Array.isArray(cats) && cats.length > 0) {
          setCategoriesList(
            cats.map((c: any, idx: number) => ({
              id: String(c.id || c._id || idx),
              name: c.name || "Collection",
              slug: c.slug || String(c.name || "").toLowerCase().replace(/\s+/g, "-"),
              description: c.description || `Architectural ${c.name} collection`,
              image:
                c.image ||
                "/uploads/bed6e30a33b2.jpg",
              itemCount: c.itemCount ?? c.count ?? 0,
            }))
          );
        }
      })
      .catch(() => {});
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8 py-6 sm:py-16 space-y-8 sm:space-y-14">
      {/* Page Header */}
      <div className="text-center max-w-2xl mx-auto space-y-2.5 sm:space-y-3">
        <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-black text-[#D6FF00] text-[10px] font-black tracking-[0.2em] uppercase">
          <Sparkles className="w-3 h-3" />
          <span>Curated Worlds</span>
        </span>
        <h1 className="text-2xl sm:text-5xl font-black tracking-tight text-black uppercase">
          Collections &amp; Disciplines
        </h1>
        <p className="text-xs sm:text-sm text-gray-500 font-light leading-relaxed">
          From sculptural leather accessories to fluid double-faced virgin wool tailoring.
          Explore each universe crafted with unyielding dedication to form and tactile materials.
        </p>
      </div>

      {/* Categories Grid (2 Large featured top + bottom grid) */}
      <div className="space-y-4 sm:space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          {categoriesList.slice(0, 2).map((cat, idx) => (
            <motion.div
              key={cat.id}
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: idx * 0.06, ease: [0.16, 1, 0.3, 1] }}
            >
              <Link
                to={`/shop?category=${cat.slug}`}
                className="group relative aspect-[16/10] sm:aspect-[16/9] rounded-2xl sm:rounded-3xl overflow-hidden bg-[#111111] flex flex-col justify-end p-5 sm:p-10 shadow-sm hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 block transform-gpu"
              >
                <img
                  src={cat.image}
                  alt={cat.name}
                  loading="lazy"
                  decoding="async"
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-106"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent opacity-85 group-hover:opacity-95 transition-opacity" />

                <div className="relative z-10 text-white space-y-1.5 sm:space-y-2">
                  <div className="flex items-center gap-2 text-[10px] sm:text-xs font-bold text-[#D6FF00] uppercase tracking-widest">
                    <Sparkles className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                    <span>{cat.itemCount} Designs Available</span>
                  </div>

                  <h2 className="text-xl sm:text-4xl font-black uppercase tracking-tight">
                    {cat.name}
                  </h2>

                  <p className="text-xs sm:text-sm text-gray-300 max-w-md line-clamp-1 sm:line-clamp-2">
                    {cat.description}
                  </p>

                  <div className="pt-1 sm:pt-2">
                    <span className="inline-flex items-center gap-2 px-4 sm:px-6 py-2 sm:py-3 rounded-full bg-white text-black text-[11px] sm:text-xs font-black uppercase tracking-widest group-hover:bg-[#D6FF00] transition-colors">
                      <span>Enter {cat.name}</span>
                      <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                    </span>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>

        {/* Remaining Categories */}
        {categoriesList.length > 2 && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-6">
            {categoriesList.slice(2).map((cat, idx) => (
              <motion.div
                key={cat.id}
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: 0.1 + idx * 0.05, ease: [0.16, 1, 0.3, 1] }}
              >
                <Link
                  to={`/shop?category=${cat.slug}`}
                  className="group relative aspect-[3/4] rounded-2xl sm:rounded-3xl overflow-hidden bg-[#111111] flex flex-col justify-end p-4 sm:p-6 shadow-sm hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 block transform-gpu"
                >
                  <img
                    src={cat.image}
                    alt={cat.name}
                    loading="lazy"
                    decoding="async"
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-108"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent opacity-85 group-hover:opacity-95 transition-opacity" />

                  <div className="relative z-10 text-white space-y-1">
                    <span className="text-[9px] sm:text-[10px] font-bold text-[#D6FF00] uppercase tracking-widest">
                      {cat.itemCount} Curations
                    </span>

                    <h3 className="text-base sm:text-xl font-extrabold uppercase tracking-tight truncate">
                      {cat.name}
                    </h3>

                    <p className="text-[10px] sm:text-[11px] text-gray-300 line-clamp-1 sm:line-clamp-2 hidden xs:block">
                      {cat.description}
                    </p>

                    <div className="pt-1 sm:pt-2">
                      <span className="inline-flex items-center gap-1 text-[11px] sm:text-xs font-bold text-white group-hover:text-[#D6FF00] transition-colors">
                        <span>Discover</span>
                        <ArrowUpRight className="w-3 h-3 sm:w-3.5 sm:h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                      </span>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Categories;

