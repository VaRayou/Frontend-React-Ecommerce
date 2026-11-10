import React from "react";
import { Link } from "react-router-dom";

function ProductFilter({
  categories = [],
  selectedCategory = "all",
  onSelectCategory,
  maxPrice,
  onChangeMaxPrice,
  selectedBrand,
  onSelectBrand,
  onClearFilters,
}) {
  const brands = ["Nike", "Adidas", "Armani", "Chanel", "Gucci", "Prada", "Puma", "Guess", "Fendi", "Valentino"];

  return (
    <div className="left-sidebar">
      {/* Category Section */}
      <h2>Category</h2>
      <div className="panel-group category-products" id="accordian">
        <div className="panel panel-default">
          <div className="panel-heading">
            <h4 className="panel-title">
              <a
                href="#all"
                onClick={(e) => {
                  e.preventDefault();
                  onSelectCategory("all");
                }}
                style={{
                  color: selectedCategory === "all" ? "#fe980f" : "#696763",
                  fontWeight: selectedCategory === "all" ? "700" : "normal",
                }}
              >
                All Categories
              </a>
            </h4>
          </div>
        </div>

        {categories.map((cat) => {
          const isActive = selectedCategory?.toLowerCase() === cat.name.toLowerCase();
          return (
            <div className="panel panel-default" key={cat.id}>
              <div className="panel-heading">
                <h4 className="panel-title">
                  <a
                    href={`#${cat.slug}`}
                    onClick={(e) => {
                      e.preventDefault();
                      onSelectCategory(cat.name);
                    }}
                    style={{
                      color: isActive ? "#fe980f" : "#696763",
                      fontWeight: isActive ? "700" : "normal",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <span>{cat.name}</span>
                    <span className="badge pull-right" style={{ background: isActive ? "#fe980f" : "#f5f5ed", color: isActive ? "#fff" : "#888" }}>
                      {cat.itemCount || ""}
                    </span>
                  </a>
                </h4>
              </div>
            </div>
          );
        })}
      </div>

      {/* Brands Section */}
      <div className="brands_products">
        <h2>Brands</h2>
        <div className="brands-name">
          <ul className="nav nav-pills nav-stacked">
            {brands.map((brand) => {
              const isBrandActive = selectedBrand === brand;
              return (
                <li key={brand}>
                  <a
                    href={`#${brand}`}
                    onClick={(e) => {
                      e.preventDefault();
                      onSelectBrand(isBrandActive ? "" : brand);
                    }}
                    style={{
                      color: isBrandActive ? "#fe980f" : "#696763",
                      fontWeight: isBrandActive ? "bold" : "normal",
                    }}
                  >
                    {isBrandActive && <i className="fa fa-check" style={{ marginRight: 6 }}></i>}
                    {brand}
                  </a>
                </li>
              );
            })}
          </ul>
        </div>
      </div>

      {/* Price Range Filter */}
      <div className="price-range" style={{ marginTop: 24, marginBottom: 20 }}>
        <h2>Price Range</h2>
        <div className="well text-center" style={{ background: "#f5f5ed", padding: 18, border: "1px solid #e8e8e0" }}>
          <label style={{ display: "block", marginBottom: 8, fontSize: 13, color: "#363432", fontWeight: 600 }}>
            Max Price: <span style={{ color: "#fe980f", fontSize: 16 }}>${maxPrice}</span>
          </label>
          <input
            type="range"
            min="20"
            max="160"
            step="5"
            value={maxPrice}
            onChange={(e) => onChangeMaxPrice(Number(e.target.value))}
            style={{ width: "100%", accentColor: "#fe980f" }}
          />
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8, fontSize: 12, color: "#888" }}>
            <span>$20</span>
            <span>$160+</span>
          </div>
        </div>
      </div>

      {/* Clear Filters Button */}
      {(selectedCategory !== "all" || selectedBrand || maxPrice < 160) && (
        <div style={{ marginBottom: 20 }}>
          <button
            type="button"
            className="btn btn-default"
            onClick={onClearFilters}
            style={{
              width: "100%",
              backgroundColor: "#fff",
              border: "1px dashed #d9534f",
              color: "#d9534f",
              padding: "8px 12px",
            }}
          >
            <i className="fa fa-times" style={{ marginRight: 6 }}></i>
            Reset All Filters
          </button>
        </div>
      )}

      {/* Shipping Promo Ad Image */}
      <div className="shipping text-center">
        <Link to="/shop">
          <img src="/user/images/home/shipping.jpg" alt="Shipping Discount" className="img-responsive" />
        </Link>
      </div>
    </div>
  );
}

export default ProductFilter;

