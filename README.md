# DevGate Ready-to-Run Skeleton

## Backend

1. Navigate to `backend`
2. `npm install`
3. Copy `.env.example` to `.env` and set `DATABASE_URL` and `JWT_SECRET`
4. `npx prisma migrate dev --name init`
5. `npm run dev`

## Frontend

1. Navigate to `frontend`
2. `npm install`
3. Copy `.env.example` to `.env` and set `VITE_API_URL=http://localhost:4000`
4. `npm run dev`
