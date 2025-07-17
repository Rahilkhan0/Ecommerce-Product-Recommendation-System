import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./Navbar.css";
import homeIcon from "../images/home.png";  
import cartIcon from "../images/cart.png"; 

const Navbar = () => {
  const [productName, setProductName] = useState("");
  const [userEmail, setUserEmail] = useState(localStorage.getItem("userEmail") || "");
  const [brands, setBrands] = useState([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    axios.get("http://localhost:5000/brands")
      .then((response) => {
        setBrands(response.data);
      })
      .catch((error) => console.error("Error fetching brands:", error.message));
  }, []);

  const toggleDropdown = () => setIsDropdownOpen((prev) => !prev);

  const handleBrandClick = (brand) => {
    navigate(`/products?brand=${encodeURIComponent(brand)}`);
    setIsDropdownOpen(false);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (productName.trim()) {
      navigate(`/search?query=${encodeURIComponent(productName)}`);
      setProductName("");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userEmail");
    setUserEmail("");
    navigate("/");
  };

  const getEmailDetails = (email) => {
    if (!email) return { initial: "", displayName: "" };
    const firstLetter = email[0].toUpperCase();
    const name = email.split("@")[0];
    return { initial: firstLetter, displayName: name };
  };

  const { initial, displayName } = getEmailDetails(userEmail);

  return (
    <header className="navbar-container">
      <nav className="navbar">
        <div className="navbar-left">
          <a href="/" className="home-link">
            <img src={homeIcon} alt="Home" className="nav-icon" />
            <span className="logo-text">ShopEase</span>
          </a>

          <div className="brand-dropdown">
            <button 
              className="brand-button" 
              onClick={toggleDropdown}
              aria-expanded={isDropdownOpen}
              aria-haspopup="true"
            >
              Brands <span className={`dropdown-arrow ${isDropdownOpen ? 'open' : ''}`}>▼</span>
            </button>
            {isDropdownOpen && (
              <div className="brand-menu">
                {brands.length > 0 ? (
                  brands
                    .filter(brand => brand !== 'opi')
                    .map((brand, index) => (
                      <button 
                        key={index} 
                        className="brand-item" 
                        onClick={() => handleBrandClick(brand)}
                      >
                        {brand}
                      </button>
                    ))
                ) : (
                  <div className="brand-item loading">Loading brands...</div>
                )}
              </div>
            )}
          </div>
        </div>

        <form onSubmit={handleSearch} className="search-container">
          <div className="search-bar">
            <input
              type="text"
              value={productName}
              onChange={(e) => setProductName(e.target.value)}
              placeholder="Search for products..."
              className="search-input"
              aria-label="Search products"
            />
            <button type="submit" className="search-button">
              <svg xmlns="http://www.w3.org/2000/svg" className="search-icon" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </form>

        <div className="navbar-right">
          <a href="/cart" className="cart-link">
            <img src={cartIcon} alt="Cart" className="nav-icon" />
            <span className="cart-text">Cart</span>
          </a>
          
          {userEmail ? (
            <div className="user-dropdown">
              <button className="user-profile" onClick={toggleDropdown}>
                <div className="user-avatar">{initial}</div>
                <span className="user-name">{displayName}</span>
              </button>
              {isDropdownOpen && (
                <div className="user-menu">
                  <button onClick={handleLogout} className="logout-button">
                    Logout
                  </button>
                </div>
              )}
            </div>
          ) : (
            <a href="/account" className="account-link">Sign In</a>
          )}
        </div>
      </nav>
    </header>
  );
};

export default Navbar;