package com.neurofleetx.service;

import com.neurofleetx.dto.RouteOptimizationResponse;
import com.neurofleetx.dto.RouteOptionDTO;
import com.neurofleetx.dto.RouteRequest;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

@Service
@RequiredArgsConstructor
public class RouteOptimizationService {

        private static final Logger logger = LoggerFactory.getLogger(RouteOptimizationService.class);
        private final OSRMService osrmService;

        /**
         * Gets optimized routes with best and alternate options
         */
        public RouteOptimizationResponse getOptimizedRoutes(RouteRequest request) {
                logger.info("Getting optimized routes from ({}, {}) to ({}, {})",
                                request.getPickupLatitude(), request.getPickupLongitude(),
                                request.getDropLatitude(), request.getDropLongitude());

                // Fetch routes from OSRM
                List<RouteOptionDTO> routes = osrmService.getRoutes(
                                request.getPickupLongitude(),
                                request.getPickupLatitude(),
                                request.getDropLongitude(),
                                request.getDropLatitude());

                if (routes.isEmpty()) {
                        throw new RuntimeException("Unable to find any routes");
                }

                // Sort routes by score (lower is better)
                routes.sort(Comparator.comparing(RouteOptionDTO::getScore));

                // Mark best route
                RouteOptionDTO bestRoute = routes.get(0);
                bestRoute.setBestRoute(true);

                // Get alternate routes (up to 2 more)
                List<RouteOptionDTO> alternateRoutes = new ArrayList<>();
                for (int i = 1; i < Math.min(routes.size(), 3); i++) {
                        routes.get(i).setBestRoute(false);
                        alternateRoutes.add(routes.get(i));
                }

                // Build response
                RouteOptimizationResponse response = new RouteOptimizationResponse();
                response.setBestRoute(bestRoute);
                response.setAlternateRoutes(alternateRoutes);
                response.setEstimatedTimeArrival(bestRoute.getDuration());
                response.setTotalDistance(bestRoute.getDistance());

                // Set pickup and drop locations
                RouteOptimizationResponse.PickupDropLocation pickup = new RouteOptimizationResponse.PickupDropLocation(
                                request.getPickupLatitude(),
                                request.getPickupLongitude(),
                                request.getPickupAddress());

                RouteOptimizationResponse.PickupDropLocation drop = new RouteOptimizationResponse.PickupDropLocation(
                                request.getDropLatitude(),
                                request.getDropLongitude(),
                                request.getDropAddress());

                response.setPickup(pickup);
                response.setDrop(drop);

                logger.info("Found {} route(s). Best route: {} km, {} min",
                                routes.size(),
                                bestRoute.getDistance(),
                                bestRoute.getDuration());

                return response;
        }
}
