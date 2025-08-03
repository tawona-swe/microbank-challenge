
````md
# Microbank Application

**Microbank** is a microservices-based banking system comprising:

- `clientservice` – user registration, authentication, and admin controls
- `bankingservice` – deposits, withdrawals, transactions, and balances
- React frontend – user/admin interface communicating with both services

---

## 1. Prerequisites

Make sure the following tools are installed:

- **Java 17+**
- **Apache Maven 3.6+**
- **Docker & Docker Compose**
- **Node.js + npm**
- *(Optional)* **MySQL**, if running services manually

---

## 2. Services Overview

| Service        | Port | Description                              |
|----------------|------|------------------------------------------|
| clientservice  | 8081 | Handles authentication & user management |
| bankingservice | 8082 | Handles financial transactions           |
| frontend       | 5173 | React app for clients & admins           |
| phpMyAdmin     | 8080 | DB browser (via Docker)                  |
| Swagger UI     | —    | Auto-generated API docs per service      |

---

## 3. Swagger API Docs

Each Spring Boot service exposes Swagger UI via `springdoc-openapi`:

- **Client Service** → [http://localhost:8081/swagger-ui.html](http://localhost:8081/swagger-ui.html)
- **Banking Service** → [http://localhost:8082/swagger-ui.html](http://localhost:8082/swagger-ui.html)

Explore endpoints like `/api/auth/signin` and `/api/banking/withdraw` with request/response samples.

---

## 4. Docker Deployment

Use Docker Compose to spin up all services in one go.

### 🐳 Dockerized stack includes:

- MySQL (`banking_db`)
- Spring Boot services (`clientservice`, `bankingservice`)
- React frontend (port `5173`)
- phpMyAdmin (port `8080`)

### 🚀 Run with:

```bash
docker-compose up --build
````

Then visit:

* Frontend → [http://localhost:5173](http://localhost:5173)
* phpMyAdmin → [http://localhost:8080](http://localhost:8080)
  *(Use `root` as username with no password)*

---

## 5. Manual Run (Development)

If you prefer running services manually without Docker:

```bash
# Client Service
cd services/clientservice
mvn spring-boot:run

# Banking Service
cd services/bankingservice
mvn spring-boot:run

# Frontend
cd frontend
npm install
npm run dev
```

---

## 6. Database Configuration

If you're running without Docker, ensure your local MySQL is set up. Update `application.properties`:

```properties
spring.datasource.url=jdbc:mysql://localhost:3306/banking_db
spring.datasource.username=your-username
spring.datasource.password=your-password
```

> On Render or cloud platforms, use environment variables for these credentials.

---

## 7. API Highlights

### Client Service (`http://localhost:8081`)

| Method | Endpoint                    | Description          |
| ------ | --------------------------- | -------------------- |
| POST   | `/api/auth/signin`          | Log in               |
| POST   | `/api/auth/signup`          | Register             |
| GET    | `/api/admin/clients`        | List clients (admin) |
| PUT    | `/api/admin/blacklist/{id}` | Blacklist a client   |

### Banking Service (`http://localhost:8082`)

| Method | Endpoint                    | Description           |
| ------ | --------------------------- | --------------------- |
| POST   | `/api/banking/deposit`      | Deposit into account  |
| POST   | `/api/banking/withdraw`     | Withdraw from account |
| GET    | `/api/banking/transactions` | List all transactions |
| GET    | `/api/banking/balance`      | Get account balance   |

> All protected endpoints require `Authorization: Bearer <JWT>` in the header.

---

```
---

```
