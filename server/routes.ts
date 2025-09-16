import type { Express } from "express";
import express from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { shiptimeService } from "./services/shiptime";
import { stripeService } from "./services/stripe-service";
import { emailService } from "./services/email-service";
import { requireAuth, requireAdmin } from "./middleware/auth";
import { insertUserSchema, insertShipmentSchema, insertClientBrandingSchema } from "@shared/schema";
import multer from "multer";
import path from "path";
import fs from "fs";
import Stripe from "stripe";

// Configure multer for file uploads
const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      const dir = 'uploads';
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      cb(null, dir);
    },
    filename: (req, file, cb) => {
      const uniqueName = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const extension = path.extname(file.originalname);
      cb(null, uniqueName + extension);
    }
  }),
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/svg+xml'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, and SVG files are allowed.'));
    }
  },
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
});

// Configure multer for CSV uploads
const csvUpload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      const dir = 'uploads';
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      cb(null, dir);
    },
    filename: (req, file, cb) => {
      const uniqueName = Date.now() + '-csv-' + Math.round(Math.random() * 1E9);
      const extension = path.extname(file.originalname);
      cb(null, uniqueName + extension);
    }
  }),
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'text/csv' || file.originalname.toLowerCase().endsWith('.csv')) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only CSV files are allowed.'));
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit for CSV files
  },
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Demo label endpoint
  app.get("/api/demo-label", (req, res) => {
    // Generate a simple SVG shipping label
    const svg = `
      <svg width="400" height="600" xmlns="http://www.w3.org/2000/svg">
        <rect width="400" height="600" fill="white" stroke="black" stroke-width="2"/>
        
        <!-- ShipSwift Logo Area -->
        <rect x="20" y="20" width="360" height="80" fill="#1E40AF" rx="8"/>
        <text x="200" y="50" text-anchor="middle" fill="white" font-family="Arial, sans-serif" font-size="24" font-weight="bold">SHIPSWIFT</text>
        <text x="200" y="75" text-anchor="middle" fill="white" font-family="Arial, sans-serif" font-size="14">Canadian Shipping Solutions</text>
        
        <!-- Demo Label Notice -->
        <rect x="20" y="120" width="360" height="40" fill="#FEF3C7" stroke="#F59E0B" stroke-width="1" rx="4"/>
        <text x="200" y="135" text-anchor="middle" fill="#92400E" font-family="Arial, sans-serif" font-size="12" font-weight="bold">DEMO SHIPPING LABEL</text>
        <text x="200" y="150" text-anchor="middle" fill="#92400E" font-family="Arial, sans-serif" font-size="10">For demonstration purposes only</text>
        
        <!-- From Address -->
        <text x="30" y="190" fill="black" font-family="Arial, sans-serif" font-size="14" font-weight="bold">FROM:</text>
        <text x="30" y="210" fill="black" font-family="Arial, sans-serif" font-size="12">ShipSwift</text>
        <text x="30" y="225" fill="black" font-family="Arial, sans-serif" font-size="12">44322 Yale Rd #3</text>
        <text x="30" y="240" fill="black" font-family="Arial, sans-serif" font-size="12">Chilliwack, BC V2R 4H1</text>
        <text x="30" y="255" fill="black" font-family="Arial, sans-serif" font-size="12">Canada</text>
        
        <!-- To Address -->
        <text x="30" y="290" fill="black" font-family="Arial, sans-serif" font-size="14" font-weight="bold">TO:</text>
        <text x="30" y="310" fill="black" font-family="Arial, sans-serif" font-size="12">Sample Recipient</text>
        <text x="30" y="325" fill="black" font-family="Arial, sans-serif" font-size="12">123 Main Street</text>
        <text x="30" y="340" fill="black" font-family="Arial, sans-serif" font-size="12">Vancouver, BC V6B 1A1</text>
        <text x="30" y="355" fill="black" font-family="Arial, sans-serif" font-size="12">Canada</text>
        
        <!-- Tracking Number -->
        <rect x="20" y="380" width="360" height="60" fill="#F3F4F6" stroke="#9CA3AF" stroke-width="1" rx="4"/>
        <text x="30" y="400" fill="black" font-family="Arial, sans-serif" font-size="12" font-weight="bold">TRACKING NUMBER:</text>
        <text x="200" y="420" text-anchor="middle" fill="black" font-family="monospace" font-size="18" font-weight="bold">DEMO${new Date().getTime().toString().slice(-8)}</text>
        
        <!-- Service Info -->
        <text x="30" y="470" fill="black" font-family="Arial, sans-serif" font-size="12" font-weight="bold">SERVICE: Canada Post Expedited</text>
        <text x="30" y="485" fill="black" font-family="Arial, sans-serif" font-size="12" font-weight="bold">WEIGHT: 1.0 kg</text>
        
        <!-- Barcode placeholder -->
        <rect x="50" y="510" width="300" height="40" fill="black"/>
        <rect x="52" y="512" width="4" height="36" fill="white"/>
        <rect x="58" y="512" width="2" height="36" fill="white"/>
        <rect x="62" y="512" width="4" height="36" fill="white"/>
        <rect x="68" y="512" width="2" height="36" fill="white"/>
        <rect x="72" y="512" width="6" height="36" fill="white"/>
        <!-- Add more barcode lines... -->
        
        <!-- Footer -->
        <text x="200" y="575" text-anchor="middle" fill="#6B7280" font-family="Arial, sans-serif" font-size="10">Generated: ${new Date().toLocaleString()}</text>
      </svg>
    `;
    
    res.setHeader('Content-Type', 'image/svg+xml');
    res.setHeader('Content-Disposition', 'inline; filename="demo-shipping-label.svg"');
    res.send(svg);
  });
  // Auth routes
  app.post("/api/auth/register", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      
      // Check if user already exists
      const existingUser = await storage.getUserByEmail(userData.email);
      if (existingUser) {
        return res.status(400).json({ message: "User already exists with this email" });
      }

      const user = await storage.createUser(userData);
      
      // Automatically log in the user after registration
      (req.session as any).userId = user.id;
      
      // Update login stats
      await storage.updateUser(user.id, {
        lastLoginAt: new Date(),
        loginCount: (user.loginCount || 0) + 1
      });
      
      // Log registration activity
      await storage.logUserActivity({
        userId: user.id,
        activityType: 'registration',
        activityData: { method: 'web_form' },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      });
      
      res.json({ user: { ...user, role: user.role } });
    } catch (error: any) {
      console.error("Registration error:", error);
      res.status(400).json({ message: error.message || "Registration failed" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      const user = await storage.getUserByEmail(email);
      
      if (!user || !user.isActive) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      // Verify password against stored password in database
      if (!password) {
        return res.status(401).json({ message: "Password is required" });
      }
      
      // Check if stored password matches provided password
      if (user.password && user.password !== password) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      // Update login stats
      await storage.updateUser(user.id, {
        lastLoginAt: new Date(),
        loginCount: (user.loginCount || 0) + 1
      });
      
      // Log login activity
      await storage.logUserActivity({
        userId: user.id,
        activityType: 'login',
        activityData: { method: 'email_password' },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      });
      
      // Set session
      console.log('Setting session for user:', user.id);
      (req.session as any).userId = user.id;
      
      // Explicitly save session to ensure it persists
      req.session.save((err) => {
        if (err) {
          console.error('Session save error:', err);
          return res.status(500).json({ message: 'Failed to save session' });
        }
        console.log('Session saved successfully:', {
          sessionId: req.sessionID,
          userId: (req.session as any).userId
        });
        res.json({ user: { ...user, role: user.role } });
      });
    } catch (error: any) {
      console.error("Login error:", error);
      res.status(401).json({ message: "Login failed" });
    }
  });

  // Logout endpoint
  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        console.error("Logout error:", err);
        return res.status(500).json({ message: "Failed to logout" });
      }
      res.json({ message: "Logged out successfully" });
    });
  });

  // Get current user data
  app.get("/api/auth/user", requireAuth, async (req, res) => {
    try {
      const userId = req.user!.id;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      res.json(user);
    } catch (error: any) {
      console.error("Get user error:", error);
      res.status(500).json({ message: "Failed to get user data" });
    }
  });

  // Update user profile
  app.put("/api/auth/profile", requireAuth, async (req, res) => {
    try {
      const userId = req.user!.id;
      const { firstName, lastName, email, companyName } = req.body;
      
      // Validate required fields
      if (!email) {
        return res.status(400).json({ message: "Email is required" });
      }
      
      // Check if email is already taken by another user
      if (email !== req.user!.email) {
        const existingUser = await storage.getUserByEmail(email);
        if (existingUser && existingUser.id !== userId) {
          return res.status(400).json({ message: "Email is already taken" });
        }
      }
      
      const updatedUser = await storage.updateUser(userId, {
        firstName: firstName || null,
        lastName: lastName || null, 
        email,
        companyName: companyName || null,
      });
      
      res.json({ user: updatedUser });
    } catch (error: any) {
      console.error("Update profile error:", error);
      res.status(500).json({ message: "Failed to update profile" });
    }
  });

  // Shipping rates
  app.post("/api/shipping/rates", async (req, res) => {
    const {
      fromCountry,
      fromPostalCode,
      toCountry,
      toPostalCode,
      packageDetails
    } = req.body;

    if (!fromPostalCode || !toPostalCode || !packageDetails) {
      return res.status(400).json({ message: "Missing required shipping parameters" });
    }

    try {
      const rates = await shiptimeService.getRates({
        from: { countryCode: fromCountry, postalCode: fromPostalCode },
        to: { countryCode: toCountry, postalCode: toPostalCode },
        packageDetails
      });

      res.json({ rates });
    } catch (apiError: any) {
      console.error("ShipTime API error, providing sample rates:", apiError);
      
      // Calculate weight-based pricing for realistic rates
      const weight = packageDetails.weight || 1;
      const timestamp = Date.now();
      
      // Provide comprehensive sample rates when API is unavailable
      const sampleRates = [
        // Canada Post Options
        {
          id: `rate_${timestamp}_1`,
          carrierId: 'canadapost',
          carrierName: 'Canada Post',
          serviceName: 'Regular Parcel',
          serviceType: 'regular',
          totalCharge: (12 + (weight * 2.5)).toFixed(2),
          price: (12 + (weight * 2.5)).toFixed(2),
          transitTime: '5-7 business days',
          currency: 'CAD',
          estimatedDelivery: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: `rate_${timestamp}_2`,
          carrierId: 'canadapost',
          carrierName: 'Canada Post',
          serviceName: 'Expedited Parcel',
          serviceType: 'expedited',
          totalCharge: (18 + (weight * 3.2)).toFixed(2),
          price: (18 + (weight * 3.2)).toFixed(2),
          transitTime: '2-3 business days',
          currency: 'CAD',
          estimatedDelivery: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: `rate_${timestamp}_3`,
          carrierId: 'canadapost',
          carrierName: 'Canada Post',
          serviceName: 'Xpresspost',
          serviceType: 'express',
          totalCharge: (25 + (weight * 4.1)).toFixed(2),
          price: (25 + (weight * 4.1)).toFixed(2),
          transitTime: '1-2 business days',
          currency: 'CAD',
          estimatedDelivery: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString()
        },
        
        // Purolator Options
        {
          id: `rate_${timestamp}_4`,
          carrierId: 'purolator',
          carrierName: 'Purolator',
          serviceName: 'Ground',
          serviceType: 'ground',
          totalCharge: (22 + (weight * 3.8)).toFixed(2),
          price: (22 + (weight * 3.8)).toFixed(2),
          transitTime: '1-3 business days',
          currency: 'CAD',
          estimatedDelivery: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: `rate_${timestamp}_5`,
          carrierId: 'purolator',
          carrierName: 'Purolator',
          serviceName: 'Express',
          serviceType: 'express',
          totalCharge: (32 + (weight * 4.5)).toFixed(2),
          price: (32 + (weight * 4.5)).toFixed(2),
          transitTime: '1-2 business days',
          currency: 'CAD',
          estimatedDelivery: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString()
        },
        
        // UPS Options
        {
          id: `rate_${timestamp}_6`,
          carrierId: 'ups',
          carrierName: 'UPS',
          serviceName: 'Ground',
          serviceType: 'ground',
          totalCharge: (24 + (weight * 4.0)).toFixed(2),
          price: (24 + (weight * 4.0)).toFixed(2),
          transitTime: '2-4 business days',
          currency: 'CAD',
          estimatedDelivery: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: `rate_${timestamp}_7`,
          carrierId: 'ups',
          carrierName: 'UPS',
          serviceName: 'Express Saver',
          serviceType: 'express',
          totalCharge: (38 + (weight * 5.2)).toFixed(2),
          price: (38 + (weight * 5.2)).toFixed(2),
          transitTime: '1-2 business days',
          currency: 'CAD',
          estimatedDelivery: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString()
        },
        
        // FedEx Options
        {
          id: `rate_${timestamp}_8`,
          carrierId: 'fedex',
          carrierName: 'FedEx',
          serviceName: 'Ground',
          serviceType: 'ground',
          totalCharge: (26 + (weight * 4.2)).toFixed(2),
          price: (26 + (weight * 4.2)).toFixed(2),
          transitTime: '2-5 business days',
          currency: 'CAD',
          estimatedDelivery: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: `rate_${timestamp}_9`,
          carrierId: 'fedex',
          carrierName: 'FedEx',
          serviceName: 'Express',
          serviceType: 'express',
          totalCharge: (45 + (weight * 6.0)).toFixed(2),
          price: (45 + (weight * 6.0)).toFixed(2),
          transitTime: '1-2 business days',
          currency: 'CAD',
          estimatedDelivery: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString()
        },
        
        // DHL Options  
        {
          id: `rate_${timestamp}_10`,
          carrierId: 'dhl',
          carrierName: 'DHL',
          serviceName: 'Express',
          serviceType: 'express',
          totalCharge: (52 + (weight * 7.5)).toFixed(2),
          price: (52 + (weight * 7.5)).toFixed(2),
          transitTime: '1-2 business days',
          currency: 'CAD',
          estimatedDelivery: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString()
        }
      ];
      
      res.json({
        rates: sampleRates,
        note: 'Sample rates - API credentials need configuration'
      });
    }
  });

  // Create shipment
  app.post("/api/shipments", requireAuth, async (req, res) => {
    try {
      const userId = req.user!.id;
      const { fromAddress, toAddress, packageDetails, ...otherData } = req.body;
      
      // Transform the data to match ShipTime service interface
      const shipmentRequest = {
        rateId: otherData.rateId,
        carrierName: otherData.carrierName,
        serviceName: otherData.serviceName,
        from: {
          countryCode: fromAddress.countryCode,
          postalCode: fromAddress.postalCode,
          streetAddress: fromAddress.streetAddress,
          city: fromAddress.city,
          state: fromAddress.state,
          attention: fromAddress.attention,
          phone: fromAddress.phone,
        },
        to: {
          countryCode: toAddress.countryCode,
          postalCode: toAddress.postalCode,
          streetAddress: toAddress.streetAddress,
          city: toAddress.city,
          state: toAddress.state,
          attention: toAddress.attention,
          phone: toAddress.phone,
        },
        packageDetails: packageDetails || {
          length: 10,
          width: 10,
          height: 10,
          weight: 1
        }
      };
      
      const shipmentData = {
        ...req.body,
        userId,
      };

      // Create shipment with ShipTime (with fallback for demo)
      let shiptimeShipment;
      try {
        shiptimeShipment = await shiptimeService.createShipment(shipmentRequest);
      } catch (shiptimeError) {
        console.log('ShipTime API unavailable, creating demo shipment:', (shiptimeError as Error).message);
        // Provide demo response when ShipTime API is unavailable
        shiptimeShipment = {
          id: `demo_${Date.now()}`,
          trackingNumber: `DEMO${Math.random().toString(36).substr(2, 8).toUpperCase()}`,
          labelUrl: '/api/demo-label', // Use our own demo label endpoint
          carrier: { name: otherData.carrierName },
          service: { name: otherData.serviceName },
        };
      }
      
      // Calculate markup
      const markups = await storage.getRateMarkups();
      const applicableMarkup = markups.find(m => 
        m.carrierName === shipmentData.carrierName &&
        (!m.serviceName || m.serviceName === shipmentData.serviceName)
      );

      let markupCost = 0;
      if (applicableMarkup) {
        if (applicableMarkup.markupType === 'percentage') {
          markupCost = (parseFloat(shipmentData.baseCost) * parseFloat(applicableMarkup.markupValue.toString())) / 100;
        } else {
          markupCost = parseFloat(applicableMarkup.markupValue.toString());
        }
      }

      const totalCost = parseFloat(shipmentData.baseCost) + markupCost;

      // Process payment with Stripe
      const paymentIntent = await stripeService.createPaymentIntent(totalCost * 100); // Convert to cents

      // Save shipment to database
      const shipment = await storage.createShipment({
        ...shipmentData,
        baseCost: shipmentData.baseCost || '0',
        shiptimeShipmentId: shiptimeShipment.id,
        trackingNumber: shiptimeShipment.trackingNumber,
        labelUrl: shiptimeShipment.labelUrl,
        markupCost: markupCost.toString(),
        totalCost: totalCost.toString(),
        stripeChargeId: paymentIntent.id,
      });

      // Log shipment creation activity
      await storage.logUserActivity({
        userId,
        activityType: 'shipment_created',
        activityData: {
          shipmentId: shipment.id,
          carrierName: shipment.carrierName,
          serviceName: shipment.serviceName,
          totalCost: shipment.totalCost,
          trackingNumber: shipment.trackingNumber
        },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      });

      // Send shipment creation notification email
      try {
        const user = await storage.getUser(userId);
        if (user?.email) {
          await emailService.sendShipmentNotification({
            shipmentId: shipment.id,
            trackingNumber: (shipment.trackingNumber || shiptimeShipment.trackingNumber) || '',
            status: shipment.status || 'processing',
            carrierName: shipment.carrierName,
            serviceName: shipment.serviceName,
            customerEmail: user.email,
            customerName: user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : (user.firstName || user.lastName || undefined),
            fromAddress: shipment.fromAddress,
            toAddress: shipment.toAddress,
            totalCost: shipment.totalCost,
            createdAt: shipment.createdAt ? shipment.createdAt.toISOString() : new Date().toISOString(),
          });
        }
      } catch (emailError) {
        console.error("Failed to send shipment notification email:", emailError);
        // Don't fail the shipment creation if email fails
      }

      res.json({ 
        shipment,
        clientSecret: paymentIntent.client_secret,
        labelUrl: shiptimeShipment.labelUrl
      });
    } catch (error: any) {
      console.error("Shipment creation error:", error);
      res.status(500).json({ message: error.message || "Failed to create shipment" });
    }
  });

  // Get user shipments
  app.get("/api/shipments", requireAuth, async (req, res) => {
    try {
      const userId = req.user!.id;
      const shipments = await storage.getShipmentsByUser(userId);
      res.json({ shipments });
    } catch (error: any) {
      console.error("Get shipments error:", error);
      res.status(500).json({ message: "Failed to get shipments" });
    }
  });

  // Track shipment
  app.get("/api/shipments/:id/track", async (req, res) => {
    try {
      const { id } = req.params;
      const shipment = await storage.getShipment(id);
      
      if (!shipment) {
        return res.status(404).json({ message: "Shipment not found" });
      }

      let trackingData = null;
      if (shipment.shiptimeShipmentId) {
        try {
          trackingData = await shiptimeService.trackShipment(shipment.shiptimeShipmentId);
        } catch (trackingError: any) {
          console.error("ShipTime tracking error:", trackingError);
          // Don't fail the whole request if tracking fails - just return shipment data
          trackingData = null;
        }
      }

      res.json({ 
        shipment,
        tracking: trackingData,
      });
    } catch (error: any) {
      console.error("Tracking error:", error);
      res.status(500).json({ message: "Failed to get tracking information" });
    }
  });

  // Cancel shipment
  app.post("/api/shipments/:id/cancel", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.user!.id;
      
      const shipment = await storage.getShipment(id);
      
      if (!shipment) {
        return res.status(404).json({ message: "Shipment not found" });
      }

      // Verify shipment belongs to the user
      if (shipment.userId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }

      // Check if shipment can be cancelled
      if (shipment.status === 'cancelled') {
        return res.status(400).json({ message: "Shipment is already cancelled" });
      }

      if (shipment.status === 'delivered') {
        return res.status(400).json({ message: "Cannot cancel delivered shipment" });
      }

      // Cancel with ShipTime API if shipment ID exists
      if (shipment.shiptimeShipmentId) {
        try {
          await shiptimeService.cancelShipment(shipment.shiptimeShipmentId);
        } catch (shiptimeError: any) {
          console.error("ShipTime cancel error:", shiptimeError);
          // Continue with local cancellation even if ShipTime API fails
        }
      }

      // Update shipment status in database
      const cancelledShipment = await storage.updateShipmentStatus(id, 'cancelled');

      // Send cancellation notification email
      try {
        const user = await storage.getUser(userId);
        if (user?.email) {
          await emailService.sendShipmentNotification({
            shipmentId: cancelledShipment.id,
            trackingNumber: cancelledShipment.trackingNumber || `SW-${cancelledShipment.id.slice(-8)}`,
            status: 'cancelled',
            carrierName: cancelledShipment.carrierName,
            serviceName: cancelledShipment.serviceName,
            customerEmail: user.email,
            customerName: user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : (user.firstName || user.lastName || undefined),
            fromAddress: cancelledShipment.fromAddress,
            toAddress: cancelledShipment.toAddress,
            totalCost: cancelledShipment.totalCost,
            createdAt: cancelledShipment.createdAt ? cancelledShipment.createdAt.toISOString() : new Date().toISOString(),
            updatedAt: cancelledShipment.updatedAt ? cancelledShipment.updatedAt.toISOString() : undefined,
          });
        }
      } catch (emailError) {
        console.error("Failed to send cancellation notification email:", emailError);
        // Don't fail the cancellation if email fails
      }

      res.json({ 
        message: "Shipment cancelled successfully",
        shipment: cancelledShipment
      });
    } catch (error: any) {
      console.error("Cancel shipment error:", error);
      res.status(500).json({ message: "Failed to cancel shipment" });
    }
  });

  // Client branding
  app.get("/api/branding", requireAuth, async (req, res) => {
    try {
      const userId = req.user!.id;
      const branding = await storage.getClientBranding(userId);
      res.json({ branding });
    } catch (error: any) {
      res.status(500).json({ message: "Failed to get branding settings" });
    }
  });

  app.post("/api/branding", requireAuth, async (req, res) => {
    try {
      const userId = req.user!.id;
      const brandingData = { ...req.body, userId };
      
      const existingBranding = await storage.getClientBranding(userId);
      let branding;
      
      if (existingBranding) {
        branding = await storage.updateClientBranding(userId, brandingData);
      } else {
        branding = await storage.createClientBranding(brandingData);
      }
      
      res.json({ branding });
    } catch (error: any) {
      console.error("Branding update error:", error);
      res.status(500).json({ message: "Failed to update branding settings" });
    }
  });

  // Logo upload with enhanced debugging
  app.post("/api/branding/logo", requireAuth, upload.single('logo'), async (req, res) => {
    try {
      console.log('🖼️ Logo upload endpoint hit');
      console.log('📁 Request file object:', req.file ? {
        filename: req.file.filename,
        originalname: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size,
        path: req.file.path,
        destination: req.file.destination
      } : 'NO FILE');
      
      if (!req.file) {
        console.error('❌ No file in request');
        return res.status(400).json({ message: "No file uploaded" });
      }

      const userId = req.user!.id;
      const logoUrl = `/uploads/${req.file.filename}`;
      
      console.log('👤 User ID:', userId);
      console.log('📂 Saving to uploads directory as:', req.file.filename);
      console.log('🔗 Logo URL will be:', logoUrl);
      
      // Check if file actually exists on disk
      const filePath = path.join(process.cwd(), 'uploads', req.file.filename);
      console.log('💾 File path on disk:', filePath);
      console.log('📍 File exists on disk:', fs.existsSync(filePath));
      
      // Ensure branding record exists before updating logo
      const existingBranding = await storage.getClientBranding(userId);
      
      if (!existingBranding) {
        console.log('🆕 No existing branding found, creating default branding record...');
        // Create default branding record with logo
        const defaultBranding = {
          userId,
          companyName: 'Your Company',
          logoUrl,
          primaryColor: '#007bff',
          secondaryColor: '#6c757d',
        };
        
        const branding = await storage.createClientBranding(defaultBranding);
        console.log('✅ Created new branding record:', branding.id);
        console.log('🏷️ New branding logoUrl:', branding.logoUrl);
        res.json({ logoUrl, branding });
      } else {
        console.log('🔄 Updating existing branding record...');
        const updatedBranding = await storage.updateClientBranding(userId, { logoUrl });
        console.log('✅ Updated branding record:', updatedBranding.id);
        console.log('🏷️ Updated branding logoUrl:', updatedBranding.logoUrl);
        res.json({ logoUrl, branding: updatedBranding });
      }
    } catch (error: any) {
      console.error("💥 Logo upload error:", error);
      res.status(500).json({ message: "Failed to upload logo", error: error.message });
    }
  });

  // Public branding endpoint (for white-label tracking pages)
  app.get("/api/branding/public/:userId", async (req, res) => {
    try {
      const { userId } = req.params;
      const branding = await storage.getClientBranding(userId);
      
      if (!branding) {
        return res.status(404).json({ message: "Branding not found" });
      }
      
      // Only return public branding data (no sensitive info)
      const publicBranding = {
        companyName: branding.companyName,
        logoUrl: branding.logoUrl,
        primaryColor: branding.primaryColor,
        secondaryColor: branding.secondaryColor,
        supportEmail: branding.supportEmail,
      };
      
      res.json(publicBranding);
    } catch (error: any) {
      console.error("Public branding error:", error);
      res.status(500).json({ message: "Failed to get branding" });
    }
  });

  // CSV Import endpoint
  app.post("/api/shipments/import-csv", requireAuth, csvUpload.single('csv'), async (req, res) => {
    try {
      const userId = req.user!.id;
      const file = req.file;

      if (!file) {
        return res.status(400).json({ message: "No CSV file provided" });
      }

      // Read and parse CSV file
      const csvContent = fs.readFileSync(file.path, 'utf-8');
      const lines = csvContent.split('\n').filter(line => line.trim());
      
      if (lines.length < 2) {
        // Clean up uploaded file
        fs.unlinkSync(file.path);
        return res.status(400).json({ message: "CSV file must contain at least a header and one data row" });
      }

      const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
      const dataRows = lines.slice(1);

      // Expected CSV format headers
      const requiredHeaders = ['fromAddress', 'toAddress', 'packageLength', 'packageWidth', 'packageHeight', 'packageWeight'];
      const missingHeaders = requiredHeaders.filter(header => !headers.includes(header));
      
      if (missingHeaders.length > 0) {
        // Clean up uploaded file
        fs.unlinkSync(file.path);
        return res.status(400).json({ 
          message: `Missing required columns: ${missingHeaders.join(', ')}`,
          expectedHeaders: requiredHeaders
        });
      }

      const successfulImports = [];
      const failedImports = [];

      // Process each row
      for (let i = 0; i < dataRows.length; i++) {
        try {
          const row = dataRows[i];
          const values = row.split(',').map(v => v.trim().replace(/"/g, ''));
          
          if (values.length !== headers.length) {
            failedImports.push({ row: i + 2, error: 'Column count mismatch' });
            continue;
          }

          const rowData: any = {};
          headers.forEach((header, index) => {
            rowData[header] = values[index];
          });

          // Parse addresses (assuming they're in "City, Province" format)
          const parseAddress = (addressStr: string) => {
            const parts = addressStr.split(',').map(p => p.trim());
            return {
              city: parts[0] || '',
              state: parts[1] || 'BC',
              postalCode: rowData.fromPostalCode || 'V2R4H1',
              countryCode: 'CA'
            };
          };

          const fromAddress = parseAddress(rowData.fromAddress || 'Chilliwack, BC');
          const toAddress = parseAddress(rowData.toAddress);
          
          const packageDetails = {
            length: parseFloat(rowData.packageLength) || 30,
            width: parseFloat(rowData.packageWidth) || 20,
            height: parseFloat(rowData.packageHeight) || 10,
            weight: parseFloat(rowData.packageWeight) || 1
          };

          // Create shipment with sample data
          const shipmentData = {
            userId,
            fromAddress: JSON.stringify(fromAddress),
            toAddress: JSON.stringify(toAddress),
            packageDetails: JSON.stringify(packageDetails),
            carrierName: rowData.carrier || 'Canada Post',
            serviceName: rowData.service || 'Regular',
            trackingNumber: rowData.trackingNumber || `SW-CSV-${Date.now()}-${i}`,
            totalCost: rowData.totalCost || '25.99',
            markupCost: rowData.markupCost || '3.90',
            labelUrl: null,
            status: 'processing'
          };

          const shipment = await storage.createShipment({
            ...shipmentData,
            baseCost: shipmentData.totalCost || '0'
          });
          successfulImports.push({ row: i + 2, shipmentId: shipment.id });

        } catch (error: any) {
          failedImports.push({ row: i + 2, error: error.message || 'Unknown error' });
        }
      }

      // Clean up uploaded file
      fs.unlinkSync(file.path);

      res.json({
        message: "CSV import completed",
        imported: successfulImports.length,
        failed: failedImports.length,
        successfulImports,
        failedImports
      });

    } catch (error: any) {
      console.error("CSV import error:", error);
      // Clean up file if it exists
      if (req.file?.path) {
        try {
          fs.unlinkSync(req.file.path);
        } catch {}
      }
      res.status(500).json({ message: "Failed to import CSV", error: error.message });
    }
  });

  // Public tracking endpoint (for white-label tracking pages)
  app.get("/api/shipments/track/public/:trackingNumber", async (req, res) => {
    try {
      const { trackingNumber } = req.params;
      const shipment = await storage.getShipmentByTrackingNumber(trackingNumber);
      
      if (!shipment) {
        return res.status(404).json({ message: "Shipment not found" });
      }
      
      let trackingData;
      if (shipment.shiptimeShipmentId) {
        trackingData = await shiptimeService.trackShipment(shipment.shiptimeShipmentId);
      }
      
      // Return public tracking data (no sensitive pricing info)
      const publicTrackingData = {
        trackingNumber: shipment.trackingNumber,
        status: trackingData?.status || shipment.status,
        carrier: shipment.carrierName,
        service: shipment.serviceName,
        estimatedDelivery: trackingData?.estimatedDelivery,
        origin: `${shipment.fromCity}, ${shipment.fromProvince}`,
        destination: `${shipment.toCity}, ${shipment.toProvince}`,
        events: trackingData?.events || [],
      };
      
      res.json(publicTrackingData);
    } catch (error: any) {
      console.error("Public tracking error:", error);
      res.status(500).json({ message: "Failed to get tracking information" });
    }
  });

  // Returns
  app.post("/api/returns", requireAuth, async (req, res) => {
    try {
      const userId = req.user!.id;
      const returnData = { ...req.body, userId };
      
      const returnRecord = await storage.createReturn(returnData);
      res.json({ return: returnRecord });
    } catch (error: any) {
      console.error("Return creation error:", error);
      res.status(500).json({ message: "Failed to create return" });
    }
  });

  app.get("/api/returns", requireAuth, async (req, res) => {
    try {
      const userId = req.user!.id;
      const returns = await storage.getReturnsByUser(userId);
      res.json({ returns });
    } catch (error: any) {
      res.status(500).json({ message: "Failed to get returns" });
    }
  });

  // Admin routes
  app.get("/api/admin/rate-markups", requireAdmin, async (req, res) => {
    try {
      const markups = await storage.getRateMarkups();
      res.json({ markups });
    } catch (error: any) {
      res.status(500).json({ message: "Failed to get rate markups" });
    }
  });

  app.post("/api/admin/rate-markups", requireAdmin, async (req, res) => {
    try {
      const markup = await storage.createRateMarkup(req.body);
      res.json({ markup });
    } catch (error: any) {
      console.error("Rate markup creation error:", error);
      res.status(500).json({ message: "Failed to create rate markup" });
    }
  });

  app.put("/api/admin/rate-markups/:id", requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const markup = await storage.updateRateMarkup(id, req.body);
      res.json({ markup });
    } catch (error: any) {
      res.status(500).json({ message: "Failed to update rate markup" });
    }
  });

  app.delete("/api/admin/rate-markups/:id", requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteRateMarkup(id);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ message: "Failed to delete rate markup" });
    }
  });

  // Serve uploaded files
  app.use('/uploads', express.static('uploads'));

  // Admin settings routes
  app.get("/api/admin/settings", requireAuth, async (req, res) => {
    try {
      const userId = req.user!.id;
      const user = await storage.getUser(userId);
      
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      // Get key system settings
      const settings = [
        { 
          key: 'SHIPTIME_USERNAME', 
          value: await storage.getSetting('SHIPTIME_USERNAME') || '',
          description: 'ShipTime API username/email'
        },
        { 
          key: 'SHIPTIME_PASSWORD', 
          value: await storage.getSetting('SHIPTIME_PASSWORD') || '',
          description: 'ShipTime API password'
        },
        { 
          key: 'SHIPTIME_ENVIRONMENT', 
          value: await storage.getSetting('SHIPTIME_ENVIRONMENT') || 'production',
          description: 'ShipTime API environment (production/sandbox)'
        }
      ];

      res.json(settings);
    } catch (error) {
      console.error("Error fetching admin settings:", error);
      res.status(500).json({ message: "Failed to fetch settings" });
    }
  });

  app.post("/api/admin/settings/shiptime-credentials", requireAuth, async (req, res) => {
    try {
      const userId = req.user!.id;
      const user = await storage.getUser(userId);
      
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const { username, password, environment = 'production' } = req.body;
      
      if (!username || !password) {
        return res.status(400).json({ message: "Username and password are required" });
      }

      await storage.setSetting('SHIPTIME_USERNAME', username, userId);
      await storage.setSetting('SHIPTIME_PASSWORD', password, userId);
      await storage.setSetting('SHIPTIME_ENVIRONMENT', environment, userId);

      res.json({ message: "Credentials saved successfully" });
    } catch (error) {
      console.error("Error saving ShipTime credentials:", error);
      res.status(500).json({ message: "Failed to save credentials" });
    }
  });

  app.post("/api/admin/settings/stripe-credentials", requireAuth, async (req, res) => {
    try {
      const userId = req.user!.id;
      const user = await storage.getUser(userId);
      
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const { publishableKey, secretKey, environment = 'test' } = req.body;
      
      if (!publishableKey || !secretKey) {
        return res.status(400).json({ message: "Publishable key and secret key are required" });
      }

      // Validate key formats
      if (!publishableKey.startsWith('pk_')) {
        return res.status(400).json({ message: "Invalid publishable key format (must start with pk_)" });
      }

      if (!secretKey.startsWith('sk_')) {
        return res.status(400).json({ message: "Invalid secret key format (must start with sk_)" });
      }

      await storage.setSetting('STRIPE_PUBLISHABLE_KEY', publishableKey, userId);
      await storage.setSetting('STRIPE_SECRET_KEY', secretKey, userId);
      await storage.setSetting('STRIPE_ENVIRONMENT', environment, userId);

      res.json({ message: "Stripe credentials saved successfully" });
    } catch (error) {
      console.error("Error saving Stripe credentials:", error);
      res.status(500).json({ message: "Failed to save Stripe credentials" });
    }
  });

  // SendGrid credentials
  app.post("/api/admin/settings/sendgrid-credentials", requireAuth, async (req, res) => {
    try {
      const userId = req.user!.id;
      const user = await storage.getUser(userId);
      
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const { apiKey, fromEmail, fromName } = req.body;

      if (!apiKey || !fromEmail || !fromName) {
        return res.status(400).json({ message: "All SendGrid fields are required" });
      }

      if (!apiKey.startsWith('SG.')) {
        return res.status(400).json({ message: "Invalid API key format (must start with SG.)" });
      }

      await storage.setSetting('SENDGRID_API_KEY', apiKey, userId);
      await storage.setSetting('SENDGRID_FROM_EMAIL', fromEmail, userId);
      await storage.setSetting('SENDGRID_FROM_NAME', fromName, userId);

      res.json({ message: "SendGrid credentials saved successfully" });
    } catch (error) {
      console.error("Error saving SendGrid credentials:", error);
      res.status(500).json({ message: "Failed to save SendGrid credentials" });
    }
  });

  app.get("/api/admin/rate-markups", requireAuth, async (req, res) => {
    try {
      const userId = req.user!.id;
      const user = await storage.getUser(userId);
      
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const markups = await storage.getRateMarkups();
      res.json(markups);
    } catch (error) {
      console.error("Error fetching rate markups:", error);
      res.status(500).json({ message: "Failed to fetch rate markups" });
    }
  });

  app.post("/api/admin/rate-markups", requireAuth, async (req, res) => {
    try {
      const userId = req.user!.id;
      const user = await storage.getUser(userId);
      
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const markupData = req.body;
      const markup = await storage.createRateMarkup(markupData);
      res.json(markup);
    } catch (error) {
      console.error("Error creating rate markup:", error);
      res.status(500).json({ message: "Failed to create rate markup" });
    }
  });

  app.delete("/api/admin/rate-markups/:id", requireAuth, async (req, res) => {
    try {
      const userId = req.user!.id;
      const user = await storage.getUser(userId);
      
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      await storage.deleteRateMarkup(req.params.id);
      res.json({ message: "Rate markup deleted successfully" });
    } catch (error) {
      console.error("Error deleting rate markup:", error);
      res.status(500).json({ message: "Failed to delete rate markup" });
    }
  });

  // User Management API endpoints (Admin only)
  app.get("/api/admin/users/stats", requireAdmin, async (req, res) => {
    try {
      const stats = await storage.getUserStats();
      res.json(stats);
    } catch (error: any) {
      console.error("Error fetching user stats:", error);
      res.status(500).json({ message: "Failed to fetch user statistics" });
    }
  });

  app.get("/api/admin/users", requireAdmin, async (req, res) => {
    try {
      const { search, role, status } = req.query;
      const users = await storage.getAllUsers({
        search: search as string,
        role: role as string,
        status: status as string,
      });
      res.json(users);
    } catch (error: any) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.patch("/api/admin/users/:id", requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      
      const user = await storage.updateUser(id, updates);
      res.json(user);
    } catch (error: any) {
      console.error("Error updating user:", error);
      res.status(500).json({ message: "Failed to update user" });
    }
  });

  app.post("/api/admin/users", requireAdmin, async (req, res) => {
    try {
      console.log("Creating user - Request body:", req.body);
      console.log("Creating user - Session info:", {
        sessionId: req.sessionID,
        userId: (req.session as any)?.userId,
        user: req.user
      });
      
      const userData = req.body;
      
      // Check if email already exists
      const existingUser = await storage.getUserByEmail(userData.email);
      if (existingUser) {
        console.log("User creation failed - email exists:", userData.email);
        return res.status(400).json({ message: "Email already exists" });
      }
      
      // Hash the password (in a real app, use bcrypt)
      const hashedPassword = userData.password; // Simplified for demo
      
      const user = await storage.createUser({
        ...userData,
        password: hashedPassword,
      });
      
      console.log("User created successfully:", user.id);
      
      // Log user creation activity
      await storage.logUserActivity({
        userId: user.id,
        activityType: 'user_created',
        activityData: { createdBy: 'admin', role: user.role },
      });
      
      res.json(user);
    } catch (error: any) {
      console.error("Error creating user - Full error:", error);
      console.error("Error creating user - Stack:", error.stack);
      res.status(500).json({ message: "Failed to create user", error: error.message });
    }
  });

  app.post("/api/admin/users/:id/reset-password", requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const { newPassword } = req.body;
      
      if (!newPassword || newPassword.length < 8) {
        return res.status(400).json({ message: "Password must be at least 8 characters" });
      }
      
      // Hash the password (in a real app, use bcrypt)
      const hashedPassword = newPassword; // Simplified for demo
      
      await storage.updateUser(id, { password: hashedPassword });
      
      // Log password reset activity
      await storage.logUserActivity({
        userId: id,
        activityType: 'password_reset',
        activityData: { resetBy: 'admin' },
      });
      
      res.json({ message: "Password reset successfully" });
    } catch (error: any) {
      console.error("Error resetting password:", error);
      res.status(500).json({ message: "Failed to reset password" });
    }
  });

  app.get("/api/admin/users/:id/activity", requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const activity = await storage.getUserActivity(id);
      res.json(activity);
    } catch (error: any) {
      console.error("Error fetching user activity:", error);
      res.status(500).json({ message: "Failed to fetch user activity" });
    }
  });

  app.get("/api/admin/users/:id/stats", requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const stats = await storage.getUserDetailedStats(id);
      res.json(stats);
    } catch (error: any) {
      console.error("Error fetching user stats:", error);
      res.status(500).json({ message: "Failed to fetch user stats" });
    }
  });

  // Rate comparison demonstration endpoint
  app.post("/api/admin/rate-comparison", requireAdmin, async (req, res) => {
    try {
      const { fromAddress, toAddress, packageDetails } = req.body;
      
      // Import the rate comparison service
      const { rateComparisonService } = await import('./services/rate-comparison');
      
      // Get rate comparisons
      const comparisons = await rateComparisonService.compareRates({
        fromAddress,
        toAddress,
        packageDetails
      });

      // Get both negotiated and standard rates separately for detailed view
      const [negotiatedRates, standardRates] = await Promise.all([
        rateComparisonService.getNegotiatedRates({ fromAddress, toAddress, packageDetails }),
        rateComparisonService.getStandardRates({ fromAddress, toAddress, packageDetails })
      ]);

      res.json({
        comparisons,
        negotiatedRates,
        standardRates,
        summary: {
          totalComparisons: comparisons.length,
          averageSavings: comparisons.length > 0 ? 
            comparisons.reduce((sum, comp) => sum + comp.savings, 0) / comparisons.length : 0,
          averageSavingsPercentage: comparisons.length > 0 ?
            comparisons.reduce((sum, comp) => sum + comp.savingsPercentage, 0) / comparisons.length : 0
        }
      });
    } catch (error: any) {
      console.error("Rate comparison error:", error);
      res.status(500).json({ 
        message: "Failed to compare rates",
        error: error.message 
      });
    }
  });

  // Development endpoint to seed sample users (remove in production)
  if (process.env.NODE_ENV === 'development') {
    app.post("/api/admin/seed-users", requireAdmin, async (req, res) => {
      try {
        const sampleUsers = [
          {
            email: 'alice.johnson@acmecorp.com',
            firstName: 'Alice',
            lastName: 'Johnson',
            companyName: 'Acme Corp',
            phone: '604-555-0123',
            role: 'customer',
            totalSpent: '1250.75',
            totalSaved: '89.25',
            shipmentsCount: 12,
            loginCount: 25,
            lastLoginAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
            preferredCarrier: 'Canada Post'
          },
          {
            email: 'bob.smith@techstart.io',
            firstName: 'Bob',
            lastName: 'Smith',
            companyName: 'TechStart Inc',
            phone: '416-555-0456',
            role: 'customer',
            totalSpent: '2840.50',
            totalSaved: '184.30',
            shipmentsCount: 28,
            loginCount: 45,
            lastLoginAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
            preferredCarrier: 'Purolator'
          },
          {
            email: 'sarah.chen@logistics.com',
            firstName: 'Sarah',
            lastName: 'Chen',
            companyName: 'Chen Logistics',
            phone: '778-555-0789',
            role: 'admin',
            totalSpent: '580.25',
            totalSaved: '45.60',
            shipmentsCount: 8,
            loginCount: 15,
            lastLoginAt: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
            preferredCarrier: 'UPS'
          },
          {
            email: 'mike.wilson@smallbiz.ca',
            firstName: 'Mike',
            lastName: 'Wilson',
            companyName: 'Small Biz Solutions',
            phone: '250-555-1234',
            role: 'customer',
            totalSpent: '450.00',
            totalSaved: '32.15',
            shipmentsCount: 6,
            loginCount: 8,
            lastLoginAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 1 week ago
            preferredCarrier: 'FedEx',
            isActive: false,
            notes: 'Account suspended due to payment issues'
          },
          {
            email: 'jennifer.lee@ecommerce.net',
            firstName: 'Jennifer',
            lastName: 'Lee',
            companyName: 'E-Commerce Plus',
            phone: '604-555-9876',
            role: 'customer',
            totalSpent: '3200.80',
            totalSaved: '245.70',
            shipmentsCount: 42,
            loginCount: 67,
            lastLoginAt: new Date(), // Active now
            preferredCarrier: 'DHL'
          }
        ];

        const createdUsers = [];
        
        for (const userData of sampleUsers) {
          try {
            const existingUser = await storage.getUserByEmail(userData.email);
            if (!existingUser) {
              const user = await storage.createUser(userData);
              
              // Log some sample activity for each user
              await storage.logUserActivity({
                userId: user.id,
                activityType: 'login',
                ipAddress: '192.168.1.100',
                userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
              });
              
              await storage.logUserActivity({
                userId: user.id,
                activityType: 'rate_quoted',
                activityData: { carrier: userData.preferredCarrier, service: 'Express' },
                ipAddress: '192.168.1.100',
              });
              
              createdUsers.push(user.email);
            }
          } catch (error) {
            console.error(`Failed to create user ${userData.email}:`, error);
          }
        }

        res.json({ 
          message: `Sample users created successfully`,
          created: createdUsers.length,
          users: createdUsers
        });
      } catch (error: any) {
        console.error("Error seeding users:", error);
        res.status(500).json({ message: "Failed to seed sample users" });
      }
    });
  }

  // Test API connections
  app.post("/api/admin/test-connection/:service", requireAuth, async (req, res) => {
    try {
      const userId = req.user!.id;
      const user = await storage.getUser(userId);
      
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const { service } = req.params;
      
      if (service === 'shiptime') {
        try {
          // Test ShipTime API connection with a simple rates request
          const testRequest = {
            from: {
              countryCode: 'CA',
              postalCode: 'V2R4H1',
              streetAddress: '44322 Yale Rd #3',
              city: 'Chilliwack',
              state: 'BC'
            },
            to: {
              countryCode: 'CA',
              postalCode: 'V6B1A1',
              city: 'Vancouver',
              state: 'BC'
            },
            packageDetails: {
              length: 30,
              width: 20,
              height: 10,
              weight: 1
            }
          };

          // Clear credentials cache and reload from database
          await shiptimeService.clearCredentials();
          await shiptimeService.testConnection();
          
          res.json({ message: "ShipTime API connection successful", status: "connected" });
        } catch (error: any) {
          console.error("ShipTime connection test failed:", error);
          res.status(400).json({ message: `ShipTime API connection failed: ${error.message}` });
        }
      } else if (service === 'stripe') {
        try {
          // Get Stripe credentials from database
          const publishableKey = await storage.getSetting('STRIPE_PUBLISHABLE_KEY');
          const secretKey = await storage.getSetting('STRIPE_SECRET_KEY');
          
          if (!publishableKey || !secretKey) {
            return res.status(400).json({ message: "Stripe credentials not configured" });
          }

          // Test Stripe connection by creating a test payment intent
          const testStripe = new Stripe(secretKey, { apiVersion: "2025-07-30.basil" });
          
          // Create a minimal payment intent to test the connection
          const paymentIntent = await testStripe.paymentIntents.create({
            amount: 100, // $1.00 CAD in cents
            currency: 'cad',
            payment_method_types: ['card'],
            metadata: {
              test: 'connection_test'
            }
          });

          // Immediately cancel the test payment intent
          await testStripe.paymentIntents.cancel(paymentIntent.id);
          
          res.json({ 
            message: "Stripe API connection successful", 
            status: "connected",
            environment: secretKey.includes('_test_') ? 'test' : 'live'
          });
        } catch (error: any) {
          console.error("Stripe connection test failed:", error);
          res.status(400).json({ 
            message: `Stripe API connection failed: ${error.message}`,
            error: error.type || 'unknown_error'
          });
        }
      } else if (service === 'sendgrid') {
        try {
          // Get SendGrid credentials from database
          const apiKey = await storage.getSetting('SENDGRID_API_KEY');
          const fromEmail = await storage.getSetting('SENDGRID_FROM_EMAIL');
          const fromName = await storage.getSetting('SENDGRID_FROM_NAME');
          
          if (!apiKey || !fromEmail || !fromName) {
            return res.status(400).json({ message: "SendGrid credentials not configured" });
          }

          // Test SendGrid connection by sending a test email
          const { MailService } = require('@sendgrid/mail');
          const testMailService = new MailService();
          testMailService.setApiKey(apiKey);

          // Send a test email to verify the API key works
          await testMailService.send({
            to: fromEmail, // Send test email to the configured from email
            from: {
              email: fromEmail,
              name: fromName
            },
            subject: 'ShipSwift - SendGrid API Test',
            text: 'This is a test email to verify your SendGrid API configuration.',
            html: '<p>This is a test email to verify your SendGrid API configuration.</p><p>If you received this email, your SendGrid API is working correctly.</p>'
          });
          
          res.json({ message: "SendGrid API connection successful - test email sent", status: "connected" });
        } catch (error: any) {
          console.error("SendGrid connection test failed:", error);
          res.status(400).json({ message: `SendGrid API connection failed: ${error.message}` });
        }
      } else {
        res.status(400).json({ message: "Unknown service" });
      }
    } catch (error: any) {
      console.error("Connection test error:", error);
      res.status(500).json({ message: "Failed to test connection" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
