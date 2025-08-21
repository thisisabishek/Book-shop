# Pahana Edu Bookshop Management System

A comprehensive web-based bookshop management system built with Spring Boot, designed for Pahana Edu - a leading bookshop in Colombo City serving hundreds of customers monthly.

## 📋 Project Overview

This system replaces manual customer account management with a computerized online solution that efficiently manages billing information, inventory, and customer relationships. The application provides role-based access for different user types including administrators, managers, cashiers, and customers.

## 🏗️ System Architecture

### Technology Stack
- **Backend Framework**: Spring Boot 3.x
- **Database**: MySQL 8.0+
- **Security**: Spring Security with JWT Authentication
- **ORM**: Spring Data JPA with Hibernate
- **Build Tool**: Maven
- **Server**: Apache Tomcat (Embedded)
- **Frontend**: HTML5, CSS3, JavaScript with Tailwind CSS

### Architecture Pattern
- **3-Tier Architecture**: Presentation Layer, Business Logic Layer, Data Access Layer
- **RESTful API Design**: Clean separation between frontend and backend
- **MVC Pattern**: Model-View-Controller for organized code structure
- **Repository Pattern**: Data access abstraction layer

## 🗄️ Database Schema

### Core Entities

#### Users Table
\`\`\`sql
CREATE TABLE users (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role ENUM('ADMIN', 'MANAGER', 'CASHIER', 'CUSTOMER') NOT NULL,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
\`\`\`

#### Customers Table
\`\`\`sql
CREATE TABLE customers (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    account_number VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    address TEXT NOT NULL,
    telephone VARCHAR(15) NOT NULL,
    email VARCHAR(100),
    user_id BIGINT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);
\`\`\`

#### Items Table (Books/Products)
\`\`\`sql
CREATE TABLE items (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    author VARCHAR(100),
    isbn VARCHAR(20) UNIQUE,
    category VARCHAR(50),
    price DECIMAL(10,2) NOT NULL,
    stock_quantity INT NOT NULL DEFAULT 0,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
\`\`\`

#### Bills Table
\`\`\`sql
CREATE TABLE bills (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    bill_number VARCHAR(20) UNIQUE NOT NULL,
    customer_id BIGINT NOT NULL,
    total_amount DECIMAL(10,2) NOT NULL,
    bill_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by BIGINT,
    status ENUM('PENDING', 'PAID', 'CANCELLED') DEFAULT 'PENDING',
    FOREIGN KEY (customer_id) REFERENCES customers(id),
    FOREIGN KEY (created_by) REFERENCES users(id)
);
\`\`\`

#### Bill Items Table
\`\`\`sql
CREATE TABLE bill_items (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    bill_id BIGINT NOT NULL,
    item_id BIGINT NOT NULL,
    quantity INT NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    total_price DECIMAL(10,2) NOT NULL,
    FOREIGN KEY (bill_id) REFERENCES bills(id) ON DELETE CASCADE,
    FOREIGN KEY (item_id) REFERENCES items(id)
);
\`\`\`

## 🔐 User Roles & Permissions

### ADMIN
- **User Management**: Create, read, update, delete all users
- **System Configuration**: Manage system settings and configurations
- **Full Access**: All functionalities available to other roles
- **Reports**: Access to comprehensive system reports

### MANAGER
- **Customer Management**: Full CRUD operations on customer accounts
- **Inventory Management**: Add, update, delete items/books
- **Bill Management**: View and manage all bills
- **Staff Oversight**: Monitor cashier activities
- **Reports**: Sales and inventory reports

### CASHIER
- **Customer Service**: View and update customer information
- **Sales Processing**: Create bills and process orders
- **Inventory Viewing**: View item details and stock levels
- **Basic Reports**: Daily sales reports

### CUSTOMER
- **Self-Service**: Register and manage own account
- **Book Browsing**: Search and view available books
- **Order Placement**: Create orders for books
- **Order History**: View personal order history
- **Account Management**: Update personal information

## 🚀 Key Features

### Authentication & Security
- JWT-based stateless authentication
- BCrypt password hashing
- Role-based access control (RBAC)
- Session management
- CORS configuration for frontend integration

### Customer Management
- Unique account number generation
- Customer registration and profile management
- Address and contact information tracking
- Purchase history and analytics

### Inventory Management
- Book/item catalog with detailed information
- Stock level tracking and low stock alerts
- Category-based organization
- ISBN and author management
- Price management and updates

### Billing System
- Automated bill generation with unique bill numbers
- Multi-item order processing
- Real-time stock updates
- Bill status tracking (Pending, Paid, Cancelled)
- Tax calculations and discounts

### Reporting & Analytics
- Sales reports by date range
- Inventory reports with stock levels
- Customer purchase analytics
- Low stock alerts and notifications
- Revenue tracking and analysis

## 📁 Project Structure

\`\`\`
src/
├── main/
│   ├── java/com/pahanaedu/bookshop/
│   │   ├── BookshopSystemApplication.java          # Main Spring Boot application
│   │   ├── config/
│   │   │   ├── SecurityConfig.java                 # Spring Security configuration
│   │   │   └── JwtUtil.java                        # JWT utility class
│   │   ├── controller/
│   │   │   ├── AuthController.java                 # Authentication endpoints
│   │   │   ├── CustomerController.java             # Customer management (Admin/Manager)
│   │   │   ├── CustomerPortalController.java       # Customer self-service portal
│   │   │   ├── ItemController.java                 # Inventory management
│   │   │   ├── BillController.java                 # Billing operations
│   │   │   └── UserController.java                 # User management
│   │   ├── entity/
│   │   │   ├── User.java                          # User entity with roles
│   │   │   ├── Customer.java                      # Customer entity
│   │   │   ├── Item.java                          # Book/Item entity
│   │   │   ├── Bill.java                          # Bill entity
│   │   │   └── BillItem.java                      # Bill line items
│   │   ├── repository/
│   │   │   ├── UserRepository.java                # User data access
│   │   │   ├── CustomerRepository.java            # Customer data access
│   │   │   ├── ItemRepository.java                # Item data access
│   │   │   ├── BillRepository.java                # Bill data access
│   │   │   └── BillItemRepository.java            # Bill item data access
│   │   ├── service/
│   │   │   ├── AuthService.java                   # Authentication business logic
│   │   │   ├── CustomerService.java               # Customer business logic
│   │   │   ├── ItemService.java                   # Inventory business logic
│   │   │   ├── BillService.java                   # Billing business logic
│   │   │   └── UserService.java                   # User management logic
│   │   ├── dto/
│   │   │   ├── LoginRequest.java                  # Login request DTO
│   │   │   ├── CustomerRegistrationRequest.java   # Customer registration DTO
│   │   │   ├── OrderRequest.java                  # Order placement DTO
│   │   │   └── [Other DTOs]                       # Request/Response objects
│   │   └── exception/
│   │       ├── GlobalExceptionHandler.java        # Global exception handling
│   │       └── [Custom Exceptions]                # Business-specific exceptions
│   └── resources/
│       ├── application.properties                 # Spring Boot configuration
│       ├── static/
│       │   └── index.html                        # Frontend application
│       └── templates/                            # Thymeleaf templates (if used)
├── database/
│   └── schema.sql                                # Database schema and sample data
└── pom.xml                                       # Maven dependencies
\`\`\`

## 🛠️ API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `POST /api/auth/refresh` - Refresh JWT token

### Customer Portal (Customer Role)
- `POST /api/customer-portal/register` - Customer self-registration
- `POST /api/customer-portal/login` - Customer login
- `GET /api/customer-portal/books` - Browse available books
- `GET /api/customer-portal/books/search` - Search books by title/author
- `POST /api/customer-portal/orders` - Place new order
- `GET /api/customer-portal/orders` - View order history

### Customer Management (Admin/Manager/Cashier)
- `GET /api/customers` - List all customers
- `POST /api/customers` - Create new customer
- `GET /api/customers/{id}` - Get customer details
- `PUT /api/customers/{id}` - Update customer information
- `DELETE /api/customers/{id}` - Delete customer (Admin only)

### Inventory Management (Admin/Manager)
- `GET /api/items` - List all items/books
- `POST /api/items` - Add new item
- `GET /api/items/{id}` - Get item details
- `PUT /api/items/{id}` - Update item information
- `DELETE /api/items/{id}` - Delete item
- `GET /api/items/low-stock` - Get low stock items

### Billing (Admin/Manager/Cashier)
- `GET /api/bills` - List all bills
- `POST /api/bills` - Create new bill
- `GET /api/bills/{id}` - Get bill details
- `PUT /api/bills/{id}/status` - Update bill status
- `GET /api/bills/customer/{customerId}` - Get customer bills

### User Management (Admin only)
- `GET /api/users` - List all users
- `POST /api/users` - Create new user
- `PUT /api/users/{id}` - Update user information
- `DELETE /api/users/{id}` - Delete user

## 🚀 Setup and Installation

### Prerequisites
- Java 17 or higher
- MySQL 8.0+
- Maven 3.6+
- IDE (IntelliJ IDEA, Eclipse, or VS Code)

### Installation Steps

1. **Clone the Repository**
   \`\`\`bash
   git clone <repository-url>
   cd pahana-edu-bookshop
   \`\`\`

2. **Database Setup**
   \`\`\`bash
   # Create MySQL database
   mysql -u root -p
   CREATE DATABASE pahana_bookshop;
   USE pahana_bookshop;
   SOURCE database/schema.sql;
   \`\`\`

3. **Configure Application**
   \`\`\`bash
   # Update src/main/resources/application.properties
   spring.datasource.url=jdbc:mysql://localhost:3306/pahana_bookshop
   spring.datasource.username=your_username
   spring.datasource.password=your_password
   \`\`\`

4. **Build and Run**
   \`\`\`bash
   mvn clean install
   mvn spring-boot:run
   \`\`\`

5. **Access Application**
   - Backend API: `http://localhost:8080`
   - Frontend: `http://localhost:8080/index.html`
   - API Documentation: `http://localhost:8080/swagger-ui.html` (if Swagger is configured)

### Default System Users
\`\`\`sql
-- Admin user
INSERT INTO users (username, password, role) VALUES ('admin', '$2a$10$...', 'ADMIN');

-- Manager user
INSERT INTO users (username, password, role) VALUES ('manager1', '$2a$10$...', 'MANAGER');

-- Cashier user
INSERT INTO users (username, password, role) VALUES ('cashier1', '$2a$10$...', 'CASHIER');
\`\`\`

## 🔄 Business Workflows

### Customer Registration Flow
1. Customer accesses registration form
2. System validates input data (client and server-side)
3. Creates User record with CUSTOMER role and hashed password
4. Generates unique account number
5. Creates Customer record with personal details
6. Returns success confirmation with account details

### Order Processing Flow
1. Customer browses available books
2. Selects items and quantities
3. System validates stock availability
4. Creates Bill record with PENDING status
5. Creates BillItem records for each item
6. Updates stock quantities
7. Returns order confirmation with bill number

### Inventory Management Flow
1. Staff (Manager/Admin) adds new books
2. System validates book information
3. Creates Item record with stock quantity
4. Monitors stock levels for low stock alerts
5. Updates stock on each sale
6. Generates inventory reports

## 🛡️ Security Features

### Authentication Security
- **Password Hashing**: BCrypt with salt rounds
- **JWT Tokens**: Stateless authentication with expiration
- **Role-Based Access**: Method-level security annotations
- **Session Management**: Stateless design prevents session hijacking

### Data Security
- **Input Validation**: Server-side validation for all inputs
- **SQL Injection Prevention**: JPA parameterized queries
- **XSS Protection**: Input sanitization and output encoding
- **CORS Configuration**: Controlled cross-origin requests

### Business Logic Security
- **Stock Validation**: Prevents overselling
- **Account Number Uniqueness**: Prevents duplicate accounts
- **Bill Number Generation**: Unique bill identification
- **Role-Based Operations**: Users can only perform authorized actions

## 📊 Performance Considerations

### Database Optimization
- **Indexing**: Primary keys, foreign keys, and frequently queried columns
- **Connection Pooling**: HikariCP for efficient database connections
- **Query Optimization**: Efficient JPA queries with proper joins
- **Pagination**: Large result sets handled with pagination

### Application Performance
- **Lazy Loading**: JPA entities loaded on demand
- **Caching**: Spring Boot default caching for frequently accessed data
- **Stateless Design**: JWT tokens eliminate server-side session storage
- **Resource Management**: Proper resource cleanup and memory management

## 🔧 Monitoring and Maintenance

### Logging
- **Application Logs**: Spring Boot default logging configuration
- **SQL Logging**: Hibernate SQL query logging for debugging
- **Error Tracking**: Comprehensive error logging with stack traces
- **Audit Trails**: User action logging for security and compliance

### Health Monitoring
- **Spring Boot Actuator**: Health checks and metrics endpoints
- **Database Health**: Connection pool and query performance monitoring
- **Application Metrics**: Memory usage, response times, and throughput
- **Custom Health Indicators**: Business-specific health checks

### Backup and Recovery
- **Database Backups**: Regular MySQL database backups
- **Configuration Backups**: Application properties and configuration files
- **Disaster Recovery**: Documented recovery procedures
- **Data Migration**: Scripts for database schema updates

## 🚀 Future Enhancements

### Planned Features
- **Email Notifications**: Order confirmations and low stock alerts
- **Payment Integration**: Online payment processing
- **Advanced Reporting**: Dashboard with charts and analytics
- **Mobile App**: React Native mobile application
- **Barcode Scanning**: ISBN barcode scanning for inventory
- **Multi-location Support**: Support for multiple store locations

### Technical Improvements
- **Microservices Architecture**: Split into smaller, focused services
- **Redis Caching**: Distributed caching for better performance
- **Message Queues**: Asynchronous processing for heavy operations
- **API Rate Limiting**: Prevent API abuse and ensure fair usage
- **Advanced Security**: OAuth2, two-factor authentication

## 📞 Support and Contact

For technical support or questions about the Pahana Edu Bookshop Management System:

- **Development Team**: [Your Team Contact]
- **System Administrator**: [Admin Contact]
- **Business Owner**: Pahana Edu Bookshop, Colombo City

## 📄 License

This project is proprietary software developed for Pahana Edu Bookshop. All rights reserved.

---

**Version**: 1.0.0  
**Last Updated**: [Current Date]  
**Documentation Maintained By**: Development Team

