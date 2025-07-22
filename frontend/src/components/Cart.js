import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Cart.css';

const Cart = ({cart,setCart, handleRemoveFromCart, handleIncreaseCount, fetchCart}) => {
    const getValidImageUrl = (imageUrl) => {
        console.log(imageUrl)
        const imageUrls = imageUrl?.split('|').map(url => url.trim());
        for (const url of imageUrls) {
          if (url) return url;
        }
        return 'https://via.placeholder.com/150'; 
      };

    const navigate = useNavigate();
    
    // Call fetchCart when the component mounts
    useEffect(() => {
        fetchCart();
    }, []);

    return (
        <div className="cart-container">
            <h1>Your Cart</h1>
            {cart.length === 0 ? (
                <p>Your cart is empty.</p>
            ) : (
                <div className="product-grid">
                    {cart.map((item) => (
                        <div key={item.ProdID} className="product-card">
                            <img src={getValidImageUrl(item.ImageURL)} alt={item.Name} className="product-image" />
                            <div className="product-info">
                                <h2>{item.Name}</h2>
                                <p>{item.Brand}</p>
                                <p>Rating: {item.Rating} ⭐</p>
                                <p>{item.ReviewCount} reviews</p>
                                <div className="quantity-controls border">
                <button onClick={() => handleRemoveFromCart(item.ProdID, item.Name)}>-</button>
                <span>{item.count}</span>
                <button onClick={() => handleIncreaseCount(item.ProdID, item.Name)}>+</button>
            </div>
                                <button className="remove-from-cart-button bg-blue-500 p-1 m-1" onClick={() => handleRemoveFromCart(item.ProdID,item.Name,'remove')}>Remove</button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
            <button className="go-back-button" onClick={() => navigate('/')}>Go Back</button>
        </div>
    );
};

export default Cart;
