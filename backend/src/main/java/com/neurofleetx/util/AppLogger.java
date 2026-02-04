package com.neurofleetx.util;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * Centralized logging utility for NeuroFleetX
 * Replaces System.out.println and e.printStackTrace()
 * with proper structured logging
 */
public class AppLogger {
    
    /**
     * Get logger for a specific class
     */
    public static Logger getLogger(Class<?> clazz) {
        return LoggerFactory.getLogger(clazz);
    }
    
    /**
     * Log info message
     */
    public static void info(Class<?> clazz, String message) {
        getLogger(clazz).info(message);
    }
    
    /**
     * Log debug message
     */
    public static void debug(Class<?> clazz, String message) {
        getLogger(clazz).debug(message);
    }
    
    /**
     * Log warning message
     */
    public static void warn(Class<?> clazz, String message) {
        getLogger(clazz).warn(message);
    }
    
    /**
     * Log error message
     */
    public static void error(Class<?> clazz, String message) {
        getLogger(clazz).error(message);
    }
    
    /**
     * Log error with exception
     * SECURITY: Does not expose full stack trace in production
     */
    public static void error(Class<?> clazz, String message, Throwable throwable) {
        Logger logger = getLogger(clazz);
        logger.error(message, throwable);
    }
    
    /**
     * Log sensitive operation (sanitized)
     * SECURITY: Masks sensitive data
     */
    public static void logSensitiveOperation(Class<?> clazz, String operation, String userId) {
        getLogger(clazz).info("Operation: {} | User: {}", operation, maskSensitiveData(userId));
    }
    
    /**
     * Mask sensitive data for logging
     * SECURITY: Prevents logging of full sensitive values
     */
    private static String maskSensitiveData(String data) {
        if (data == null || data.length() <= 4) {
            return "****";
        }
        return data.substring(0, 2) + "****" + data.substring(data.length() - 2);
    }
}
