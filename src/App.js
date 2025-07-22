import React, { useState } from 'react';
import {Route, Routes } from 'react-router-dom';
import { HashRouter as Router } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './components/Home';
import Cart from './components/Cart';
import SignIn from './components/SignIn';
import Login from './components/Login';
import Account from './components/Account';
import Search from './components/Search';  
import ProductDetail from './components/ProductDetail';
import Brand from './components/Brand';
import ProductsByBrand from './components/ProductsByBrand';
import AdminDashboard from './components/AdminDashboard ';

const App = () => {
  const [userEmail, setUserEmail] = useState(null);
  const [cart, setCart] = useState([])

  const fetchCart = async () => {
    try {
      const userId = localStorage.getItem('user_id');

        if (!userId) return;

        const response = await fetch(`http://localhost:5000/get_cart?user_id=${userId}`);
        const data = await response.json();

        if (response.ok) {
            setCart(data.cart);  // Update cart state
        } else {
            console.error("Error fetching cart:", data.error);
        }
    } catch (error) {
        console.error("Error fetching cart:", error);
    }
  };

  const handleAddToCart = async (product) => {
    try {
         // Retrieve the logged-in user ID
         const userId = localStorage.getItem('user_id');
        if (!userId) {
            alert("Please log in first!");
            return;
        }

        const response = await fetch("http://localhost:5000/add_to_cart", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                user_id: userId,
                product: product, // Send full product object
            }),
        });

        const data = await response.json();

        if (response.ok) {
            alert(data.message);
            fetchCart(); // Refresh cart after adding
        } else {
            alert(`Error: ${data.error}`);
        }
    } catch (error) {
        console.error("Error adding product to cart:", error);
    }
};
  
  const handleRemoveFromCart = async (productId, productName, action = '') => {
      try {
          const userId = localStorage.getItem("user_id");
          if (!userId) {
              alert("Please log in first!");
              return;
          }

          const item = cart.find(item => item.Name === productName);
          if (!item) return;

          let updatedCart;

          if (action === 'remove') {
              updatedCart = cart.filter(item => item.Name !== productName);
              setCart(updatedCart);

              await fetch("http://localhost:5000/remove_from_cart", {
                  method: "POST",
                  headers: {
                      "Content-Type": "application/json",
                  },
                  body: JSON.stringify({
                      user_id: userId,
                      product_name: productName,
                  }),
              });
          } else {
              if (item.count > 1) {
                  updatedCart = cart.map(item =>
                      item.Name === productName ? { ...item, count: item.count - 1 } : item
                  );
                  setCart(updatedCart);
              } else {
                  updatedCart = cart.filter(item => item.Name !== productName);
                  setCart(updatedCart);
              }

              await fetch("http://localhost:5000/decrease_cart_quantity", {
                  method: "POST",
                  headers: {
                      "Content-Type": "application/json",
                  },
                  body: JSON.stringify({
                      user_id: userId,
                      product_name: productName,
                  }),
              });
          }

          fetchCart();
      } catch (error) {
          console.error("Error removing product from cart:", error);
      }
  };

  const handleIncreaseCount = async (productId,productName) => {
          try {
              const userId = localStorage.getItem("user_id");
      
              if (!userId) {
                  alert("Please log in first!");
                  return;
              }
      
              const updatedCart = cart.map(item =>
                  item.Nane === productName ? { ...item, count: item.count + 1 } : item
              );
      
              setCart(updatedCart);
      
              // Update database
              const response = await fetch("http://localhost:5000/increase_cart_count", {
                  method: "POST",
                  headers: {
                      "Content-Type": "application/json",
                  },
                  body: JSON.stringify({
                      user_id: userId,
                      product_id: productId,
                      product_name:productName
                  }),
              });
      
              const data = await response.json();
      
              if (!response.ok) {
                  alert(`Error: ${data.error}`);
              }

              fetchCart()
          } catch (error) {
              console.error("Error increasing product count:", error);
          }
  };

  const handleLogin = (email) => {
    setUserEmail(email);  
  };

  const handleLogout = () => {
    setUserEmail(null); // Clear user email on logout
  };

  return (
    <Router>
      <Navbar userEmail={userEmail} handleLogout={handleLogout} />
      <Routes>
        <Route path="/" element={<Home cart={cart} setCart={setCart} handleAddToCart={handleAddToCart}/>} />
        <Route path="/cart" element={<Cart cart={cart} setCart={setCart} handleIncreaseCount={handleIncreaseCount} handleRemoveFromCart={handleRemoveFromCart} fetchCart={fetchCart}/>} />
        <Route path="/signin" element={<SignIn handleLogin={handleLogin} />} />
        <Route path="/login" element={<Login handleLogin={handleLogin} />} />
        <Route path="/account" element={<Account handleLogin={handleLogin} />} />
        <Route path="/search" element={<Search cart={cart} setCart={setCart} handleAddToCart={handleAddToCart}/>} />  
        <Route path="/product-detail" element={<ProductDetail cart={cart} setCart={setCart} handleAddToCart={handleAddToCart}/>} />
        <Route path="/Brand" element={<Brand cart={cart} setCart={setCart} handleAddToCart={handleAddToCart}/>} />
       <Route path="/products" element={<ProductsByBrand cart={cart} setCart={setCart} handleAddToCart={handleAddToCart}/>} />
       <Route path="/admin-dashboard" element={<AdminDashboard />} />
        
      </Routes>
    </Router>
  );
};

export default App;
