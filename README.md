# Tamper-Evident Append-Only Log Service

This project is my solution for the Potens Backend Take-Home Assignment (Q1).

The objective was to build a tamper-evident append-only logging service. Every new log entry is linked to the previous one using SHA-256 hashing, so if any existing entry is modified, the chain verification process detects it.

---

# Tech Stack

- Node.js
- Express.js
- PostgreSQL
- pg
- Pino (Structured Logging)
- express-rate-limit

---

# Project Structure

```
src/
├── config/         # Database configuration
├── controllers/    # Request handlers
├── middleware/     # Authentication & rate limiting
├── routes/         # API routes
├── services/       # Business logic (hash chain)
├── logger/         # Pino logger
├── app.js
└── server.js

migrations/
scripts/
tests/
```

I organized the project into separate layers (routes, controllers, services, and configuration) so that each part has a single responsibility. This also made it easy to reuse the same business logic in both the REST API and the CLI verification command.

---

# Features

- Append-only audit log
- SHA-256 hash chaining
- Chain verification
- Filtered log export
- API Key authentication
- Rate limiting on write operations
- Structured logging using Pino
- PostgreSQL migrations

**Stretch Goal Implemented:** CLI verification (`npm run verify`)

---

# Getting Started

## 1. Clone the repository

```bash
git clone <repository-url>
cd potens-intern-backend-jyoti-vaggu
```

## 2. Install dependencies

```bash
npm install
```

## 3. Configure environment variables

Copy `.env.example` to `.env` and update the values according to your local PostgreSQL setup.


## 4. Run the migration

```bash
psql -d <database_name> -f migrations/1_Create_Logs_Table.sql
```

## 5. Start the application

Development

```bash
npm run dev
```

Production

```bash
npm start
```

## 6. Health Check

```
GET /health
```

---

# Authentication

All `/log/*` routes require an API Key.

Example header:

```
x-api-key: your_api_key
```

- Missing key → **401 Unauthorized**
- Invalid key → **403 Forbidden**

---

# API Endpoints

| Method | Endpoint | Description |
|---------|----------|-------------|
| POST | /log | Create a new log entry |
| GET | /log/:id | Retrieve one log entry with verification status |
| GET | /log/verify | Verify the complete hash chain |
| GET | /log/export | Export logs filtered by actor/date |

---

# Example Request

## POST /log

```json
{
    "actor": "jyoti",
    "action": "LOGIN",
    "payload": {
        "ip": "192.168.1.1"
    }
}
```

---

# CLI Verification

The project also includes a simple CLI command that performs the same verification as the `/log/verify` endpoint.

```bash
npm run verify
```

This reuses the same service layer instead of duplicating verification logic.

---

# Design Decisions

## SHA-256 Hash Chaining

Each entry stores:

- previous hash
- current hash

The current hash is generated using:

```
SHA256(
previous_hash +
actor +
action +
serialized_payload +
created_at
)
```

Changing any previous record changes its hash, which breaks every following link in the chain.

---

## Genesis Hash

The first log entry uses a fixed 64-character zero hash instead of `NULL`.

This keeps the verification logic consistent because every entry always has a previous hash value.

---

## JSONB Payload

Different actions can have different payload structures.

Using PostgreSQL's `JSONB` allows the payload to stay flexible without requiring many nullable columns while still supporting future querying if needed.

---

## Transactions and Row Locking

When a new log entry is created:

1. Read the latest entry
2. Lock it using `FOR UPDATE`
3. Generate the next hash
4. Insert the new entry
5. Commit

This helps avoid race conditions where two requests might otherwise read the same latest hash and create an inconsistent chain.

---

## Timestamp Normalization

While testing the project, I found that PostgreSQL and JavaScript were storing timestamps in slightly different formats. This caused valid entries to fail hash verification even though the data had not been modified.

To solve this, I created a small helper function:

```javascript
function normalizeTimestamp(date) {
    return new Date(date).toISOString();
}
```

This helper is used both while creating a log entry and while verifying existing entries, ensuring a consistent timestamp format throughout the application.

---

## Service Layer

All business logic lives inside `hashChain.service.js`.

Controllers only coordinate requests and responses.

This also allowed the CLI verification command to reuse the exact same verification logic.

---

## Rate Limiting

Rate limiting is only applied to `POST /log`.

I applied rate limiting only to the write endpoint (`POST /log`) because it is the only endpoint that modifies data. The read endpoints remain unrestricted.

---

# Manual Testing

I manually tested the application using Postman and PostgreSQL.

The following scenarios were verified:

- ✔️ Creating log entries
- ✔️ Retrieving individual log entries
- ✔️ Full chain verification
- ✔️ Filtered log export
- ✔️ Missing API key
- ✔️ Invalid API key
- ✔️ Rate limiting
- ✔️ Manual database tampering detection
- ✔️ CLI verification

---

# Known Limitations

Given the assignment time limit, I focused on completing all required functionality before optional improvements.

Current limitations:

- Automated tests (Jest/Supertest) were not added. All required functionality was tested manually using Postman.
- The current payload hashing works for this project, but a production system should use canonical JSON serialization for deeply nested payloads.
- Full chain verification scans the complete table. A Merkle-tree based approach would scale better for very large datasets.
- Docker Compose was not implemented.

---

# Future Improvements

If I had more time, I would:

- Add automated tests using Jest and Supertest.
- Add Docker Compose for easier local setup.
- Implement Merkle-tree based verification for better scalability.
- Replace API key authentication with JWT or OAuth.
- Use canonical JSON serialization for nested payloads.
- Add monitoring and metrics for production deployments.

---

# AI Use Log

| Tool | Approximate Usage | Used For |
|------|-------------------|-----------|
| Claude (Sonnet) | ~20–30 messages | Pair programming during implementation, debugging, reviewing code, and discussing design choices. |
| ChatGPT | ~25-35 messages | Architecture planning, engineering discussions, code reviews, Git workflow, testing strategy, and README review. |

AI was used as a development assistant throughout the assignment. I used it to discuss approaches, review implementations, and debug issues. The final implementation was integrated, tested, and verified by me, and I understand the design decisions and implementation details.

---

# Reflection

Working on this assignment gave me hands-on experience designing a backend service beyond simply implementing REST APIs. It helped me think more about project structure, transactions, concurrency, and keeping business logic separate from HTTP handling...

One of the most valuable parts of the project was debugging real issues, such as timestamp normalization during hash verification. Solving those problems helped me better understand why consistency matters in systems that rely on cryptographic verification.

Thank you for taking the time to review my submission!