
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

class Config:
    """Configuration class for the smart contract backend"""
    
    # Flask Configuration
    PORT = int(os.getenv('PORT', 5000))
    DEBUG = os.getenv('FLASK_ENV', 'production') == 'development'
    
    # Blockchain Configuration
    NETWORK_NAME = os.getenv('NETWORK_NAME', 'Ethereum Mainnet')
    NETWORK_URL = os.getenv('NETWORK_URL', 'https://mainnet.infura.io/v3/YOUR_INFURA_PROJECT_ID')
    CHAIN_ID = int(os.getenv('CHAIN_ID', 1))
    
    # Smart Contract Configuration
    CONTRACT_ADDRESS = os.getenv('CONTRACT_ADDRESS', '0x...')  # Replace with your contract address
    
    # Account Configuration (for minting - owner only)
    PRIVATE_KEY = os.getenv('PRIVATE_KEY', '')  # Owner's private key for minting
    
    # API Configuration
    MAX_REQUEST_SIZE = int(os.getenv('MAX_REQUEST_SIZE', 16 * 1024 * 1024))  # 16MB
    REQUEST_TIMEOUT = int(os.getenv('REQUEST_TIMEOUT', 30))  # 30 seconds
    
    # Gas Configuration
    DEFAULT_GAS_LIMIT = int(os.getenv('DEFAULT_GAS_LIMIT', 200000))
    GAS_PRICE_MULTIPLIER = float(os.getenv('GAS_PRICE_MULTIPLIER', 1.1))
    
    # Security Configuration
    RATE_LIMIT_PER_MINUTE = int(os.getenv('RATE_LIMIT_PER_MINUTE', 60))
    
    @classmethod
    def validate_config(cls):
        """Validate required configuration"""
        required_vars = [
            'CONTRACT_ADDRESS',
            'NETWORK_URL'
        ]
        
        missing_vars = []
        for var in required_vars:
            if not getattr(cls, var) or getattr(cls, var) == '0x...':
                missing_vars.append(var)
        
        if missing_vars:
            raise ValueError(f"Missing required configuration: {', '.join(missing_vars)}")
        
        return True
    
    @classmethod
    def get_network_config(cls):
        """Get network-specific configuration"""
        networks = {
            1: {
                'name': 'Ethereum Mainnet',
                'explorer': 'https://etherscan.io',
                'currency': 'ETH'
            },
            5: {
                'name': 'Goerli Testnet',
                'explorer': 'https://goerli.etherscan.io',
                'currency': 'GoerliETH'
            },
            11155111: {
                'name': 'Sepolia Testnet',
                'explorer': 'https://sepolia.etherscan.io',
                'currency': 'SepoliaETH'
            },
            137: {
                'name': 'Polygon Mainnet',
                'explorer': 'https://polygonscan.com',
                'currency': 'MATIC'
            },
            80001: {
                'name': 'Polygon Mumbai',
                'explorer': 'https://mumbai.polygonscan.com',
                'currency': 'MATIC'
            }
        }
        
        return networks.get(cls.CHAIN_ID, {
            'name': f'Unknown Network (Chain ID: {cls.CHAIN_ID})',
            'explorer': 'Unknown',
            'currency': 'Unknown'
        })

# Validate configuration on import
Config.validate_config()
