# Mini ERP + CRM Operations Portal

*This project is a submission for the Fundsroom Infotech Pvt. Ltd. Full Stack Developer case study.*

A full-stack ERP/CRM for a wholesale/distribution company.

## Known Limitations

Please see [LIMITATIONS.md](./LIMITATIONS.md) for a detailed, honest breakdown of the submission requirements, what was completed, and what parts were omitted or simplified.

## Postman Collection

A full Postman collection covering all backend routes (with built-in token management for all 4 roles) is included at the root: [postman_collection.json](./postman_collection.json).
Import this file into Postman, and the login endpoints will automatically set the appropriate role token for subsequent requests.

## Architecture

- **Frontend**: A React SPA built with Vite and Tailwind CSS. It communicates securely with the backend via REST APIs.
- **Backend**: A Node.js/Express service providing RESTful endpoints, secured via JWT middleware with strict Role-Based Access Control (RBAC).
- **Database**: PostgreSQL accessed via Prisma ORM.
- **Challan Transaction Logic**: Creating a confirmed challan (or confirming a draft) requires atomic database updates to reduce product stock and record the challan. This logic lives entirely within the backend controllers (`challans.ts`) wrapped inside Prisma `$transaction` blocks to prevent race conditions or negative stock.

## Test Credentials

The database seed provides 4 default users, one for each role:

| Role | Email | Password |
| :--- | :--- | :--- |
| **Admin** | `admin@erp.com` | `password123` |
| **Sales** | `sales@erp.com` | `password123` |
| **Warehouse** | `warehouse@erp.com` | `password123` |
| **Accounts** | `accounts@erp.com` | `password123` |

## Tech Stack
- Backend: Node.js, Express, Prisma, PostgreSQL
- Frontend: React, Vite, Tailwind CSS

## Run Locally

### Backend
1. `cd backend`
2. `cp .env.example .env` (Configure your Postgres URL and JWT Secret)
3. `npm install`
4. `npx prisma generate`
5. `npx prisma db push` (or `npx prisma migrate dev`)
6. `npm run prisma:seed`
7. `npm run dev`

### Frontend
1. `cd frontend`
2. `npm install`
3. `npm run dev`

## Generating Screenshots

To generate the standard set of screenshots for this project:

1. Ensure both the backend (port 4000) and frontend (port 5173) are running.
2. Ensure the database is seeded (`npm run prisma:seed` in `backend/`).
3. `cd scripts`
4. `npm install`
5. `npx playwright install chromium`
6. `node take-screenshots.mjs`

Screenshots will be saved in the `/screenshots` directory.

## Screenshots

### Login & Dashboard
![Login](./screenshots/01-login.png)
![Dashboard](./screenshots/02-dashboard.png)

### Customers (CRM)
![Customers List](./screenshots/03-customers-list.png)
![Customer Detail Drawer](./screenshots/04-customer-detail.png)

### Products & Inventory
![Products List](./screenshots/05-products-list.png)
![Low Stock Alerts](./screenshots/06-products-lowstock.png)

### Sales Challans
![Challans List](./screenshots/07-challans-list.png)
![New Challan Form](./screenshots/08-challan-create-form.png)

## Seed Datasets

The database seed script uses the following public datasets:
- **Customers**: UK Businesses dataset from [chandanverma07/DataSets](https://github.com/chandanverma07/DataSets/blob/master/Data_Uk.csv). (Public use)
- **Products**: Mock eCommerce Products from [Vendure Mock Data](https://github.com/vendure-ecommerce/vendure/blob/master/packages/core/mock-data/data-sources/products.csv) (MIT License).


## Project Structure

\\\	ext
mini-erp-crm/
├── backend/                 # Node.js + Express backend
│   ├── prisma/              # Prisma schema and seed scripts
│   ├── src/                 # Application source code
│   │   ├── middleware/      # Auth and validation middlewares
│   │   ├── routes/          # API route definitions
│   │   └── utils/           # Utilities (db connection, error handling)
│   ├── Dockerfile           # Backend docker configuration
│   └── package.json
├── frontend/                # React + Vite frontend
│   ├── src/                 # Application source code
│   │   ├── components/      # Reusable UI components
│   │   ├── context/         # React Context (Auth)
│   │   ├── pages/           # Application pages (Dashboard, Customers, etc.)
│   │   └── index.css        # Tailwind design tokens
│   └── package.json
├── scripts/                 # Utility scripts (e.g., screenshot generator)
├── screenshots/             # Generated UI screenshots
├── .gitignore
├── docker-compose.yml       # Postgres database docker setup
├── LIMITATIONS.md           # Known limitations and project gaps
├── AUDIT_FINAL.md           # Implementation audit
├── postman_collection.json  # Postman API testing collection
└── README.md                # This file
\\\`n
## Documentation

### How the Server Was Set Up
- The backend is a standard Node.js/Express application written in TypeScript.
- Prisma is used as the ORM to communicate with a PostgreSQL database.
- Routing is modularized under \ackend/src/routes/\ and secured using JWT authentication middleware.
- The frontend is a React Single Page Application (SPA) bootstrapped with Vite and styled via Tailwind CSS.

### How Environment Variables Are Managed
- Environment variables are isolated from the codebase using \.env\ files.
- A \.env.example\ is provided in the \ackend\ directory to illustrate the required keys (e.g., \DATABASE_URL\, \JWT_SECRET\).
- In production, these should be securely injected via the hosting provider's secret management system.

### How to Deploy the Project
This project is currently structured for local development but can easily be deployed:
- **Database**: Spin up a managed PostgreSQL instance (e.g., Supabase, Neon, AWS RDS) and update the \DATABASE_URL\ env variable.
- **Backend**: Can be containerized using the provided \Dockerfile\ and deployed to platforms like Render, Railway, or AWS ECS/AppRunner.
- **Frontend**: Run \
pm run build\ to generate static assets and host them on platforms like Vercel, Netlify, or AWS S3/CloudFront.

### Assumptions Made
- **RBAC Strictness**: It is assumed that WAREHOUSE users have zero need to read customer data, while SALES users can freely view but not modify products.
- **Snapshotting**: For the sake of simplicity, full deep-copy snapshotting of a product's price at the time of a challan creation is substituted by simple tracking of total quantity and relational mapping.
- **Rate Limiting**: A simple in-memory rate limiter is used on the login route to deter brute-force attacks, assuming a single backend instance. A distributed cache (e.g., Redis) would be required for horizontally scaled environments.

