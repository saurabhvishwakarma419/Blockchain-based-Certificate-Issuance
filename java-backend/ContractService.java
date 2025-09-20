package com.project.service;

import com.project.config.Web3Config;
import com.project.exception.ContractException;
import com.project.model.TokenInfo;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.web3j.abi.FunctionEncoder;
import org.web3j.abi.FunctionReturnDecoder;
import org.web3j.abi.TypeReference;
import org.web3j.abi.datatypes.*;
import org.web3j.abi.datatypes.generated.Uint256;
import org.web3j.crypto.Credentials;
import org.web3j.protocol.Web3j;
import org.web3j.protocol.core.DefaultBlockParameterName;
import org.web3j.protocol.core.methods.request.Transaction;
import org.web3j.protocol.core.methods.response.*;
import org.web3j.tx.RawTransactionManager;
import org.web3j.tx.TransactionManager;
import org.web3j.tx.gas.DefaultGasProvider;

import java.math.BigDecimal;
import java.math.BigInteger;
import java.util.*;

/**
 * Service class for smart contract operations
 * Handles blockchain interactions and transaction management
 */
@Service
public class ContractService {
    
    private static final Logger logger = LoggerFactory.getLogger(ContractService.class);
    
    @Autowired
    private Web3j web3j;
    
    @Value("${contract.address}")
    private String contractAddress;
    
    @Value("${contract.owner.private-key:}")
    private String ownerPrivateKey;
    
    /**
     * Get token information from smart contract
     */
    public TokenInfo getTokenInfo() throws Exception {
        logger.info("Fetching token information from contract: {}", contractAddress);
        
        try {
            // Get token name
            String name = callStringFunction("name");
            
            // Get token symbol
            String symbol = callStringFunction("symbol");
            
            // Get total supply
            BigInteger totalSupply = callUint256Function("totalSupply");
            
            // Get decimals
            BigInteger decimals = callUint256Function("decimals");
            
            // Format total supply for display
            BigDecimal formattedSupply = new BigDecimal(totalSupply)
                    .divide(BigDecimal.TEN.pow(decimals.intValue()));
            
            TokenInfo tokenInfo = new TokenInfo();
            tokenInfo.setName(name);
            tokenInfo.setSymbol(symbol);
            tokenInfo.setTotalSupply(totalSupply.toString());
            tokenInfo.setFormattedTotalSupply(formattedSupply.toPlainString());
            tokenInfo.setDecimals(decimals.intValue());
            tokenInfo.setContractAddress(contractAddress);
            
            logger.info("Token info retrieved successfully: {} ({})", name, symbol);
            return tokenInfo;
            
        } catch (Exception e) {
            logger.error("Failed to fetch token information", e);
            throw new ContractException("Unable to fetch token information: " + e.getMessage());
        }
    }
    
    /**
     * Get token balance for specific address
     */
    public BigDecimal getBalance(String address) throws Exception {
        logger.info("Fetching balance for address: {}", address);
        
        if (!isValidAddress(address)) {
            throw new ContractException("Invalid Ethereum address format");
        }
        
        try {
            // Create balanceOf function call
            Function function = new Function(
                    "balanceOf",
                    Arrays.asList(new Address(address)),
                    Arrays.asList(new TypeReference<Uint256>() {})
            );
            
            BigInteger balanceWei = callContractFunction(function);
            BigInteger decimals = callUint256Function("decimals");
            
            // Convert to human-readable format
            BigDecimal balance = new BigDecimal(balanceWei)
                    .divide(BigDecimal.TEN.pow(decimals.intValue()));
            
            logger.info("Balance retrieved for {}: {}", address, balance.toPlainString());
            return balance;
            
        } catch (Exception e) {
            logger.error("Failed to fetch balance for address: {}", address, e);
            throw new ContractException("Unable to fetch balance: " + e.getMessage());
        }
    }
    
    /**
     * Mint tokens to specified address (owner only)
     */
    public String mintTokens(String toAddress, BigDecimal amount) throws Exception {
        logger.info("Minting {} tokens to {}", amount, toAddress);
        
        if (ownerPrivateKey == null || ownerPrivateKey.isEmpty()) {
            throw new ContractException("Owner private key not configured");
        }
        
        if (!isValidAddress(toAddress)) {
            throw new ContractException("Invalid recipient address");
        }
        
        if (amount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new ContractException("Amount must be greater than zero");
        }
        
        try {
            Credentials credentials = Credentials.create(ownerPrivateKey);
            BigInteger decimals = callUint256Function("decimals");
            BigInteger amountWei = amount.multiply(BigDecimal.TEN.pow(decimals.intValue())).toBigInteger();
            
            // Create mint function
            Function mintFunction = new Function(
                    "mint",
                    Arrays.asList(new Address(toAddress), new Uint256(amountWei)),
                    Collections.emptyList()
            );
            
            String txHash = sendTransaction(credentials, mintFunction);
            logger.info("Mint transaction sent successfully: {}", txHash);
            return txHash;
            
        } catch (Exception e) {
            logger.error("Failed to mint tokens", e);
            throw new ContractException("Mint operation failed: " + e.getMessage());
        }
    }
    
    /**
     * Transfer tokens between addresses
     */
    public String transferTokens(String fromAddress, String toAddress, BigDecimal amount, String privateKey) throws Exception {
        logger.info("Transferring {} tokens from {} to {}", amount, fromAddress, toAddress);
        
        if (!isValidAddress(fromAddress) || !isValidAddress(toAddress)) {
            throw new ContractException("Invalid address provided");
        }
        
        if (amount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new ContractException("Amount must be greater than zero");
        }
        
        try {
            Credentials credentials = Credentials.create(privateKey);
            
            // Verify private key matches sender address
            if (!credentials.getAddress().equalsIgnoreCase(fromAddress)) {
                throw new ContractException("Private key does not match sender address");
            }
            
            BigInteger decimals = callUint256Function("decimals");
            BigInteger amountWei = amount.multiply(BigDecimal.TEN.pow(decimals.intValue())).toBigInteger();
            
            // Create transfer function
            Function transferFunction = new Function(
                    "transfer",
                    Arrays.asList(new Address(toAddress), new Uint256(amountWei)),
                    Arrays.asList(new TypeReference<Bool>() {})
            );
            
            String txHash = sendTransaction(credentials, transferFunction);
            logger.info("Transfer transaction sent successfully: {}", txHash);
            return txHash;
            
        } catch (Exception e) {
            logger.error("Failed to transfer tokens", e);
            throw new ContractException("Transfer operation failed: " + e.getMessage());
        }
    }
    
    /**
     * Burn tokens from address
     */
    public String burnTokens(String fromAddress, BigDecimal amount, String privateKey) throws Exception {
        logger.info("Burning {} tokens from {}", amount, fromAddress);
        
        if (!isValidAddress(fromAddress)) {
            throw new ContractException("Invalid address provided");
        }
        
        if (amount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new ContractException("Amount must be greater than zero");
        }
        
        try {
            Credentials credentials = Credentials.create(privateKey);
            
            // Verify private key matches address
            if (!credentials.getAddress().equalsIgnoreCase(fromAddress)) {
                throw new ContractException("Private key does not match address");
            }
            
            BigInteger decimals = callUint256Function("decimals");
            BigInteger amountWei = amount.multiply(BigDecimal.TEN.pow(decimals.intValue())).toBigInteger();
            
            // Create burn function
            Function burnFunction = new Function(
                    "burn",
                    Arrays.asList(new Uint256(amountWei)),
                    Collections.emptyList()
            );
            
            String txHash = sendTransaction(credentials, burnFunction);
            logger.info("Burn transaction sent successfully: {}", txHash);
            return txHash;
            
        } catch (Exception e) {
            logger.error("Failed to burn tokens", e);
            throw new ContractException("Burn operation failed: " + e.getMessage());
        }
    }
    
    /**
     * Get transaction status and details
     */
    public Map<String, Object> getTransactionStatus(String txHash) throws Exception {
        logger.info("Checking status for transaction: {}", txHash);
        
        try {
            Map<String, Object> result = new HashMap<>();
            result.put("hash", txHash);
            
            // Get transaction receipt
            EthGetTransactionReceipt receiptResponse = web3j.ethGetTransactionReceipt(txHash).send();
            
            if (receiptResponse.getTransactionReceipt().isPresent()) {
                TransactionReceipt receipt = receiptResponse.getTransactionReceipt().get();
                String status = "0x1".equals(receipt.getStatus()) ? "success" : "failed";
                
                result.put("status", status);
                result.put("block_number", receipt.getBlockNumber().toString());
                result.put("gas_used", receipt.getGasUsed().toString());
                result.put("transaction_index", receipt.getTransactionIndex().toString());
                
                // Get transaction details
                EthTransaction txResponse = web3j.ethGetTransactionByHash(txHash).send();
                if (txResponse.getTransaction().isPresent()) {
                    org.web3j.protocol.core.methods.response.Transaction tx = txResponse.getTransaction().get();
                    result.put("from", tx.getFrom());
                    result.put("to", tx.getTo());
                    result.put("value", tx.getValue().toString());
                    result.put("gas", tx.getGas().toString());
                    result.put("gas_price", tx.getGasPrice().toString());
                }
            } else {
                result.put("status", "pending");
            }
            
            return result;
            
        } catch (Exception e) {
            logger.error("Failed to get transaction status", e);
            throw new ContractException("Unable to fetch transaction status: " + e.getMessage());
        }
    }
    
    /**
     * Estimate gas for contract operations
     */
    public Map<String, Object> estimateGas(String functionName, Map<String, Object> params) throws Exception {
        logger.info("Estimating gas for function: {}", functionName);
        
        try {
            Function function = createFunctionForEstimation(functionName, params);
            String encodedFunction = FunctionEncoder.encode(function);
            
            Transaction transaction = Transaction.createFunctionCallTransaction(
                    null, null, null, null, contractAddress, null, encodedFunction
            );
            
            EthEstimateGas gasResponse = web3j.ethEstimateGas(transaction).send();
            if (gasResponse.hasError()) {
                throw new Exception("Gas estimation failed: " + gasResponse.getError().getMessage());
            }
            
            BigInteger gasEstimate = gasResponse.getAmountUsed();
            EthGasPrice gasPriceResponse = web3j.ethGasPrice().send();
            BigInteger gasPrice = gasPriceResponse.getGasPrice();
            
            BigDecimal costWei = new BigDecimal(gasEstimate.multiply(gasPrice));
            BigDecimal costEth = costWei.divide(BigDecimal.TEN.pow(18));
            
            Map<String, Object> result = new HashMap<>();
            result.put("function_name", functionName);
            result.put("estimated_gas", gasEstimate.toString());
            result.put("gas_price", gasPrice.toString());
            result.put("estimated_cost_wei", costWei.toString());
            result.put("estimated_cost_eth", costEth.toPlainString());
            
            return result;
            
        } catch (Exception e) {
            logger.error("Gas estimation failed", e);
            throw new ContractException("Gas estimation failed: " + e.getMessage());
        }
    }
    
    // Helper methods
    
    private String callStringFunction(String functionName) throws Exception {
        Function function = new Function(
                functionName,
                Collections.emptyList(),
                Arrays.asList(new TypeReference<Utf8String>() {})
        );
        
        String encodedFunction = FunctionEncoder.encode(function);
        EthCall response = web3j.ethCall(
                Transaction.createEthCallTransaction(null, contractAddress, encodedFunction),
                DefaultBlockParameterName.LATEST
        ).send();
        
        if (response.hasError()) {
            throw new Exception("Contract call failed: " + response.getError().getMessage());
        }
        
        List<Type> result = FunctionReturnDecoder.decode(response.getValue(), function.getOutputParameters());
        return result.isEmpty() ? "" : (String) result.get(0).getValue();
    }
    
    private BigInteger callUint256Function(String functionName) throws Exception {
        Function function = new Function(
                functionName,
                Collections.emptyList(),
                Arrays.asList(new TypeReference<Uint256>() {})
        );
        
        return callContractFunction(function);
    }
    
    private BigInteger callContractFunction(Function function) throws Exception {
        String encodedFunction = FunctionEncoder.encode(function);
        EthCall response = web3j.ethCall(
                Transaction.createEthCallTransaction(null, contractAddress, encodedFunction),
                DefaultBlockParameterName.LATEST
        ).send();
        
        if (response.hasError()) {
            throw new Exception("Contract call failed: " + response.getError().getMessage());
        }
        
        List<Type> result = FunctionReturnDecoder.decode(response.getValue(), function.getOutputParameters());
        return result.isEmpty() ? BigInteger.ZERO : (BigInteger) result.get(0).getValue();
    }
    
    private String sendTransaction(Credentials credentials, Function function) throws Exception {
        String encodedFunction = FunctionEncoder.encode(function);
        
        EthGetTransactionCount transactionCount = web3j.ethGetTransactionCount(
                credentials.getAddress(), DefaultBlockParameterName.LATEST
        ).send();
        
        BigInteger nonce = transactionCount.getTransactionCount();
        BigInteger gasPrice = web3j.ethGasPrice().send().getGasPrice();
        BigInteger gasLimit = BigInteger.valueOf(200000);
        
        org.web3j.crypto.RawTransaction rawTransaction = org.web3j.crypto.RawTransaction.createTransaction(
                nonce, gasPrice, gasLimit, contractAddress, encodedFunction
        );
        
        byte[] signedMessage = org.web3j.crypto.TransactionEncoder.signMessage(rawTransaction, credentials);
        String hexValue = org.web3j.utils.Numeric.toHexString(signedMessage);
        
        EthSendTransaction response = web3j.ethSendRawTransaction(hexValue).send();
        if (response.hasError()) {
            throw new Exception("Transaction failed: " + response.getError().getMessage());
        }
        
        return response.getTransactionHash();
    }
    
    private Function createFunctionForEstimation(String functionName, Map<String, Object> params) {
        switch (functionName.toLowerCase()) {
            case "mint":
                return new Function("mint",
                        Arrays.asList(
                                new Address((String) params.get("to_address")),
                                new Uint256(BigInteger.valueOf(100)) // default for estimation
                        ),
                        Collections.emptyList()
                );
            case "transfer":
                return new Function("transfer",
                        Arrays.asList(
                                new Address((String) params.get("to_address")),
                                new Uint256(BigInteger.valueOf(100)) // default for estimation
                        ),
                        Arrays.asList(new TypeReference<Bool>() {})
                );
            case "burn":
                return new Function("burn",
                        Arrays.asList(new Uint256(BigInteger.valueOf(100))), // default for estimation
                        Collections.emptyList()
                );
            default:
                throw new IllegalArgumentException("Unknown function: " + functionName);
        }
    }
    
    private boolean isValidAddress(String address) {
        return address != null && address.matches("^0x[a-fA-F0-9]{40}$");
    }
}
