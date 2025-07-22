import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './Home.css';
import Products from './Products';

const Home = ({ cart, setCart, handleAddToCart }) => {
  const [recommendations, setRecommendations] = useState([]);
  const [topRated, setTopRated] = useState([]);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [hybridRecommendations, setHybridRecommendations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState(0);

  const navigate = useNavigate();
  const userId = localStorage.getItem("user_id");

  const fetchRelatedProducts = async () => {
    try {
      if (!userId) return;
      const response = await fetch(`http://localhost:5000/recommend-by-brand?user_id=${userId}`);
      const data = await response.json();
      if (response.ok) {
        const relatedItems = data?.slice(0, 15);
        setRelatedProducts(relatedItems);
      }
    } catch (error) {
      console.error("Error fetching related products:", error);
    }
  };

  const fetchCollaborativeRecommendations = async () => {
    try {
      if (!userId) return;
      setLoading(true);
      const { data } = await axios.get(`http://localhost:5000/recommendations?user_id=${userId}`);
      const filtered = data.filter(rec => rec.Rating > 0.0);
      setRecommendations(filtered);
    } catch (error) {
      setError('Failed to fetch recommendations.');
    } finally {
      setLoading(false);
    }
  };

  const fetchTopRatedProducts = async () => {
    try {
      setLoading(true);
      const { data } = await axios.get('http://localhost:5000/rating-recommendation');
      setTopRated(data);
    } catch (error) {
      setError('Failed to fetch top-rated products.');
    } finally {
      setLoading(false);
    }
  };

  const fetchHybridRecommendations = async () => {
    try {
      if (!userId) return;
      setLoading(true);
      // Get a sample product from recommendations to use for hybrid recommendations
      const sampleProduct = recommendations[0]?.Name || "shampoo";
      const { data } = await axios.get(
        `http://localhost:5000/hybrid-recommendation?user_id=${userId}&item_name=${sampleProduct}`
      );
      // Use the hybrid recommendations from the response
      setHybridRecommendations(data.hybrid || []);
    } catch (error) {
      console.error("Error fetching hybrid recommendations:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCart = async () => {
    try {
      if (!userId) return;
      const response = await fetch(`http://localhost:5000/get_cart?user_id=${userId}`);
      const data = await response.json();
      if (response.ok) {
        setCart(data.cart);
      }
    } catch (error) {
      console.error("Error fetching cart:", error);
    }
  };

  useEffect(() => {
    fetchRelatedProducts();
    fetchCollaborativeRecommendations();
    fetchTopRatedProducts();
    fetchCart();
  }, [userId]);

  // Fetch hybrid recommendations when collaborative recommendations are loaded
  useEffect(() => {
    if (recommendations.length > 0) {
      fetchHybridRecommendations();
    }
  }, [recommendations]);

  const handleCardClick = (product) => {
    navigate(`/product-detail?query=${product.Name}`, { state: { product } });
  };

  const renderProducts = () => {
    switch (activeTab) {
      case 0:
        return <Products items={recommendations} handleAddToCart={handleAddToCart} fetchCart={fetchCart} handleClick={handleCardClick} />;
      case 1:
        return <Products items={relatedProducts} handleAddToCart={handleAddToCart} fetchCart={fetchCart} handleClick={handleCardClick} />;
      case 2:
        return <Products items={topRated} handleAddToCart={handleAddToCart} fetchCart={fetchCart} handleClick={handleCardClick} />;
      case 3:
        return <Products items={hybridRecommendations} handleAddToCart={handleAddToCart} fetchCart={fetchCart} handleClick={handleCardClick} />;
      default:
        return <Products items={recommendations} handleAddToCart={handleAddToCart} fetchCart={fetchCart} handleClick={handleCardClick} />;
    }
  };

  return (
    <div className="home-container min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Discover Products</h1>
          <p className="text-lg text-gray-600">Personalized recommendations just for you</p>
        </div>

        <div className="flex flex-col items-center mb-12">
          <div className="flex flex-wrap justify-center gap-2 bg-white p-2 rounded-full shadow-md">
            {['Recommended', 'Related to You', 'Top Rated', 'Hybrid'].map((tab, index) => (
              <button
                key={index}
                className={`px-6 py-2 rounded-full transition-all duration-300 ${
                  activeTab === index 
                    ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg'
                    : 'text-gray-600 hover:bg-gray-100'
                } font-medium`}
                onClick={() => setActiveTab(index)}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {loading && (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        )}
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6 text-center">
            {error}
          </div>
        )}

        {!loading && renderProducts()}
      </div>

      <footer className="bg-gray-800 text-white py-8 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p>&copy; {new Date().getFullYear()} Rahilkhan Recommendation System. All rights reserved.</p>
          <div className="flex justify-center space-x-6 mt-4">
            <a href="#" className="text-gray-300 hover:text-white">Privacy Policy</a>
            <a href="#" className="text-gray-300 hover:text-white">Terms of Service</a>
            <a href="#" className="text-gray-300 hover:text-white">Contact Us</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;