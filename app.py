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

# Initialize Flask app
app = Flask(__name__)
CORS(app, supports_credentials=True)
logger.debug("Flask app initialized")

# Configure session
app.secret_key = os.getenv('SESSION_SECRET')
if not app.secret_key:
    logger.error("SESSION_SECRET not set in environment variables!")
    raise ValueError("SESSION_SECRET not set in environment variables!")

# For local development, do NOT use secure cookies (set to True in production)
app.config['SESSION_COOKIE_SECURE'] = False  # Set to True in production!
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

try:
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

@app.route('/api/register', methods=['POST'])
@limiter.limit("5 per minute")
def register():
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

@app.route('/api/login', methods=['POST'])
@limiter.limit("10 per minute")
def login():
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

        return jsonify({'error': 'Invalid credentials'}), 401
    except Exception as e:
        logger.error(f"Login error: {e}")
        return jsonify({'error': 'Login failed'}), 500

@app.route('/api/logout', methods=['POST'])
def logout():
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
    # Multi-key Stable Diffusion (core) integration
    API_KEYS = [
        "sk-k0UAi2X9KKdx15LTFalN8GqN7UkBDKkCEkxAXFZjzNpxNTT0",
        # Add more keys here if you have them
    ]
    STABILITY_URL = "https://api.stability.ai/v2beta/stable-image/generate/core"
    try:
        prompt = None
        if request.is_json:
            data = request.get_json()
            prompt = data.get('prompt') if data else None
        if not prompt:
            prompt = request.form.get('prompt')
        if not prompt:
            return jsonify({"error": "No prompt provided"}), 400

        for api_key in API_KEYS:
            response = requests.post(
                STABILITY_URL,
                headers={
                    "authorization": f"Bearer {api_key}",
                    "accept": "image/*"
                },
                files={"none": ''},
                data={
                    "prompt": prompt,
                    "output_format": "webp",
                },
            )
            if response.status_code == 200:
                image_bytes = response.content
                img_str = base64.b64encode(image_bytes).decode()
                return jsonify({"image_url": f"data:image/webp;base64,{img_str}"})
            elif response.status_code == 402:
                continue  # Try next key
            else:
                try:
                    return jsonify(response.json()), response.status_code
                except Exception:
                    return response.text, response.status_code
        return jsonify({"error": "All API keys exhausted or payment required."}), 402
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/hover_segment', methods=['POST'])
def hover_segment():
    return jsonify({"error": "Hover segmentation functionality is disabled for testing."}), 501

@app.route('/test')
def test():
    return "Flask server is running!"

if __name__ == '__main__':
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