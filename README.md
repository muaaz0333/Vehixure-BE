# backend

A modern backend boilerplate, built with Fastify and TypeScript.

## Features
- Fastify server with TypeScript
- PostgreSQL database via TypeORM
- Modular route/controller structure
- JWT authentication
- OpenAPI (Swagger) documentation at `/docs`
- Ready for Docker deployment

## Getting Started

1. **Install dependencies:**
   ```sh
   npm install
   ```
2. **Configure environment:**
   Create a `.env` file with your database and JWT settings:
   ```env
   DB_HOST=localhost
   DB_PORT=5432
   DB_USER=postgres
   DB_PASSWORD=postgres
   DB_DATABASE=postgres
   JWT_SECRET=your_jwt_secret
   ```
3. **Run the server:**
   ```sh
   npm run dev
   ```
4. **API Documentation:**
   Visit [http://localhost:5050/docs](http://localhost:5050/docs) for interactive API docs.

## Project Structure
- `src/` - Source code
  - `entities/` - TypeORM entity schemas
  - `controllers/` - Route handler logic
  - `routes/` - API route definitions
  - `plugins/` - Fastify plugins (config, db, etc.)

## License
MIT
