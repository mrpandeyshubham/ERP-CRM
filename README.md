# Mini ERP + CRM Operations Portal

A full-stack ERP/CRM for a wholesale/distribution company.

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

