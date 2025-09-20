
package com.project.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.web3j.protocol.Web3j;
import org.web3j.protocol.http.HttpService;

/**
 * Web3 Configuration Class
 * Sets up blockchain connection and Web3j instance
 */
@Configuration
public class Web3Config {
    
    private static final Logger logger = LoggerFactory.getLogger(Web3Config.class);
