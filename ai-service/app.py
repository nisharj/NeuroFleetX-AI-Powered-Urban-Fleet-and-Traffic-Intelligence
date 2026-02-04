"""
NeuroFleetX AI Microservice
Python Flask API for AI-powered fleet management features
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Import route blueprints
from routes.route_optimizer import route_optimizer_bp
from routes.maintenance_predictor import maintenance_predictor_bp
from routes.recommendation_engine import recommendation_engine_bp

# Initialize Flask app
app = Flask(__name__)
CORS(app)

# Configuration
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'neurofleetx-ai-secret-2026')
app.config['DEBUG'] = os.getenv('DEBUG', 'False') == 'True'

# Register blueprints
app.register_blueprint(route_optimizer_bp, url_prefix='/api/ai/routes')
app.register_blueprint(maintenance_predictor_bp, url_prefix='/api/ai/maintenance')
app.register_blueprint(recommendation_engine_bp, url_prefix='/api/ai/recommendations')

@app.route('/')
def index():
    """API root endpoint"""
    return jsonify({
        'service': 'NeuroFleetX AI Microservice',
        'version': '1.0.0',
        'status': 'running',
        'endpoints': {
            'route_optimization': '/api/ai/routes/optimize',
            'maintenance_prediction': '/api/ai/maintenance/predict',
            'vehicle_recommendations': '/api/ai/recommendations/vehicles'
        }
    })

@app.route('/health')
def health():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'service': 'AI Microservice',
        'version': '1.0.0'
    })

@app.errorhandler(404)
def not_found(error):
    return jsonify({'error': 'Endpoint not found'}), 404

@app.errorhandler(500)
def internal_error(error):
    return jsonify({'error': 'Internal server error'}), 500

if __name__ == '__main__':
    import logging
    logging.basicConfig(level=logging.INFO)
    logger = logging.getLogger(__name__)

    port = int(os.getenv('PORT', 5000))
    logger.info("NeuroFleetX AI Microservice Started - Version: 1.0.0, Port: %s", port)
    app.run(host='0.0.0.0', port=port, debug=app.config['DEBUG'])
