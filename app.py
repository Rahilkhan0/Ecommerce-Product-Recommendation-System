from flask import Flask, jsonify, request
import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from flask_cors import CORS
from flask_pymongo import PyMongo
import bcrypt

app = Flask(__name__)
CORS(app)
app.config['MONGO_URI'] = 'mongodb://localhost:27017/MainProject'
mongo = PyMongo(app)

def hash_password(password):
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password.encode('utf-8'), salt)
    return hashed

def create_user(name, mobileNo, email, password):
    """Registers a new user"""
    user_id = mongo.db.users.count_documents({}) + 1
    hashed_password = hash_password(password)
    mongo.db.users.insert_one({
        "user_id": user_id,
        "name": name,
        "mobileNo": mobileNo,
        "email": email,
        "password": hashed_password,
        "cart": [],
        "is_admin": email == "admin@gmail.com"  # Flag admin accounts
    })

# ✅ Ensure the admin account is created at startup
if not mongo.db.users.find_one({"email": "admin@gmail.com"}):
    create_user("Admin", "0000000000", "admin@gmail.com", "admin123")
    print("✅ Admin account created.")

@app.route('/signup', methods=['POST'])
def signup():
    """Handles user registration"""
    data = request.get_json()
    name = data.get('name')
    mobileNo = data.get('mobileNo')
    email = data.get('email')
    password = data.get('password')

    if mongo.db.users.find_one({"email": email}):
        return jsonify({"message": "User already exists!"}), 409

    create_user(name, mobileNo, email, password)
    return jsonify({"message": "User registered successfully"}), 201

@app.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')

    user = mongo.db.users.find_one({"email": email})
    if user and bcrypt.checkpw(password.encode('utf-8'), user['password']):
        return jsonify({
            "message": "Login successful", 
            "user_id": user['user_id'], 
            "is_admin": user.get("is_admin", False)  # Default to False if not set
        }), 200
    return jsonify({"message": "Invalid credentials"}), 401

# Load the dataset from the CSV file
data = pd.read_csv('clean_data.csv')

@app.route('/content-recommendation', methods=['GET'])
def content_based_recommendations():
    item_name = request.args.get('item_name')

    if not item_name:
        return jsonify({'error': 'Item name is required'}), 400

    # Use partial matching instead of exact matching
    matching_items = data[data['Name'].str.contains(item_name, case=False, na=False)]
    
    if matching_items.empty:
        return jsonify({'error': f"Item '{item_name}' not found in the dataset"}), 404

    # If multiple items match, select the first one for recommendations
    item_index = matching_items.index[0]

    # Existing recommendation logic
    tfidf_vectorizer = TfidfVectorizer(stop_words='english')
    data['Tags'] = data['Tags'].fillna('')  # Fill missing tags
    tfidf_matrix_content = tfidf_vectorizer.fit_transform(data['Tags'])
    cosine_similarities_content = cosine_similarity(tfidf_matrix_content, tfidf_matrix_content)

    similar_items = list(enumerate(cosine_similarities_content[item_index]))
    similar_items = sorted(similar_items, key=lambda x: x[1], reverse=True)

    top_n = int(request.args.get('top_n', 10))
    top_similar_items = similar_items[1:top_n + 1]

    recommended_item_indices = [x[0] for x in top_similar_items]
    recommended_items_details = data.iloc[recommended_item_indices][['Name', 'ReviewCount', 'Brand', 'ImageURL', 'Rating']]

    return jsonify(recommended_items_details.to_dict(orient='records'))


@app.route('/rating-recommendation', methods=['GET'])
def rating_based_recommendations():
    try:
        average_ratings = data.groupby(['Name', 'ReviewCount', 'Brand', 'ImageURL'])['Rating'].mean().reset_index()
        top_rated_items = average_ratings.sort_values(by='Rating', ascending=False)
        rating_base_recommendation = top_rated_items.head(10)

        rating_base_recommendation['Rating'] = rating_base_recommendation['Rating'].astype(int)
        rating_base_recommendation['ReviewCount'] = rating_base_recommendation['ReviewCount'].astype(int)

        return jsonify(rating_base_recommendation.to_dict(orient='records'))

    except Exception as e:
        return jsonify({'error': str(e)}), 500
data = pd.read_csv('clean_data.csv')   
train_data = pd.read_csv('clean_data.csv')   

def collaborative_filtering_recommendations(train_data, target_user_id, top_n=20):
    # Create the user-item matrix
    user_item_matrix = train_data.pivot_table(index='ID', columns='ProdID', values='Rating', aggfunc='mean').fillna(0)

    # Calculate the user similarity matrix using cosine similarity
    user_similarity = cosine_similarity(user_item_matrix)

    # Find the index of the target user in the matrix
    target_user_index = user_item_matrix.index.get_loc(target_user_id)

    # Get the similarity scores for the target user
    user_similarities = user_similarity[target_user_index]

    # Sort the users by similarity in descending order (excluding the target user)
    similar_users_indices = user_similarities.argsort()[::-1][1:]

    # Generate recommendations based on similar users
    recommended_items = set()  # Use a set to avoid duplicate recommendations

    for user_index in similar_users_indices:
        # Get items rated by the similar user but not by the target user
        rated_by_similar_user = user_item_matrix.iloc[user_index]
        not_rated_by_target_user = (rated_by_similar_user > 0) & (user_item_matrix.iloc[target_user_index] == 0)

        # Extract the item IDs of recommended items
        recommended_items.update(user_item_matrix.columns[not_rated_by_target_user])

        # Stop if we have enough recommendations
        if len(recommended_items) >= top_n:
            break

    # Get the details of recommended items
    recommended_items_details = train_data[train_data['ProdID'].isin(recommended_items)][['Name','Brand', 'ReviewCount',  'ImageURL', 'Rating', "ProdID"]]

    return recommended_items_details.head(top_n)


@app.route('/recommendations', methods=['GET'])
def recommendations():
    user_id = request.args.get('user_id', type=int)
    if user_id is None:
        return jsonify({'error': 'User ID is required'}), 400

    # Call the collaborative filtering function
    recommended_items = collaborative_filtering_recommendations(train_data, user_id)

    return jsonify(recommended_items.to_dict(orient='records'))

@app.route('/search-similar-products', methods=['GET'])
def search_similar_products():
    item_description = request.args.get('description')

    if not item_description:
        return jsonify({'error': 'Description is required'}), 400

    # Use partial matching based on the description
    matching_items = data[data['Description'].str.contains(item_description, case=False, na=False)]

    if matching_items.empty:
        return jsonify({'error': 'No similar products found'}), 404

    # If multiple items match, select the first one for recommendations
    item_index = matching_items.index[0]

    # Existing content-based recommendation logic
    tfidf_vectorizer = TfidfVectorizer(stop_words='english')
    data['Tags'] = data['Tags'].fillna('')  # Fill missing tags
    tfidf_matrix_content = tfidf_vectorizer.fit_transform(data['Tags'])
    cosine_similarities_content = cosine_similarity(tfidf_matrix_content, tfidf_matrix_content)

    similar_items = list(enumerate(cosine_similarities_content[item_index]))
    similar_items = sorted(similar_items, key=lambda x: x[1], reverse=True)

    top_n = int(request.args.get('top_n', 10))
    top_similar_items = similar_items[1:top_n + 1]

    recommended_item_indices = [x[0] for x in top_similar_items]
    recommended_items_details = data.iloc[recommended_item_indices][['Name', 'ReviewCount', 'Brand', 'ImageURL', 'Rating']]

    return jsonify(recommended_items_details.to_dict(orient='records'))

df = pd.read_csv("clean_data.csv")  
#brands

# Load dataset
try:
    df = pd.read_csv("clean_data.csv")
except FileNotFoundError:
    print("Error: data file not found!")
    df = pd.DataFrame(columns=["Brand", "prodID", "name", "description", "ImageURL"])  # Empty DataFrame

@app.route("/brands", methods=["GET"])
def get_brands():
    """Fetch unique brand names from the dataset"""
    if df.empty:
        return jsonify({"error": "Dataset is empty"}), 500  
    brands = df["Brand"].dropna().unique().tolist()
    return jsonify(brands)

@app.route("/products/brand", methods=["GET"])
def get_products_by_brand():
    print("started")
    """Fetch products based on brand name"""
    brand_name = request.args.get("brand")
    if not brand_name:
        return jsonify({"error": "Brand parameter is required"}), 400

    filtered_products = df[df["Brand"].str.lower() == brand_name.lower()]
    
    if filtered_products.empty:
        return jsonify({"message": "No products found for this brand"}), 404

    # Convert to JSON format
    products = filtered_products.to_dict(orient="records")
    return jsonify(products)

 
@app.route("/brands/products", methods=["GET"])
def get_brands_with_products():
    """Fetch all brands with their products"""
    if df.empty:
        return jsonify({"error": "Dataset is empty"}), 500

    brands_products = df.groupby("Brand").apply(lambda x: x.to_dict(orient="records")).to_dict()
    return jsonify(brands_products)
if __name__ == "__main__":
    app.run(debug=True)


@app.route('/add_to_cart', methods=['POST'])
def add_to_cart():
    data = request.json
    user_id = data.get("user_id")
    product = data.get("product")  # Full product object

    if not user_id or not product:
        return jsonify({"error": "Missing user_id or product"}), 400

    user = mongo.db.users.find_one({"user_id": int(user_id)})

    if not user:
        return jsonify({"error": "User not found"}), 404

    # Check if product is already in the cart
    existing_cart = user.get("cart", [])
    for item in existing_cart:
        if item["Name"] == product["Name"]:
            # Increase count instead of adding a duplicate
            mongo.db.users.update_one(
                {"user_id": int(user_id), "cart.Name": product["Name"]},
                {"$inc": {"cart.$.count": 1}}  # Increment the count field
            )
            return jsonify({"message": "Product quantity increased"}), 200

    # If product is not in the cart, add it with count: 1
    product["count"] = 1  # Add count field
    mongo.db.users.update_one(
        {"user_id": int(user_id)},
        {"$push": {"cart": product}}
    )

    return jsonify({"message": "Product added to cart"}), 200

@app.route('/get_cart', methods=['GET'])
def get_cart():
    user_id = request.args.get("user_id")

    if not user_id:
        return jsonify({"error": "Missing user_id"}), 400

    user = mongo.db.users.find_one({"user_id": int(user_id)}, {"_id": 0, "cart": 1})

    if not user:
        return jsonify({"error": "User not found"}), 404

    return jsonify({"cart": user.get("cart", [])}), 200

@app.route('/decrease_cart_quantity', methods=['POST'])
def decrease_item_quantity():
    data = request.json
    user_id = data.get("user_id")
    product_name = data.get("product_name")

    user = mongo.db.users.find_one({"user_id": int(user_id)})
    if not user:
        return jsonify({"error": "User not found"}), 404

    cart = user.get("cart", [])
    for item in cart:
        if item["Name"] == product_name:
            if item.get("count", 1) > 1:
                item["count"] -= 1
            else:
                cart.remove(item)
            break

    mongo.db.users.update_one({"user_id": int(user_id)}, {"$set": {"cart": cart}})
    return jsonify({"message": "Item quantity updated", "cart": cart})


@app.route('/remove_from_cart', methods=['POST'])
def remove_from_cart():
    data = request.json
    user_id = data.get("user_id")
    product_name = data.get("product_name")

    user = mongo.db.users.find_one({"user_id": int(user_id)})
    if not user:
        return jsonify({"error": "User not found"}), 404

    cart = user.get("cart", [])
    cart = [item for item in cart if item["Name"] != product_name]

    mongo.db.users.update_one({"user_id": int(user_id)}, {"$set": {"cart": cart}})
    return jsonify({"message": "Item removed from cart", "cart": cart})

@app.route('/increase_cart_count', methods=['POST'])
def increase_cart_count():
    data = request.json
    user_id = data.get("user_id")
    product_id = data.get("product_id")
    product_name = data.get("product_name")

    user = mongo.db.users.find_one({"user_id": int(user_id)})
    if not user:
        return jsonify({"error": "User not found"}), 404

    cart = user.get("cart", [])

    for item in cart:
        if item["Name"] == product_name:
            item["count"] += 1  # Increase count
            break

    mongo.db.users.update_one({"user_id": int(user_id)}, {"$set": {"cart": cart}})
    return jsonify({"message": "Cart updated", "cart": cart})

@app.route("/recommend-by-brand", methods=["GET"])
def recommend_by_brand():
    user_id = request.args.get("user_id", type=int)
    
    if user_id is None:
        return jsonify({"error": "User ID is required"}), 400

    # Fetch user from MongoDB
    user = mongo.db.users.find_one({"user_id": user_id})
    
    if not user:
        return jsonify({"error": "User not found"}), 404

    # Extract brands from the user's cart
    cart_items = user.get("cart", [])
    
    if not cart_items:
        return jsonify({"message": "No items in cart"}), 200

    # Get unique brands from cart
    cart_brands = {item["Brand"] for item in cart_items if "Brand" in item}
    
    if not cart_brands:
        return jsonify({"message": "No brand information available in cart"}), 200

    # Fetch products matching the brands in the cart
    recommended_products = df[df["Brand"].isin(cart_brands)][["Name", "Brand", "ImageURL", "Rating", "ProdID"]]

    if recommended_products.empty:
        return jsonify({"message": "No recommended products found for these brands"}), 404

    return jsonify(recommended_products.to_dict(orient="records"))

@app.route('/admin-dashboard-data', methods=['GET'])
def get_admin_dashboard_data():
    data = pd.read_csv("clean_data.csv")
    data.columns = data.columns.str.strip()  # remove any unwanted whitespace just in case

    # 🔝 Top 10 products by rating
    top_products = data.sort_values(by='Rating', ascending=False).head(10)[
        ['ProdID', 'Name', 'Brand', 'Rating', 'ImageURL']
    ].to_dict(orient='records')

    # 🔝 Top brands by average rating
    top_brands = data.groupby('Brand')['Rating'].mean().sort_values(ascending=False).head(10).reset_index()
    top_brands = top_brands.rename(columns={'Rating': 'AverageRating'}).to_dict(orient='records')

    return jsonify({
        "top_products": top_products,
        "top_brands": top_brands
    })


 
    user_id = request.args.get('user_id', type=int)
    item_name = request.args.get('item_name', type=str)
    
    if user_id is None or item_name is None:
        return jsonify({'error': 'User ID and Item Name are required'}), 400

    # Content-Based Part
    matching_items = data[data['Name'].str.contains(item_name, case=False, na=False)]

    if matching_items.empty:
        return jsonify({'error': f"Item '{item_name}' not found in the dataset"}), 404

    item_index = matching_items.index[0]

    tfidf_vectorizer = TfidfVectorizer(stop_words='english')
    data['Tags'] = data['Tags'].fillna('')  
    tfidf_matrix_content = tfidf_vectorizer.fit_transform(data['Tags'])
    cosine_similarities_content = cosine_similarity(tfidf_matrix_content, tfidf_matrix_content)

    similar_items = list(enumerate(cosine_similarities_content[item_index]))
    similar_items = sorted(similar_items, key=lambda x: x[1], reverse=True)
    content_based_indices = [x[0] for x in similar_items[1:6]]  # Top 5 similar

    content_based_recommendations = data.iloc[content_based_indices][['ProdID', 'Name', 'Brand', 'ImageURL', 'Rating']]

    # Collaborative Filtering Part
    collab_recommendations = collaborative_filtering_recommendations(train_data, user_id, top_n=5)

    # Merge Recommendations
    combined_recommendations = pd.concat([content_based_recommendations, collab_recommendations]).drop_duplicates('ProdID').head(10)

    # Final Output
    return jsonify(combined_recommendations.to_dict(orient='records'))



@app.route('/addcomment', methods=['POST'])
def addcomment():
    print("hello")
    data = request.get_json()
    print(data)

    user_id = data.get("user_id")
    product_id = data.get("product_id")
    username = data.get("username")
    comment_text = data.get("comment")
    productname = data.get("productname")
    brand = data.get("Brand")
    rating = data.get("Rating")
    review_count = data.get("ReviewCount")
    description = data.get("description")

    if not user_id or not product_id or not comment_text:
        return jsonify({"error": "Missing data"}), 400

    comment_document = {
        "user_id": user_id,
        "product_id": product_id,
        "username": username,
        "comment": comment_text,
        "productname": productname,
        "brand": brand,
        "rating": rating,
        "review_count": review_count,
        "description": description
    }

    try:
        mongo.db.comments.insert_one(comment_document)
        return jsonify({"message": "Comment added successfully"}), 200
    except Exception as e:
        print("Error inserting comment:", e)
        return jsonify({"error": "Failed to add comment"}), 500



@app.route('/top-comments-products', methods=['GET'])
def top_comments_products():
    try:
        # Group by product_id and collect product-related info too
        pipeline = [
            {
                "$group": {
                    "_id": "$product_id",
                    "comment_count": {"$sum": 1},
                    "productname": {"$first": "$productname"},
                    "brand": {"$first": "$brand"},
                    "rating": {"$first": "$rating"},
                    "review_count": {"$first": "$review_count"},
                    "description": {"$first": "$description"}
                }
            },
            {"$sort": {"comment_count": -1}}
        ]

        results = list(mongo.db.comments.aggregate(pipeline))

        top_products = []
        for res in results:
            product_data = {
                "product_id": res["_id"],
                "comment_count": res["comment_count"],
                "productname": res.get("productname", ""),
                "brand": res.get("brand", ""),
                "rating": res.get("rating", None),
                "review_count": res.get("review_count", None),
                "description": res.get("description", None),
            }
            top_products.append(product_data)

        return jsonify(top_products), 200

    except Exception as e:
        print("Error fetching top comments products:", e)
        return jsonify({"error": "Failed to fetch top comments products"}), 500


@app.route('/hybrid-recommendation', methods=['GET'])
def hybrid_recommendations():
    user_id = request.args.get('user_id', type=int)
    item_name = request.args.get('item_name', type=str)
    top_n = request.args.get('top_n', default=10, type=int)
    
    if user_id is None:
        return jsonify({'error': 'User ID is required'}), 400

    try:
        # Initialize result dictionary
        recommendations = {
            'content_based': [],
            'collaborative': [],
            'hybrid': []
        }

        # Content-Based Recommendations (if item_name provided)
        if item_name:
            matching_items = data[data['Name'].str.contains(item_name, case=False, na=False)]
            
            if not matching_items.empty:
                item_index = matching_items.index[0]

                tfidf_vectorizer = TfidfVectorizer(stop_words='english')
                data['Tags'] = data['Tags'].fillna('')
                tfidf_matrix_content = tfidf_vectorizer.fit_transform(data['Tags'])
                cosine_sim_content = cosine_similarity(tfidf_matrix_content, tfidf_matrix_content)

                similar_items = list(enumerate(cosine_sim_content[item_index]))
                similar_items = sorted(similar_items, key=lambda x: x[1], reverse=True)
                
                content_indices = [x[0] for x in similar_items[1:top_n+1]]
                content_recs = data.iloc[content_indices][['ProdID', 'Name', 'Brand', 'ImageURL', 'Rating']]
                recommendations['content_based'] = content_recs.to_dict(orient='records')

        # Collaborative Filtering Recommendations
        collab_recs = collaborative_filtering_recommendations(train_data, user_id, top_n)
        recommendations['collaborative'] = collab_recs.to_dict(orient='records')

        # Hybrid Recommendations - Combine both approaches
        if item_name and not matching_items.empty:
            # Create weighted scores
            content_df = content_recs.copy()
            collab_df = collab_recs.copy()
            
            # Add ranking scores (1 = best)
            content_df['content_rank'] = range(1, len(content_df)+1)
            collab_df['collab_rank'] = range(1, len(collab_df)+1)
            
            # Merge the two recommendation sets
            hybrid_df = pd.merge(
                content_df, 
                collab_df, 
                on=['ProdID', 'Name', 'Brand', 'ImageURL', 'Rating'], 
                how='outer'
            ).fillna(top_n+1)  # Fill missing ranks with worst possible
            
            # Calculate hybrid score (lower is better)
            hybrid_df['hybrid_score'] = (
                0.6 * hybrid_df['content_rank'] +  # More weight to content-based
                0.4 * hybrid_df['collab_rank']    # Less weight to collaborative
            )
            
            # Sort by hybrid score and select top N
            hybrid_df = hybrid_df.sort_values('hybrid_score').head(top_n)
            recommendations['hybrid'] = hybrid_df[['ProdID', 'Name', 'Brand', 'ImageURL', 'Rating']].to_dict(orient='records')
        else:
            # If no item_name provided, just use collaborative
            recommendations['hybrid'] = recommendations['collaborative']

        return jsonify(recommendations)

    except Exception as e:
        app.logger.error(f"Error in hybrid recommendations: {str(e)}")
        return jsonify({'error': f'Recommendation failed: {str(e)}'}), 500
