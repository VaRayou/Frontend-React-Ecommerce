import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Slider from "../../components/user/Slider";
import ProductCard from "../../components/shop/ProductCard";
import ProductFilter from "../../components/shop/ProductFilter";
import { productService } from "../../services/productService";
import { categoryService } from "../../services/categoryService";
import Loader from "../../components/common/Loader";

function Home() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTabCategory, setActiveTabCategory] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [prodList, catList] = await Promise.all([
          productService.getProducts(),
          categoryService.getCategories(),
        ]);
        setProducts(prodList);
        setCategories(catList);
        if (catList && catList.length > 0) {
          setActiveTabCategory(catList[0].name);
        }
      } catch (err) {
        console.error("Failed to load homepage data", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const featuredProducts = products.filter((p) => p.isFeatured).slice(0, 6);
  const tabProducts = products.filter(
    (p) => activeTabCategory && p.category && p.category.toLowerCase() === activeTabCategory.toLowerCase()
  );
  const recommendedProducts = products.filter((p) => p.isRecommended).slice(0, 3);
  const tabCategories = categories.length > 0
    ? categories.slice(0, 6).map((c) => c.name)
    : ["Electronics", "Accessories"];

  return (
    <>
      {/* Banner / Slider */}
      <Slider />

      <section>
        <div className="container">
          <div className="row">
            {/* Sidebar Column */}
            <div className="col-sm-3">
              <ProductFilter
                categories={categories}
                selectedCategory="all"
                onSelectCategory={(cat) => {
                  window.location.href = cat === "all" ? "/shop" : `/shop?category=${encodeURIComponent(cat)}`;
                }}
                maxPrice={160}
                onChangeMaxPrice={(price) => {
                  window.location.href = `/shop?maxPrice=${price}`;
                }}
                selectedBrand=""
                onSelectBrand={(brand) => {
                  window.location.href = `/shop?brand=${encodeURIComponent(brand)}`;
                }}
                onClearFilters={() => {}}
              />
            </div>

            {/* Main Content Column */}
            <div className="col-sm-9 padding-right">
              {loading ? (
                <Loader message="Loading fresh products..." />
              ) : (
                <>
                  {/* Features Items */}
                  <div className="features_items">
                    <h2 className="title text-center">Features Items</h2>
                    <div className="row">
                      {featuredProducts.map((product) => (
                        <ProductCard
                          key={product.id}
                          product={product}
                          columnClass="col-sm-4"
                        />
                      ))}
                    </div>
                  </div>

                  {/* Category Tabs Section */}
                  <div className="category-tab">
                    <div className="col-sm-12">
                      <ul className="nav nav-tabs">
                        {tabCategories.map((tab) => (
                          <li
                            key={tab}
                            className={activeTabCategory && activeTabCategory.toLowerCase() === tab.toLowerCase() ? "active" : ""}
                          >
                            <a
                              href={`#${tab}`}
                              onClick={(e) => {
                                e.preventDefault();
                                setActiveTabCategory(tab);
                              }}
                            >
                              {tab}
                            </a>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="tab-content" style={{ marginTop: 20 }}>
                      <div className="tab-pane fade active in">
                        <div className="row">
                          {tabProducts.length > 0 ? (
                            tabProducts.slice(0, 4).map((product) => (
                              <ProductCard
                                key={product.id}
                                product={product}
                                columnClass="col-sm-3"
                              />
                            ))
                          ) : (
                            <div className="col-sm-12 text-center" style={{ padding: "30px 0", color: "#888" }}>
                              <p>No products currently available under {activeTabCategory}.</p>
                              <Link to="/shop" className="btn btn-default add-to-cart">
                                Browse All Products
                              </Link>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Recommended Items */}
                  <div className="recommended_items">
                    <h2 className="title text-center">Recommended Items</h2>
                    <div className="row">
                      {recommendedProducts.map((product) => (
                        <ProductCard
                          key={product.id}
                          product={product}
                          columnClass="col-sm-4"
                        />
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

export default Home;

