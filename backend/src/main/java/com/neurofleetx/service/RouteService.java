package com.neurofleetx.service;

import com.neurofleetx.dto.FareCalculationResult;
import com.neurofleetx.model.City;
import com.neurofleetx.model.Route;
import com.neurofleetx.model.Vehicle;
import com.neurofleetx.repository.CityRepository;
import com.neurofleetx.repository.RouteRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.*;

@Service
@RequiredArgsConstructor
public class RouteService {

    private final RouteRepository routeRepository;
    private final CityRepository cityRepository;

    /**
     * Calculates the shortest path distance between two cities using Dijkstra's algorithm.
     * Returns null if no path is found.
     */
    public BigDecimal getShortestDistance(Long sourceCityId, Long destCityId) {
        if (sourceCityId.equals(destCityId)) {
            return BigDecimal.ZERO;
        }

        List<City> cities = cityRepository.findAll();
        List<Route> routes = routeRepository.findAll();

        // 1. Build Adjacency List: Map<CityId, List<Edge>>
        // Edge maps neighborId -> distance
        Map<Long, Map<Long, BigDecimal>> graph = new HashMap<>();

        for (Route route : routes) {
            Long u = route.getSourceCity().getId();
            Long v = route.getDestinationCity().getId();
            BigDecimal dist = route.getDistanceKm();

            graph.computeIfAbsent(u, k -> new HashMap<>()).put(v, dist);
            // Assuming undirected graph for roads usually, but let's see. 
            // If data is stored one-way but implies two-way, add reverse. 
            // Often routes are defined A->B. Safe to assume two-way for standard roads unless specified.
            graph.computeIfAbsent(v, k -> new HashMap<>()).put(u, dist);
        }

        // 2. Dijkstra's Algorithm
        PriorityQueue<Node> pq = new PriorityQueue<>(Comparator.comparing(n -> n.distance));
        Map<Long, BigDecimal> distances = new HashMap<>();
        Set<Long> visited = new HashSet<>();

        // Initialize
        for (City city : cities) {
            distances.put(city.getId(), null); // null represents infinity
        }
        
        // Start node
        distances.put(sourceCityId, BigDecimal.ZERO);
        pq.add(new Node(sourceCityId, BigDecimal.ZERO));

        while (!pq.isEmpty()) {
            Node current = pq.poll();
            Long u = current.id;

            if (visited.contains(u)) continue;
            visited.add(u);

            if (u.equals(destCityId)) {
                return distances.get(u);
            }

            if (graph.containsKey(u)) {
                for (Map.Entry<Long, BigDecimal> neighbor : graph.get(u).entrySet()) {
                    Long v = neighbor.getKey();
                    BigDecimal weight = neighbor.getValue();

                    if (!visited.contains(v)) {
                         BigDecimal currentDist = distances.get(v);
                         BigDecimal newDist = distances.get(u).add(weight);

                         if (currentDist == null || newDist.compareTo(currentDist) < 0) {
                             distances.put(v, newDist);
                             pq.add(new Node(v, newDist));
                         }
                    }
                }
            }
        }

        return null; // unreachable
    }

    public FareCalculationResult calculateFare(Long sourceCityId, Long destCityId, String vehicleTypeStr) {
        BigDecimal distance = getShortestDistance(sourceCityId, destCityId);
        if (distance == null) {
            throw new RuntimeException("No route found between selected cities");
        }

        BigDecimal baseFare = new BigDecimal("50.00"); 
        BigDecimal ratePerKm = new BigDecimal("10.00");

        Vehicle.VehicleType type = Vehicle.VehicleType.SEDAN; 
        try {
            if (vehicleTypeStr != null && !vehicleTypeStr.isEmpty()) {
                type = Vehicle.VehicleType.valueOf(vehicleTypeStr);
            }
        } catch (IllegalArgumentException e) {
            // ignore, use default
        }

        if (type == Vehicle.VehicleType.ELECTRICAL_VEHICLE || type == Vehicle.VehicleType.BIKE) {
            ratePerKm = new BigDecimal("5.00");
        }
        
        // Calculate
        BigDecimal distanceCost = distance.multiply(ratePerKm);
        BigDecimal estimatedCost = baseFare.add(distanceCost);
        
        // Add Tax (10%)
        estimatedCost = estimatedCost.multiply(BigDecimal.valueOf(1.10)).setScale(2, RoundingMode.HALF_UP);

        City source = cityRepository.findById(sourceCityId).orElse(new City());
        City dest = cityRepository.findById(destCityId).orElse(new City());
        String details = source.getName() + " -> " + dest.getName();

        return new FareCalculationResult(
            distance,
            estimatedCost,
            baseFare,
            ratePerKm,
            details
        );
    }

    private static class Node {
        Long id;
        BigDecimal distance;

        public Node(Long id, BigDecimal distance) {
            this.id = id;
            this.distance = distance;
        }
    }
}
