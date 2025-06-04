import requests

API_KEY = "sk-RxTJO7w7yTlO5TtCmA0QHPcGGmCYeWYjmDCPLaHjRwaNbLmG"
PROMPT = "Lighthouse on a cliff overlooking the ocean"
OUTPUT_FILE = "lighthouse.jpeg"

response = requests.post(
    "https://api.stability.ai/v2beta/stable-image/generate/sd3",
    headers={
        "authorization": f"Bearer {API_KEY}",
        "accept": "image/*"
    },
    files={"none": ''},
    data={
        "prompt": PROMPT,
        "output_format": "jpeg",
    },
)

if response.status_code == 200:
    with open(OUTPUT_FILE, 'wb') as file:
        file.write(response.content)
    print(f"Image saved as {OUTPUT_FILE}")
else:
    print(f"Error: {response.status_code}")
    try:
        print(response.json())
    except Exception:
        print(response.text) 