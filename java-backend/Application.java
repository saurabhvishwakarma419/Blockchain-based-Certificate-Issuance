package com.project;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/**
 * Main Spring Boot Application Class
 * Entry point for the Smart Contract Backend API
 */
@SpringBootApplication
public class Application {
    
    public static void main(String[] args) {
        System.out.println("🚀 Starting Smart Contract Backend...");
        SpringApplication.run(Application.class, args);
        System.out.println("✅ Smart Contract Backend is running on port 8080!");
        System.out.println("📋 API Documentation: http://localhost:8080/swagger-ui.html");
    }
    
    /**
     * Configure CORS for frontend integration
     */
    @Bean
    public WebMvcConfigurer corsConfigurer() {
        return new WebMvcConfigurer() {
            @Override
            public void addCorsMappings(CorsRegistry registry) {
                registry.addMapping("/**")
                        .allowedOrigins("*")
                        .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
                        .allowedHeaders("*");
            }
        };
    }
}
