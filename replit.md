# Overview

GoABLP, a product of ABLP Logistics, is a Canadian shipping platform providing multi-carrier rate comparison, shipment management, and branded tracking experiences. It enables users to compare rates from major Canadian carriers (Canada Post, Purolator, UPS, FedEx, DHL), create shipments with integrated payment processing, and track packages via a white-labeled interface. The platform supports role-based access for customers and administrators, with admin functionalities including rate markup configuration, system settings management, and client branding customization for white-label services.

The project's vision is to streamline Canadian logistics for businesses by offering a comprehensive, user-friendly, and customizable shipping solution that drives efficiency and enhances brand presence for its clients.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **Framework**: React + TypeScript
- **Build Tool**: Vite
- **UI Components**: shadcn/ui (built on Radix UI)
- **Styling**: Tailwind CSS with custom CSS variables
- **State Management**: Zustand (auth), TanStack Query (server state)
- **Routing**: Wouter
- **Form Handling**: React Hook Form with Zod validation

## Backend Architecture
- **Platform**: Node.js + Express with TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: Session-based with role-based access control (customer/admin)
- **File Uploads**: Multer
- **API Design**: RESTful with consistent error handling

## Database Design
- **Core Entities**: Users, Shipments, Client Branding, Rate Markups, Returns, System Settings.
- **Key Features**: Comprehensive user management, detailed shipment tracking, white-label customization, dynamic rate markup rules, and configurable application settings.

## System Design Choices
- **Branding**: Complete rebranding to GoABLP with dynamic logo sizing and sticky header.
- **Rate Markup System**: Implemented to apply profit margins to shipping rates with carrier-specific rules and a default 15% markup. Frontend displays detailed rate breakdowns.
- **Shipment Capabilities**: Full support for both package (parcel) and pallet/freight (LTL) shipments, including pallet-specific fields and LTL accessorial services (e.g., tailgate, commercial/residential).
- **Multi-Source Rate Aggregation**: Integrated ShipTime and Stallion Express APIs for competitive parcel rate comparison, with automatic deduplication and graceful degradation. Pallet/LTL uses ShipTime exclusively. Stallion uses separate API keys for sandbox and production environments (both available from dashboard).
- **Payment Processing**: Stripe integration for card payments, Apple Pay, and Google Pay in CAD, ensuring PCI compliance.
- **ABLP Admin System**: Dedicated admin panel for internal management, including dynamic ShipTime API credential management and advanced rate markup configuration.
- **Client Branding System**: Allows ABLP clients to customize their shipping interface and tracking pages with logos and color schemes for a white-label experience.
- **Rate Calculation System**: Features auto-rate fetching with debounce, graceful API failure handling, and dynamic loading of ABLP credentials.
- **Insurance System**: Comprehensive insurance options with detailed terms and conditions.
- **Legal Policies**: Integrated Privacy Policy, Terms of Service, and Cookie Policy.
- **User Management**: Advanced admin panel for user creation, role assignment, password management (bcrypt hashing), activity logging, and user deletion.
- **API Credentials Validation**: Automatic `.trim()` sanitization for all API credentials to prevent authentication failures.
- **Iframe Embedding Support**: Full cross-origin iframe compatibility with CORS headers and session configuration.

# External Dependencies

## Shipping Integration
- **ShipTime API**: Primary API for rates, label generation, and tracking. Supports Canada Post, Purolator, UPS, FedEx, DHL, Canpar, Loomis, GLS.
- **Stallion Express API**: Integrated for competitive parcel rates.

## Database & Infrastructure
- **Neon Database**: Serverless PostgreSQL hosting.
- **connect-pg-simple**: PostgreSQL-based session management.

## Payment Processing
- **Stripe**: Payment gateway for transactions.
- **Stripe Elements**: Frontend components for secure payment forms.

## Development & Deployment
- **Replit**: Development environment.
- **Vite**: Frontend build tool.
- **ESBuild**: Server-side bundling.