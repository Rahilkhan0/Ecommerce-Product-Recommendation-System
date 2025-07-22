import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import axios from "axios";
import "./ProductsByBrand.css"; // Import the CSS file for styling
import Products from "./Products";

const ProductsByBrand = ({cart, setCart, handleAddToCart}) => {
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const brand = params.get("brand");

  const [products, setProducts] = useState([]);

  useEffect(() => {
    if (brand) {
      axios
        .get(`http://localhost:5000/products/brand?brand=${encodeURIComponent(brand)}`)
        .then((response) => {
          setProducts(response.data);
          
          
        })
        .catch((error) => console.error("Error fetching products:", error.message));
    }
  }, [brand]);
  console.log(products)

  return (
    <div>
      <h2>Products for {brand}</h2>
        {products.length > 0 ? (
          <Products items={products} handleAddToCart={handleAddToCart} handleClick={()=>{}}/>
        ) : (
          <p>No products found for this brand.</p>
        )}
    </div>
  );
};

export default ProductsByBrand;
  