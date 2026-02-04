package com.neurofleetx.config;

import com.neurofleetx.security.JwtTokenProvider;
import com.neurofleetx.security.UserDetailsServiceImpl;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.config.ChannelRegistration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;
import org.springframework.web.socket.server.HandshakeInterceptor;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    private static final Logger logger = LoggerFactory.getLogger(WebSocketConfig.class);

    @Autowired
    private JwtTokenProvider tokenProvider;

    @Autowired
    private UserDetailsServiceImpl userDetailsService;

    @Override
    public void configureMessageBroker(MessageBrokerRegistry registry) {
        registry.enableSimpleBroker("/topic", "/queue");
        registry.setApplicationDestinationPrefixes("/app");
        registry.setUserDestinationPrefix("/user");
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        registry.addEndpoint("/api/ws")
                .addInterceptors(new HandshakeInterceptor() {
                    @Override
                    public boolean beforeHandshake(org.springframework.http.server.ServerHttpRequest request,
                            org.springframework.http.server.ServerHttpResponse response,
                            org.springframework.web.socket.WebSocketHandler wsHandler,
                            java.util.Map<String, Object> attributes) throws Exception {
                        try {
                            // Extract token from query parameter and store in session attributes
                            if (request instanceof org.springframework.http.server.ServletServerHttpRequest httpRequest) {
                                String query = httpRequest
                                        .getServletRequest().getQueryString();
                                if (query != null && query.contains("token=")) {
                                    String token = query.split("token=")[1].split("&")[0];
                                    attributes.put("token", token);
                                    logger.debug("Token extracted from query parameter");
                                }
                            }
                        } catch (Exception e) {
                            logger.error("Error extracting token from query parameters", e);
                        }
                        return true;
                    }

                    @Override
                    public void afterHandshake(org.springframework.http.server.ServerHttpRequest request,
                            org.springframework.http.server.ServerHttpResponse response,
                            org.springframework.web.socket.WebSocketHandler wsHandler,
                            Exception exception) {
                        // no-op
                    }
                })
                .setAllowedOriginPatterns("*")
                .withSockJS();
    }

    @Override
    public void configureClientInboundChannel(ChannelRegistration registration) {
        registration.interceptors(new ChannelInterceptor() {
            @Override
            public Message<?> preSend(Message<?> message, MessageChannel channel) {
                StompHeaderAccessor accessor = StompHeaderAccessor.wrap(message);

                // Only process CONNECT messages
                if (StompCommand.CONNECT.equals(accessor.getCommand())) {
                    String authHeader = accessor.getFirstNativeHeader("Authorization");
                    String token = null;

                    // Try Authorization header first
                    if (authHeader != null && authHeader.startsWith("Bearer ")) {
                        token = authHeader.substring(7);
                    }
                    // Try token native header (from connectHeaders)
                    else if (accessor.getNativeHeader("Authorization") != null) {
                        java.util.List<String> authHeaders = accessor.getNativeHeader("Authorization");
                        if (!authHeaders.isEmpty() && authHeaders.getFirst().startsWith("Bearer ")) {
                            token = authHeaders.getFirst().substring(7);
                        }
                    }
                    // Try to get from session attributes (populated by handshake interceptor)
                    else if (accessor.getSessionAttributes() != null &&
                            accessor.getSessionAttributes().containsKey("token")) {
                        token = (String) accessor.getSessionAttributes().get("token");
                    }

                    if (token != null) {
                        try {
                            // Validate token and extract user ID
                            if (tokenProvider.validateToken(token)) {
                                String userId = tokenProvider.getUserIdFromToken(token);
                                logger.debug("WebSocket JWT valid for userId: {}", userId);

                                // Load user details by ID
                                UserDetails userDetails = userDetailsService.loadUserById(Long.parseLong(userId));

                                // Create authentication token with user details
                                UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken(
                                        userDetails, null, userDetails.getAuthorities());
                                accessor.setUser(auth);
                                logger.debug("WebSocket authentication set for user: {}", userDetails.getUsername());
                            } else {
                                logger.warn("WebSocket JWT validation failed");
                            }
                        } catch (Exception e) {
                            logger.error("WebSocket JWT processing error: {}", e.getMessage(), e);
                        }
                    } else {
                        logger.warn("No token found in Authorization header, native header, or session attributes");
                    }
                }

                return message;
            }
        });
    }
}
