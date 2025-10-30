
from flask import Flask, request, jsonify
from flask_cors import CORS
import logging
from contract_handler import ContractHandler
from config import Config
import os
from decimal import Decimal

# Initialize Flask app
app = Flask(__name__)
CORS(app)  # Enable CORS for frontend integration

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize contract handler
contract_handler = ContractHandler()

@app.errorhandler(Exception)
def handle_error(error):
    """Global error handler"""
    logger.error(f"Application error: {str(error)}")
    return jsonify({
        'success': False,
        'error': str(error),
        'message': 'An unexpected error occurred'
    }), 500

@app.route('/', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'success': True,
        'message': 'Smart Contract Backend API is running',
        'version': '1.0.0'
    })

@app.route('/api/token/info', methods=['GET'])
def get_token_info():
    """Get basic token information"""
    try:
        token_info = contract_handler.get_token_info()
        return jsonify({
            'success': True,
            'data': token_info
        })
    except Exception as e:
        logger.error(f"Error fetching token info: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/balance/<address>', methods=['GET'])
def get_balance(address):
    """Get token balance for a specific address"""
    try:
        if not contract_handler.is_valid_address(address):
            return jsonify({
                'success': False,
                'error': 'Invalid Ethereum address'
            }), 400
            
        balance = contract_handler.get_balance(address)
        return jsonify({
            'success': True,
            'data': {
                'address': address,
                'balance': str(balance),
                'formatted_balance': f"{balance:.4f}"
            }
        })
    except Exception as e:
        logger.error(f"Error fetching balance for {address}: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/mint', methods=['POST'])
def mint_tokens():
    """Mint new tokens to specified address"""
    try:
        data = request.get_json()
        
        # Validate required fields
        if not data or 'to_address' not in data or 'amount' not in data:
            return jsonify({
                'success': False,
                'error': 'Missing required fields: to_address, amount'
            }), 400
        
        to_address = data['to_address']
        amount = data['amount']
        
        # Validate address
        if not contract_handler.is_valid_address(to_address):
            return jsonify({
                'success': False,
                'error': 'Invalid recipient address'
            }), 400
        
        # Validate amount
        try:
            amount = float(amount)
            if amount <= 0:
                raise ValueError("Amount must be positive")
        except (ValueError, TypeError):
            return jsonify({
                'success': False,
                'error': 'Invalid amount'
            }), 400
        
        # Execute mint transaction
        tx_hash = contract_handler.mint_tokens(to_address, amount)
        
        return jsonify({
            'success': True,
            'data': {
                'transaction_hash': tx_hash,
                'to_address': to_address,
                'amount': amount,
                'message': 'Mint transaction submitted successfully'
            }
        })
        
    except Exception as e:
        logger.error(f"Error minting tokens: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/transfer', methods=['POST'])
def transfer_tokens():
    """Transfer tokens from one address to another"""
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['from_address', 'to_address', 'amount', 'private_key']
        if not data or not all(field in data for field in required_fields):
            return jsonify({
                'success': False,
                'error': f'Missing required fields: {", ".join(required_fields)}'
            }), 400
        
        from_address = data['from_address']
        to_address = data['to_address']
        amount = data['amount']
        private_key = data['private_key']
        
        # Validate addresses
        if not contract_handler.is_valid_address(from_address):
            return jsonify({
                'success': False,
                'error': 'Invalid sender address'
            }), 400
            
        if not contract_handler.is_valid_address(to_address):
            return jsonify({
                'success': False,
                'error': 'Invalid recipient address'
            }), 400
        
        # Validate amount
        try:
            amount = float(amount)
            if amount <= 0:
                raise ValueError("Amount must be positive")
        except (ValueError, TypeError):
            return jsonify({
                'success': False,
                'error': 'Invalid amount'
            }), 400
        
        # Execute transfer transaction
        tx_hash = contract_handler.transfer_tokens(
            from_address, to_address, amount, private_key
        )
        
        return jsonify({
            'success': True,
            'data': {
                'transaction_hash': tx_hash,
                'from_address': from_address,
                'to_address': to_address,
                'amount': amount,
                'message': 'Transfer transaction submitted successfully'
            }
        })
        
    except Exception as e:
        logger.error(f"Error transferring tokens: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/burn', methods=['POST'])
def burn_tokens():
    """Burn tokens from specified address"""
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['from_address', 'amount', 'private_key']
        if not data or not all(field in data for field in required_fields):
            return jsonify({
                'success': False,
                'error': f'Missing required fields: {", ".join(required_fields)}'
            }), 400
        
        from_address = data['from_address']
        amount = data['amount']
        private_key = data['private_key']
        
        # Validate address
        if not contract_handler.is_valid_address(from_address):
            return jsonify({
                'success': False,
                'error': 'Invalid address'
            }), 400
        
        # Validate amount
        try:
            amount = float(amount)
            if amount <= 0:
                raise ValueError("Amount must be positive")
        except (ValueError, TypeError):
            return jsonify({
                'success': False,
                'error': 'Invalid amount'
            }), 400
        
        # Execute burn transaction
        tx_hash = contract_handler.burn_tokens(from_address, amount, private_key)
        
        return jsonify({
            'success': True,
            'data': {
                'transaction_hash': tx_hash,
                'from_address': from_address,
                'amount': amount,
                'message': 'Burn transaction submitted successfully'
            }
        })
        
    except Exception as e:
        logger.error(f"Error burning tokens: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/transaction/<tx_hash>', methods=['GET'])
def get_transaction_status(tx_hash):
    """Get transaction status and details"""
    try:
        tx_status = contract_handler.get_transaction_status(tx_hash)
        return jsonify({
            'success': True,
            'data': tx_status
        })
    except Exception as e:
        logger.error(f"Error fetching transaction status: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/gas/estimate', methods=['POST'])
def estimate_gas():
    """Estimate gas for a transaction"""
    try:
        data = request.get_json()
        
        if not data or 'function_name' not in data:
            return jsonify({
                'success': False,
                'error': 'Missing required field: function_name'
            }), 400
        
        function_name = data['function_name']
        params = data.get('params', {})
        
        gas_estimate = contract_handler.estimate_gas(function_name, **params)
        
        return jsonify({
            'success': True,
            'data': {
                'function_name': function_name,
                'estimated_gas': gas_estimate,
                'estimated_cost_eth': contract_handler.calculate_gas_cost(gas_estimate)
            }
        })
        
    except Exception as e:
        logger.error(f"Error estimating gas: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

if __name__ == '__main__':
    port = int(os.environ.get('PORT', Config.PORT))
    debug = os.environ.get('FLASK_ENV') == 'development'
    
    logger.info(f"Starting Flask server on port {port}")
    logger.info(f"Debug mode: {debug}")
    
    app.run(
        host='0.0.0.0',
        port=port,
        debug=debug
    )
