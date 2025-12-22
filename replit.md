# Overview

GoABLP, a product of ABLP Logistics, is a Canadian shipping platform providing multi-carrier rate comparison, shipment management, and branded tracking experiences. It enables users to compare rates from major Canadian carriers (Canada Post, Purolator, UPS, FedEx, DHL), create shipments with integrated payment processing, and track packages via a white-labeled interface. The platform supports role-based access for customers and administrators, with admin functionalities including rate markup configuration, system settings management, and client branding customization for white-label services.

The project's vision is to streamline Canadian logistics for businesses by offering a comprehensive, user-friendly, and customizable shipping solution that drives efficiency and enhances brand presence for its clients.

## Recent Updates (Dec 22, 2025)

### New Features - Uber Direct Local Delivery
1. **Same-Day Local Delivery Highlighting**: Uber Direct rates (available via ShipTime API) are now highlighted with distinctive amber styling and a "Same-Day Local" badge with lightning icon.
2. **Local Delivery Tagging**: Rate aggregator automatically tags Uber rates with `isLocalDelivery: true` and `deliveryType: 'same-day-local'` for easy identification.
3. **Custom Uber Logo**: Carrier logo component displays a branded black/white "UBER" fallback for Uber rates.
4. **Uber Direct Coverage**: Available within 25 km in Canada (20 miles in USA) for packages under 50 lbs via ShipTime integration.

## Previous Updates (Dec 21, 2025)

### New Features - Stripe Card Saving & Overage Processing
1. **Mandatory Saved Payment Method**: Users MUST add a credit card to their account before creating any shipment. The checkout shows a warning with link to profile if no card is saved.
2. **Instant Payment Charging**: When creating a shipment, the saved card is charged immediately - no separate payment step required. Users see "Pay $XX.XX CAD Now" button with their card on file displayed.
3. **Saved Payment Methods**: Users can save credit cards to their account via the Profile page. Cards are securely stored via Stripe and displayed with last 4 digits and expiration.
4. **Automatic Overage Charging**: When carriers report actual dimensions/weight exceeding declared values by more than 5%, the system automatically calculates and charges overages to the user's saved payment method.
5. **Overage Processing System**: Complete admin workflow for reviewing, processing, and waiving overages. Includes dimensional weight calculation (DIM factor 5000) and $1 minimum charge threshold.
6. **Payment Methods UI**: New PaymentMethods component in Profile page allows users to add, view, set default, and delete saved cards using Stripe Elements.

### System Architecture - Stripe Integration
- **Database Entities**: `stripeCustomerId` and `defaultPaymentMethodId` on users table; overage tracking fields (`overageAmount`, `overageStatus`, `overageChargeId`, `originalWeight`, `originalDimensions`, `actualWeight`, `actualDimensions`) on shipments table
- **Services**: `StripeService` (customer management, SetupIntent, off-session payments), `OverageService` (calculation, threshold checks, auto-charging)
- **Routes**: `/api/user/payment-methods/*` for card management, `/api/admin/shipments/:id/process-overage` for admin overage processing
- **Overage Status Flow**: pending → charged/waived/failed

## Previous Updates (Dec 20, 2025)

### New Features - Blaze Portal
1. **Blaze Cannabis Dispensary Integration**: Complete integration with Blaze POS for cannabis dispensary shipping. The Blaze Portal provides a dedicated shipping interface for dispensary orders with carrier filtering.
2. **Cannabis-Friendly Carrier Filtering**: Automatically excludes US-based carriers (UPS, FedEx, DHL) that have restrictions on cannabis products. Only Canadian carriers like Canada Post, Purolator, Canpar, GLS, and Loomis are available for cannabis shipments.
3. **Blaze Admin Settings**: Admin panel for managing Blaze Partner API credentials, carrier exclusion rules, and user access control.
4. **Blaze User Access Control**: Admins can grant/revoke Blaze Portal access for specific users via the admin panel.
5. **Dispensary Connections**: Users can connect their Blaze dispensary accounts to streamline order fulfillment.

### System Architecture - Blaze Portal
- **Database Entities**: `blaze_settings` (Partner API config, carrier exclusions), `blaze_connections` (user-dispensary links)
- **User Access**: `blazeAccess` boolean flag on users table controls Blaze Portal access
- **Routes**: `/blaze/*` for user portal, `/api/admin/blaze/*` for admin management, `/api/blaze/*` for user API
- **Carrier Logic**: Configurable carrier exclusions stored in `blaze_settings.excludedCarriers`

## Previous Updates (Nov 10, 2025)

### Bug Fixes
1. **Drop-Off Package Validation**: Fixed pickup options form to allow "Drop Off" selection without validation errors. Contact name, phone, location, and time fields are now only required when scheduling pickup (not for drop-off).
2. **Dashboard Rate Calculator**: Updated to require and display full addresses (company, street, city, province, phone) for ALL shipment types (package, envelope, pallet), not just freight. This ensures ShipTime API receives complete data for accurate rate calculation.
3. **API Payload**: Modified rate request payload to include fromAddress/toAddress for all shipment types, enabling proper multi-carrier rate aggregation.
4. **Pickup Options Display**: Fixed rate display in pickup options to correctly calculate total from `subtotal + taxAmount` instead of using undefined `totalCharge` property.
5. **Same-Day Pickup**: Fixed pickup date calendar to allow same-day pickup scheduling. Previously, the minimum selectable date was hardcoded to "tomorrow", preventing same-day pickups for all carriers. Now uses "today" as minimum date with proper midnight normalization for reliable date comparison.
6. **Transit Time Display**: Fixed transit time display to show accurate carrier-guaranteed ranges instead of calculated midpoints. Stallion API ranges like "2-3 days" now display as "2-3 business days" instead of being collapsed to "3 business days". This provides customers with accurate delivery expectations matching carrier service guarantees (e.g., Canada Post Expedited's 2-3 day guarantee).

### New Features
1. **Address Data Persistence**: Implemented complete data flow from rate calculator through to order summary. Ship-to address details (street, city, province, postal code, phone) are now automatically pre-filled in the shipment form, eliminating the need for users to re-enter information.
2. **Order Confirmation Checkbox**: Added mandatory confirmation checkbox in the order summary before payment continuation. Users must explicitly confirm all shipping information is correct before proceeding to payment. The "Continue to Payment" button is disabled until checkbox is checked, with both UI and backend validation.
3. **Payment Section Scroll**: Implemented automatic smooth scrolling to Payment Details section when user clicks "Continue to Payment". Previously scrolled to wrong section, now correctly targets the payment form.
4. **Dual-Format Transit Times**: Implemented dual-field transit time system providing both string ranges for UI display and numeric values for API compatibility. Rates now include `transitTime` (e.g., "2-3 business days") for accurate customer-facing display and `deliveryDays` (numeric midpoint) for WooCommerce plugin compatibility and sorting algorithms.

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
- **Blaze Portal**: Dedicated cannabis dispensary shipping portal with carrier filtering to exclude US-based carriers (UPS, FedEx, DHL) that restrict cannabis products. Supports package and envelope shipments only (no pallets for cannabis). Accessed via `/blaze` with user access controlled by `blazeAccess` flag.

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