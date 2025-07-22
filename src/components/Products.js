import { useNavigate } from "react-router-dom";

export default function Products({items, handleAddToCart, handleClick}){
    const getValidImageUrl = (imageUrl) => {
        const imageUrls = imageUrl.split('|').map(url => url.trim());
        for (const url of imageUrls) {
          if (url) return url;
        }
        return 'https://via.placeholder.com/150'; 
      };

    console.log(items)

    return(<div className="product-grid ">
        {items.length > 0 && items?.map((item) => (
            <div key={item.ProdID} className="product-card" onClick={()=>{handleClick(item)}}>
            <img src={getValidImageUrl(item.ImageURL)} alt={item.Name} className="product-image" />
            <div className="product-info">
                <h2>{item.Name}</h2>
                <p>{item.Brand}</p>
                <p>Rating: {item.Rating} ⭐</p>
                <p>{item.ReviewCount} reviews</p>
                <button className="add-to-cart-button p-2 m-2 mx-8" onClick={()=>{handleAddToCart(item)}}> Add to Cart</button>
            </div>
        </div>
        ))}
</div>
)
}