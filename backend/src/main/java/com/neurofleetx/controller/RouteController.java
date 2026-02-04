package com.neurofleetx.controller;

import com.neurofleetx.dto.FareCalculationResult;
import com.neurofleetx.service.RouteService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/routes")
@RequiredArgsConstructor
@CrossOrigin(origins = "*") 
public class RouteController {
    
    private final RouteService routeService;
    
    @GetMapping("/fare")
    public ResponseEntity<FareCalculationResult> calculateFare(
        @RequestParam Long sourceCityId,
        @RequestParam Long destCityId,
        @RequestParam(required = false) String vehicleType
    ) {
        FareCalculationResult result = routeService.calculateFare(sourceCityId, destCityId, vehicleType);
        return ResponseEntity.ok(result);
    }
}
