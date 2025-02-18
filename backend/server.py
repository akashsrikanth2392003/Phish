from flask import Flask, request, jsonify
from flask_cors import CORS
import joblib
from datetime import datetime

# Initialize Flask app
app = Flask(__name__)
CORS(app)

# Load model and vectorizer
model = joblib.load(r'model.joblib')
vectorizer = joblib.load(r'vectorizer.joblib')

# Function to log prediction data to a file
def log_prediction(email_text, is_phishing):
    with open("predictions.log", "a") as log_file:
        log_entry = f"{datetime.now()} | Email: {email_text[:50]}... | Is Phishing: {is_phishing}\n"
        log_file.write(log_entry)

@app.route('/predict', methods=['POST'])
def predict():
    # Get email text from request
    email_text = request.json.get('email_text', '')
    if not email_text:
        return jsonify({'error': 'No email text provided'}), 400

    # Transform the text and predict
    transformed_text = vectorizer.transform([email_text])
    prediction = model.predict(transformed_text)
    is_phishing = bool(prediction[0])  # True if phishing, False if safe

    # Log the prediction data
    log_prediction(email_text, is_phishing)

    return jsonify({'is_phishing': is_phishing})

if __name__ == '__main__':
    app.run(host='127.0.0.1', port=5000)
