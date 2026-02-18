package com.neurofleetx.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;

@Entity
@Table(name = "users", uniqueConstraints = {
        @UniqueConstraint(columnNames = "email")
})
@EntityListeners(AuditingEntityListener.class)
@Data
@NoArgsConstructor
@AllArgsConstructor
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank
    @Size(max = 100)
    private String name;

    @NotBlank
    @Email
    @Size(max = 100)
    private String email;

    @NotBlank
    @Size(max = 255)
    @com.fasterxml.jackson.annotation.JsonIgnore
    private String password;

    @Enumerated(EnumType.STRING)
    @Column(length = 20)
    private Role role;

    @Column(length = 50)
    private String phone;

    @Column(length = 500)
    private String address;

    @Column(name = "license_number", length = 100)
    private String licenseNumber;

    @Column(name = "is_active")
    private Boolean isActive = true;

    @Enumerated(EnumType.STRING)
    @Column(name = "approval_status", length = 50)
    private ApprovalStatus approvalStatus = ApprovalStatus.PENDING_ACCOUNT_APPROVAL;

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @LastModifiedDate
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Column(name = "details_submitted")
    private Boolean detailsSubmitted = false;

    @OneToOne(fetch = FetchType.LAZY, cascade = CascadeType.ALL)
    @JoinColumn(name = "vehicle_id")
    @com.fasterxml.jackson.annotation.JsonIgnoreProperties({ "hibernateLazyInitializer", "handler", "currentCity" })
    private Vehicle vehicle;

    public enum Role {
        ADMIN,
        FLEET_MANAGER,
        DRIVER,
        CUSTOMER
    }

    public enum ApprovalStatus {
        PENDING_ACCOUNT_APPROVAL, // Phase 1: Just registered, waiting for admin to approve account
        ACCOUNT_APPROVED, // Phase 1 complete: Account approved, can login but cannot accept rides yet
        APPROVED, // Phase 2 complete: Both account and ride eligibility approved (kept for
                  // backward compatibility)
        REJECTED, // Account/verification rejected by admin
        SUSPENDED // Account suspended by admin
    }
}
