Here’s a fully formatted `README.md` file ready for use on GitHub for your **Microbank Application** project:

````markdown
# 💳 Microbank Application

A microservices-based banking application with:

- 🔐 A **client service** for user management (Spring Boot + JWT)
- 💰 A **banking service** for financial transactions
- 🌐 A **React frontend** that interacts with both services
- 🐳 Optional **Docker/Docker Compose** setup for seamless deployment

---

## 🧰 Prerequisites

Ensure the following tools are installed:

- **Java 17+**
- **Maven 3.6+**
- **MySQL Server**
- **Node.js + npm**
- **Docker + Docker Compose**
- **IDE**: VS Code, IntelliJ IDEA, etc.

---

## ⚙️ Ports Overview

| Service         | Port  | Description                         |
|-----------------|-------|-------------------------------------|
| Client Service  | 8081  | Handles authentication and users    |
| Banking Service | 8082  | Handles deposits, withdrawals, etc. |
| Frontend        | 5173  | React Vite application              |

> The frontend calls the backend at:
> - `http://localhost:8081/api`
> - `http://localhost:8082/api`

---

## 🔧 Backend Setup (Manual)

### 📁 Database

1. Create the database:

```sql
CREATE DATABASE banking_db;
````

2. Update the `application.properties` for both `clientservice` and `bankingservice`:

```properties
# MySQL configuration
spring.datasource.url=jdbc:mysql://localhost:3306/banking_db?useSSL=false&serverTimezone=UTC
spring.datasource.username=your-username
spring.datasource.password=your-password
spring.datasource.driver-class-name=com.mysql.cj.jdbc.Driver

# Hibernate
spring.jpa.hibernate.ddl-auto=update
spring.jpa.show-sql=true
spring.jpa.properties.hibernate.dialect=org.hibernate.dialect.MySQLDialect
```

### ▶️ Run Services

For each service:

```bash
cd clientservice  # or bankingservice
mvn clean install
mvn spring-boot:run
```

---

## 🎨 Frontend Setup (Manual)

```bash
cd frontend
npm install
npm run dev
```

Access the app at: [http://localhost:5173](http://localhost:5173)

---

## 📡 API Endpoints

All secure endpoints require a JWT in the header:

```
Authorization: Bearer [JWT_TOKEN]
```

### 🔐 Client Service (`:8081`)

| Method | Endpoint                                             | Description              |
| ------ | ---------------------------------------------------- | ------------------------ |
| POST   | `/api/auth/signin`                                   | Login, returns JWT       |
| POST   | `/api/auth/signup`                                   | Register new user        |
| GET    | `/api/admin/clients`                                 | (Admin) List all clients |
| PUT    | `/api/admin/blacklist/{id}?isBlacklisted=true/false` | (Admin) Toggle blacklist |

---

### 💳 Banking Service (`:8082`)

| Method | Endpoint                    | Description                  |
| ------ | --------------------------- | ---------------------------- |
| POST   | `/api/banking/deposit`      | Deposit funds                |
| POST   | `/api/banking/withdraw`     | Withdraw funds               |
| GET    | `/api/banking/transactions` | View all transactions        |
| GET    | `/api/banking/balance`      | View current account balance |

---

## 🐳 Docker Setup (Recommended)

### 📄 Dockerfiles

#### `clientservice/Dockerfile` & `bankingservice/Dockerfile`

```Dockerfile
# Stage 1: Build
FROM maven:3.8.6-openjdk-17 AS build
WORKDIR /app
COPY pom.xml ./
COPY src ./src
RUN mvn clean install -DskipTests

# Stage 2: Runtime
FROM openjdk:17-jre-slim
WORKDIR /app
COPY --from=build /app/target/*.jar app.jar
ENTRYPOINT ["java", "-jar", "app.jar"]
```

#### `frontend/Dockerfile`

```Dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package.json ./
RUN npm install
COPY . .
EXPOSE 5173
CMD ["npm", "run", "dev"]
```

---

### 🛠 `docker-compose.yml`

```yaml
version: '3.8'

services:
  mysql:
    image: mysql:8.0
    environment:
      MYSQL_ROOT_PASSWORD: root_password
      MYSQL_DATABASE: banking_db
      MYSQL_USER: tawona-swe
      MYSQL_PASSWORD: tawona-password
    ports:
      - "3306:3306"
    volumes:
      - mysql-data:/var/lib/mysql

  clientservice:
    build: ./clientservice
    ports:
      - "8081:8081"
    environment:
      SPRING_DATASOURCE_URL: jdbc:mysql://mysql:3306/banking_db
      SPRING_DATASOURCE_USERNAME: tawona-swe
      SPRING_DATASOURCE_PASSWORD: tawona-password
    depends_on:
      - mysql

  bankingservice:
    build: ./bankingservice
    ports:
      - "8082:8082"
    environment:
      SPRING_DATASOURCE_URL: jdbc:mysql://mysql:3306/banking_db
      SPRING_DATASOURCE_USERNAME: tawona-swe
      SPRING_DATASOURCE_PASSWORD: tawona-password
    depends_on:
      - mysql
      
  frontend:
    build: ./frontend
    ports:
      - "5173:5173"
    depends_on:
      - clientservice
      - bankingservice

volumes:
  mysql-data:
```

### ▶️ Running with Docker

```bash
docker-compose up --build
```

Visit the app at: [http://localhost:5173](http://localhost:5173)

---

## ✍️ Author

**Tawona Rwatida**
Full Stack Software Developer
[GitHub Profile](https://github.com/your-username)

---

## 📄 License

This project is open-source and available under the [MIT License](LICENSE).

```

---

You can paste this into a `README.md` file in your GitHub repo root. Let me know if you'd like badges (e.g., build status, Docker, license), CI/CD info, or images/screenshots added.
```
