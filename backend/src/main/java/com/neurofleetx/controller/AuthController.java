package com.neurofleetx.controller;

import com.neurofleetx.dto.JwtResponse;
import com.neurofleetx.dto.LoginRequest;
import com.neurofleetx.dto.MessageResponse;
import com.neurofleetx.dto.RegisterRequest;
import com.neurofleetx.model.User;
import com.neurofleetx.repository.UserRepository;
import com.neurofleetx.security.JwtTokenProvider;
import com.neurofleetx.security.UserDetailsImpl;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "*", maxAge = 3600)
public class AuthController {

    @Autowired
    private AuthenticationManager authenticationManager;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtTokenProvider jwtTokenProvider;

    private static final org.slf4j.Logger logger = org.slf4j.LoggerFactory.getLogger(AuthController.class);

    /**
     * Login endpoint
     */
    @PostMapping("/login")
    public ResponseEntity<?> authenticateUser(@Valid @RequestBody LoginRequest loginRequest) {
        logger.info("=== LOGIN ATTEMPT ===");
        logger.info("Email: {}", loginRequest.getEmail());

        // Check if user exists and get approval status
        var optionalUser = userRepository.findByEmail(loginRequest.getEmail());
        if (optionalUser.isEmpty()) {
            logger.warn("LOGIN FAILED: Email not found in database - {}", loginRequest.getEmail());
            logger.warn("Please verify the email is correct and matches the registered email");
            return ResponseEntity.badRequest()
                    .body(new MessageResponse("Error: Email not registered. Please check your email and try again."));
        }

        User user = optionalUser.get();
        logger.info("User found in database:");
        logger.info("  - ID: {}", user.getId());
        logger.info("  - Name: {}", user.getName());
        logger.info("  - Email: {}", user.getEmail());
        logger.info("  - Role: {}", user.getRole());
        logger.info("  - Approval Status: {}", user.getApprovalStatus());
        logger.info("  - Is Active: {}", user.getIsActive());

        // Check approval status for fleet managers and drivers (Phase 1: Account
        // Approval)
        if (user.getRole() == User.Role.FLEET_MANAGER || user.getRole() == User.Role.DRIVER) {
            if (user.getApprovalStatus() == User.ApprovalStatus.PENDING_ACCOUNT_APPROVAL) {
                logger.warn("LOGIN BLOCKED: Account pending approval - {}", loginRequest.getEmail());
                return ResponseEntity.badRequest()
                        .body(new MessageResponse(
                                "Your account is pending admin approval. Please wait for approval."));
            } else if (user.getApprovalStatus() == User.ApprovalStatus.REJECTED) {
                logger.warn("LOGIN BLOCKED: Account rejected - {}", loginRequest.getEmail());
                return ResponseEntity.badRequest()
                        .body(new MessageResponse(
                                "Your account has been rejected by admin. Please contact support."));
            } else if (user.getApprovalStatus() == User.ApprovalStatus.SUSPENDED) {
                logger.warn("LOGIN BLOCKED: Account suspended - {}", loginRequest.getEmail());
                return ResponseEntity.badRequest()
                        .body(new MessageResponse(
                                "Your account has been suspended. Please contact support."));
            } else if (user.getApprovalStatus() != User.ApprovalStatus.ACCOUNT_APPROVED
                    && user.getApprovalStatus() != User.ApprovalStatus.APPROVED) {
                logger.error("LOGIN BLOCKED: Invalid approval status - {} for user {}",
                        user.getApprovalStatus(), loginRequest.getEmail());
                return ResponseEntity.badRequest()
                        .body(new MessageResponse("Your account status is invalid. Please contact support."));
            }
            logger.info("Approval check passed: User has {} status", user.getApprovalStatus());
        }

        // Check if user is active
        if (!user.getIsActive()) {
            logger.warn("LOGIN BLOCKED: Account inactive - {}", loginRequest.getEmail());
            return ResponseEntity.badRequest()
                    .body(new MessageResponse("Your account is inactive. Please contact support."));
        }

        logger.info("All validation checks passed. Proceeding with authentication...");

        try {
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(
                            loginRequest.getEmail(),
                            loginRequest.getPassword()));

            SecurityContextHolder.getContext().setAuthentication(authentication);
            String jwt = jwtTokenProvider.generateToken(authentication);

            UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
            String role = userDetails.getAuthorities().iterator().next().getAuthority().replace("ROLE_", "");

            logger.info("=== LOGIN SUCCESSFUL ===");
            logger.info("User: {} ({})", user.getName(), loginRequest.getEmail());
            logger.info("Role: {}", role);
            logger.info("Token generated successfully");

            return ResponseEntity.ok(new JwtResponse(
                    jwt,
                    userDetails.getId().toString(), // Convert Long to String
                    userDetails.getName(),
                    userDetails.getEmail(),
                    role));
        } catch (org.springframework.security.authentication.BadCredentialsException ex) {
            logger.warn("LOGIN FAILED: Invalid password for email: {}", loginRequest.getEmail());
            return ResponseEntity.status(401).body(new MessageResponse("Error: Invalid email or password"));
        } catch (Exception e) {
            logger.error("LOGIN ERROR: Unexpected authentication error for {}: {}",
                    loginRequest.getEmail(), e.getMessage(), e);
            return ResponseEntity.status(500)
                    .body(new MessageResponse("An unexpected error occurred"));
        }
    }

    /**
     * Register endpoint
     */
    @PostMapping("/register")
    public ResponseEntity<?> registerUser(@Valid @RequestBody RegisterRequest registerRequest) {
        logger.info("Registration attempt: email={}, role={}",
                registerRequest.getEmail(), registerRequest.getRole());
        logger.debug("Registration request: name={}, email={}, role={}",
                registerRequest.getName(), registerRequest.getEmail(), registerRequest.getRole());

        // Check if email already exists
        if (userRepository.existsByEmail(registerRequest.getEmail())) {
            logger.warn("Registration failed: Email already exists - {}", registerRequest.getEmail());
            return ResponseEntity.badRequest()
                    .body(new MessageResponse("Error: Email is already in use!"));
        }

        // Create new user
        User user = new User();
        user.setName(registerRequest.getName());
        user.setEmail(registerRequest.getEmail());
        user.setPassword(passwordEncoder.encode(registerRequest.getPassword()));
        user.setPhone(registerRequest.getPhone());
        user.setIsActive(true);

        // Set role and approval status
        try {
            User.Role role = User.Role.valueOf(registerRequest.getRole().toUpperCase());
            user.setRole(role);

            // Set approval status based on role
            if (role == User.Role.FLEET_MANAGER || role == User.Role.DRIVER) {
                // Fleet managers and drivers need admin approval (Phase 1)
                user.setApprovalStatus(User.ApprovalStatus.PENDING_ACCOUNT_APPROVAL);
                user.setIsActive(false); // Inactive until account approved
            } else if (role == User.Role.CUSTOMER || role == User.Role.ADMIN) {
                // Customers and admins are auto-approved
                user.setApprovalStatus(User.ApprovalStatus.APPROVED);
                user.setIsActive(true);
            }
        } catch (IllegalArgumentException e) {
            logger.error("Registration failed: Invalid role - {}", registerRequest.getRole());
            return ResponseEntity.badRequest()
                    .body(new MessageResponse("Error: Invalid role specified"));
        }

        userRepository.save(user);
        logger.info("User registered successfully: id={}, email={}, role={}, approvalStatus={}",
                user.getId(), user.getEmail(), user.getRole(), user.getApprovalStatus());

        // Return different messages based on role
        if (user.getRole() == User.Role.FLEET_MANAGER || user.getRole() == User.Role.DRIVER) {
            return ResponseEntity.ok(new MessageResponse(
                    "Registration successful! Your account is pending admin approval. You will be notified once approved."));
        } else {
            return ResponseEntity.ok(new MessageResponse("User registered successfully!"));
        }
    }

    /**
     * Health check endpoint
     */
    @GetMapping("/health")
    public ResponseEntity<?> healthCheck() {
        return ResponseEntity.ok(new MessageResponse("NeuroFleetX Backend API is running!"));
    }
}
