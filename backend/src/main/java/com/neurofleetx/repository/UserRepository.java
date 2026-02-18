package com.neurofleetx.repository;

import com.neurofleetx.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByEmail(String email);

    Boolean existsByEmail(String email);

    Optional<User> findByIdAndIsActiveTrue(Long id);

    List<User> findByApprovalStatus(User.ApprovalStatus approvalStatus);

    List<User> findByRole(User.Role role);

    List<User> findByRoleAndApprovalStatus(User.Role role, User.ApprovalStatus approvalStatus);

    // ✅ PERMANENT FIX: Fetch User + Vehicle together (avoid LazyInitialization +
    // 500)
    @Query("""
                SELECT u FROM User u
                LEFT JOIN FETCH u.vehicle
                WHERE u.email = :email
            """)
    Optional<User> findByEmailWithVehicle(@Param("email") String email);

    // Fetch all users with vehicles to avoid lazy initialization issues
    @Query("""
                SELECT DISTINCT u FROM User u
                LEFT JOIN FETCH u.vehicle
            """)
    List<User> findAllWithVehicle();

    // Fetch users by role with vehicles to avoid lazy initialization issues
    @Query("""
                SELECT DISTINCT u FROM User u
                LEFT JOIN FETCH u.vehicle
                WHERE u.role = :role
            """)
    List<User> findByRoleWithVehicle(@Param("role") User.Role role);
}
