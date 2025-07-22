// src/components/ProductDetail.js
import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';

const ProductDetail = () => {
  const [searchParams] = useSearchParams();
  const { state } = useLocation();
  const product = state?.product;
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [comment, setComment] = useState('');
  const productName = searchParams.get('query');

  const navigate = useNavigate();

  const user_id = localStorage.getItem('user_id'); // 👈 get user_id from storage
  const username = localStorage.getItem('username'); // 👈 get user_name from storage

  const getValidImageUrl = (imageUrl) => {
    const imageUrls = imageUrl?.split('|').map(url => url.trim());
    for (const url of imageUrls || []) {
      if (url) return url;
    }
    return 'https://via.placeholder.com/150';
  };

  const handleCardClick = (product) => {
    navigate(`/product-detail`, { state: { product } });
  };

  useEffect(() => {
    const fetchRecommendations = async () => {
      if (!productName) return;
      setLoading(true);
      setError('');
      try {
        const { data } = await axios.get(`http://localhost:5000/content-recommendation?item_name=${productName}`);
        setRecommendations(data);
      } catch (error) {
        setError('Failed to fetch recommendations. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchRecommendations();
  }, [productName]);

  const handleCommentSubmit = async () => {
    if (!user_id || !product?.ProdID || !comment) {
      console.log(user_id,product?.ProdID,comment)
      alert('Something went wrong. Make sure you are logged in and the comment is not empty.');
      return;
    }

    try {
      const response = await axios.post('http://localhost:5000/addcomment', {
        user_id,
        product_id: product?.ProdID,
        username,
        comment,
        productname:product?.Name,
        Brand: product?.Brand,
        Rating:product?.Rating,
        ReviewCount: product?.ReviewCount,
        description: product?.description,
      });

      if (response.status === 200) {
        alert('Review submitted successfully!');
        setComment('');
      } else {
        alert('Failed to submit review.');
      }
    } catch (error) {
      console.error('Error submitting review:', error);
      alert('Error submitting review. Try again later.');
    }
  };

  return (
    <div className="p-4 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-4">{product?.name}</h1>

      <div className="flex flex-col md:flex-row gap-8 bg-white p-6 shadow-md rounded-xl">
        <img
          src={getValidImageUrl(product?.ImageURL)}
          alt={product?.Name}
          className="w-full md:w-1/3 rounded-xl object-contain"
        />
        <div className="flex-1">
          <h2 className="text-2xl font-semibold">{product?.Name}</h2>
          <p className="text-gray-600 mt-2">Brand: {product?.Brand}</p>
          <p className="mt-1">Rating: {product?.Rating} ⭐</p>
          <p className="text-sm text-gray-500">{product?.ReviewCount} reviews</p>
          <p className="mt-4 text-gray-700">{product?.description}</p>

          {/* Review Section */}
          <div className="mt-6">
            <h3 className="text-xl font-semibold mb-2">Add a Review</h3>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Write your review here..."
              rows="4"
              className="w-full p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={handleCommentSubmit}
              className="mt-3 px-6 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition"
            >
              Submit Review
            </button>
          </div>
        </div>
      </div>

      <h3 className="text-2xl font-semibold mt-10 mb-4">Similar Products</h3>
      {loading && <p>Loading...</p>}
      {error && <p className="text-red-500">{error}</p>}
      {recommendations.length === 0 && !loading && !error && (
        <p>No recommendations found</p>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-4">
        {recommendations.map((rec) => (
          <div
            key={rec.ID}
            className="cursor-pointer bg-white p-4 rounded-xl shadow hover:shadow-lg transition"
            onClick={() => handleCardClick(rec)}
          >
            <img
              src={getValidImageUrl(rec.ImageURL)}
              alt={rec.Name}
              className="w-full h-48 object-contain rounded"
            />
            <div className="mt-2">
              <h2 className="text-lg font-semibold">{rec.Name}</h2>
              <p className="text-gray-500">{rec.Brand}</p>
              <p>Rating: {rec.Rating} ⭐</p>
              <p className="text-sm text-gray-400">{rec.ReviewCount} reviews</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProductDetail;
