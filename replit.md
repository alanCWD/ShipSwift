# Overview

This is a Canadian shipping platform called "ABLP Logistics" that provides multi-carrier rate comparison, shipment management, and branded tracking experiences. The application allows users to compare shipping rates from major Canadian carriers (Canada Post, Purolator, UPS, FedEx, DHL), create shipments with payment processing, and track packages through a white-labeled interface. It features role-based access with customer and admin portals, where admins can configure rate markups and system settings.

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
- **ShipTime API**: Primary shipping carrier integration for rates, label generation, and tracking
- **Multi-Carrier Support**: Canada Post, Purolator, UPS, FedEx, DHL through unified API

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