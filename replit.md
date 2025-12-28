# Overview

GoABLP, a product of ABLP Logistics, is a Canadian shipping platform designed to streamline logistics for businesses. It offers multi-carrier rate comparison, efficient shipment management, and customizable branded tracking experiences. The platform allows users to compare rates from major Canadian carriers, create shipments with integrated payment processing, and track packages via a white-labeled interface. It supports role-based access for customers and administrators, with admin features including rate markup configuration, system settings management, and client branding customization. The vision is to provide a comprehensive, user-friendly, and customizable shipping solution that enhances efficiency and brand presence for Canadian businesses.

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
- **Stripe Integration**: `stripeCustomerId` and `defaultPaymentMethodId` on users table; overage tracking fields on shipments table.
- **Blaze Portal**: `blaze_settings` for API config and carrier exclusions, `blaze_connections` for user-dispensary links, `blazeAccess` flag on users table.

## System Design Choices
- **Branding**: Complete rebranding to GoABLP with dynamic logo sizing and sticky header, including client branding customization for white-label experiences.
- **Rate Markup System**: Implemented for applying profit margins with carrier-specific rules and a default 15% markup, displaying detailed rate breakdowns.
- **Shipment Capabilities**: Full support for package (parcel), envelope, and pallet/freight (LTL) shipments. Includes specific handling for envelope and pallet shipments. New "Same Day Local" shipment type with specific filtering and UI.
- **Multi-Source Rate Aggregation**: Integration with ShipTime and Stallion Express APIs for competitive rate comparison, with automatic deduplication and graceful degradation.
- **Payment Processing**: Stripe integration for card payments, Apple Pay, and Google Pay (CAD), ensuring PCI compliance. Mandatory saved payment methods and automatic overage charging.
- **ABLP Admin System**: Dedicated admin panel for internal management, including dynamic ShipTime API credential management and advanced rate markup configuration.
- **Rate Calculation System**: Auto-rate fetching with debounce, graceful API failure handling, and dynamic credential loading.
- **Insurance System**: Comprehensive insurance options.
- **Legal Policies**: Integrated Privacy Policy, Terms of Service, and Cookie Policy.
- **User Management**: Advanced admin panel for user creation, role assignment, password management, activity logging, and user deletion.
- **Canadian Tax Calculation**: Local tax calculation service using official 2025 provincial tax rates (destination-based), supporting GST, HST, and GST+QST.
- **Merchant API System**: Secure API key management for external e-commerce integrations (e.g., WooCommerce, Shopify), providing real-time shipping rates.
- **Blaze Portal**: Dedicated cannabis dispensary shipping portal with carrier filtering to exclude US-based carriers, accessible via `/blaze` with user access control.

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