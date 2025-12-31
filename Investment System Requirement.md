Investment System Requirements
Overview
The system is designed to manage financial investments for Rodrimine Limited, allowing investors to deposit funds, earn ROI, and track their investments with both web-based and Excel-based options.
Functional Requirements
Investor Onboarding






Provide an online application form with fields:
Investor's full name (surname, first name, other name)
Residential address
Home address
Phone number
Sex
ROI frequency (monthly/on demand)
Policy date
Investment amount
Interest amount
Disbursement bank
Account name
Account number
Next of kin name
Next of kin address
Next of kin phone
Next of kin sex
Referred by
Investor's signature and date
Rodrimine director's signature and date
Passport photo upload


Automatically create investor accounts upon form submission.

Investment Management

Record every deposit (initial investment or top-up).
Record every withdrawal or partial withdrawal.
Record when ROI is paid out.

ROI (Return on Investment) Calculation

Calculate and display a 3.3% monthly ROI due amount each month.
Apply a 40% annual ROI if no withdrawals or ROI collections occur for 12 months.
Compound ROI by adding uncollected interest to the principal and recalculating.

Statements and Reports

Generate investor statements in PDF or Excel format showing:
Inflow (deposits)
Outflow (ROI collected / withdrawals)
Current balance


Provide admin access to all investors’ reports.

Notifications

Send SMS/email alerts for:
New investments
Monthly ROI availability
Withdrawals



Dashboard

Admin Dashboard: Track all investors, total investments, ROI due, etc.
Investor Dashboard: Display total investment, accrued ROI, withdrawals.

Technical Requirements

Integrate with the existing website (rodrimine.com).
Utilize the website's backend for data management (e.g., contact us emails).
Store and manage data in Excel format with automatic export of reports.
Optional Excel-based automation with VBA macros for offline use:
Calculate ROI
Generate statements
Track investments


Web-based option with secure login.

Additional Features

KYC (Know Your Customer): Allow upload of ID documents for investor verification.
Audit Trail: Log all transactions and updates for accountability.
User Roles: Admin, Accountant, Investor.

Non-Functional Requirements

Ensure data accuracy in interest calculations and tracking.
Provide a user-friendly interface for both investors and administrators.
Support secure data handling for online integration.
