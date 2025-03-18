from flask import Flask, request, jsonify, session, render_template, redirect, url_for
from pymongo import MongoClient
import bcrypt
from dotenv import load_dotenv
import os
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

# Initialize Flask app
app = Flask(__name__)

# Securely fetch secret key (MANDATORY for session security)
app.secret_key = os.getenv('SESSION_SECRET')
if not app.secret_key:
    raise ValueError("SESSION_SECRET not set in environment variables!")

# MongoDB Connection
MONGODB_URI = os.getenv('MONGODB_URI', 'mongodb+srv://hassan123:hassan123@auth.jrzn0.mongodb.net/?retryWrites=true&w=majority&appName=auth')
try:
    client = MongoClient(MONGODB_URI)
    db = client['AdoebIIT']  # Updated database name
    users = db['users']
    logger.info("Connected to MongoDB successfully")
except Exception as e:
    logger.error(f"Failed to connect to MongoDB: {e}")
    raise

# Password Hashing Functions
def hash_password(password):
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())

def check_password(password, hashed):
    return bcrypt.checkpw(password.encode('utf-8'), hashed)

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
def register():
    try:
        data = request.get_json()
        username = data.get('username')
        email = data.get('email')
        password = data.get('password')

        if not username or not email or not password:
            return jsonify({'error': 'All fields are required'}), 400

        if users.find_one({'$or': [{'username': username}, {'email': email}]}):
            return jsonify({'error': 'Username or email already exists'}), 400

        hashed_password = hash_password(password)
        users.insert_one({
            'username': username,
            'email': email,
            'password': hashed_password
        })

        session['user'] = username
        return jsonify({'message': 'Registration successful'})
    except Exception as e:
        logger.error(f"Registration error: {e}")
        return jsonify({'error': 'Registration failed'}), 500

@app.route('/api/login', methods=['POST'])
def login():
    try:
        data = request.get_json()
        username = data.get('username')
        password = data.get('password')

        user = users.find_one({'username': username})
        if user and check_password(password, user['password']):
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
    session.pop('user', None)
    return jsonify({'message': 'Logout successful'})

@app.route('/test')
def test():
    return "Flask server is running!"

if __name__ == '__main__':
    try:
        logger.info("Starting Flask application...")
        app.run(
            host='0.0.0.0',
            port=5000,
            debug=False,  # Disable debug mode
            use_reloader=False  # Disable auto-reloader
        )
    except Exception as e:
        logger.error(f"Failed to start Flask application: {e}")
        raise
