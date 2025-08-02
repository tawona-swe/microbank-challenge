# Microbank Application

This project is a microservices-based banking application with a client service for user management and a banking service for financial transactions. The frontend is a React application that interacts with both services.

-----

### 1\. Assumptions and Prerequisites

To successfully set up and run this application, you must have the following installed:

  * **Java Development Kit (JDK) 17+**
  * **Apache Maven 3.6+**
  * **MySQL Server**
  * **Node.js and npm** (for the React frontend)
  * A code editor like **Visual Studio Code** or an IDE like **IntelliJ IDEA**.

The backend services are configured to run on the following ports:

  * **`clientservice`**: `8081`
  * **`bankingservice`**: `8082`

The frontend is configured to run on port `5173` (default for `npm run dev`) and is hardcoded to call the backend services at `http://localhost:8081/api` and `http://localhost:8082/api`.

-----

### 2\. Backend Setup

Both backend services are Spring Boot applications that use Maven for dependency management and MySQL for data persistence.

#### MySQL Database Setup

Before running the services, you need to create the `banking_db` database.

1.  Open your MySQL client.

2.  Run the following command:

    ```sql
    CREATE DATABASE banking_db;
    ```

3.  Ensure your `application.properties` files in both services are configured with the correct username and password for your MySQL instance.

#### clientservice Setup

1.  Navigate to the `clientservice` directory.

2.  Ensure your `pom.xml` contains the MySQL connector dependency.

3.  Configure your `src/main/resources/application.properties` file:

    ```properties
    # MySQL database configuration
    spring.datasource.url=jdbc:mysql://localhost:3306/banking_db?useSSL=false&serverTimezone=UTC
    spring.datasource.username=your-username
    spring.datasource.password=your-password
    spring.datasource.driver-class-name=com.mysql.cj.jdbc.Driver

    # JPA/Hibernate configuration
    spring.jpa.hibernate.ddl-auto=update
    spring.jpa.show-sql=true
    spring.jpa.properties.hibernate.dialect=org.hibernate.dialect.MySQLDialect
    ```

4.  Build and run the service using Maven:

    ```bash
    mvn clean install
    mvn spring-boot:run
    ```

#### bankingservice Setup

1.  Navigate to the `bankingservice` directory.

2.  Ensure your `pom.xml` contains the MySQL connector dependency.

3.  Configure your `src/main/resources/application.properties` file:

    ```properties
    # MySQL database configuration
    spring.datasource.url=jdbc:mysql://localhost:3306/banking_db?useSSL=false&serverTimezone=UTC
    spring.datasource.username=your-username
    spring.datasource.password=your-password
    spring.datasource.driver-class-name=com.mysql.cj.jdbc.Driver

    # JPA/Hibernate configuration
    spring.jpa.hibernate.ddl-auto=update
    spring.jpa.show-sql=true
    spring.jpa.properties.hibernate.dialect=org.hibernate.dialect.MySQLDialect
    ```

4.  Build and run the service using Maven:

    ```bash
    mvn clean install
    mvn spring-boot:run
    ```

-----

### 3\. Frontend Setup

The frontend is a React application. You can use the code provided previously.

1.  Navigate to your frontend project directory.
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Run the application:
    ```bash
    npm run dev
    ```

-----

### 4\. API Endpoints

This section documents the primary API endpoints for each service. All authenticated endpoints require a JWT in the `Authorization` header, formatted as `Bearer [JWT_TOKEN]`.

#### Client Service (`clientservice` on port 8081)

| HTTP Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/auth/signin` | Authenticates a user and returns a JWT. |
| | | **Request Body:** `{ "username": "...", "password": "..." }` |
| | | **Response Body (Success):** `{ "accessToken": "...", "id": ..., "username": "...", "email": "...", "name": "...", "roles": ["..."] }` |
| `POST` | `/api/auth/signup` | Registers a new user. |
| | | **Request Body:** `{ "name": "...", "username": "...", "email": "...", "password": "..." }` |
| | | **Response Body:** `{ "message": "User registered successfully!" }` |
| `GET` | `/api/admin/clients` | (Admin Only) Retrieves a list of all clients. |
| | | **Request Header:** `Authorization: Bearer [JWT]` |
| | | **Response Body:** `[{ "id": ..., "name": "...", "email": "...", "isBlacklisted": ... }, ...]` |
| `PUT` | `/api/admin/blacklist/{clientId}` | (Admin Only) Toggles a user's blacklist status. |
| | | **Request Header:** `Authorization: Bearer [JWT]` |
| | | **Request Params:** `?isBlacklisted=true/false` |
| | | **Response Body:** `{"message": "User blacklist status updated."}` |

#### Banking Service (`bankingservice` on port 8082)

| HTTP Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/banking/deposit` | Deposits a specified amount into the user's account. |
| | | **Request Header:** `Authorization: Bearer [JWT]` |
| | | **Request Body:** `{ "amount": 100.00 }` |
| `POST` | `/api/banking/withdraw` | Withdraws a specified amount from the user's account. |
| | | **Request Header:** `Authorization: Bearer [JWT]` |
| | | **Request Body:** `{ "amount": 50.00 }` |
| `GET` | `/api/banking/transactions` | Retrieves all transaction history for the authenticated user. |
| | | **Request Header:** `Authorization: Bearer [JWT]` |
| `GET` | `/api/banking/balance` | Retrieves the current balance for the authenticated user. |
| | | **Request Header:** `Authorization: Bearer [JWT]` |

-----

### 5\. Docker Setup (Recommended)

This section provides a more streamlined way to run all services using Docker and Docker Compose. This approach removes the need to install MySQL, Maven, and Node.js locally.

Dockerfiles
First, you need to create a Dockerfile for each of your backend services and one for your frontend.

clientservice/Dockerfile and bankingservice/Dockerfile
Create a Dockerfile in both the clientservice and bankingservice directories with the following content. This will build a final lightweight image with your Spring Boot application.

# Multi-stage build
# Stage 1: Build the application
FROM maven:3.8.6-openjdk-17 AS build
WORKDIR /app
COPY pom.xml .
COPY src ./src
RUN mvn clean install -DskipTests

# Stage 2: Create the final image
FROM openjdk:17-jre-slim
WORKDIR /app
COPY --from=build /app/target/*.jar app.jar
ENTRYPOINT ["java", "-jar", "app.jar"]

frontend/Dockerfile
Create a Dockerfile in your frontend directory with the following content. This will build and run your React application.

FROM node:18-alpine
WORKDIR /app
COPY package.json ./
RUN npm install
COPY . .
EXPOSE 5173
CMD ["npm", "run", "dev"]

Docker Compose File
Create a docker-compose.yml file in the root of your project with the following content. This file defines and links all the services together.

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

Running with Docker
Navigate to the root directory of your project.

Build and start all services with a single command:

docker-compose up --build

Open your web browser and navigate to http://localhost:5173 to access the application.

### 6\. Running the Full Application (Manual Method)

To run the full application, follow these steps in separate terminal windows:

1.  **Start your MySQL Server.**
2.  In the `clientservice` directory, run `mvn spring-boot:run`.
3.  In the `bankingservice` directory, run `mvn spring-boot:run`.
4.  In the frontend directory, run `npm run dev`.
5.  Open your web browser and navigate to **`http://localhost:5173`** to access the application.