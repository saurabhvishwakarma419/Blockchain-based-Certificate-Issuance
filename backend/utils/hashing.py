import hashlib
import json

def generate_certificate_hash(data):
    """
    Data (Name, ID, Course) ko SHA-256 hash mein convert karta hai.
    """
    # Data ko hamesha ek hi order mein sort karna zaroori hai
    encoded_data = json.dumps(data, sort_keys=True).encode()
    return hashlib.sha256(encoded_data).hexdigest()
