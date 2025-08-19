# Document-App Backend

This repository contains the backend services for the Document-App application, designed with a microservices architecture. It leverages Docker Compose for orchestration and includes services for authentication, document management, an API gateway, and database management using MongoDB and PostgreSQL.

## Table of Contents

- [Architecture Overview](#architecture-overview)
- [Services](#services)
  - [API Gateway](#api-gateway)
  - [Auth Service](#auth-service)
  - [Document Service](#document-service)
- [Databases](#databases)
  - [PostgreSQL](#postgresql)
- [Configuration Files](#configuration-files)
  - [Docker Compose](#docker-compose)
  - [PostgreSQL Configuration](#postgresql-configuration)
  - [Prometheus Configuration](#prometheus-configuration)
  - [Redis Configuration](#redis-configuration)
- [Development Environment](#development-environment)
- [Running the Application](#running-the-application)
- [Monitoring](#monitoring)
- [Database Management](#database-management)
- [Contributing](#contributing)
- [License](#license)

---

## Architecture Overview
![image](https://github.com/user-attachments/assets/add7a7bb-0bd8-43fe-8ac5-89a0958d9c7a)


The backend is structured into multiple services to promote scalability and maintainability:

- **API Gateway**: Manages incoming requests and routes them to the appropriate services.
- **Auth Service**: Handles user authentication and authorization.
- **Document Service**: Manages operations related to documents.
- **PostgreSQL**: SQL database for relational data storage.
- **Redis**: In-memory caching and message brokering.
- **Prometheus & Grafana**: Monitoring and analytics.

These services communicate asynchronously, ensuring a decoupled and resilient system.

---

## Services

### API Gateway

Located in the `api-gateway` directory, this service serves as the entry point for clients. It routes requests to the appropriate backend services and handles concerns such as load balancing and rate limiting.

### Auth Service

Found in the `auth-service` directory, this service is responsible for user authentication and authorization. It manages user credentials and issues tokens for session management.

### Post Service

Situated in the `document-service` directory, this service handles all operations related to documents, including creation, retrieval, updating, and deletion.

---

## Databases

### PostgreSQL

- Used for storing relational data.
- Defined in `docker-compose.yml` as the `postgres` service.
- **pgAdmin** is included for managing PostgreSQL databases via a web interface.

---

## Configuration Files

### Docker Compose

The `docker-compose.yml` file orchestrates the various services and dependencies:

- **Services**:
  - `api-gateway`
  - `auth-service`
  - `document-service`
  - `postgres`: Relational database.
  - `redis`: In-memory caching and pub/sub.
  - `pgadmin`: Web-based UI for managing PostgreSQL.
  - `prometheus`: Monitoring system.
  - `grafana`: Dashboard visualization.

### PostgreSQL Configuration

- Environment variables for the database (username, password, database name) are set in `docker-compose.yml`.
- pgAdmin allows database administration via a web UI, accessible at `http://localhost:5050`.

### Prometheus Configuration

The `prometheus.yml` file contains the configuration for Prometheus, specifying scrape intervals and targets for monitoring the services.

### Redis Configuration

The `redis.conf` file provides custom configurations for the Redis service to optimize performance and persistence settings.

---

## Development Environment

A `.devcontainer` directory is present, indicating support for development within a containerized environment, ensuring consistency across development setups.

---

## Running the Application

To run the application locally:

1. Ensure Docker and Docker Compose are installed on your system.
2. Clone the repository:
   ```sh
   git clone https://github.com/wadhwasumit/jktech.git
