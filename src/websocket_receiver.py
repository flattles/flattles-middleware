import requests

# Replace with laptop's IP and the server port
url = "http://192.168.1.100:3000/move"  

# Define the payload
data = {
    "shipID": 2,
    "x": "B",
    "y": 3
}

# Send the POST request
response = requests.post(url, json=data)

# Check the response
if response.status_code == 200:
    print("Success:", response.json())
else:
    print(f"Error {response.status_code}: {response.text}")
