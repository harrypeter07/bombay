from flask import Flask, request, jsonify, send_file, render_template_string
import requests
import base64
from io import BytesIO
import os

app = Flask(__name__)

API_KEY = "sk-7ktKiNUJKP2oIwKVpHTiVaB29yldUiBLNOhIPW5G0MVM8FCD"
STABILITY_URL = "https://api.stability.ai/v2beta/stable-image/generate/core"

# Serve the HTML form at '/'
@app.route('/')
def serve_form():
    # Read the HTML file and return its contents
    with open(os.path.join(os.path.dirname(__file__), 'test_stability_form.html'), encoding='utf-8') as f:
        html = f.read()
    return html

# IMAGE GENERATION ENDPOINT
@app.route('/generate-stability-image', methods=['POST'])
def generate_stability_image():
    data = request.get_json()
    prompt = data.get('prompt')
    if not prompt:
        return "No prompt provided", 400
    response = requests.post(
        STABILITY_URL,
        headers={
            "authorization": f"Bearer {API_KEY}",
            "accept": "image/*"
        },
        files={"none": ''},
        data={
            "prompt": prompt,
            "output_format": "webp",
        },
    )
    if response.status_code == 200:
        img_bytes = response.content
        img_b64 = base64.b64encode(img_bytes).decode()
        return jsonify({"image": img_b64})
    else:
        try:
            return jsonify(response.json()), response.status_code
        except Exception:
            return response.text, response.status_code

if __name__ == "__main__":
    app.run(debug=True, port=5001) 