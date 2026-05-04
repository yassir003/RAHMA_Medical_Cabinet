# ---- Build stage ----
FROM maven:3.9-eclipse-temurin-22 AS build
WORKDIR /app

# Cache dependencies separately from source
COPY pom.xml ./
RUN mvn dependency:go-offline -q

# Build
COPY src ./src
RUN mvn package -DskipTests -q

# ---- Runtime stage ----
FROM eclipse-temurin:22-jre-alpine
WORKDIR /app
COPY --from=build /app/target/medical-1.0.0.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
