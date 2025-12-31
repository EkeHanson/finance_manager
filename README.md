Rodrimine Investment Management Frontend
This project is a Vite-based React frontend for the Rodrimine Investment Management system. It provides an online interface for investor onboarding, investment tracking, ROI calculations, and dashboard views, integrated with the existing Rodrimine website.
Prerequisites

Node.js (v16 or later)
npm (v8 or later)
A code editor (e.g., VS Code)

Setup Instructions

Clone the Repository
git clone <repository-url>
cd rodrimine-investment-frontend


Install Dependencies
npm install


Run the Development Server
npm run dev

Open http://localhost:5173 in your browser to see the app.

Build for Production
npm run build

This generates a dist folder with production-ready files.


Project Structure
rodrimine-investment-frontend/
├── public/                  # Static assets
│   ├── index.html           # Main HTML file
│   ├── favicon.ico          # Favicon
│   └── logo.png             # Logo image
├── src/                     # Source code
│   ├── assets/              # Images, fonts, etc.
│   ├── components/          # Reusable React components
│   │   ├── FormInput.js     # Generic input field component
│   │   ├── InvestmentForm.js # Investor onboarding form
│   │   ├── Dashboard.js     # Admin/Investor dashboard
│   │   ├── Notification.js  # Notification display component
│   │   └── Statement.js     # Investment statement component
│   ├── pages/               # Page-level components
│   │   ├── Home.js          # Landing page
│   │   ├── Login.js         # Login page
│   │   └── Register.js      # Registration page
│   ├── App.js               # Root component
│   ├── main.js              # Entry point
│   ├── styles/              # CSS/Tailwind styles
│   │   ├── tailwind.css     # Tailwind configuration
│   │   └── global.css       # Global styles
│   └── utils/               # Utility functions
│       ├── api.js           # API call utilities
│       └── calculations.js  # ROI calculation logic
├── .gitignore               # Git ignore file
├── index.html               # Main HTML template (in public/)
├── package.json             # Project metadata and dependencies
├── tailwind.config.js       # Tailwind CSS configuration
├── vite.config.js           # Vite configuration
└── README.md                # This file

Components
Core Components

FormInput.js: A reusable input field component for forms (e.g., text, number).
InvestmentForm.js: Component for the online investor application form with fields for name, contact, bank details, next of kin, and passport photo upload.
Dashboard.js: Displays admin or investor dashboard with investment totals, ROI, and withdrawals.
Notification.js: Shows SMS/email notification alerts for investments, ROI, and withdrawals.
Statement.js: Generates and displays investor statements (inflow, outflow, balance).

Page Components

Home.js: Landing page with an overview and form link.
Login.js: Login page for investors and admins.
Register.js: Registration page (optional, if separate from the form).

Utility Files

api.js: Handles API calls to the backend for data submission and retrieval.
calculations.js: Contains logic for 3.3% monthly ROI, 40% annual ROI, and compounding calculations.

Styling

Uses Tailwind CSS for responsive and modern styling.
Global styles are defined in styles/global.css.
Configure Tailwind in tailwind.config.js to include custom colors and layouts.

Dependencies

react
react-dom
vite
tailwindcss
axios (for API calls)

Install via package.json:
{
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "axios": "^1.6.0"
  },
  "devDependencies": {
    "vite": "^5.0.0",
    "tailwindcss": "^3.3.0"
  }
}

Development Guidelines

Follow React best practices (component-based, reusable code).
Ensure accessibility (ARIA labels, keyboard navigation).
Test responsiveness across devices.

Deployment

Build the project (npm run build).
Deploy the dist folder to a web server or integrate with the Rodrimine website backend.

Contributing
Fork the repository, create a feature branch, and submit a pull request for review.
License
MIT License