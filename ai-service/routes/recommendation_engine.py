"""
Recommendation Engine Module
AI-powered vehicle recommendations based on user preferences and history
"""

from flask import Blueprint, request, jsonify
import numpy as np
from sklearn.metrics.pairwise import cosine_similarity

recommendation_engine_bp = Blueprint('recommendation_engine', __name__)

class RecommendationEngine:
    """AI-powered recommendation system"""
    
    def __init__(self):
        self.vehicle_features = {
            'EV': [1, 0, 0, 0, 0, 1, 0.9, 0.8],      # [type_ev, type_sedan, type_suv, type_van, type_bike, eco_friendly, comfort, cost_efficiency]
            'SEDAN': [0, 1, 0, 0, 0, 0.5, 0.8, 0.7],
            'SUV': [0, 0, 1, 0, 0, 0.3, 0.9, 0.5],
            'VAN': [0, 0, 0, 1, 0, 0.4, 0.7, 0.6],
            'BIKE': [0, 0, 0, 0, 1, 0.8, 0.3, 0.9]
        }
    
    def calculate_match_score(self, vehicle, user_preferences):
        """Calculate how well a vehicle matches user preferences"""
        score = 0
        weights = {
            'type': 3.0,
            'seats': 2.0,
            'price': 2.5,
            'rating': 2.0,
            'battery': 1.5,
            'eco_friendly': 1.0
        }
        
        # Type match
        if user_preferences.get('preferred_type') == vehicle.get('type'):
            score += weights['type'] * 10
        
        # Seats match
        required_seats = user_preferences.get('seats', 4)
        if vehicle.get('seats', 4) >= required_seats:
            score += weights['seats'] * 10
        
        # Price match
        max_price = user_preferences.get('max_price_per_hour', 100)
        vehicle_price = vehicle.get('price_per_hour', 0)
        if vehicle_price <= max_price:
            price_score = (1 - (vehicle_price / max_price)) * 10
            score += weights['price'] * price_score
        
        # Rating
        rating = vehicle.get('rating', 0)
        score += weights['rating'] * rating
        
        # Battery/fuel level
        battery = vehicle.get('battery', 100)
        if battery >= 70:
            score += weights['battery'] * 10
        elif battery >= 50:
            score += weights['battery'] * 7
        else:
            score += weights['battery'] * 3
        
        # Eco-friendly preference
        if user_preferences.get('eco_friendly', False) and vehicle.get('type') == 'EV':
            score += weights['eco_friendly'] * 10
        
        return round(score, 2)
    
    def recommend_vehicles(self, vehicles, user_preferences, top_n=5):
        """
        Recommend top N vehicles based on user preferences
        """
        # Calculate scores for all vehicles
        scored_vehicles = []
        for vehicle in vehicles:
            score = self.calculate_match_score(vehicle, user_preferences)
            vehicle_with_score = vehicle.copy()
            vehicle_with_score['match_score'] = score
            vehicle_with_score['match_percentage'] = min(100, int((score / 100) * 100))
            scored_vehicles.append(vehicle_with_score)
        
        # Sort by score
        scored_vehicles.sort(key=lambda x: x['match_score'], reverse=True)
        
        # Get top N
        recommendations = scored_vehicles[:top_n]
        
        # Add reasons for recommendation
        for rec in recommendations:
            reasons = []
            
            if rec.get('type') == user_preferences.get('preferred_type'):
                reasons.append(f"Matches your preferred type: {rec['type']}")
            
            if rec.get('rating', 0) >= 4.5:
                reasons.append(f"Highly rated ({rec['rating']}/5)")
            
            if rec.get('battery', 0) >= 80:
                reasons.append("Excellent battery level")
            
            if rec.get('type') == 'EV' and user_preferences.get('eco_friendly'):
                reasons.append("Eco-friendly electric vehicle")
            
            if rec.get('price_per_hour', 0) <= user_preferences.get('max_price_per_hour', 100) * 0.7:
                reasons.append("Great value for money")
            
            rec['recommendation_reasons'] = reasons if reasons else ["Available and ready to book"]
        
        return recommendations
    
    def predict_demand(self, historical_data):
        """Predict vehicle demand based on historical patterns"""
        # Simple demand prediction based on time patterns
        hour = historical_data.get('hour', 12)
        day_of_week = historical_data.get('day_of_week', 3)  # 0=Monday, 6=Sunday
        
        # Peak hours: 7-9 AM and 5-7 PM
        is_peak_hour = (7 <= hour <= 9) or (17 <= hour <= 19)
        
        # Weekday vs weekend
        is_weekend = day_of_week >= 5
        
        # Calculate demand score (0-100)
        demand_score = 50  # Base demand
        
        if is_peak_hour:
            demand_score += 30
        
        if is_weekend:
            demand_score += 10
        else:
            demand_score += 5
        
        # Determine demand level
        if demand_score >= 80:
            demand_level = 'VERY_HIGH'
            price_multiplier = 1.5
        elif demand_score >= 65:
            demand_level = 'HIGH'
            price_multiplier = 1.3
        elif demand_score >= 40:
            demand_level = 'MEDIUM'
            price_multiplier = 1.0
        else:
            demand_level = 'LOW'
            price_multiplier = 0.9
        
        return {
            'demand_level': demand_level,
            'demand_score': demand_score,
            'price_multiplier': price_multiplier,
            'is_peak_hour': is_peak_hour,
            'is_weekend': is_weekend
        }

# Initialize engine
engine = RecommendationEngine()

@recommendation_engine_bp.route('/vehicles', methods=['POST'])
def recommend_vehicles():
    """
    POST /api/ai/recommendations/vehicles
    Get personalized vehicle recommendations
    
    Request body:
    {
        "user_id": "user123",
        "preferences": {
            "preferred_type": "EV",
            "seats": 4,
            "max_price_per_hour": 30,
            "eco_friendly": true
        },
        "vehicles": [...],
        "top_n": 5
    }
    """
    try:
        data = request.get_json()
        
        vehicles = data.get('vehicles', [])
        preferences = data.get('preferences', {})
        top_n = data.get('top_n', 5)
        
        if not vehicles:
            return jsonify({'error': 'No vehicles provided'}), 400
        
        # Get recommendations
        recommendations = engine.recommend_vehicles(vehicles, preferences, top_n)
        
        return jsonify({
            'user_id': data.get('user_id'),
            'total_vehicles_analyzed': len(vehicles),
            'recommendations': recommendations,
            'preferences_used': preferences
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@recommendation_engine_bp.route('/demand-prediction', methods=['POST'])
def predict_demand():
    """
    POST /api/ai/recommendations/demand-prediction
    Predict vehicle demand and dynamic pricing
    """
    try:
        data = request.get_json()
        
        prediction = engine.predict_demand(data)
        
        return jsonify(prediction), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@recommendation_engine_bp.route('/similar-vehicles', methods=['POST'])
def find_similar_vehicles():
    """
    POST /api/ai/recommendations/similar-vehicles
    Find vehicles similar to a given vehicle
    """
    try:
        data = request.get_json()
        
        target_vehicle = data.get('vehicle')
        all_vehicles = data.get('vehicles', [])
        top_n = data.get('top_n', 3)
        
        # Simple similarity based on type, price, and rating
        similar = []
        for vehicle in all_vehicles:
            if vehicle.get('id') == target_vehicle.get('id'):
                continue
            
            similarity_score = 0
            
            # Type similarity
            if vehicle.get('type') == target_vehicle.get('type'):
                similarity_score += 40
            
            # Price similarity (within 20%)
            target_price = target_vehicle.get('price_per_hour', 0)
            vehicle_price = vehicle.get('price_per_hour', 0)
            if target_price > 0:
                price_diff = abs(target_price - vehicle_price) / target_price
                if price_diff <= 0.2:
                    similarity_score += 30
            
            # Rating similarity
            target_rating = target_vehicle.get('rating', 0)
            vehicle_rating = vehicle.get('rating', 0)
            rating_diff = abs(target_rating - vehicle_rating)
            if rating_diff <= 0.5:
                similarity_score += 30
            
            vehicle_with_score = vehicle.copy()
            vehicle_with_score['similarity_score'] = similarity_score
            similar.append(vehicle_with_score)
        
        # Sort and get top N
        similar.sort(key=lambda x: x['similarity_score'], reverse=True)
        
        return jsonify({
            'target_vehicle_id': target_vehicle.get('id'),
            'similar_vehicles': similar[:top_n]
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500
