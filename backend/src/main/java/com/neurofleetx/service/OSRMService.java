package com.neurofleetx.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.neurofleetx.dto.RouteOptionDTO;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class OSRMService {

    private static final Logger logger = LoggerFactory.getLogger(OSRMService.class);
    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper;

    @Value("${osrm.api.url:http://router.project-osrm.org}")
    private String osrmApiUrl;

    private static final double TRAFFIC_WEIGHT_DEFAULT = 0.0;

    /**
     * Fetches routes from OSRM API including alternatives
     * 
     * @return List of RouteOptionDTO containing route data
     */
    public List<RouteOptionDTO> getRoutes(Double pickupLng, Double pickupLat,
            Double dropLng, Double dropLat) {
        try {
            String url = String.format(
                    "%s/route/v1/driving/%f,%f;%f,%f?alternatives=true&overview=full&geometries=geojson&steps=true",
                    osrmApiUrl, pickupLng, pickupLat, dropLng, dropLat);

            logger.info("Calling OSRM API: {}", url);
            String response = restTemplate.getForObject(url, String.class);

            if (response == null) {
                logger.error("OSRM API returned null response");
                return getFallbackRoute(pickupLng, pickupLat, dropLng, dropLat);
            }

            return parseOSRMResponse(response);

        } catch (Exception e) {
            logger.error("Error calling OSRM API: {}", e.getMessage(), e);
            return getFallbackRoute(pickupLng, pickupLat, dropLng, dropLat);
        }
    }

    /**
     * Parses OSRM JSON response and converts to RouteOptionDTO list
     */
    private List<RouteOptionDTO> parseOSRMResponse(String response) throws Exception {
        List<RouteOptionDTO> routes = new ArrayList<>();
        JsonNode root = objectMapper.readTree(response);

        if (!root.has("routes") || root.get("routes").size() == 0) {
            throw new RuntimeException("No routes found in OSRM response");
        }

        JsonNode routesNode = root.get("routes");

        for (int i = 0; i < routesNode.size(); i++) {
            JsonNode routeNode = routesNode.get(i);
            RouteOptionDTO route = new RouteOptionDTO();

            // Distance in meters, convert to km
            double distanceMeters = routeNode.get("distance").asDouble();
            route.setDistance(BigDecimal.valueOf(distanceMeters / 1000.0).setScale(2, RoundingMode.HALF_UP));

            // Duration in seconds, convert to minutes
            double durationSeconds = routeNode.get("duration").asDouble();
            route.setDuration(BigDecimal.valueOf(durationSeconds / 60.0).setScale(2, RoundingMode.HALF_UP));

            // Extract geometry coordinates
            if (routeNode.has("geometry") && routeNode.get("geometry").has("coordinates")) {
                JsonNode coordinates = routeNode.get("geometry").get("coordinates");
                List<List<Double>> geometry = new ArrayList<>();
                for (JsonNode coord : coordinates) {
                    List<Double> point = new ArrayList<>();
                    point.add(coord.get(0).asDouble()); // longitude
                    point.add(coord.get(1).asDouble()); // latitude
                    geometry.add(point);
                }
                route.setGeometry(geometry);
            }

            // Calculate score: prioritize duration (60%), distance (30%), traffic (10%)
            BigDecimal durationScore = route.getDuration().multiply(BigDecimal.valueOf(0.6));
            BigDecimal distanceScore = route.getDistance().multiply(BigDecimal.valueOf(0.3));
            BigDecimal trafficScore = BigDecimal.valueOf(TRAFFIC_WEIGHT_DEFAULT * 0.1);

            route.setScore(durationScore.add(distanceScore).add(trafficScore));
            route.setSummary(String.format("%.1f km, %.0f min",
                    route.getDistance().doubleValue(),
                    route.getDuration().doubleValue()));

            routes.add(route);
        }

        return routes;
    }

    /**
     * Fallback route calculation using straight-line distance
     */
    private List<RouteOptionDTO> getFallbackRoute(Double pickupLng, Double pickupLat,
            Double dropLng, Double dropLat) {
        logger.warn("Using fallback route calculation");

        RouteOptionDTO fallbackRoute = new RouteOptionDTO();

        // Calculate straight-line distance using Haversine
        double distance = calculateHaversineDistance(pickupLat, pickupLng, dropLat, dropLng);
        fallbackRoute.setDistance(BigDecimal.valueOf(distance).setScale(2, RoundingMode.HALF_UP));

        // Estimate duration: assume average speed of 30 km/h
        BigDecimal duration = fallbackRoute.getDistance()
                .divide(BigDecimal.valueOf(30.0), 2, RoundingMode.HALF_UP)
                .multiply(BigDecimal.valueOf(60)); // convert hours to minutes
        fallbackRoute.setDuration(duration);

        // Simple geometry: straight line
        List<List<Double>> geometry = new ArrayList<>();
        geometry.add(List.of(pickupLng, pickupLat));
        geometry.add(List.of(dropLng, dropLat));
        fallbackRoute.setGeometry(geometry);

        // Calculate score
        BigDecimal score = duration.multiply(BigDecimal.valueOf(0.6))
                .add(fallbackRoute.getDistance().multiply(BigDecimal.valueOf(0.3)));
        fallbackRoute.setScore(score);
        fallbackRoute.setSummary(String.format("%.1f km (estimated), %.0f min (estimated)",
                distance, duration.doubleValue()));

        return List.of(fallbackRoute);
    }

    /**
     * Haversine formula for calculating distance between two coordinates
     */
    private double calculateHaversineDistance(double lat1, double lon1, double lat2, double lon2) {
        final int EARTH_RADIUS = 6371; // Radius in kilometers

        double dLat = Math.toRadians(lat2 - lat1);
        double dLon = Math.toRadians(lon2 - lon1);

        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
                + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                        * Math.sin(dLon / 2) * Math.sin(dLon / 2);

        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

        return EARTH_RADIUS * c;
    }
}
