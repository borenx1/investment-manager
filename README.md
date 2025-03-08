# Investment Manager

A web app to manage your investment portfolio.

Built with:

- [Next.js](https://nextjs.org)
- [React](https://react.dev/)
- [PostgreSQL](https://www.postgresql.org/)

## Development

### Run locally

1. Have a running PostgreSQL database server and get the connection URI.

2. Install [Bun](https://bun.sh/) if not installed already.

3. Install dependencies with

   ```bash
   bun install
   ```

4. Create a `.env` file from `.env.example` and fill in the environment variables

   ```bash
   cp .env.example .env
   ```

   Generate an auth secret with

   ```bash
   bunx auth secret
   ```

5. Prepare the database schema if not done already

   ```bash
   bunx drizzle-kit push
   ```

6. Run locally with

   ```bash
   bun run dev
   ```

   The app will be running on [http://localhost:3000](http://localhost:3000).

## Deployment

TODO
