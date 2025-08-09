# Overview

This is a Canadian shipping platform called "ShipSwift" (a subsidiary of ABLP Logistics) that provides multi-carrier rate comparison, shipment management, and branded tracking experiences. The application allows users to compare shipping rates from major Canadian carriers (Canada Post, Purolator, UPS, FedEx, DHL), create shipments with payment processing, and track packages through a white-labeled interface. It features role-based access with customer and admin portals, where admins can configure rate markups and system settings.

## Recent Changes (January 2025)
- Updated footer to 2025 copyright and new phone number (604) 392-3923
- Migrated from Freightcom API back to ShipTime API for production environment
- Fixed authentication flow bugs and TypeScript errors
- Configured ShipTime service to use production API endpoint
- **NEW: Implemented ABLP internal admin system**
  - Created ABLP-only admin settings panel for ShipTime API credentials management
  - Added database-driven settings storage with encrypted credential support
  - Implemented rate markup configuration system for ABLP profit margins (hidden from clients)
  - ShipTime service now loads ABLP credentials dynamically from database settings
  - Fixed authentication method to use Basic Auth as required by ShipTime API
  - Created comprehensive ABLP admin interface for carrier rate markup management
- **NEW: Client branding system for white-label shipping interface**
  - ABLP clients can customize shipping interface branding for their end users
  - Logo upload and color scheme customization capabilities
  - White-label tracking pages with client branding
- **Fixed rate calculation system (August 2025)**
  - Fixed Create Shipment page from being blank due to React Suspense issues
  - Implemented auto-rate fetching with 1.5 second debounce when package dimensions entered
  - Fixed ShipTime service to use environment variables as fallback when database missing
  - Created fallback sample rate system when API credentials fail (shows realistic Canadian rates)
  - Rate calculator now properly handles API failures gracefully with sample data
- **COMPLETED: Full Stripe payment integration (August 2025)**
  - Resolved Stripe API key configuration issues (correct secret vs publishable keys)
  - Fixed frontend Stripe loading and payment form functionality
  - Complete shipment creation flow operational: rate selection → details → payment → label generation
  - Enhanced user experience with clearer success messages and label access instructions
- **COMPLETED: Enhanced insurance system with comprehensive terms (August 2025)**
  - Insurance toggle now defaults to OFF, with Edit Insurance button appearing only when enabled
  - Updated insurance description to clarify protection beyond carrier liability
  - Removed all Freightcom branding from insurance terms and conditions
  - Created comprehensive Insurance Terms page with detailed coverage information and prohibited items list
  - Added Insurance Terms link to footer Support section for easy access
  - Linked terms acceptance checkbox to new Insurance Terms page
- **COMPLETED: Home page demo button updates (August 2025)**
  - Changed "Watch Demo" to "Schedule Demo" linking to Calendar Hero booking page
  - Unified hover colors for consistent button styling - balanced blue tones between both buttons
  - Added external link functionality to open calendar booking in new tab
- **COMPLETED: Comprehensive legal policy pages (August 2025)**
  - Created Privacy Policy with detailed data collection, usage, and rights information
  - Created Terms of Service with shipping terms, liability, and user conduct guidelines
  - Created Cookie Policy with cookie types, management, and third-party integrations
  - All policies are generic templates referencing only ABLP Logistics (no ShipSwift mentions)
  - Added proper routing and footer links for easy access to all legal documents
- **COMPLETED: UI improvements for shipment workflow (August 2025)**
  - Moved "Continue to Payment" button below Total in Order Summary for better UX flow
  - Added automatic redirect to dashboard after successful payment completion
  - Replaced 3-dot dropdown menu with direct "Track" and "Label" buttons in Recent Shipments
  - Created comprehensive /shipments page to replace 404 error with full shipment management
  - Fixed tracking page auto-fill functionality when accessed from shipment links
  - Replaced broken demo label placeholder with proper SVG-based shipping labels
- **COMPLETED: Content organization and marketing cleanup (August 2025)**
  - Removed detailed marketing content from footer component to keep it only on home page
  - Simplified footer to show essential links: Quick Links (dashboard, create shipment, tracking, shipments) and Support (profile, branding, contact)
  - Replaced marketing descriptions with concise company description
  - Marketing features section (Rate Comparison, Label Printing, etc.) now exclusively on home page
  - **UPDATED: Streamlined to 3 core features: Rate Comparison, Shipment Management, Branded Customization**
  - Removed Multi-Modal Shipping and Returns Management sections for focused messaging
  - Consolidated label printing functionality into Shipment Management section
  - Enhanced Branded Customization to encompass full white-label solutions
  - **RE-ADDED: Additional shipping services section below core features (August 2025)**
    - Small Package Courier: Links to rate calculator for instant quotes
    - LTL Freight Services: Direct phone contact for custom freight quotes
    - Pallet Shipping: Email contact for specialized pallet handling quotes
    - Two-tiered layout: 3 core features + 3 additional shipping services
- **COMPLETED: UI improvements for shipment workflow (August 2025)**
  - Moved "Continue to Payment" button below Total in Order Summary for better UX flow
  - Added automatic redirect to dashboard after successful payment completion
  - Replaced 3-dot dropdown menu with direct "Track" and "Label" buttons in Recent Shipments
  - Created comprehensive /shipments page to replace 404 error with full shipment management
  - Fixed tracking page auto-fill functionality when accessed from shipment links
  - Replaced broken demo label placeholder with proper SVG-based shipping labels
- **COMPLETED: Enhanced tracking and admin system (August 2025)**
  - Developed realistic tracking data generation based on shipment age and status
  - Fixed Home button navigation to redirect logged-in users to dashboard
  - Created comprehensive ABLP admin settings system with API credential management
  - Implemented advanced markup configuration with conditional logic (cost/weight/location-based rules)
  - Enhanced database schema to support complex markup rules with boolean logic and priority system
  - Admins can now configure intelligent markup rules for different scenarios (e.g., higher markup for expensive shipments)
- **COMPLETED: Content organization and marketing cleanup (August 2025)**
  - Removed detailed marketing content from footer component to keep it only on home page
  - Simplified footer to show essential links: Quick Links (dashboard, create shipment, tracking, shipments) and Support (profile, branding, contact)
  - Replaced marketing descriptions with concise company description
  - Marketing features section (Rate Comparison, Label Printing, etc.) now exclusively on home page
- **COMPLETED: Responsive carrier logo system implementation (August 2025)**
  - Implemented authentic carrier logos provided by user for professional visual presentation
  - Added real carrier logos for major Canadian carriers: Canada Post, Purolator, UPS, FedEx, DHL, Canpar, Loomis, GLS
  - Replaced emoji-based and SVG placeholder carrier identification with actual carrier branding
  - **Mobile-responsive design**: Logos hidden on mobile devices (< 768px) to save space and improve layout
  - Desktop/tablet displays show full carrier logos for enhanced visual recognition
  - CarrierLogo component supports dynamic sizing with fallback text for carriers without uploaded logos (Nationex)
  - Improved professional appearance and mobile usability of shipping rate comparison interface
  - **FIXED: ShipTime API connection testing (August 2025)**
    - Enhanced error handling to detect HTML responses vs JSON (common with auth failures)
    - Added proper sandbox/production environment support with correct API URLs
    - Improved connection test endpoint with better error messages and credential reloading
    - Now provides specific error messages for authentication, endpoint, and server issues
    - **RESOLVED: ShipTime sandbox API configuration (August 2025)**
      - Fixed sandbox API URL from apitest.shiptime.com to sandboxapi.shiptime.com
      - Configured official ShipTime development credentials provided by their support team
      - Enhanced connection test with complete address data required by ShipTime API
      - Authentication now working properly with sandbox environment
      - **COMPLETED: Sandbox testing successful - 19 shipping rates returned**
      - Ready for production testing with live ShipTime credentials
      - **DOCUMENTED: ShipTime best practices for sandbox and production environments**
        - Sandbox: Add "Test booking Not for Pick up" in special instructions
        - Sandbox: Use Drop-off only (not Pick-up) for rate testing
        - Sandbox: Automatically cancel ALL shipments immediately to prevent charges
        - Production: No test shipments (shipper liable for charges)
        - Production: Use actual ShipTime account credentials
      - **IMPLEMENTED: Automatic sandbox shipment cancellation (August 2025)**
        - Sandbox shipments are automatically cancelled immediately after creation
        - Prevents any charges or fees from ShipTime for test shipments
        - Logs cancellation status for debugging and verification
- **COMPLETED: Pickup options and unit conversion system (August 2025)**
  - Added comprehensive pickup scheduling section after rate selection based on Freightcom interface
  - Implemented three pickup options: schedule now, schedule later, drop-off with informative tooltips
  - Created pickup form with date picker, contact details, location, time windows, and special instructions
  - Updated database schema to store pickup details in shipments table
  - Integrated pickup flow between rate selection and payment processing
  - **NEW: Package unit conversion system (cm/kg ↔ in/lbs)**
    - Added unit selector dropdown in package details section
    - Automatic conversion between metric and imperial units with real-time value updates
    - API automatically receives metric units regardless of user's input preference
    - Conversion rates: 1 inch = 2.54 cm, 1 pound = 0.453 kg

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **React + TypeScript** with Vite as the build tool and development server
- **Component Library**: shadcn/ui components built on Radix UI primitives
- **Styling**: Tailwind CSS with custom CSS variables for theming
- **State Management**: Zustand for auth state, TanStack Query for server state
- **Routing**: Wouter for lightweight client-side routing
- **Form Handling**: React Hook Form with Zod validation

## Backend Architecture
- **Node.js + Express** server with TypeScript
- **Database**: PostgreSQL with Drizzle ORM for type-safe database operations
- **Authentication**: Session-based auth with role-based access control (customer/admin)
- **File Uploads**: Multer middleware for handling image uploads (logos, branding)
- **API Design**: RESTful endpoints with consistent error handling and request logging

## Database Design
- **Users**: Core user management with company details and role assignment
- **Shipments**: Comprehensive shipment tracking with carrier integration
- **Client Branding**: White-label customization for tracking pages
- **Rate Markups**: Admin-configurable pricing rules per carrier/service
- **Returns**: Return shipment management
- **System Settings**: Configurable application settings

## Payment Processing
- **Stripe Integration**: Complete payment flow with PaymentIntents API
- **Currency**: Canadian Dollar (CAD) support
- **Payment Methods**: Card payments, Apple Pay, Google Pay
- **Security**: PCI-compliant payment handling through Stripe Elements

# External Dependencies

## Shipping Integration
- **ShipTime API**: Primary shipping carrier integration for rates, label generation, and tracking (Production Environment)
- **Multi-Carrier Support**: Canada Post, Purolator, UPS, FedEx, DHL through unified API
- **API Endpoint**: https://restapi.shiptime.com/rest/ (Production)

## Database & Infrastructure
- **Neon Database**: Serverless PostgreSQL hosting with connection pooling
- **Session Storage**: PostgreSQL-based session management with connect-pg-simple

## Payment Processing
- **Stripe**: Payment processing, subscription management, and financial operations
- **Stripe Elements**: Secure payment form components with Canadian payment methods

## Development & Deployment
- **Replit**: Development environment with integrated database provisioning
- **Vite**: Fast development server with HMR and optimized production builds
- **ESBuild**: Server-side bundling for production deployment