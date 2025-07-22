import React, { useEffect, useState } from "react";
import axios from "axios";
import "./AdminDashboard.css"; // Add styles similar to Search if needed

const AdminDashboard = () => {
  const [topProducts, setTopProducts] = useState([]);
  const [topBrands, setTopBrands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const getValidImageUrl = (url) => {
    if (!url || url === "nan") {
      return "https://via.placeholder.com/150";
    }
    return url;
  };

  useEffect(() => {
    axios
      .get("http://localhost:5000/admin-dashboard-data")
      .then((res) => {
        console.log("Admin data:", res.data);
        setTopProducts(res.data.top_products || []);
        setTopBrands(res.data.top_brands || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching admin data:", err);
        setError("Failed to fetch admin data");
        setLoading(false);
      });
  }, []);

  return (
    <div className="admin-dashboard">
      <h1>Admin Dashboard</h1>

      {loading && <p>Loading...</p>}
      {error && <p className="error">{error}</p>}

      {/* Top Rated Products */}
      <h2>Top Rated Products</h2>
      {topProducts.length === 0 && !loading && !error && (
        <p>No top products found</p>
      )}
      <div className="recommendation-container">
        {topProducts.map((rec) => (
          <div key={rec.ProdID} className="recommendation-card">
            <img
              src={getValidImageUrl(rec.ImageURL)}
              alt={rec.Name}
              className="product-image"
            />
            <div className="product-info">
              <h2>{rec.Name}</h2>
              <p>{rec.Brand}</p>
              <p>Rating: {rec.Rating} ⭐</p>
              <button className="add-to-cart-button">View</button>
            </div>
          </div>
        ))}
      </div>

      {/* Top Brands */}
      <h2>Top Brands by Average Rating</h2>
      {topBrands.length === 0 && !loading && !error && (
        <p>No top brands found</p>
      )}
      <ul className="brand-list">
        {topBrands.map((brand, index) => (
          <li key={index}>
            <strong>{brand.Brand}</strong> - Avg. Rating: {brand.AverageRating.toFixed(2)} ⭐
          </li>
        ))}
      </ul>
    </div>
  );
};

export default AdminDashboard;
