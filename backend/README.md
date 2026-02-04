# NeuroFleetX Backend - Phase 2

## 🚀 Spring Boot Backend API

This is the backend REST API for the NeuroFleetX platform, built with **Spring Boot 3.2.1**, **MySQL**, and **JWT Authentication**.

---

## 📋 Prerequisites

Before running the backend, ensure you have:

- **Java 17** or higher
- **Maven 3.8+**
- **MySQL 8.0+**
- **Git**

---

## 🛠️ Technology Stack

| Technology | Version | Purpose |
|------------|---------|---------|
| Spring Boot | 3.2.1 | Application Framework |
| Spring Security | 6.x | Authentication & Authorization |
| Spring Data JPA | 3.x | Database ORM |
| MySQL | 8.0+ | Relational Database |
| JWT (jjwt) | 0.12.3 | Token-based Authentication |
| Lombok | Latest | Reduce Boilerplate Code |
| Maven | 3.8+ | Build Tool |

---

## 📁 Project Structure

```
backend/
├── src/
│   ├── main/
│   │   ├── java/com/neurofleetx/
│   │   │   ├── NeuroFleetXApplication.java    # Main Application
│   │   │   ├── model/                          # Entity Models
│   │   │   │   ├── User.java
│   │   │   │   ├── Vehicle.java
│   │   │   │   └── Booking.java
│   │   │   ├── repository/                     # JPA Repositories
│   │   │   │   ├── UserRepository.java
│   │   │   │   ├── VehicleRepository.java
│   │   │   │   └── BookingRepository.java
│   │   │   ├── service/                        # Business Logic (To be created)
│   │   │   ├── controller/                     # REST Controllers (To be created)
│   │   │   ├── security/                       # JWT & Security Config (To be created)
│   │   │   ├── dto/                            # Data Transfer Objects (To be created)
│   │   │   └── exception/                      # Custom Exceptions (To be created)
│   │   └── resources/
│   │       └── application.properties          # Configuration
│   └── test/                                   # Unit Tests
├── pom.xml                                     # Maven Dependencies
└── README.md                                   # This file
```

---

## 🗄️ Database Schema

### Users Table
```sql
CREATE TABLE users (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role ENUM('ADMIN', 'FLEET_MANAGER', 'DRIVER', 'CUSTOMER'),
    phone VARCHAR(20),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### Vehicles Table
```sql
CREATE TABLE vehicles (
    id VARCHAR(20) PRIMARY KEY,
    type ENUM('EV', 'SEDAN', 'SUV', 'VAN', 'BIKE'),
    name VARCHAR(100) NOT NULL,
    status ENUM('AVAILABLE', 'IN_USE', 'MAINTENANCE', 'CHARGING'),
    battery INT CHECK (battery BETWEEN 0 AND 100),
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    city VARCHAR(100),
    mileage INT,
    last_service DATE,
    engine_health INT CHECK (engine_health BETWEEN 0 AND 100),
    tire_health INT CHECK (tire_health BETWEEN 0 AND 100),
    brake_health INT CHECK (brake_health BETWEEN 0 AND 100),
    seats INT,
    price_per_hour DECIMAL(10, 2),
    rating DECIMAL(3, 2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### Bookings Table
```sql
CREATE TABLE bookings (
    id VARCHAR(20) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    vehicle_id VARCHAR(20) NOT NULL,
    start_date TIMESTAMP NOT NULL,
    end_date TIMESTAMP NOT NULL,
    total_cost DECIMAL(10, 2),
    status ENUM('ACTIVE', 'COMPLETED', 'CANCELLED'),
    rating INT CHECK (rating BETWEEN 1 AND 5),
    pickup_location VARCHAR(255),
    dropoff_location VARCHAR(255),
    distance DECIMAL(10, 2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (vehicle_id) REFERENCES vehicles(id)
);
```

---

## ⚙️ Configuration

### 1. Database Setup

**Create MySQL Database:**
```sql
CREATE DATABASE neurofleetx;
USE neurofleetx;
```

**Update `application.properties`:**
```properties
spring.datasource.url=jdbc:mysql://localhost:3306/neurofleetx
spring.datasource.username=YOUR_MYSQL_USERNAME
spring.datasource.password=YOUR_MYSQL_PASSWORD
```

### 2. JWT Configuration

The JWT secret key is configured in `application.properties`:
```properties
jwt.secret=neurofleetx-secret-key-2026-ai-driven-fleet-management-platform-secure-token
jwt.expiration=86400000  # 24 hours in milliseconds
```

**⚠️ IMPORTANT**: Change the `jwt.secret` to a strong, random key in production!

### 3. CORS Configuration

Allowed origins are configured for frontend development:
```properties
cors.allowed-origins=http://localhost:5173,http://localhost:3000
```

---

## 🚀 Running the Application

### Option 1: Using Maven
```bash
cd backend
mvn clean install
mvn spring-boot:run
```

### Option 2: Using Java
```bash
cd backend
mvn clean package
java -jar target/neurofleetx-backend-1.0.0.jar
```

### Option 3: Using IDE
- Open the project in IntelliJ IDEA or Eclipse
- Run `NeuroFleetXApplication.java`

---

## 📡 API Endpoints

### Authentication
```
POST   /api/auth/register    # Register new user
POST   /api/auth/login       # Login and get JWT token
POST   /api/auth/refresh     # Refresh JWT token
```

### Users
```
GET    /api/users            # Get all users (Admin only)
GET    /api/users/{id}       # Get user by ID
PUT    /api/users/{id}       # Update user
DELETE /api/users/{id}       # Delete user (Admin only)
```

### Vehicles
```
GET    /api/vehicles         # Get all vehicles
GET    /api/vehicles/{id}    # Get vehicle by ID
POST   /api/vehicles         # Create vehicle (Fleet Manager/Admin)
PUT    /api/vehicles/{id}    # Update vehicle
DELETE /api/vehicles/{id}    # Delete vehicle (Admin only)
GET    /api/vehicles/available  # Get available vehicles
GET    /api/vehicles/maintenance  # Get vehicles needing maintenance
```

### Bookings
```
GET    /api/bookings         # Get all bookings
GET    /api/bookings/{id}    # Get booking by ID
POST   /api/bookings         # Create booking
PUT    /api/bookings/{id}    # Update booking
DELETE /api/bookings/{id}    # Cancel booking
GET    /api/bookings/user/{userId}  # Get user's bookings
GET    /api/bookings/active  # Get active bookings
```

### Analytics
```
GET    /api/analytics/revenue       # Get revenue statistics
GET    /api/analytics/fleet-usage   # Get fleet utilization
GET    /api/analytics/trip-density  # Get trip density heatmap data
```

---

## 🔐 Authentication Flow

1. **Register**: `POST /api/auth/register`
   ```json
   {
     "name": "John Doe",
     "email": "john@example.com",
     "password": "password123",
     "role": "CUSTOMER"
   }
   ```

2. **Login**: `POST /api/auth/login`
   ```json
   {
     "email": "john@example.com",
     "password": "password123"
   }
   ```

3. **Response**:
   ```json
   {
     "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
     "type": "Bearer",
     "id": "uuid",
     "email": "john@example.com",
     "role": "CUSTOMER"
   }
   ```

4. **Use Token**: Include in headers for protected endpoints
   ```
   Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

---

## 🧪 Testing

### Run Tests
```bash
mvn test
```

### Test with Postman
1. Import the Postman collection (to be created)
2. Set environment variables:
   - `base_url`: `http://localhost:8080/api`
   - `token`: (obtained from login)

### Test with cURL
```bash
# Register
curl -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@test.com","password":"test123","role":"CUSTOMER"}'

# Login
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"test123"}'
```

---

## 📊 Current Status

### ✅ Completed
- [x] Project structure setup
- [x] Maven dependencies configuration
- [x] Database configuration
- [x] Entity models (User, Vehicle, Booking)
- [x] JPA repositories with custom queries
- [x] Application properties configuration

### 🚧 In Progress
- [ ] JWT utility class
- [ ] Security configuration
- [ ] Service layer implementation
- [ ] REST controllers
- [ ] DTO classes
- [ ] Exception handling
- [ ] Data validation
- [ ] Unit tests

### 📅 Upcoming
- [ ] WebSocket for real-time updates
- [ ] File upload for vehicle images
- [ ] Email notifications
- [ ] Logging and monitoring
- [ ] API documentation (Swagger)
- [ ] Docker containerization

---

## 🐛 Troubleshooting

### MySQL Connection Error
```
Error: Communications link failure
Solution: Ensure MySQL is running and credentials are correct
```

### Port Already in Use
```
Error: Port 8080 is already in use
Solution: Change port in application.properties or kill the process
```

### JWT Token Invalid
```
Error: 401 Unauthorized
Solution: Check if token is expired or secret key matches
```

---

## 📚 Additional Resources

- [Spring Boot Documentation](https://spring.io/projects/spring-boot)
- [Spring Security](https://spring.io/projects/spring-security)
- [JWT.io](https://jwt.io/)
- [MySQL Documentation](https://dev.mysql.com/doc/)

---

## 👥 Contributors

- **Backend Team**: Spring Boot Development
- **Database Team**: MySQL Schema Design
- **Security Team**: JWT Implementation

---

## 📄 License

MIT License - See LICENSE file for details

---

**Next Steps**: Implement JWT utilities, security configuration, and REST controllers to complete Phase 2!
