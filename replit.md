# Overview

GoABLP, a product of ABLP Logistics, is a Canadian shipping platform providing multi-carrier rate comparison, shipment management, and branded tracking experiences. It enables users to compare rates from major Canadian carriers (Canada Post, Purolator, UPS, FedEx, DHL), create shipments with integrated payment processing, and track packages via a white-labeled interface. The platform supports role-based access for customers and administrators, with admin functionalities including rate markup configuration, system settings management, and client branding customization for white-label services.

The project's vision is to streamline Canadian logistics for businesses by offering a comprehensive, user-friendly, and customizable shipping solution that drives efficiency and enhances brand presence for its clients.

## Recent Updates (Nov 8, 2025)

### Bug Fixes
1. **Drop-Off Package Validation**: Fixed pickup options form to allow "Drop Off" selection without validation errors. Contact name, phone, location, and time fields are now only required when scheduling pickup (not for drop-off).
2. **Dashboard Rate Calculator**: Updated to require and display full addresses (company, street, city, province, phone) for ALL shipment types (package, envelope, pallet), not just freight. This ensures ShipTime API receives complete data for accurate rate calculation.
3. **API Payload**: Modified rate request payload to include fromAddress/toAddress for all shipment types, enabling proper multi-carrier rate aggregation.
4. **Pickup Options Display**: Fixed rate display in pickup options to correctly calculate total from `subtotal + taxAmount` instead of using undefined `totalCharge` property.
5. **Same-Day Pickup**: Fixed pickup date calendar to allow same-day pickup scheduling. Previously, the minimum selectable date was hardcoded to "tomorrow", preventing same-day pickups for all carriers. Now uses "today" as minimum date with proper midnight normalization for reliable date comparison.

### New Features
1. **Address Data Persistence**: Implemented complete data flow from rate calculator through to order summary. Ship-to address details (street, city, province, postal code, phone) are now automatically pre-filled in the shipment form, eliminating the need for users to re-enter information.
2. **Order Confirmation Checkbox**: Added mandatory confirmation checkbox in the order summary before payment continuation. Users must explicitly confirm all shipping information is correct before proceeding to payment. The "Continue to Payment" button is disabled until checkbox is checked, with both UI and backend validation.
3. **Payment Section Scroll**: Implemented automatic smooth scrolling to Payment Details section when user clicks "Continue to Payment". Previously scrolled to wrong section, now correctly targets the payment form.

# User Preferences

Preferred communication style: Simple, everyday language.

**UI/UX Preferences**:
- Do not reference carrier names (Stallion Express, ShipTime, etc.) in customer-facing UI
- Keep carrier information internal to backend services and admin panels only

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
- **Shipment Capabilities**: Full support for package (parcel), envelope, and pallet/freight (LTL) shipments. Envelope shipments feature standard size presets (Letter, Legal, Large, Flat Rate) with automatic dimension mapping, 2 lb weight limit, and Stallion Express-exclusive routing. Package and pallet shipments include pallet-specific fields and LTL accessorial services (e.g., tailgate, commercial/residential).
- **Multi-Source Rate Aggregation**: Integrated ShipTime and Stallion Express APIs for competitive parcel rate comparison, with automatic deduplication and graceful degradation. Envelope shipments use Stallion Express exclusively. Pallet/LTL uses ShipTime exclusively. Package shipments query both APIs. Stallion uses separate API keys for sandbox and production environments (both available from dashboard).
- **Payment Processing**: Stripe integration for card payments, Apple Pay, and Google Pay in CAD, ensuring PCI compliance.
- **ABLP Admin System**: Dedicated admin panel for internal management, including dynamic ShipTime API credential management and advanced rate markup configuration.
- **Client Branding System**: Allows ABLP clients to customize their shipping interface and tracking pages with logos and color schemes for a white-label experience.
- **Rate Calculation System**: Features auto-rate fetching with debounce, graceful API failure handling, and dynamic loading of ABLP credentials.
- **Insurance System**: Comprehensive insurance options with detailed terms and conditions.
- **Legal Policies**: Integrated Privacy Policy, Terms of Service, and Cookie Policy.
- **User Management**: Advanced admin panel for user creation, role assignment, password management (bcrypt hashing), activity logging, and user deletion.
- **API Credentials Validation**: Automatic `.trim()` sanitization for all API credentials to prevent authentication failures.
- **Iframe Embedding Support**: Full cross-origin iframe compatibility with CORS headers and session configuration.
- **Canadian Tax Calculation**: Local tax calculation service using official 2025 provincial tax rates (destination-based). Calculates and validates taxes to ensure 100% accuracy, overriding API-provided taxes when necessary. Supports GST (5%), HST (13% ON, 15% Atlantic), and GST+QST (14.975% QC). Tax calculations are logged for transparency and auditing.
- **Merchant API System**: Secure API key management for external e-commerce integrations. Allows merchants to generate API keys and fetch real-time shipping rates for platforms like WooCommerce, Shopify, and others via authenticated REST API endpoint.
- **WooCommerce Plugin**: Complete WordPress plugin providing real-time multi-carrier shipping rates at checkout. Features smart caching, fallback rates, debug logging, and delivery time display. Available in `/woocommerce-plugin/` directory.

# External Dependencies

## Shipping Integration
- **ShipTime API**: Primary API for rates, label generation, and tracking. Supports Canada Post, Purolator, UPS, FedEx, DHL, Canpar, Loomis, GLS.
- **Stallion Express API**: Integrated for competitive parcel rates. **IMPORTANT**: Stallion has strict content validation for item descriptions. Safe default is "Package" - avoid terms like "General Merchandise" or "Parcel" which may be flagged as prohibited content.

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