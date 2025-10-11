# Overview

GoABLP, a product of ABLP Logistics, is a Canadian shipping platform providing multi-carrier rate comparison, shipment management, and branded tracking experiences. It enables users to compare rates from major Canadian carriers (Canada Post, Purolol, UPS, FedEx, DHL), create shipments with integrated payment processing, and track packages via a white-labeled interface. The platform supports role-based access for customers and administrators, with admin functionalities including rate markup configuration, system settings management, and client branding customization for white-label services.

The project's vision is to streamline Canadian logistics for businesses by offering a comprehensive, user-friendly, and customizable shipping solution that drives efficiency and enhances brand presence for its clients.

## Recent Changes (October 2025)

**Complete Rebranding to GoABLP (October 2025):**
- Rebranded entire application from "ShipSwift" to "GoABLP"
- Replaced all text references, logos, and branding elements throughout the platform
- Updated navbar and footer with new GoABLP logo (2x bigger than original)
- Implemented sticky header with dynamic logo sizing on scroll
- Logo reduces from 80px to 70px when scrolling down (smooth 300ms transition)
- Navbar container adjusts from 96px to 80px height on scroll
- Footer logo set to 80px (2x original size)
- Updated email templates, documentation, and all user-facing text
- Changed tagline from "Subsidiary of ABLP Logistics" to "A Product of ABLP Logistics"
- Comprehensive find-and-replace across frontend, backend, and documentation

**Rate Markup System (October 2025 - New Feature):**
- Implemented comprehensive rate markup system to apply profit margins to ShipTime API rates
- Created RateMarkupService that queries carrier-specific markup rules from database
- Default 25% markup applied when no carrier-specific rule exists
- Markup applied to base rates only (excluding taxes) for accurate comparison
- Frontend displays pre-tax subtotal as main price (matching ShipTime display)
- Taxes shown as separate line item ("+ $X.XX tax") below subtotal
- Final total displayed clearly ("Total: $X.XX")
- Solves rate discrepancy issue: ShipTime shows pre-tax rates, app was showing post-tax totals
- Enables apples-to-apples rate comparison between GoABLP and ShipTime interface
- Admin can configure carrier-specific markup rules via existing rateMarkups table

**Pallet/Freight Shipping (New Feature):**
- Added pallet and freight (LTL) shipping capabilities alongside existing package shipping
- Shipment type selector in UI allows users to choose between Package and Pallet/Freight shipping
- Pallet-specific fields: number of pallets, pallet type (standard/euro/custom), stackability, freight class
- Backend integration with ShipTime API for freight rate requests using PALLET packageType
- Database schema uses shipment_type column to differentiate shipments, with pallet metadata stored in packageDetails JSONB field for flexibility
- Design decision: Pallet-specific fields stored in packageDetails JSONB rather than dedicated columns for schema flexibility and easier evolution
- Province dropdowns ensure 2-letter codes (AB, BC, ON) for API validation
- Automatic postal code formatting (uppercase with space: A1A 1A1)

**Authentication & Navigation (August 2025 - Resolved):**
- Fixed logout redirect functionality across all pages using immediate window.location.href navigation
- Enhanced navbar logout with proper session handling and immediate redirect

**Logo Upload System (August 2025 - Resolved):**
- Implemented comprehensive file upload system with multer middleware
- Added extensive debugging and error handling for upload process
- Fixed client-side event handling issues with proper HTML form semantics
- Logo uploads now persist correctly in uploads directory and database

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

## Payment Processing
- **Integration**: Stripe for complete payment flow using PaymentIntents API.
- **Currency**: Canadian Dollar (CAD).
- **Methods**: Card payments, Apple Pay, Google Pay.
- **Security**: PCI-compliant through Stripe Elements.

## System Design Choices
- **Pallet/Freight Shipping**: Full support for both package (parcel) and pallet/freight (LTL) shipments with dedicated UI for pallet-specific details (pallet count, type, stackability, freight class). Uses JSONB storage for flexible pallet metadata.
- **ABLP Admin System**: Dedicated admin panel for internal ABLP management, including dynamic ShipTime API credential management (encrypted storage) and advanced rate markup configuration with conditional logic (cost/weight/location-based rules) for profit margin control.
- **Client Branding System**: Allows ABLP clients to customize their shipping interface and tracking pages with their logos and color schemes for a white-label experience.
- **Rate Calculation System**: Features auto-rate fetching with debounce, graceful API failure handling using sample rates as fallback, and dynamic loading of ABLP credentials.
- **Insurance System**: Comprehensive insurance options with detailed terms and conditions, distinct from carrier liability, and proper acceptance mechanisms.
- **Legal Policies**: Integrated Privacy Policy, Terms of Service, and Cookie Policy, generic to ABLP Logistics.
- **UI/UX Enhancements**: Streamlined shipment workflow, enhanced tracking display, comprehensive shipment management page, and improved dashboard navigation.
- **User Management**: Advanced admin panel for user creation, role assignment, password management, activity logging, and real-time user statistics.
- **Carrier Logos**: Implementation of authentic, responsive carrier logos for major Canadian carriers.
- **ShipTime API Integration**: Robust connection testing, proper sandbox/production environment support, and automatic cancellation of sandbox shipments.
- **Pickup Options & Unit Conversion**: Integrated pickup scheduling, and automatic metric/imperial unit conversion for package dimensions.
- **Iframe Embedding Support**: Full cross-origin iframe compatibility with CORS headers and session configuration optimized for embedding in third-party websites via shortcodes.

# External Dependencies

## Shipping Integration
- **ShipTime API**: Primary API for rates, label generation, and tracking.
- **Multi-Carrier Support**: Canada Post, Purolator, UPS, FedEx, DHL, Canpar, Loomis, GLS (via ShipTime).
- **API Endpoint**: https://restapi.shiptime.com/rest/ (Production).

## Database & Infrastructure
- **Neon Database**: Serverless PostgreSQL hosting.
- **connect-pg-simple**: PostgreSQL-based session management.

## Payment Processing
- **Stripe**: Payment gateway for transactions, subscriptions, and financial operations.
- **Stripe Elements**: Frontend components for secure payment forms.

## Development & Deployment
- **Replit**: Development environment.
- **Vite**: Frontend build tool.
- **ESBuild**: Server-side bundling.