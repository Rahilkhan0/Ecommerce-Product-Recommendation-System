import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Search.css';
import Products from './Products';

const Search = ({ cart, setCart, handleAddToCart }) => {
  const [searchParams] = useSearchParams();
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const productName = searchParams.get('query');
  const navigate = useNavigate();

  // Store last searched product with additional details
  const storeLastSearchedProduct = (productName, results) => {
    if (productName && results?.length > 0) {
      const lastProduct = {
        name: productName,
        timestamp: new Date().toISOString(),
        relatedProducts: results.slice(0, 3).map(p => p.Name)
      };
      localStorage.setItem('lastSearchedProduct', JSON.stringify(lastProduct));
    }
  };

  const getValidImageUrl = (imageUrl) => {
    const urls = imageUrl?.split('|').map(url => url.trim()).filter(Boolean);
    return urls?.[0] || 'https://via.placeholder.com/150';
  };

  const handleCardClick = (product) => {
    navigate(`/product-detail?query=${product.Name}`, { state: { product } });
  };

  useEffect(() => {
    const fetchRecommendations = async () => {
      if (!productName) return;
      setLoading(true);
      setError('');
      try {
        const response = await axios.get(`http://localhost:5000/content-recommendation`, {
          params: { item_name: productName }
        });
        setRecommendations(response.data);
        storeLastSearchedProduct(productName, response.data);
      } catch (err) {
        console.error(err);
        setError('Failed to fetch recommendations. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchRecommendations();
  }, [productName]);

  return (
    <div className="search-container">
      <h1>Search Results for "{productName}"</h1>

      {loading && <div className="loading-spinner"></div>}
      {error && <p className="error-message">{error}</p>}
      {!loading && !error && recommendations.length === 0 && (
        <p className="no-results">No recommendations found.</p>
      )}

      <Products
        items={recommendations}
        handleAddToCart={handleAddToCart}
        handleClick={handleCardClick}
      />
    </div>
  );
};

export default Search;