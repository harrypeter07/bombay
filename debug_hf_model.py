import requests
import os

# Set your Hugging Face API key and model URL here
API_KEY = os.getenv('HUGGING_FACE_API_KEY', 'hf_your_actual_key_here')
MODEL_URL = os.getenv('HUGGING_FACE_API_URL', 'https://api-inference.huggingface.co/models/stabilityai/stable-diffusion-2')

headers = {
    'Authorization': f'Bearer {API_KEY}'
}

def test_model(prompt="a cat riding a bicycle"):
    print(f"Testing model: {MODEL_URL}")
    print(f"Using API key: {'set' if API_KEY and not API_KEY.startswith('hf_your') else 'NOT SET!'}")
    response = requests.post(
        MODEL_URL,
        headers=headers,
        json={"inputs": prompt}
    )
    print(f"Status code: {response.status_code}")
    print(f"Response: {response.text[:500]}")  # Print only first 500 chars
    if response.status_code == 200:
        print("\nSUCCESS: Model is accessible and responded correctly.")
    elif response.status_code == 401:
        print("\nERROR: Unauthorized. Check your API key.")
    elif response.status_code == 404:
        print("\nERROR: Model not found. Check the model URL and your access.")
    else:
        print("\nERROR: Unexpected response. See above.")

if __name__ == "__main__":
    test_model() 