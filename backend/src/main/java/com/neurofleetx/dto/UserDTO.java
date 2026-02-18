package com.neurofleetx.dto;

import com.neurofleetx.model.User;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UserDTO {
    private Long id;
    private String name;
    private String email;
    private String role;
    private String phone;
    private String address;
    private String licenseNumber;
    private Boolean isActive;
    private String approvalStatus;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private Boolean detailsSubmitted;
    private VehicleDTO vehicle;

    // Constructor from User entity
    public static UserDTO fromUser(User user) {
        UserDTO dto = new UserDTO();
        dto.setId(user.getId());
        dto.setName(user.getName());
        dto.setEmail(user.getEmail());
        dto.setRole(user.getRole() != null ? user.getRole().name() : null);
        dto.setPhone(user.getPhone());
        dto.setAddress(user.getAddress());
        dto.setLicenseNumber(user.getLicenseNumber());
        dto.setIsActive(user.getIsActive());
        dto.setApprovalStatus(user.getApprovalStatus() != null ? user.getApprovalStatus().name() : null);
        dto.setCreatedAt(user.getCreatedAt());
        dto.setUpdatedAt(user.getUpdatedAt());
        dto.setDetailsSubmitted(user.getDetailsSubmitted());

        // Only include vehicle if it exists (for drivers)
        if (user.getVehicle() != null) {
            VehicleDTO vehicleDTO = new VehicleDTO();
            vehicleDTO.setId(user.getVehicle().getId());
            vehicleDTO.setVehicleCode(user.getVehicle().getVehicleCode());
            vehicleDTO.setName(user.getVehicle().getName());
            vehicleDTO.setType(user.getVehicle().getType() != null ? user.getVehicle().getType().name() : null);
            vehicleDTO.setModel(user.getVehicle().getModel());
            vehicleDTO.setSeats(user.getVehicle().getSeats());
            vehicleDTO.setFuelType(
                    user.getVehicle().getFuelType() != null ? user.getVehicle().getFuelType().name() : null);
            vehicleDTO.setPricePerHour(user.getVehicle().getPricePerHour());
            vehicleDTO.setRating(user.getVehicle().getRating());
            vehicleDTO.setBatteryLevel(user.getVehicle().getBatteryLevel());
            vehicleDTO.setStatus(user.getVehicle().getStatus() != null ? user.getVehicle().getStatus().name() : null);
            dto.setVehicle(vehicleDTO);
        }

        return dto;
    }
}
