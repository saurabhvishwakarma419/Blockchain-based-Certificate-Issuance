from flask import Flask, request, jsonify
from flask_cors import CORS
from utils.hashing import generate_certificate_hash

app = Flask(__name__)
CORS(app)  # Taaki Frontend bina kisi error ke connect ho sake

@app.route('/generate-hash', methods=['POST'])
def get_hash():
    data = request.json
    if not data:
        return jsonify({"error": "No data provided"}), 400
    
    # Hash generate karo
    cert_hash = generate_certificate_hash(data)
    
    return jsonify({
        "status": "success",
        "certificate_hash": cert_hash,
        "message": "Hash generated for Blockchain issuance"
    })

if __name__ == '__main__':
    app.run(debug=True, port=5000)
