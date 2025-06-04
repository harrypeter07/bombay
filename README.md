# Bombay Project

A web application for advanced image segmentation and AI-powered image generation, featuring user authentication, layer management, and more.

## Features

- User authentication (register, login, logout)
- AI-powered image generation (Stable Diffusion)
- Interactive image segmentation tools
- Layer management with drag-and-drop reordering
- Canvas editing and blending
- JSON export of canvas state
- Responsive, modern UI

## Tech Stack

- Python (Flask)
- JavaScript (ES6, Fabric.js)
- HTML5 & CSS3
- MongoDB
- Stable Diffusion API (Stability AI)

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/harrypeter07/bombay.git
   cd bombay
   ```
2. Install Python dependencies:
   ```bash
   pip install -r requirements.txt
   ```
3. Set up your `.env` file with the required environment variables (see below).
4. Start the Flask server:
   ```bash
   python app.py
   ```
5. Open your browser and go to `http://localhost:5000`.

## Environment Variables

Create a `.env` file in the project root with the following variables:

```
SESSION_SECRET=your_secret_key
MONGODB_URI=your_mongodb_connection_string
HUGGING_FACE_API_KEY=your_huggingface_api_key  # (if using Hugging Face)
```

- For Stable Diffusion, you will need one or more Stability AI API keys (used directly in the code).

## Usage

1. Register a new account or log in with your credentials.
2. Use the AI Image Generation panel to generate images from text prompts.
3. Upload images or use generated images for segmentation.
4. Add, remove, and reorder layers using the sidebar.
5. Use segmentation tools to mark and segment objects in images.
6. Export your canvas as JSON for further use.
