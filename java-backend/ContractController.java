
package com.project.controller;

import com.project.model.ApiResponse;
import com.project.model.TokenInfo;
import com.project.model.TransactionRequest;
import com.project.service.ContractService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.Map;

/**
 * REST Controller for Smart Contract Operations
 * Handles all HTTP requests for blockchain interactions
 */
@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "*")
public class ContractController {
    
    private static final Logger logger = LoggerFactory.getLogger(ContractController.class);
    
    @Autowired
    private ContractService contractService;
    
    /**
     * Health check endpoint
     */
    @GetMapping("/")
    public ResponseEntity<ApiResponse<Map<String, Object>>> healthCheck() {
        logger.info("Health check requested");
        
        Map<String, Object> health = new HashMap<>();
        health.put("status", "UP");
        health.put("message", "Smart Contract Backend API is running");
        health.put("version", "1.0.0");
        health.put("timestamp", System.currentTimeMillis());
        
        return ResponseEntity.ok(new ApiResponse<>(true, "API is healthy", health));
    }
    
    /**
     * Get token information
     */
    @GetMapping("/token/info")
    public ResponseEntity<ApiResponse<TokenInfo>> getTokenInfo() {
        try {
            logger.info("Fetching token information");
            TokenInfo tokenInfo = contractService.getTokenInfo();
            return ResponseEntity.ok(new ApiResponse<>(true, "Token info retrieved", tokenInfo));
        } catch (Exception e) {
            logger.error("Error fetching token info: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ApiResponse<>(false, "Failed to fetch token info: " + e.getMessage(), null));
        }
    }
    
    /**
     * Get balance for specific address
     */
    @GetMapping("/balance/{address}")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getBalance(@PathVariable String address) {
        try {
            logger.info("Fetching balance for address: {}", address);
            BigDecimal balance = contractService.getBalance(address);
            
            Map<String, Object> response = new HashMap<>();
            response.put("address", address);
            response.put("balance", balance.toString());
            response.put("formatted_balance", balance.toPlainString());
            
            return ResponseEntity.ok(new ApiResponse<>(true, "Balance retrieved", response));
        } catch (Exception e) {
            logger.error("Error fetching balance: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ApiResponse<>(false, "Failed to fetch balance: " + e.getMessage(), null));
        }
    }
    
    /**
     * Mint new tokens
     */
    @PostMapping("/mint")
    public ResponseEntity<ApiResponse<Map<String, Object>>> mintTokens(@RequestBody TransactionRequest request) {
        try {
            logger.info("Minting {} tokens to {}", request.getAmount(), request.getToAddress());
            String txHash = contractService.mintTokens(request.getToAddress(), request.getAmount());
            
            Map<String, Object> response = new HashMap<>();
            response.put("transaction_hash", txHash);
            response.put("to_address", request.getToAddress());
            response.put("amount", request.getAmount().toString());
            response.put("status", "pending");
            response.put("message", "Mint transaction submitted successfully");
            
            return ResponseEntity.ok(new ApiResponse<>(true, "Mint transaction submitted", response));
        } catch (Exception e) {
            logger.error("Error minting tokens: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ApiResponse<>(false, "Mint failed: " + e.getMessage(), null));
        }
    }
    
    /**
     * Transfer tokens
     */
    @PostMapping("/transfer")
    public ResponseEntity<ApiResponse<Map<String, Object>>> transferTokens(@RequestBody TransactionRequest request) {
        try {
            logger.info("Transferring {} tokens from {} to {}", 
                request.getAmount(), request.getFromAddress(), request.getToAddress());
            
            String txHash = contractService.transferTokens(
                request.getFromAddress(), 
                request.getToAddress(), 
                request.getAmount(), 
                request.getPrivateKey()
            );
            
            Map<String, Object> response = new HashMap<>();
            response.put("transaction_hash", txHash);
            response.put("from_address", request.getFromAddress());
            response.put("to_address", request.getToAddress());
            response.put("amount", request.getAmount().toString());
            response.put("status", "pending");
            response.put("message", "Transfer transaction submitted successfully");
            
            return ResponseEntity.ok(new ApiResponse<>(true, "Transfer transaction submitted", response));
        } catch (Exception e) {
            logger.error("Error transferring tokens: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ApiResponse<>(false, "Transfer failed: " + e.getMessage(), null));
        }
    }
    
    /**
     * Burn tokens
     */
    @PostMapping("/burn")
    public ResponseEntity<ApiResponse<Map<String, Object>>> burnTokens(@RequestBody TransactionRequest request) {
        try {
            logger.info("Burning {} tokens from {}", request.getAmount(), request.getFromAddress());
            
            String txHash = contractService.burnTokens(
                request.getFromAddress(), 
                request.getAmount(), 
                request.getPrivateKey()
            );
            
            Map<String, Object> response = new HashMap<>();
            response.put("transaction_hash", txHash);
            response.put("from_address", request.getFromAddress());
            response.put("amount", request.getAmount().toString());
            response.put("status", "pending");
            response.put("message", "Burn transaction submitted successfully");
            
            return ResponseEntity.ok(new ApiResponse<>(true, "Burn transaction submitted", response));
        } catch (Exception e) {
            logger.error("Error burning tokens: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ApiResponse<>(false, "Burn failed: " + e.getMessage(), null));
        }
    }
    
    /**
     * Get transaction status
     */
    @GetMapping("/transaction/{txHash}")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getTransactionStatus(@PathVariable String txHash) {
        try {
            logger.info("Fetching transaction status for: {}", txHash);
            Map<String, Object> status = contractService.getTransactionStatus(txHash);
            return ResponseEntity.ok(new ApiResponse<>(true, "Transaction status retrieved", status));
        } catch (Exception e) {
            logger.error("Error fetching transaction status: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ApiResponse<>(false, "Failed to fetch transaction status: " + e.getMessage(), null));
        }
    }
    
    /**
     * Estimate gas for operations
     */
    @PostMapping("/gas/estimate")
    public ResponseEntity<ApiResponse<Map<String, Object>>> estimateGas(@RequestBody Map<String, Object> request) {
        try {
            String functionName = (String) request.get("function_name");
            logger.info("Estimating gas for function: {}", functionName);
            
            Map<String, Object> gasEstimate = contractService.estimateGas(functionName, request);
            return ResponseEntity.ok(new ApiResponse<>(true, "Gas estimation completed", gasEstimate));
        } catch (Exception e) {
            logger.error("Error estimating gas: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ApiResponse<>(false, "Gas estimation failed: " + e.getMessage(), null));
        }
    }
}
