import type { Express } from "express";
import express from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { shiptimeService } from "./services/shiptime";
import { stripeService } from "./services/stripe-service";
import { requireAuth, requireAdmin } from "./middleware/auth";
import { insertUserSchema, insertShipmentSchema, insertClientBrandingSchema } from "@shared/schema";
import multer from "multer";
import path from "path";

// Configure multer for file uploads
const upload = multer({
  dest: 'uploads/',
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

export async function registerRoutes(app: Express): Promise<Server> {
  // Demo label endpoint
  app.get("/api/demo-label", (req, res) => {
    // Generate a simple SVG shipping label
    const svg = `
      <svg width="400" height="600" xmlns="http://www.w3.org/2000/svg">
        <rect width="400" height="600" fill="white" stroke="black" stroke-width="2"/>
        
        <!-- ABLP Logo Area -->
        <rect x="20" y="20" width="360" height="80" fill="#1E40AF" rx="8"/>
        <text x="200" y="50" text-anchor="middle" fill="white" font-family="Arial, sans-serif" font-size="24" font-weight="bold">ABLP LOGISTICS</text>
        <text x="200" y="75" text-anchor="middle" fill="white" font-family="Arial, sans-serif" font-size="14">Canadian Shipping Solutions</text>
        
        <!-- Demo Label Notice -->
        <rect x="20" y="120" width="360" height="40" fill="#FEF3C7" stroke="#F59E0B" stroke-width="1" rx="4"/>
        <text x="200" y="135" text-anchor="middle" fill="#92400E" font-family="Arial, sans-serif" font-size="12" font-weight="bold">DEMO SHIPPING LABEL</text>
        <text x="200" y="150" text-anchor="middle" fill="#92400E" font-family="Arial, sans-serif" font-size="10">For demonstration purposes only</text>
        
        <!-- From Address -->
        <text x="30" y="190" fill="black" font-family="Arial, sans-serif" font-size="14" font-weight="bold">FROM:</text>
        <text x="30" y="210" fill="black" font-family="Arial, sans-serif" font-size="12">ABLP Logistics</text>
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

      // In a real app, you'd verify password here against hashed password
      // For demo purposes, we'll check if password is provided
      if (!password) {
        return res.status(401).json({ message: "Password is required" });
      }
      
      // For demo: accept any non-empty password (in production, verify against hashed password)
      res.json({ user: { ...user, role: user.role } });
    } catch (error: any) {
      console.error("Login error:", error);
      res.status(401).json({ message: "Login failed" });
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
        console.log('ShipTime API unavailable, creating demo shipment:', shiptimeError.message);
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
        shiptimeShipmentId: shiptimeShipment.id,
        trackingNumber: shiptimeShipment.trackingNumber,
        labelUrl: shiptimeShipment.labelUrl,
        markupCost: markupCost.toString(),
        totalCost: totalCost.toString(),
        stripeChargeId: paymentIntent.id,
      });

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

  // Logo upload
  app.post("/api/branding/logo", requireAuth, upload.single('logo'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const userId = req.user!.id;
      const logoUrl = `/uploads/${req.file.filename}`;
      
      await storage.updateClientBranding(userId, { logoUrl });
      res.json({ logoUrl });
    } catch (error: any) {
      console.error("Logo upload error:", error);
      res.status(500).json({ message: "Failed to upload logo" });
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
        backgroundColor: branding.backgroundColor,
        textColor: branding.textColor,
        trackingPageTitle: branding.trackingPageTitle,
        trackingPageDescription: branding.trackingPageDescription,
        footerText: branding.footerText,
        supportEmail: branding.supportEmail,
        supportPhone: branding.supportPhone,
      };
      
      res.json(publicBranding);
    } catch (error: any) {
      console.error("Public branding error:", error);
      res.status(500).json({ message: "Failed to get branding" });
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

      const { username, password } = req.body;
      
      if (!username || !password) {
        return res.status(400).json({ message: "Username and password are required" });
      }

      await storage.setSetting('SHIPTIME_USERNAME', username, userId);
      await storage.setSetting('SHIPTIME_PASSWORD', password, userId);

      res.json({ message: "Credentials saved successfully" });
    } catch (error) {
      console.error("Error saving ShipTime credentials:", error);
      res.status(500).json({ message: "Failed to save credentials" });
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

  const httpServer = createServer(app);
  return httpServer;
}
