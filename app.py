from flask import Flask, request, jsonify, session, render_template
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

app = Flask(__name__)
app.secret_key = os.getenv('07ab8e02adb154079d9a7fd6447ecbadade526493e88a7117d7818cb28af88d1')  # Using the existing secret

# Log application paths
logger.info(f"Current working directory: {os.getcwd()}")
logger.info(f"Templates directory: {app.template_folder}")
logger.info(f"Static directory: {app.static_folder}")

try:
    # Temporarily disabled MongoDB connection for testing
    logger.info("MongoDB connection temporarily disabled for testing")
    users = None
except Exception as e:
    logger.error(f"Failed to connect to MongoDB: {str(e)}")
    raise

def hash_password(password):
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())

def check_password(password, hashed):
    return bcrypt.checkpw(password.encode('utf-8'), hashed)

@app.route('/')
def home():
    logger.info("Accessing home route")
    try:
        if 'user' in session:
            return render_template('dashboard.html', username=session['user'])
        return render_template('login.html')
    except Exception as e:
        logger.error(f"Error in home route: {str(e)}")
        return "Error loading page", 500

@app.route('/api/register', methods=['POST'])
def register():
    try:
        data = request.get_json()
        username = data.get('username')
        password = data.get('password')

        if users and users.find_one({'username': username}):
            return jsonify({'error': 'Username already exists'}), 400

        hashed_password = hash_password(password)
        if users:
            users.insert_one({
                'username': username,
                'password': hashed_password
            })

        session['user'] = username
        return jsonify({'message': 'Registration successful'})
    except Exception as e:
        logger.error(f"Registration error: {str(e)}")
        return jsonify({'error': 'Registration failed'}), 500

@app.route('/api/login', methods=['POST'])
def login():
    try:
        data = request.get_json()
        username = data.get('username')
        password = data.get('password')

        if users:
            user = users.find_one({'username': username})
            if user and check_password(password, user['password']):
                session['user'] = username
                return jsonify({'message': 'Login successful'})

        return jsonify({'error': 'Invalid credentials'}), 401
    except Exception as e:
        logger.error(f"Login error: {str(e)}")
        return jsonify({'error': 'Login failed'}), 500

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
        logger.error(f"Failed to start Flask application: {str(e)}")
        raise