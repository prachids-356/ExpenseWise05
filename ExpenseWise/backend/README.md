# ExpenseWise backend starter

Java 21, Spring Boot, Maven, PostgreSQL, Spring Security and JWT.

## Prerequisites
- JDK 21
- Maven 3.9+
- PostgreSQL running locally

## Database setup
Create a PostgreSQL database named `expensewise` and a user named `expensewise` with a local development password. Update `application.properties` or set `DB_URL`, `DB_USERNAME`, and `DB_PASSWORD` environment variables.

## Run
From this directory:

```powershell
mvn spring-boot:run
```

Health check: `http://localhost:8081/api/health`

## API endpoints
- `POST /api/auth/register` — JSON: `{"name":"Demo User","email":"demo@example.com","password":"StrongPass123"}`
- `POST /api/auth/login` — JSON: `{"email":"demo@example.com","password":"StrongPass123"}`
- `GET /api/auth/me` — requires `Authorization: Bearer <token>`
- `GET /api/expenses` — requires bearer token
- `POST /api/expenses` — requires bearer token
- `PUT /api/expenses/{id}` — requires bearer token
- `DELETE /api/expenses/{id}` — requires bearer token

Expense JSON example:
`{"title":"Lunch","amount":180.00,"category":"Food","date":"2026-10-20","notes":"Optional note"}`

## Important
This is a development starter, not production-hardened. Configure a strong secret through `JWT_SECRET`, use HTTPS in deployment, review rate limiting and token revocation/refresh strategy, and use database migrations before production. CORS allows common local frontend development origins; update it to match the frontend's actual origin.
