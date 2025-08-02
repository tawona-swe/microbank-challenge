# Stage 1: Build the application
FROM maven:3-openjdk-17 AS builder

# Set the working directory to the root of the project *inside* the container
WORKDIR /app

# Copy the ENTIRE project from the build context (which is now the microbank root)
COPY . .

# Change to the specific service directory to run the Maven build
WORKDIR /app/services/bankingservice

# Package the application. This creates the executable JAR.
RUN mvn clean install -DskipTests

# Stage 2: Create a lightweight runtime image
FROM openjdk:17-slim

# Set the working directory
WORKDIR /app

# Copy the executable JAR from the builder stage
# The JAR is located in the target directory *within its service folder* inside the builder.
COPY --from=builder /app/services/bankingservice/target/bankingservice-1.0.0.jar ./app.jar

# Expose the application port
EXPOSE 8082

# The command to run the application
ENTRYPOINT ["java", "-jar", "app.jar"]