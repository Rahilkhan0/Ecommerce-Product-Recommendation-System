 
import React, { useState, useEffect } from "react";
import Products from "./Products";

const Brand = ({cart, setCart, handleAddToCart}) => {
    const [brands, setBrands] = useState([]);
    const [selectedBrand, setSelectedBrand] = useState("");
    const [products, setProducts] = useState([]);

    useEffect(() => {
        // Fetch list of brands
        fetch("http://127.0.0.1:5000/brands")
            .then((response) => response.json())
            .then((data) => setBrands(data))
            .catch((error) => console.error("Error fetching brands:", error));
    }, []);

    const handleBrandChange = (event) => {
        const brand = event.target.value;
        console.log(brand)
        setSelectedBrand(brand);

        // Fetch products based on selected brand
        fetch(`http://127.0.0.1:5000/products/brand?brand=${brand}`)
            .then((response) => response.json())
            .then((data) => {
                console.log(data)
                setProducts(data)})
            .catch((error) => console.error("Error fetching products:", error));
    };

    return (
        <div className="brand-container">
            <div className="brand">
                <a href="/Brand">Brands</a>
            </div>
            <select onChange={handleBrandChange} value={selectedBrand}>
                <option value="x ">Select a brand</option>
                {brands.map((brand, index) => (
                    <option key={index} value={brand}>
                        {brand}
                    </option>
                ))}
            </select>

            <div className="products-list">
                {products.length > 0 ? (
                    <Products items={products} handleAddToCart={handleAddToCart} handleClick={()=>{}}/>
                ) : (
                    <p>No products found for this brand.</p>
                )}
            </div>
        </div>
    );
};

export default Brand;
