import type { Express } from "express";
import express from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { freightcomService } from "./services/freightcom";
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
    try {
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

      const rates = await freightcomService.getRates({
        from: { countryCode: fromCountry, postalCode: fromPostalCode },
        to: { countryCode: toCountry, postalCode: toPostalCode },
        packageDetails
      });

      res.json({ rates });
    } catch (error: any) {
      console.error("Rate calculation error:", error);
      
      // Provide more specific error messages
      if (error.message.includes('authentication failed')) {
        res.status(503).json({ 
          message: "Shipping service authentication error. Please contact support.",
          error: "FREIGHTCOM_AUTH_FAILED"
        });
      } else {
        res.status(500).json({ 
          message: "Unable to calculate shipping rates at this time. Please try again later.",
          error: "RATE_CALCULATION_FAILED"
        });
      }
    }
  });

  // Create shipment
  app.post("/api/shipments", requireAuth, async (req, res) => {
    try {
      const userId = req.user!.id;
      const shipmentData = {
        ...req.body,
        userId,
      };

      // Create shipment with Freightcom
      const freightcomShipment = await freightcomService.createShipment(shipmentData);
      
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
        shiptimeShipmentId: freightcomShipment.id,
        trackingNumber: freightcomShipment.trackingNumber,
        labelUrl: freightcomShipment.labelUrl,
        markupCost: markupCost.toString(),
        totalCost: totalCost.toString(),
        stripeChargeId: paymentIntent.id,
      });

      res.json({ 
        shipment,
        clientSecret: paymentIntent.client_secret,
        labelUrl: freightcomShipment.labelUrl
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

      let trackingData;
      if (shipment.shiptimeShipmentId) {
        trackingData = await freightcomService.trackShipment(shipment.shiptimeShipmentId);
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

  const httpServer = createServer(app);
  return httpServer;
}
