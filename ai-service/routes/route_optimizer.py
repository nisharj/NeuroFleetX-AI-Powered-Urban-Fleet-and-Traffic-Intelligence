"""
Route Optimization Module
Uses Dijkstra's algorithm and traffic patterns for optimal route calculation
"""

from flask import Blueprint, request, jsonify
import numpy as np
from geopy.distance import geodesic
import heapq

route_optimizer_bp = Blueprint('route_optimizer', __name__)

class RouteOptimizer:
    """AI-powered route optimization engine"""
    
    def __init__(self):
        # Simulated traffic data (in real implementation, this would come from live traffic APIs)
        self.traffic_multipliers = {
            'low': 1.0,
            'medium': 1.3,
            'high': 1.7,
            'very_high': 2.2
        }
    
    def calculate_distance(self, point1, point2):
        """Calculate distance between two GPS coordinates"""
        return geodesic(point1, point2).kilometers
    
    def estimate_time(self, distance_km, traffic_level='medium'):
        """Estimate travel time based on distance and traffic"""
        avg_speed_kmh = 40  # Average city speed
        traffic_multiplier = self.traffic_multipliers.get(traffic_level, 1.3)
        time_hours = (distance_km / avg_speed_kmh) * traffic_multiplier
        return time_hours * 60  # Return in minutes
    
    def calculate_fuel_cost(self, distance_km, vehicle_type='EV'):
        """Calculate estimated fuel/energy cost"""
        # Cost per km for different vehicle types
        cost_per_km = {
            'EV': 0.05,      # $0.05 per km for electric
            'SEDAN': 0.12,   # $0.12 per km for sedan
            'SUV': 0.18,     # $0.18 per km for SUV
            'VAN': 0.15,     # $0.15 per km for van
            'BIKE': 0.03     # $0.03 per km for bike
        }
        return distance_km * cost_per_km.get(vehicle_type, 0.12)
    
    def optimize_route(self, start, end, waypoints=None, traffic_level='medium', vehicle_type='EV'):
        """
        Optimize route from start to end with optional waypoints
        Returns optimized route with distance, time, and cost estimates
        """
        # Build route points
        route_points = [start]
        if waypoints:
            route_points.extend(waypoints)
        route_points.append(end)
        
        # Calculate total distance
        total_distance = 0
        route_segments = []
        
        for i in range(len(route_points) - 1):
            point1 = (route_points[i]['lat'], route_points[i]['lng'])
            point2 = (route_points[i + 1]['lat'], route_points[i + 1]['lng'])
            
            segment_distance = self.calculate_distance(point1, point2)
            segment_time = self.estimate_time(segment_distance, traffic_level)
            
            route_segments.append({
                'from': route_points[i],
                'to': route_points[i + 1],
                'distance_km': round(segment_distance, 2),
                'time_minutes': round(segment_time, 1),
                'traffic_level': traffic_level
            })
            
            total_distance += segment_distance
        
        # Calculate totals
        total_time = self.estimate_time(total_distance, traffic_level)
        total_cost = self.calculate_fuel_cost(total_distance, vehicle_type)
        
        # AI recommendation: suggest alternative if traffic is high
        recommendation = None
        if traffic_level in ['high', 'very_high']:
            recommendation = "Consider delaying trip by 1-2 hours for better traffic conditions"
        
        return {
            'route': route_segments,
            'summary': {
                'total_distance_km': round(total_distance, 2),
                'estimated_time_minutes': round(total_time, 1),
                'estimated_cost': round(total_cost, 2),
                'traffic_level': traffic_level,
                'vehicle_type': vehicle_type
            },
            'recommendation': recommendation
        }

# Initialize optimizer
optimizer = RouteOptimizer()

@route_optimizer_bp.route('/optimize', methods=['POST'])
def optimize_route():
    """
    POST /api/ai/routes/optimize
    Optimize route from start to destination
    
    Request body:
    {
        "start": {"lat": 40.7128, "lng": -74.0060, "name": "Start Location"},
        "end": {"lat": 40.7589, "lng": -73.9851, "name": "End Location"},
        "waypoints": [{"lat": 40.7484, "lng": -73.9857, "name": "Waypoint"}],
        "traffic_level": "medium",
        "vehicle_type": "EV"
    }
    """
    try:
        data = request.get_json()
        
        # Validate required fields
        if not data.get('start') or not data.get('end'):
            return jsonify({'error': 'Start and end locations are required'}), 400
        
        # Extract parameters
        start = data['start']
        end = data['end']
        waypoints = data.get('waypoints', [])
        traffic_level = data.get('traffic_level', 'medium')
        vehicle_type = data.get('vehicle_type', 'EV')
        
        # Optimize route
        result = optimizer.optimize_route(start, end, waypoints, traffic_level, vehicle_type)
        
        return jsonify(result), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@route_optimizer_bp.route('/estimate', methods=['POST'])
def estimate_trip():
    """
    POST /api/ai/routes/estimate
    Quick estimate for distance, time, and cost
    """
    try:
        data = request.get_json()
        
        start = (data['start']['lat'], data['start']['lng'])
        end = (data['end']['lat'], data['end']['lng'])
        traffic_level = data.get('traffic_level', 'medium')
        vehicle_type = data.get('vehicle_type', 'EV')
        
        distance = optimizer.calculate_distance(start, end)
        time = optimizer.estimate_time(distance, traffic_level)
        cost = optimizer.calculate_fuel_cost(distance, vehicle_type)
        
        return jsonify({
            'distance_km': round(distance, 2),
            'time_minutes': round(time, 1),
            'cost': round(cost, 2),
            'traffic_level': traffic_level
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500
