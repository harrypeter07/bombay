from flask import Flask, request, jsonify, session, render_template, redirect, url_for
from pymongo import MongoClient
import bcrypt
from dotenv import load_dotenv
import os
import logging
from datetime import timedelta
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

# Initialize Flask app
app = Flask(__name__)

# Configure session
app.secret_key = os.getenv('SESSION_SECRET')
app.config['SESSION_COOKIE_SECURE'] = True
app.config['SESSION_COOKIE_HTTPONLY'] = True
app.config['PERMANENT_SESSION_LIFETIME'] = timedelta(days=1)
app.config['SESSION_COOKIE_SAMESITE'] = 'Lax'

if not app.secret_key:
    raise ValueError("SESSION_SECRET not set in environment variables!")

# Configure rate limiter
limiter = Limiter(
    app=app,
    key_func=get_remote_address,
    default_limits=["200 per day", "50 per hour"]
)

# MongoDB Connection with connection pooling
MONGODB_URI = os.getenv('MONGODB_URI')
if not MONGODB_URI:
    raise ValueError("MONGODB_URI not set in environment variables!")

try:
    client = MongoClient(MONGODB_URI, maxPoolSize=50)
    db = client['AdoebIIT']
    users = db['users']
    logger.info("Connected to MongoDB successfully")
except Exception as e:
    logger.error(f"Failed to connect to MongoDB: {e}")
    raise

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
        return False, "Password must be at least 8 characters"
    return True, ""

# Routes
@app.route('/')
def home():
    try:
        if 'user' in session:
            return render_template('dashboard.html', username=session['user'])
        return render_template('login.html')
    except Exception as e:
        logger.error(f"Error in home route: {e}")
        return "Error loading page", 500

@app.route('/register')
def register_page():
    if 'user' in session:
        return render_template('dashboard.html', username=session['user'])
    return redirect(url_for('home') + '?register=true')

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

@app.route('/dashboard')
def dashboard():
    if 'user' not in session:
        return redirect(url_for('home'))
    return render_template('dashboard.html', username=session['user'])

@app.route('/api/logout', methods=['POST'])
def logout():
    session.clear()
    return jsonify({'message': 'Logout successful'})

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