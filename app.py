<<<<<<< HEAD
from flask import Flask, request, jsonify, session, render_template, redirect

from pymongo import MongoClient
from flask_session import Session
import os
from bson.objectid import ObjectId
=======
import os
import json
import base64
import requests
from flask import Flask, request, jsonify, session, render_template, redirect, url_for
from pymongo import MongoClient
import bcrypt
from dotenv import load_dotenv
import logging
from datetime import timedelta
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from flask_cors import CORS
from PIL import Image
import numpy as np
from io import BytesIO
# import torch
# import cv2
# from mobile_sam import sam_model_registry, SamPredictor

# Configure logging
logging.basicConfig(level=logging.DEBUG)  # Changed to DEBUG level
logger = logging.getLogger(__name__)

logger.debug("Starting application initialization...")

# Load environment variables
load_dotenv()
logger.debug("Environment variables loaded")
>>>>>>> hassan

# Initialize Flask app
app = Flask(__name__)
<<<<<<< HEAD

# ✅ MongoDB Configuration
MONGO_URI = "mongodb+srv://hassanmansuri570:hassan@cluster0.umcss.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"
DB_NAME = "Bombay"
SECRET_KEY = "07ab8e02adb154079d9a7fd6447ecbadade526493e88a7117d7818cb28af88d1"
SESSION_SECRET = "07ab8e02adb154079d9a7fd6447ecbadade526493e88a7117d7818cb28af88d1"
=======
CORS(app)
logger.debug("Flask app initialized")

# Configure session
app.secret_key = os.getenv('SESSION_SECRET')
if not app.secret_key:
    logger.error("SESSION_SECRET not set in environment variables!")
    raise ValueError("SESSION_SECRET not set in environment variables!")

app.config['SESSION_COOKIE_SECURE'] = True
app.config['SESSION_COOKIE_HTTPONLY'] = True
app.config['PERMANENT_SESSION_LIFETIME'] = timedelta(days=1)
app.config['SESSION_COOKIE_SAMESITE'] = 'Lax'
logger.debug("Session configuration completed")

# Configure rate limiter
limiter = Limiter(
    app=app,
    key_func=get_remote_address,
    default_limits=["200 per day", "50 per hour"]
)
logger.debug("Rate limiter configured")

# MongoDB Connection
MONGODB_URI = os.getenv('MONGODB_URI')
if not MONGODB_URI:
    logger.error("MONGODB_URI not set in environment variables!")
    raise ValueError("MONGODB_URI not set in environment variables!")
>>>>>>> hassan

# ✅ Flask Configurations
app.secret_key = SECRET_KEY
app.config["SESSION_TYPE"] = "filesystem"
app.config["SESSION_PERMANENT"] = False
os.makedirs('flask_session', exist_ok=True)  # Ensure directory exists for session files
Session(app)

# ✅ Connect to MongoDB
try:
<<<<<<< HEAD
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
=======
    client = MongoClient(MONGODB_URI, maxPoolSize=50)
    db = client['AdoebIIT']
    users = db['users']
    logger.info("Connected to MongoDB successfully")
except Exception as e:
    logger.error(f"Failed to connect to MongoDB: {e}")
    raise

# Hugging Face API
HUGGING_FACE_API_KEY = os.getenv('HUGGING_FACE_API_KEY')
HUGGING_FACE_API_URL = "https://api-inference.huggingface.co/models/stabilityai/stable-diffusion-2"
headers = {
    "Authorization": f"Bearer {HUGGING_FACE_API_KEY}"
}

# Password Hashing Functions
def hash_password(password):
    if not isinstance(password, str) or len(password) < 8:
        raise ValueError("Password must be a string of at least 8 characters")
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())

def check_password(password, hashed):
    if not isinstance(password, str):
        return False
    try:
        return bcrypt.checkpw(password.encode('utf-8'), hashed)
    except Exception:
        return False

# Input validation
def validate_registration_input(data):
    if not all(isinstance(v, str) for v in [data.get('name', ''), data.get('username', ''), 
                                          data.get('email', ''), data.get('password', '')]):
        return False, "Invalid input types"
    if not all(v.strip() for v in [data.get('name', ''), data.get('username', ''), 
                                  data.get('email', ''), data.get('password', '')]):
        return False, "Empty fields not allowed"
    if len(data.get('password', '')) < 8:
        return False, "Password must be at least 8 pjesama8 characters"
    return True, ""

# SAM Model Initialization
def download_model():
    # logger.info("Downloading SAM model...")
    # sam_checkpoint = "mobile_sam.pt"
    # if not os.path.exists(sam_checkpoint):
    #     url = "https://raw.githubusercontent.com/ChaoningZhang/MobileSAM/master/weights/mobile_sam.pt"
    #     response = requests.get(url)
    #     with open(sam_checkpoint, 'wb') as f:
    #         f.write(response.content)
    #     logger.info("SAM model downloaded successfully")
    # return sam_checkpoint
    pass

def initialize_model():
    # logger.info("Initializing SAM model...")
    # model_type = "vit_t"
    # sam_checkpoint = download_model()
    # device = torch.device('cpu')
    # logger.info(f"Using device: {device}")
    # sam = sam_model_registry[model_type](checkpoint=sam_checkpoint)
    # sam.to(device=device)
    # predictor = SamPredictor(sam)
    # logger.info("SAM model initialized successfully")
    # return predictor
    pass

# predictor = initialize_model()

# Routes
@app.route('/')
def home():
    try:
        if 'user' in session:
            user = users.find_one({'username': session['user']})
            return render_template('dashboard.html', username=session['user'], name=user.get('name', session['user']))
        return render_template('login.html')
    except Exception as e:
        logger.error(f"Error in home route: {e}")
        return "Error loading page", 500
>>>>>>> hassan

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
@limiter.limit("5 per minute")
def register():
<<<<<<< HEAD
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
=======
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'Invalid JSON data'}), 400

        valid, message = validate_registration_input(data)
        if not valid:
            return jsonify({'error': message}), 400

        name = data['name'].strip()
        username = data['username'].strip()
        email = data['email'].strip()
        password = data['password']

        if users.find_one({'$or': [{'username': username}, {'email': email}]}):
            return jsonify({'error': 'Username or email already exists'}), 400

        try:
            hashed_password = hash_password(password)
        except ValueError as e:
            return jsonify({'error': str(e)}), 400

        users.insert_one({
            'name': name,
            'username': username,
            'email': email,
            'password': hashed_password
        })

        session.permanent = True
        session['user'] = username
        return jsonify({'message': 'Registration successful'})
    except Exception as e:
        logger.error(f"Registration error: {e}")
        return jsonify({'error': 'Registration failed'}), 500
>>>>>>> hassan

    # Set session after successful registration
    session['user_id'] = str(result.inserted_id)
    return jsonify({'message': 'User registered successfully', 'user_id': str(result.inserted_id)}), 201

# ✅ User Login
@app.route('/api/login', methods=['POST'])
@limiter.limit("10 per minute")
def login():
<<<<<<< HEAD
    data = request.json
    email = data.get('email')
    password = data.get('password')

    if not email or not password:
        return jsonify({'error': 'Email and password are required'}), 400
=======
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'Invalid JSON data'}), 400

        username = data.get('username', '').strip()
        password = data.get('password', '')

        if not username or not password:
            return jsonify({'error': 'Username and password are required'}), 400

        user = users.find_one({'username': username})
        if user and check_password(password, user['password']):
            session.permanent = True
            session['user'] = username
            return jsonify({'message': 'Login successful'})
>>>>>>> hassan

    user = users.find_one({"email": email})

    if not user or user['password'] != password:
        return jsonify({'error': 'Invalid credentials'}), 401
<<<<<<< HEAD
=======
    except Exception as e:
        logger.error(f"Login error: {e}")
        return jsonify({'error': 'Login failed'}), 500
>>>>>>> hassan

    session['user_id'] = str(user['_id'])
    return jsonify({'message': 'Login successful'}), 200

# ✅ User Logout
@app.route('/api/logout', methods=['POST'])
def logout():
<<<<<<< HEAD
    session.pop('user_id', None)
    return jsonify({'message': 'Logout successful'}), 200
=======
    session.clear()
    return jsonify({'message': 'Logout successful'})

@app.route('/dashboard')
def dashboard():
    if 'user' not in session:
        return redirect(url_for('home'))
    try:
        user = users.find_one({'username': session['user']})
        if not user:
            session.clear()
            return redirect(url_for('home'))
        return render_template('dashboard.html', username=session['user'], name=user.get('name', session['user']))
    except Exception as e:
        logger.error(f"Error in dashboard route: {e}")
        return "Error loading page", 500

@app.route('/forgot-password', methods=['GET', 'POST'])
def forgot_password():
    if request.method == 'POST':
        email = request.form.get('email')
        user = users.find_one({'email': email})
        if user:
            # TODO: Implement password reset email functionality
            return "Password reset link has been sent to your email"
        return "Email not found", 404
    return render_template('forgot_password.html')

@app.route('/help-faq')
def help_faq():
    if 'user' not in session:
        return redirect(url_for('home'))
    try:
        user = users.find_one({'username': session['user']})
        if not user:
            session.clear()
            return redirect(url_for('home'))
        return render_template('help_faq.html', username=session['user'], name=user.get('name', session['user']))
    except Exception as e:
        logger.error(f"Error in help_faq route: {e}")
        return "Error loading page", 500

@app.route('/create-segmentation')
def create_segmentation():
    if 'user' not in session:
        return redirect(url_for('home'))
    try:
        user = users.find_one({'username': session['user']})
        if not user:
            session.clear()
            return redirect(url_for('home'))
        user_name = user.get('name', session['user'])
        return render_template('create_segmentation.html', username=session['user'], name=user_name)
    except Exception as e:
        logger.error(f"Error in create_segmentation route: {e}")
        return "Error loading page", 500

@app.route('/segment', methods=['POST'])
def segment():
    return jsonify({"error": "Segmentation functionality is disabled for testing."}), 501

@app.route('/generate-image', methods=['POST'])
def generate_image():
    try:
        prompt = request.form.get('prompt')
        if not prompt:
            return jsonify({"error": "No prompt provided"}), 400

        response = requests.post(
            HUGGING_FACE_API_URL,
            headers=headers,
            json={"inputs": prompt}
        )

        if response.status_code != 200:
            return jsonify({"error": "Failed to generate image"}), response.status_code

        image_bytes = response.content
        image = Image.open(BytesIO(image_bytes))
        
        buffered = BytesIO()
        image.save(buffered, format="PNG")
        img_str = base64.b64encode(buffered.getvalue()).decode()
        
        return jsonify({"image_url": f"data:image/png;base64,{img_str}"})

    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/hover_segment', methods=['POST'])
def hover_segment():
    return jsonify({"error": "Hover segmentation functionality is disabled for testing."}), 501

@app.route('/test')
def test():
    return "Flask server is running!"
>>>>>>> hassan

# ✅ Run Flask App
if __name__ == '__main__':
<<<<<<< HEAD
    app.run(debug=True, port=5000)
=======
    try:
        logger.info("Starting Flask application...")
        app.run(
            host='0.0.0.0',
            port=5000,
            debug=True,
            use_reloader=False
        )
    except Exception as e:
        logger.error(f"Failed to start Flask application: {e}")
        raise
>>>>>>> hassan
