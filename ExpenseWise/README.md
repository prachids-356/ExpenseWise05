# ExpenseWise

Full-stack personal expense tracking application built with **Spring Boot 3 (Java 21)**, **PostgreSQL**, **Flyway**, **Docker**, and **Vanilla HTML/CSS/JavaScript**.

## Architecture

- **Frontend:** Responsive HTML5/CSS3/JS interface with Chart.js analytics, dynamic API endpoint detection, and JWT token management.
- **Backend:** Spring Boot 3.5.6 REST API secured with Spring Security (stateless JWT authentication), BCrypt password hashing, and per-user data isolation.
- **Database:** PostgreSQL 16 with version-controlled schema migrations managed by Flyway (`V1__init_schema.sql`).
- **Containerization & CI/CD:** Multi-stage Docker builds orchestrated via Docker Compose, with automated Maven tests and Docker Hub image publishing via GitHub Actions.

## Features Implemented

- User registration and login with JWT authentication (`/api/auth/register`, `/api/auth/login`, `/api/auth/me`)
- Full Expense CRUD (`/api/expenses`) with strict per-user ownership enforcement
- Real-time category pie chart and daily spending trend line chart
- Search and multi-criteria filtering (category, payment method, date range)
- Automated JUnit 5 + MockMvc integration test suite

## Local Setup & Running with Docker

1. **Clone the repository:**
   ```bash
   git clone <YOUR_REPOSITORY_URL>
   cd ExpenseWise