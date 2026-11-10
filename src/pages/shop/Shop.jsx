import React, { useState, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import ProductCard from "../../components/shop/ProductCard";
import ProductFilter from "../../components/shop/ProductFilter";
import { productService } from "../../services/productService";
import { categoryService } from "../../services/categoryService";
import Loader from "../../components/common/Loader";

function Shop() {
  const [searchParams, setSearchParams] = useSearchParams();

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filter & Sort states
  const categoryParam = searchParams.get("category") || "all";
  const searchParam = searchParams.get("search") || "";
  const brandParam = searchParams.get("brand") || "";
  const maxPriceParam = Number(searchParams.get("maxPrice")) || 160;

  const [sortBy, setSortBy] = useState("default");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [prodList, catList] = await Promise.all([
          productService.getProducts({
            category: categoryParam,
            search: searchParam,
            maxPrice: maxPriceParam,
            sortBy,
          }),
          categoryService.getCategories(),
        ]);

        let filtered = prodList;
        if (brandParam) {
          filtered = filtered.filter(
            (p) => p.brand?.toLowerCase() === brandParam.toLowerCase()
          );
        }

        setProducts(filtered);
        setCategories(catList);
      } catch (err) {
        console.error("Error loading products", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
    setCurrentPage(1);
  }, [categoryParam, searchParam, brandParam, maxPriceParam, sortBy]);

  // Update query params helper
  const updateQuery = (key, value) => {
    const params = new URLSearchParams(searchParams);
    if (value && value !== "all") {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    setSearchParams(params);
  };

  const handleClearFilters = () => {
    setSearchParams({});
    setSortBy("default");
  };

  // Pagination calculation
  const totalPages = Math.ceil(products.length / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentProducts = products.slice(startIndex, startIndex + itemsPerPage);

  return (
    <>
      {/* Shop Banner */}
      <section id="advertisement">
        <div className="container">
          <img
            src="/user/images/shop/advertisement.jpg"
            alt="Shop Promotion"
            className="img-responsive"
            style={{ width: "100%", maxHeight: 160, objectFit: "cover" }}
          />
        </div>
      </section>

      <section style={{ marginTop: 20 }}>
        <div className="container">
          <div className="row">
            {/* Sidebar Column */}
            <div className="col-sm-3">
              <ProductFilter
                categories={categories}
                selectedCategory={categoryParam}
                onSelectCategory={(cat) => updateQuery("category", cat)}
                maxPrice={maxPriceParam}
                onChangeMaxPrice={(price) => updateQuery("maxPrice", price)}
                selectedBrand={brandParam}
                onSelectBrand={(brand) => updateQuery("brand", brand)}
                onClearFilters={handleClearFilters}
              />
            </div>

            {/* Products Listing Column */}
            <div className="col-sm-9 padding-right">
              {/* Toolbar */}
              <div className="shop-toolbar">
                <div style={{ fontSize: 13, color: "#696763" }}>
                  Showing <strong>{products.length === 0 ? 0 : startIndex + 1}</strong> -{" "}
                  <strong>{Math.min(startIndex + itemsPerPage, products.length)}</strong> of{" "}
                  <strong>{products.length}</strong> items
                  {searchParam && <span> for &ldquo;{searchParam}&rdquo;</span>}
                </div>

                <div className="shop-sort-group">
                  <label htmlFor="shop-sort" style={{ margin: 0, fontSize: 13, color: "#363432", fontWeight: 600 }}>
                    Sort by:
                  </label>
                  <select
                    id="shop-sort"
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                  >
                    <option value="default">Default</option>
                    <option value="price-asc">Price: Low to High</option>
                    <option value="price-desc">Price: High to Low</option>
                    <option value="name-asc">Product Name: A to Z</option>
                    <option value="name-desc">Product Name: Z to A</option>
                  </select>
                </div>
              </div>

              {/* Active Filter Badges */}
              {(categoryParam !== "all" || searchParam || brandParam || maxPriceParam < 160) && (
                <div style={{ marginBottom: 18 }}>
                  <span style={{ fontSize: 13, marginRight: 8, color: "#666" }}>Active filters:</span>
                  {categoryParam !== "all" && (
                    <span
                      className="active-filter-badge"
                      onClick={() => updateQuery("category", "all")}
                    >
                      Category: {categoryParam} <i className="fa fa-times"></i>
                    </span>
                  )}
                  {brandParam && (
                    <span
                      className="active-filter-badge"
                      onClick={() => updateQuery("brand", "")}
                    >
                      Brand: {brandParam} <i className="fa fa-times"></i>
                    </span>
                  )}
                  {searchParam && (
                    <span
                      className="active-filter-badge"
                      onClick={() => updateQuery("search", "")}
                    >
                      Search: &ldquo;{searchParam}&rdquo; <i className="fa fa-times"></i>
                    </span>
                  )}
                  {maxPriceParam < 160 && (
                    <span
                      className="active-filter-badge"
                      onClick={() => updateQuery("maxPrice", 160)}
                    >
                      Max: ${maxPriceParam} <i className="fa fa-times"></i>
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={handleClearFilters}
                    style={{
                      background: "none",
                      border: "none",
                      color: "#fe980f",
                      fontSize: 12,
                      cursor: "pointer",
                      textDecoration: "underline",
                    }}
                  >
                    Clear all
                  </button>
                </div>
              )}

              {/* Product Grid */}
              {loading ? (
                <Loader message="Loading products..." />
              ) : currentProducts.length === 0 ? (
                <div
                  style={{
                    backgroundColor: "#fff",
                    border: "1px solid #f7f7f0",
                    padding: "50px 20px",
                    textAlign: "center",
                    marginBottom: 30,
                  }}
                >
                  <i className="fa fa-search" style={{ fontSize: 48, color: "#d5d5cd", marginBottom: 16 }}></i>
                  <h3 style={{ fontSize: 20, color: "#363432", marginBottom: 8 }}>No matching products found</h3>
                  <p style={{ color: "#888", marginBottom: 20 }}>
                    Try adjusting your search criteria, category filters, or price range.
                  </p>
                  <button
                    type="button"
                    className="btn btn-default add-to-cart"
                    onClick={handleClearFilters}
                  >
                    Reset Filters
                  </button>
                </div>
              ) : (
                <div className="row">
                  {currentProducts.map((product) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      columnClass="col-sm-4"
                    />
                  ))}
                </div>
              )}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="text-center" style={{ margin: "20px 0 40px" }}>
                  <ul className="pagination" style={{ margin: 0 }}>
                    <li className={currentPage === 1 ? "disabled" : ""}>
                      <a
                        href="#prev"
                        onClick={(e) => {
                          e.preventDefault();
                          if (currentPage > 1) setCurrentPage(currentPage - 1);
                        }}
                      >
                        &laquo;
                      </a>
                    </li>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                      <li
                        key={page}
                        className={currentPage === page ? "active" : ""}
                      >
                        <a
                          href={`#page-${page}`}
                          onClick={(e) => {
                            e.preventDefault();
                            setCurrentPage(page);
                            window.scrollTo({ top: 300, behavior: "smooth" });
                          }}
                        >
                          {page}
                        </a>
                      </li>
                    ))}
                    <li className={currentPage === totalPages ? "disabled" : ""}>
                      <a
                        href="#next"
                        onClick={(e) => {
                          e.preventDefault();
                          if (currentPage < totalPages) setCurrentPage(currentPage + 1);
                        }}
                      >
                        &raquo;
                      </a>
                    </li>
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

export default Shop;

