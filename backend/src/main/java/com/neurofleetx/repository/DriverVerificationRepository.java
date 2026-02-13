package com.neurofleetx.repository;

import com.neurofleetx.model.DriverVerification;
import com.neurofleetx.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface DriverVerificationRepository extends JpaRepository<DriverVerification, Long> {

    Optional<DriverVerification> findByDriver(User driver);

    Optional<DriverVerification> findByDriverId(Long driverId);

    List<DriverVerification> findByVerificationStatus(DriverVerification.VerificationStatus status);

    List<DriverVerification> findByVerificationStatusIn(List<DriverVerification.VerificationStatus> statuses);

    boolean existsByDriverId(Long driverId);
}
