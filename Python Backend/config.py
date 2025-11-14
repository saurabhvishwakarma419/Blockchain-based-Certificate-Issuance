
from web3 import Web3
import json
import logging
from decimal import Decimal
from typing import Dict, Any, Optional
from config import Config

logger = logging.getLogger(__name__)

class ContractHandler:
    def __init__(self):
        """Initialize Web3 connection and contract interface"""
        self.w3 = None
        self.contract = None
        self.contract_address = Config.CONTRACT_ADDRESS
        self.private_key = Config.PRIVATE_KEY
        self.account = None
        
        self._initialize_web3()
        self._load_contract()
    
    def _initialize_web3(self):
        """Initialize Web3 connection"""
        try:
            # Connect to blockchain network
            if Config.NETWORK_URL.startswith('http'):
                self.w3 = Web3(Web3.HTTPProvider(Config.NETWORK_URL))
            elif Config.NETWORK_URL.startswith('ws'):
                self.w3 = Web3(Web3.WebsocketProvider(Config.NETWORK_URL))
            else:
                raise ValueError("Invalid network URL format")
            
            # Check connection
            if not self.w3.is_connected():
                raise ConnectionError("Failed to connect to blockchain network")
            
            # Setup default account if private key is provided
            if self.private_key:
                self.account = self.w3.eth.account.from_key(self.private_key)
                self.w3.eth.default_account = self.account.address
            
            logger.info(f"Connected to blockchain network: {Config.NETWORK_NAME}")
            logger.info(f"Chain ID: {self.w3.eth.chain_id}")
            
        except Exception as e:
            logger.error(f"Failed to initialize Web3: {str(e)}")
            raise
    
    def _load_contract(self):
        """Load smart contract interface"""
        try:
            # Contract ABI - Update with your actual contract ABI
            contract_abi = [
                {
                    "inputs": [{"name": "name", "type": "string"}, {"name": "symbol", "type": "string"}, {"name": "initialSupply", "type": "uint256"}],
                    "stateMutability": "nonpayable",
                    "type": "constructor"
                },
                {
                    "inputs": [],
                    "name": "name",
                    "outputs": [{"name": "", "type": "string"}],
                    "stateMutability": "view",
                    "type": "function"
                },
                {
                    "inputs": [],
                    "name": "symbol",
                    "outputs": [{"name": "", "type": "string"}],
                    "stateMutability": "view",
                    "type": "function"
                },
                {
                    "inputs": [],
                    "name": "totalSupply",
                    "outputs": [{"name": "", "type": "uint256"}],
                    "stateMutability": "view",
                    "type": "function"
                },
                {
                    "inputs": [],
                    "name": "decimals",
                    "outputs": [{"name": "", "type": "uint8"}],
                    "stateMutability": "view",
                    "type": "function"
                },
                {
                    "inputs": [{"name": "account", "type": "address"}],
                    "name": "balanceOf",
                    "outputs": [{"name": "", "type": "uint256"}],
                    "stateMutability": "view",
                    "type": "function"
                },
                {
                    "inputs": [{"name": "to", "type": "address"}, {"name": "amount", "type": "uint256"}],
                    "name": "mint",
                    "outputs": [],
                    "stateMutability": "nonpayable",
                    "type": "function"
                },
                {
                    "inputs": [{"name": "to", "type": "address"}, {"name": "amount", "type": "uint256"}],
                    "name": "transfer",
                    "outputs": [{"name": "", "type": "bool"}],
                    "stateMutability": "nonpayable",
                    "type": "function"
                },
                {
                    "inputs": [{"name": "amount", "type": "uint256"}],
                    "name": "burn",
                    "outputs": [],
                    "stateMutability": "nonpayable",
                    "type": "function"
                }
            ]
            
            # Initialize contract
            self.contract = self.w3.eth.contract(
                address=self.contract_address,
                abi=contract_abi
            )
            
            logger.info(f"Contract loaded successfully: {self.contract_address}")
            
        except Exception as e:
            logger.error(f"Failed to load contract: {str(e)}")
            raise
    
    def is_valid_address(self, address: str) -> bool:
        """Check if an Ethereum address is valid"""
        return self.w3.is_address(address) and self.w3.is_checksum_address(address)
    
    def get_token_info(self) -> Dict[str, Any]:
        """Get basic token information"""
        try:
            name = self.contract.functions.name().call()
            symbol = self.contract.functions.symbol().call()
            total_supply = self.contract.functions.totalSupply().call()
            decimals = self.contract.functions.decimals().call()
            
            # Convert total supply to human-readable format
            formatted_supply = total_supply / (10 ** decimals)
            
            return {
                'name': name,
                'symbol': symbol,
                'total_supply': str(total_supply),
                'formatted_total_supply': f"{formatted_supply:.4f}",
                'decimals': decimals,
                'contract_address': self.contract_address
            }
            
        except Exception as e:
            logger.error(f"Error fetching token info: {str(e)}")
            raise
    
    def get_balance(self, address: str) -> Decimal:
        """Get token balance for an address"""
        try:
            balance_wei = self.contract.functions.balanceOf(address).call()
            decimals = self.contract.functions.decimals().call()
            
            # Convert to human-readable format
            balance = Decimal(balance_wei) / Decimal(10 ** decimals)
            return balance
            
        except Exception as e:
            logger.error(f"Error fetching balance for {address}: {str(e)}")
            raise
    
    def mint_tokens(self, to_address: str, amount: float) -> str:
        """Mint tokens to specified address"""
        try:
            if not self.account:
                raise ValueError("No account configured for minting")
            
            # Get token decimals
            decimals = self.contract.functions.decimals().call()
            amount_wei = int(amount * (10 ** decimals))
            
            # Build transaction
            transaction = self.contract.functions.mint(
                to_address, amount_wei
            ).build_transaction({
                'from': self.account.address,
                'gas': 200000,
                'gasPrice': self.w3.eth.gas_price,
                'nonce': self.w3.eth.get_transaction_count(self.account.address)
            })
            
            # Sign and send transaction
            signed_txn = self.account.sign_transaction(transaction)
            tx_hash = self.w3.eth.send_raw_transaction(signed_txn.rawTransaction)
            
            logger.info(f"Mint transaction sent: {tx_hash.hex()}")
            return tx_hash.hex()
            
        except Exception as e:
            logger.error(f"Error minting tokens: {str(e)}")
            raise
    
    def transfer_tokens(self, from_address: str, to_address: str, amount: float, private_key: str) -> str:
        """Transfer tokens between addresses"""
        try:
            # Create account from private key
            sender_account = self.w3.eth.account.from_key(private_key)
            
            if sender_account.address.lower() != from_address.lower():
                raise ValueError("Private key does not match sender address")
            
            # Get token decimals
            decimals = self.contract.functions.decimals().call()
            amount_wei = int(amount * (10 ** decimals))
            
            # Build transaction
            transaction = self.contract.functions.transfer(
                to_address, amount_wei
            ).build_transaction({
                'from': sender_account.address,
                'gas': 100000,
                'gasPrice': self.w3.eth.gas_price,
                'nonce': self.w3.eth.get_transaction_count(sender_account.address)
            })
            
            # Sign and send transaction
            signed_txn = sender_account.sign_transaction(transaction)
            tx_hash = self.w3.eth.send_raw_transaction(signed_txn.rawTransaction)
            
            logger.info(f"Transfer transaction sent: {tx_hash.hex()}")
            return tx_hash.hex()
            
        except Exception as e:
            logger.error(f"Error transferring tokens: {str(e)}")
            raise
    
    def burn_tokens(self, from_address: str, amount: float, private_key: str) -> str:
        """Burn tokens from specified address"""
        try:
            # Create account from private key
            burner_account = self.w3.eth.account.from_key(private_key)
            
            if burner_account.address.lower() != from_address.lower():
                raise ValueError("Private key does not match burner address")
            
            # Get token decimals
            decimals = self.contract.functions.decimals().call()
            amount_wei = int(amount * (10 ** decimals))
            
            # Build transaction
            transaction = self.contract.functions.burn(
                amount_wei
            ).build_transaction({
                'from': burner_account.address,
                'gas': 100000,
                'gasPrice': self.w3.eth.gas_price,
                'nonce': self.w3.eth.get_transaction_count(burner_account.address)
            })
            
            # Sign and send transaction
            signed_txn = burner_account.sign_transaction(transaction)
            tx_hash = self.w3.eth.send_raw_transaction(signed_txn.rawTransaction)
            
            logger.info(f"Burn transaction sent: {tx_hash.hex()}")
            return tx_hash.hex()
            
        except Exception as e:
            logger.error(f"Error burning tokens: {str(e)}")
            raise
    
    def get_transaction_status(self, tx_hash: str) -> Dict[str, Any]:
        """Get transaction status and details"""
        try:
            # Get transaction receipt
            try:
                receipt = self.w3.eth.get_transaction_receipt(tx_hash)
                status = 'success' if receipt.status == 1 else 'failed'
            except:
                receipt = None
                status = 'pending'
            
            # Get transaction details
            try:
                transaction = self.w3.eth.get_transaction(tx_hash)
            except:
                transaction = None
            
            result = {
                'hash': tx_hash,
                'status': status
            }
            
            if receipt:
                result.update({
                    'block_number': receipt.blockNumber,
                    'gas_used': receipt.gasUsed,
                    'transaction_index': receipt.transactionIndex
                })
            
            if transaction:
                result.update({
                    'from': transaction['from'],
                    'to': transaction['to'],
                    'value': str(transaction['value']),
                    'gas': transaction['gas'],
                    'gas_price': str(transaction['gasPrice'])
                })
            
            return result
            
        except Exception as e:
            logger.error(f"Error fetching transaction status: {str(e)}")
            raise
    
    def estimate_gas(self, function_name: str, **kwargs) -> int:
        """Estimate gas for a function call"""
        try:
            if function_name == 'mint':
                return self.contract.functions.mint(
                    kwargs['to_address'], kwargs['amount']
                ).estimate_gas({'from': self.account.address})
            elif function_name == 'transfer':
                return self.contract.functions.transfer(
                    kwargs['to_address'], kwargs['amount']
                ).estimate_gas({'from': kwargs['from_address']})
            elif function_name == 'burn':
                return self.contract.functions.burn(
                    kwargs['amount']
                ).estimate_gas({'from': kwargs['from_address']})
            else:
                raise ValueError(f"Unknown function: {function_name}")
                
        except Exception as e:
            logger.error(f"Error estimating gas for {function_name}: {str(e)}")
            raise
    
    def calculate_gas_cost(self, gas_amount: int) -> str:
        """Calculate gas cost in ETH"""
        try:
            gas_price = self.w3.eth.gas_price
            cost_wei = gas_amount * gas_price
            cost_eth = self.w3.from_wei(cost_wei, 'ether')
            return f"{float(cost_eth):.8f}"
        except Exception as e:
            logger.error(f"Error calculating gas cost: {str(e)}")
            return "0.0"
