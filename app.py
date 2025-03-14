from flask import Flask, request, jsonify, session, render_template, redirect

from pymongo import MongoClient
from flask_session import Session
import os
from bson.objectid import ObjectId

app = Flask(__name__)

# ✅ MongoDB Configuration
MONGO_URI = "mongodb+srv://hassanmansuri570:hassan@cluster0.umcss.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"
DB_NAME = "Bombay"
SECRET_KEY = "07ab8e02adb154079d9a7fd6447ecbadade526493e88a7117d7818cb28af88d1"
SESSION_SECRET = "07ab8e02adb154079d9a7fd6447ecbadade526493e88a7117d7818cb28af88d1"

# ✅ Flask Configurations
app.secret_key = SECRET_KEY
app.config["SESSION_TYPE"] = "filesystem"
app.config["SESSION_PERMANENT"] = False
os.makedirs('flask_session', exist_ok=True)  # Ensure directory exists for session files
Session(app)

# ✅ Connect to MongoDB
try:
    client = MongoClient(MONGO_URI)
    db = client[DB_NAME]  # Connect to database
    users = db["users"]  # Reference to users collection
    print("✅ Connected to MongoDB Successfully!")
except Exception as e:
    print(f"❌ MongoDB Connection Failed: {e}")
    exit(1)

# ✅ Home Route
@app.route('/')
def home():
    # If user is already logged in, redirect to dashboard
    if 'user_id' in session:
        return redirect('/dashboard')
    return render_template('login.html')

# ✅ Dashboard Route (Added)
@app.route('/dashboard')
def dashboard():
    # Check if user is logged in
    if 'user_id' not in session:
        return redirect('/')
    
    # Get user data
    user_id = session.get('user_id')
    try:
        user = users.find_one({"_id": ObjectId(user_id)})
        if not user:
            session.pop('user_id', None)
            return redirect('/')
        
        # Pass only needed user data (exclude password)
        user_data = {
            "username": user.get("username", "User"),
            "email": user.get("email")
        }
        return render_template('dashboard.html', user=user_data)
    except Exception as e:
        print(f"Error loading user data: {e}")
        session.pop('user_id', None)
        return redirect('/')

# ✅ User Registration
@app.route('/api/register', methods=['POST'])
def register():
    data = request.json
    username = data.get("username")
    email = data.get('email')
    password = data.get('password')

    if    not password:
        return jsonify({'error': 'Missing username or email or password'}), 400

    if users.find_one({"email": email}):
        return jsonify({'error': 'Email already registered'}), 400

    if users.find_one({"username": username}):
       return jsonify({'error': 'Username already taken'}), 400
    
    user_data = {
        "username": username,
        "email": email, 
        "password": password
    }
    result = users.insert_one(user_data)

    # Set session after successful registration
    session['user_id'] = str(result.inserted_id)
    return jsonify({'message': 'User registered successfully', 'user_id': str(result.inserted_id)}), 201

# ✅ User Login
@app.route('/api/login', methods=['POST'])
def login():
    data = request.json
    email = data.get('email')
    password = data.get('password')

    if not email or not password:
        return jsonify({'error': 'Email and password are required'}), 400

    user = users.find_one({"email": email})

    if not user or user['password'] != password:
        return jsonify({'error': 'Invalid credentials'}), 401

    session['user_id'] = str(user['_id'])
    return jsonify({'message': 'Login successful'}), 200

# ✅ User Logout
@app.route('/api/logout', methods=['POST'])
def logout():
    session.pop('user_id', None)
    return jsonify({'message': 'Logout successful'}), 200

# ✅ Run Flask App
if __name__ == '__main__':
    app.run(debug=True, port=5000)