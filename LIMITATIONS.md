# Known Limitations and Submission Gaps

This document details the honest status of the "Submission Requirements" and "Bonus Points" sections outlined in the case study PDF.

## Submission Requirements

- **GitHub repository link**: Met.
- **Live frontend URL**: Missing. The application is designed to be run locally; no live deployment on Vercel/Netlify was made.
- **Live backend API URL**: Missing. Designed for local execution.
- **Test login credentials for all roles**: Met (documented in `README.md`).
- **Postman collection or API documentation**: Met (`postman_collection.json` provided at the root).
- **README with setup and deployment instructions**: Met.
- **Short explanation of architecture**: Met (added to `README.md`).
- **Known limitations or incomplete parts**: Met (this document).
- **A screen recording of the full flow**: Missing. Static screenshots of every core screen flow are provided in the `/screenshots` directory instead of a video recording.

## Bonus Points

- **Docker setup**: Partial. A `docker-compose.yml` is provided to easily spin up the PostgreSQL database, but the Node.js backend and React frontend themselves are not dockerized.
- **AWS Deployment**: Not attempted.
- **GitHub Actions deployment**: Not attempted.
- **Export invoice as PDF**: Not attempted. The system handles Sales Challans, but no PDF generation feature is implemented.
- **Upload product image to AWS S3**: Not attempted. Images/assets are not handled in this implementation.

## Functional/Technical Limitations

- **Search/Pagination**: Search and pagination are implemented in the API and wired up on the frontend for most lists (Challans, Customers, Products).
- **Challan Snapshotting**: The PDF requested "Challan should store product snapshot data, not only product ID". While the schema tracks total quantity and status, deep snapshotting of the exact product pricing at the time of creation inside a dedicated JSON/relational structure is simplified in the current implementation.
- **Error Handling**: Basic error handling is present on the frontend, but edge cases (e.g., database connection loss mid-transaction) might not have polished UI feedback.
