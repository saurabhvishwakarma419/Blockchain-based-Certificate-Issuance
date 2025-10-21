
// Global Variables
let provider;
let signer;
let contract;
let userAccount;
let eventListener;

// Contract Configuration - UPDATE THESE VALUES
const CONTRACT_CONFIG = {
    // Add your contract address here
    address: '',
    // Add your contract ABI here - this is a sample ERC20 ABI
    abi: [
        // View functions
        "function name() view returns (string)",
        "function symbol() view returns (string)",
        "function totalSupply() view returns (uint256)",
        "function balanceOf(address owner) view returns (uint256)",
        "function owner() view returns (address)",
        "function decimals() view returns (uint8)",
        "function allowance(address owner, address spender) view returns (uint256)",
        
        // State-changing functions
        "function transfer(address to, uint256 amount) returns (bool)",
        "function approve(address spender, uint256 amount) returns (bool)",
        "function mint(address to, uint256 amount) returns (bool)",
        "function burn(uint256 amount) returns (bool)",
        "function transferFrom(address from, address to, uint256 amount) returns (bool)",
        
        // Events
        "event Transfer(address indexed from, address indexed to, uint256 value)",
        "event Approval(address indexed owner, address indexed spender, uint256 value)",
        "event Mint(address indexed to, uint256 amount)",
        "event Burn(address indexed from, uint256 amount)"
    ]
};

// DOM Elements
const elements = {
    // Wallet elements
    connectWallet: document.getElementById('connectWallet'),
    walletInfo: document.getElementById('walletInfo'),
    walletAddress: document.getElementById('walletAddress'),
    walletBalance: document.getElementById('walletBalance'),
    
    // Status elements
    status: document.getElementById('status'),
    networkInfo: document.getElementById('networkInfo'),
    currentNetwork: document.getElementById('currentNetwork'),
    
    // Contract elements
    contractAddress: document.getElementById('contractAddress'),
    contractBalance: document.getElementById('contractBalance'),
    initContract: document.getElementById('initContract'),
    
    // Results and history
    readResults: document.getElementById('readResults'),
    transactionHistory: document.getElementById('transactionHistory'),
    eventsList: document.getElementById('eventsList'),
    
    // Loading and modal
    loadingOverlay: document.getElementById('loadingOverlay'),
    loadingText: document.getElementById('loadingText'),
    transactionModal: document.getElementById('transactionModal'),
    modalContent: document.getElementById('modalContent')
};

// Initialize Application
document.addEventListener('DOMContentLoaded', async () => {
    console.log('🚀 Initializing Smart Contract Interface...');
    setupEventListeners();
    await checkWalletConnection();
    loadSavedContractAddress();
});

// Setup Event Listeners
function setupEventListeners() {
    // Wallet connection
    elements.connectWallet?.addEventListener('click', connectWallet);
    
    // Contract initialization
    elements.initContract?.addEventListener('click', initializeContract);
    elements.contractAddress?.addEventListener('change', saveContractAddress);
    
    // Read function buttons
    document.getElementById('getName')?.addEventListener('click', () => callReadFunction('name'));
    document.getElementById('getSymbol')?.addEventListener('click', () => callReadFunction('symbol'));
    document.getElementById('getTotalSupply')?.addEventListener('click', () => callReadFunction('totalSupply'));
    document.getElementById('getBalance')?.addEventListener('click', () => callReadFunction('balanceOf', [userAccount]));
    document.getElementById('getOwner')?.addEventListener('click', () => callReadFunction('owner'));
    
    // Write function buttons
    document.getElementById('transfer')?.addEventListener('click', handleTransfer);
    document.getElementById('mint')?.addEventListener('click', handleMint);
    document.getElementById('approve')?.addEventListener('click', handleApprove);
    document.getElementById('customFunction')?.addEventListener('click', handleCustomFunction);
    
    // Event handling
    document.getElementById('listenEvents')?.addEventListener('click', startEventListening);
    document.getElementById('stopEvents')?.addEventListener('click', stopEventListening);
    
    // Utility buttons
    document.getElementById('clearHistory')?.addEventListener('click', clearTransactionHistory);
    
    // Modal close
    document.querySelector('.close')?.addEventListener('click', closeModal);
    window.addEventListener('click', (e) => {
        if (e.target === elements.transactionModal) closeModal();
    });
}

// Check if wallet is already connected
async function checkWalletConnection() {
    if (typeof window.ethereum === 'undefined') {
        showStatus('Please install MetaMask or another Web3 wallet', 'error');
        return;
    }

    try {
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        if (accounts.length > 0) {
            await initializeProvider();
            await updateWalletInfo();
            showStatus('Wallet already connected', 'success');
        }
    } catch (error) {
        console.error('Error checking wallet connection:', error);
        showStatus('Error checking wallet connection', 'error');
    }
}

// Connect Wallet
async function connectWallet() {
    if (typeof window.ethereum === 'undefined') {
        showStatus('Please install MetaMask or another Web3 wallet', 'error');
        window.open('https://metamask.io/', '_blank');
        return;
    }

    try {
        showLoading(true, 'Connecting to wallet...');
        
        // Request account access
        await window.ethereum.request({ method: 'eth_requestAccounts' });
        
        // Initialize provider and signer
        await initializeProvider();
        await updateWalletInfo();
        
        showStatus('Wallet connected successfully! 🎉', 'success');
    } catch (error) {
        console.error('Error connecting wallet:', error);
        if (error.code === 4001) {
            showStatus('Wallet connection rejected by user', 'error');
        } else {
            showStatus(`Failed to connect wallet: ${error.message}`, 'error');
        }
    } finally {
        showLoading(false);
    }
}

// Initialize Provider and Signer
async function initializeProvider() {
    provider = new ethers.BrowserProvider(window.ethereum);
    signer = await provider.getSigner();
    userAccount = await signer.getAddress();

    // Setup event listeners for account/network changes
    window.ethereum.on('accountsChanged', handleAccountsChanged);
    window.ethereum.on('chainChanged', handleChainChanged);
    
    console.log('✅ Provider initialized:', { userAccount });
}

// Update Wallet Information
async function updateWalletInfo() {
    if (!signer || !provider) return;

    try {
        const address = await signer.getAddress();
        const balance = await provider.getBalance(address);
        const network = await provider.getNetwork();

        // Update UI
        elements.walletAddress.textContent = `${address.slice(0, 6)}...${address.slice(-4)}`;
        elements.walletBalance.textContent = `${parseFloat(ethers.formatEther(balance)).toFixed(4)} ETH`;
        elements.currentNetwork.textContent = network.name || `Chain ID: ${network.chainId}`;

        // Show wallet info, hide connect button
        elements.connectWallet.style.display = 'none';
        elements.walletInfo.classList.remove('hidden');
        elements.networkInfo.classList.remove('hidden');

        console.log('✅ Wallet info updated:', { address, balance: ethers.formatEther(balance), network: network.name });
        
        // Auto-initialize contract if address is available
        if (elements.contractAddress.value) {
            await initializeContract();
        }
    } catch (error) {
        console.error('Error updating wallet info:', error);
        showStatus('Error updating wallet information', 'error');
    }
}

// Initialize Contract
async function initializeContract() {
    const address = elements.contractAddress.value.trim();
    
    if (!address) {
        showStatus('Please enter a contract address', 'error');
        return;
    }

    if (!ethers.isAddress(address)) {
        showStatus('Please enter a valid contract address', 'error');
        return;
    }

    if (!signer) {
        showStatus('Please connect your wallet first', 'error');
        return;
    }

    try {
        showLoading(true, 'Initializing contract...');
        
        contract = new ethers.Contract(address, CONTRACT_CONFIG.abi, signer);
        
        // Test contract by calling a simple view function
        try {
            await contract.name();
        } catch (testError) {
            console.warn('Contract test call failed - contract might not have name() function:', testError);
        }
        
        await updateContractInfo();
        showStatus(`Contract initialized successfully! 🎉`, 'success');
        console.log('✅ Contract initialized:', address);
        
    } catch (error) {
        console.error('Error initializing contract:', error);
        showStatus(`Error initializing contract: ${error.message}`, 'error');
        contract = null;
    } finally {
        showLoading(false);
    }
}

// Update Contract Information
async function updateContractInfo() {
    if (!contract || !provider) return;

    try {
        const balance = await provider.getBalance(contract.target);
        elements.contractBalance.textContent = `${parseFloat(ethers.formatEther(balance)).toFixed(4)} ETH`;
    } catch (error) {
        console.error('Error updating contract info:', error);
        elements
