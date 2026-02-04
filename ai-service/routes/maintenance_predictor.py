"""
Predictive Maintenance Module
Uses machine learning to predict vehicle maintenance needs
"""

from flask import Blueprint, request, jsonify
import numpy as np
from sklearn.ensemble import RandomForestClassifier
import pandas as pd

maintenance_predictor_bp = Blueprint('maintenance_predictor', __name__)

class MaintenancePredictor:
    """AI-powered predictive maintenance engine"""
    
    def __init__(self):
        # Initialize ML model (in production, load pre-trained model)
        self.model = self._initialize_model()
        self.feature_names = [
            'mileage', 'engine_health', 'tire_health', 'brake_health',
            'battery_level', 'days_since_service', 'avg_daily_distance'
        ]
    
    def _initialize_model(self):
        """Initialize and train a simple ML model for demonstration"""
        # In production, load a pre-trained model
        # For now, create a simple classifier
        model = RandomForestClassifier(n_estimators=100, random_state=42)
        
        # Generate synthetic training data
        np.random.seed(42)
        n_samples = 1000
        
        X_train = np.random.rand(n_samples, 7) * 100
        # Simple rule: maintenance needed if health metrics are low or mileage is high
        y_train = ((X_train[:, 1] < 50) | (X_train[:, 2] < 50) | 
                   (X_train[:, 3] < 50) | (X_train[:, 0] > 80000)).astype(int)
        
        model.fit(X_train, y_train)
        return model
    
    def predict_maintenance(self, vehicle_data):
        """
        Predict if vehicle needs maintenance
        Returns probability and recommended actions
        """
        # Extract features
        features = [
            vehicle_data.get('mileage', 0),
            vehicle_data.get('engine_health', 100),
            vehicle_data.get('tire_health', 100),
            vehicle_data.get('brake_health', 100),
            vehicle_data.get('battery_level', 100),
            vehicle_data.get('days_since_service', 0),
            vehicle_data.get('avg_daily_distance', 50)
        ]
        
        # Predict
        features_array = np.array([features])
        probability = self.model.predict_proba(features_array)[0][1]
        needs_maintenance = probability > 0.5
        
        # Determine priority
        if probability > 0.8:
            priority = 'CRITICAL'
        elif probability > 0.6:
            priority = 'HIGH'
        elif probability > 0.4:
            priority = 'MEDIUM'
        else:
            priority = 'LOW'
        
        # Identify specific issues
        issues = []
        recommendations = []
        
        if vehicle_data.get('engine_health', 100) < 50:
            issues.append('Engine health critical')
            recommendations.append('Schedule engine inspection immediately')
        
        if vehicle_data.get('tire_health', 100) < 50:
            issues.append('Tire wear detected')
            recommendations.append('Replace tires within 7 days')
        
        if vehicle_data.get('brake_health', 100) < 50:
            issues.append('Brake system degradation')
            recommendations.append('Brake service required urgently')
        
        if vehicle_data.get('mileage', 0) > 80000:
            issues.append('High mileage')
            recommendations.append('Comprehensive service recommended')
        
        if vehicle_data.get('days_since_service', 0) > 180:
            issues.append('Overdue for service')
            recommendations.append('Schedule routine maintenance')
        
        # Calculate estimated days until maintenance
        if needs_maintenance:
            days_until_maintenance = max(1, int((1 - probability) * 30))
        else:
            days_until_maintenance = int((1 - probability) * 90)
        
        return {
            'needs_maintenance': needs_maintenance,
            'probability': round(probability, 3),
            'priority': priority,
            'issues': issues if issues else ['No critical issues detected'],
            'recommendations': recommendations if recommendations else ['Continue regular monitoring'],
            'estimated_days_until_maintenance': days_until_maintenance,
            'confidence': round((1 - abs(0.5 - probability) * 2) * 100, 1)
        }
    
    def calculate_maintenance_cost(self, issues):
        """Estimate maintenance cost based on identified issues"""
        cost_map = {
            'Engine health critical': 1500,
            'Tire wear detected': 600,
            'Brake system degradation': 400,
            'High mileage': 800,
            'Overdue for service': 200
        }
        
        total_cost = sum(cost_map.get(issue, 100) for issue in issues)
        return total_cost

# Initialize predictor
predictor = MaintenancePredictor()

@maintenance_predictor_bp.route('/predict', methods=['POST'])
def predict_maintenance():
    """
    POST /api/ai/maintenance/predict
    Predict maintenance needs for a vehicle
    
    Request body:
    {
        "vehicle_id": "VH-0001",
        "mileage": 45000,
        "engine_health": 75,
        "tire_health": 60,
        "brake_health": 80,
        "battery_level": 85,
        "days_since_service": 120,
        "avg_daily_distance": 60
    }
    """
    try:
        data = request.get_json()
        
        # Predict maintenance
        result = predictor.predict_maintenance(data)
        
        # Add cost estimate
        result['estimated_cost'] = predictor.calculate_maintenance_cost(result['issues'])
        
        # Add vehicle ID if provided
        if 'vehicle_id' in data:
            result['vehicle_id'] = data['vehicle_id']
        
        return jsonify(result), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@maintenance_predictor_bp.route('/batch-predict', methods=['POST'])
def batch_predict():
    """
    POST /api/ai/maintenance/batch-predict
    Predict maintenance for multiple vehicles
    """
    try:
        data = request.get_json()
        vehicles = data.get('vehicles', [])
        
        results = []
        for vehicle in vehicles:
            prediction = predictor.predict_maintenance(vehicle)
            prediction['vehicle_id'] = vehicle.get('vehicle_id', 'Unknown')
            prediction['estimated_cost'] = predictor.calculate_maintenance_cost(prediction['issues'])
            results.append(prediction)
        
        # Sort by priority
        priority_order = {'CRITICAL': 0, 'HIGH': 1, 'MEDIUM': 2, 'LOW': 3}
        results.sort(key=lambda x: priority_order.get(x['priority'], 4))
        
        return jsonify({
            'total_vehicles': len(results),
            'critical_count': sum(1 for r in results if r['priority'] == 'CRITICAL'),
            'high_count': sum(1 for r in results if r['priority'] == 'HIGH'),
            'predictions': results
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@maintenance_predictor_bp.route('/schedule-optimization', methods=['POST'])
def optimize_maintenance_schedule():
    """
    POST /api/ai/maintenance/schedule-optimization
    Optimize maintenance schedule for fleet
    """
    try:
        data = request.get_json()
        vehicles = data.get('vehicles', [])
        
        # Predict for all vehicles
        predictions = []
        for vehicle in vehicles:
            pred = predictor.predict_maintenance(vehicle)
            pred['vehicle_id'] = vehicle.get('vehicle_id')
            predictions.append(pred)
        
        # Group by priority
        schedule = {
            'immediate': [p for p in predictions if p['priority'] == 'CRITICAL'],
            'this_week': [p for p in predictions if p['priority'] == 'HIGH'],
            'this_month': [p for p in predictions if p['priority'] == 'MEDIUM'],
            'routine': [p for p in predictions if p['priority'] == 'LOW']
        }
        
        return jsonify({
            'schedule': schedule,
            'summary': {
                'immediate_action': len(schedule['immediate']),
                'this_week': len(schedule['this_week']),
                'this_month': len(schedule['this_month']),
                'routine': len(schedule['routine'])
            }
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500
