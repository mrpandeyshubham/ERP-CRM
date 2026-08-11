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
