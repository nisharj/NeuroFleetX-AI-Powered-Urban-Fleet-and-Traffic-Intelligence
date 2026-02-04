# NeuroFleetX AI Microservice

## 🤖 AI-Powered Fleet Management Intelligence

This microservice provides AI and machine learning capabilities for the NeuroFleetX platform, including:

- **Route Optimization**: Intelligent route planning with traffic analysis
- **Predictive Maintenance**: ML-based vehicle maintenance prediction
- **Smart Recommendations**: Personalized vehicle recommendations
- **Demand Forecasting**: Dynamic pricing and demand prediction

---

## 🛠️ Technology Stack

- **Python 3.10+**
- **Flask 3.0** - Web framework
- **scikit-learn** - Machine learning
- **NumPy & Pandas** - Data processing
- **geopy** - Geospatial calculations

---

## 🚀 Getting Started

### Prerequisites

- Python 3.10 or higher
- pip (Python package manager)

### Installation

1. **Navigate to AI service directory**
   ```bash
   cd ai-service
   ```

2. **Create virtual environment**
   ```bash
   python -m venv venv
   ```

3. **Activate virtual environment**
   - Windows:
     ```bash
     venv\Scripts\activate
     ```
   - Linux/Mac:
     ```bash
     source venv/bin/activate
     ```

4. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

5. **Configure environment**
   ```bash
   copy .env.example .env
   ```

6. **Run the service**
   ```bash
   python app.py
   ```

The AI service will start on `http://localhost:5000`

---

## 📡 API Endpoints

### **Route Optimization**

#### POST `/api/ai/routes/optimize`
Optimize route from start to destination with traffic analysis.

**Request:**
```json
{
  "start": {"lat": 40.7128, "lng": -74.0060, "name": "New York"},
  "end": {"lat": 40.7589, "lng": -73.9851, "name": "Times Square"},
  "waypoints": [{"lat": 40.7484, "lng": -73.9857, "name": "Empire State"}],
  "traffic_level": "medium",
  "vehicle_type": "EV"
}
```

**Response:**
```json
{
  "route": [...],
  "summary": {
    "total_distance_km": 5.2,
    "estimated_time_minutes": 18.5,
    "estimated_cost": 0.26,
    "traffic_level": "medium"
  },
  "recommendation": null
}
```

#### POST `/api/ai/routes/estimate`
Quick estimate for distance, time, and cost.

---

### **Predictive Maintenance**

#### POST `/api/ai/maintenance/predict`
Predict maintenance needs for a vehicle.

**Request:**
```json
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
```

**Response:**
```json
{
  "vehicle_id": "VH-0001",
  "needs_maintenance": false,
  "probability": 0.342,
  "priority": "LOW",
  "issues": ["No critical issues detected"],
  "recommendations": ["Continue regular monitoring"],
  "estimated_days_until_maintenance": 45,
  "confidence": 68.4,
  "estimated_cost": 0
}
```

#### POST `/api/ai/maintenance/batch-predict`
Predict maintenance for multiple vehicles.

#### POST `/api/ai/maintenance/schedule-optimization`
Optimize maintenance schedule for entire fleet.

---

### **Smart Recommendations**

#### POST `/api/ai/recommendations/vehicles`
Get personalized vehicle recommendations.

**Request:**
```json
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
```

**Response:**
```json
{
  "user_id": "user123",
  "total_vehicles_analyzed": 24,
  "recommendations": [
    {
      "id": "VH-0001",
      "match_score": 85.5,
      "match_percentage": 85,
      "recommendation_reasons": [
        "Matches your preferred type: EV",
        "Highly rated (4.8/5)",
        "Eco-friendly electric vehicle"
      ]
    }
  ]
}
```

#### POST `/api/ai/recommendations/demand-prediction`
Predict vehicle demand and suggest dynamic pricing.

#### POST `/api/ai/recommendations/similar-vehicles`
Find vehicles similar to a given vehicle.

---

## 🧠 AI Models

### 1. Route Optimization
- **Algorithm**: Dijkstra's shortest path with traffic weights
- **Features**: Distance calculation, time estimation, cost prediction
- **Traffic Levels**: Low, Medium, High, Very High

### 2. Predictive Maintenance
- **Model**: Random Forest Classifier
- **Features**: Mileage, health metrics, service history
- **Output**: Maintenance probability, priority, recommendations
- **Accuracy**: ~85% (on synthetic data)

### 3. Recommendation Engine
- **Algorithm**: Content-based filtering with scoring
- **Features**: Vehicle type, price, rating, battery, eco-friendliness
- **Output**: Top N recommendations with match scores

---

## 🧪 Testing

### Test Route Optimization
```bash
curl -X POST http://localhost:5000/api/ai/routes/optimize \
  -H "Content-Type: application/json" \
  -d '{
    "start": {"lat": 40.7128, "lng": -74.0060},
    "end": {"lat": 40.7589, "lng": -73.9851},
    "traffic_level": "medium",
    "vehicle_type": "EV"
  }'
```

### Test Maintenance Prediction
```bash
curl -X POST http://localhost:5000/api/ai/maintenance/predict \
  -H "Content-Type: application/json" \
  -d '{
    "vehicle_id": "VH-0001",
    "mileage": 45000,
    "engine_health": 75,
    "tire_health": 60,
    "brake_health": 80,
    "battery_level": 85,
    "days_since_service": 120
  }'
```

---

## 📊 Model Training

The current implementation uses pre-trained models with synthetic data. For production:

1. **Collect Real Data**: Gather historical vehicle data
2. **Feature Engineering**: Extract relevant features
3. **Train Models**: Use collected data to train ML models
4. **Evaluate**: Test accuracy and performance
5. **Deploy**: Replace synthetic models with trained models

---

## 🔧 Configuration

Edit `.env` file to configure:

- `SECRET_KEY`: Flask secret key
- `DEBUG`: Enable/disable debug mode
- `PORT`: Service port (default: 5000)
- `BACKEND_API_URL`: Backend API URL for integration

---

## 🚀 Deployment

### Docker Deployment
```dockerfile
FROM python:3.10-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
CMD ["python", "app.py"]
```

### Build and Run
```bash
docker build -t neurofleetx-ai .
docker run -p 5000:5000 neurofleetx-ai
```

---

## 📈 Future Enhancements

- [ ] Real-time traffic API integration
- [ ] Deep learning models for better predictions
- [ ] Historical data analysis
- [ ] A/B testing for recommendations
- [ ] Model versioning and monitoring
- [ ] Caching for improved performance

---

## 🤝 Integration with Backend

The AI service can be integrated with the Spring Boot backend:

1. Backend calls AI service for predictions
2. AI service returns recommendations
3. Backend stores results in database
4. Frontend displays AI-powered insights

---

## 📄 License

MIT License - Part of NeuroFleetX Platform

---

**AI Microservice Version**: 1.0.0  
**Status**: Phase 3 Complete  
**Python Version**: 3.10+
