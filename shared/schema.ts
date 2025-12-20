import { sql } from 'drizzle-orm';
import {
  index,
  jsonb,
  pgTable,
  timestamp,
  varchar,
  text,
  decimal,
  boolean,
  integer,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table (required for auth)
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// Users table
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(), // Made nullable - Replit users might not have emails
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"), // Replit profile picture URL
  companyName: varchar("company_name"),
  phone: varchar("phone"),
  address: text("address"),
  city: varchar("city"),
  province: varchar("province"),
  postalCode: varchar("postal_code"),
  country: varchar("country").default('CA'),
  role: varchar("role").default('customer'), // customer, admin, ablp_admin
  password: varchar("password"), // Legacy field - no longer used with Replit Auth
  isActive: boolean("is_active").default(true),
  lastLoginAt: timestamp("last_login_at"),
  loginCount: integer("login_count").default(0),
  totalSpent: decimal("total_spent", { precision: 12, scale: 2 }).default('0.00'),
  totalSaved: decimal("total_saved", { precision: 12, scale: 2 }).default('0.00'),
  shipmentsCount: integer("shipments_count").default(0),
  preferredCarrier: varchar("preferred_carrier"),
  notes: text("notes"), // Admin notes about the user
  // Replit Auth fields
  replitSub: varchar("replit_sub").unique(), // Replit user ID from 'sub' claim - unique but nullable for migration
  authProvider: varchar("auth_provider").default('replit'), // Authentication provider
  // Blaze Portal access
  blazeAccess: boolean("blaze_access").default(false), // Whether user has access to Blaze Portal
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// User activity log for detailed tracking
export const userActivity = pgTable("user_activity", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  activityType: varchar("activity_type").notNull(), // login, logout, shipment_created, rate_quoted, etc.
  activityData: jsonb("activity_data"), // Additional context data
  ipAddress: varchar("ip_address"),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Shipments table
export const shipments = pgTable("shipments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  shiptimeShipmentId: varchar("shiptime_shipment_id"),
  trackingNumber: varchar("tracking_number"),
  carrierName: varchar("carrier_name").notNull(),
  serviceName: varchar("service_name").notNull(),
  fromAddress: jsonb("from_address").notNull(), // Store complete address object
  toAddress: jsonb("to_address").notNull(),
  fromCity: varchar("from_city"), // Legacy compatibility
  fromProvince: varchar("from_province"), // Legacy compatibility
  toCity: varchar("to_city"), // Legacy compatibility
  toProvince: varchar("to_province"), // Legacy compatibility
  shipmentType: varchar("shipment_type").default('package'), // package, pallet, freight
  packageDetails: jsonb("package_details").notNull(), // dimensions, weight, etc. For pallets: palletCount, palletType, isStackable, freightClass
  pickupDetails: jsonb("pickup_details"), // pickup scheduling, contact, location, times
  baseCost: decimal("base_cost", { precision: 10, scale: 2 }).notNull(),
  markupCost: decimal("markup_cost", { precision: 10, scale: 2 }).notNull(),
  totalCost: decimal("total_cost", { precision: 10, scale: 2 }).notNull(),
  currency: varchar("currency").default('CAD'),
  status: varchar("status").default('processing'), // processing, shipped, delivered, returned, cancelled
  labelUrl: text("label_url"),
  stripeChargeId: varchar("stripe_charge_id"),
  customsDeclaration: jsonb("customs_declaration"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Client branding settings
export const clientBranding = pgTable("client_branding", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  companyName: varchar("company_name").notNull(),
  logoUrl: text("logo_url"),
  primaryColor: varchar("primary_color").default('#007bff'),
  secondaryColor: varchar("secondary_color").default('#6c757d'),
  backgroundColor: varchar("background_color").default('#ffffff'),
  textColor: varchar("text_color").default('#000000'),
  customDomain: varchar("custom_domain"),
  trackingPageTitle: varchar("tracking_page_title").default('Track Your Shipment'),
  trackingPageDescription: text("tracking_page_description"),
  footerText: text("footer_text"),
  supportEmail: varchar("support_email"),
  supportPhone: varchar("support_phone"),
  websiteUrl: text("website_url"),
  socialLinks: jsonb("social_links"), // { facebook, twitter, instagram, etc. }
  customTrackingDomain: varchar("custom_tracking_domain"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// System settings (admin only)
export const systemSettings = pgTable("system_settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  settingKey: varchar("setting_key").unique().notNull(),
  settingValue: text("setting_value").notNull(),
  description: text("description"),
  updatedBy: varchar("updated_by").references(() => users.id),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Enhanced rate markups with conditional logic (admin configurable)
export const rateMarkups = pgTable("rate_markups", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  ruleName: varchar("rule_name").notNull(),
  carrierName: varchar("carrier_name").notNull(),
  serviceName: varchar("service_name"), // optional - applies to all services if null
  
  // Conditional logic fields
  minCost: decimal("min_cost", { precision: 10, scale: 2 }), // minimum shipment cost to apply
  maxCost: decimal("max_cost", { precision: 10, scale: 2 }), // maximum shipment cost to apply
  minWeight: decimal("min_weight", { precision: 10, scale: 2 }), // minimum weight in kg
  maxWeight: decimal("max_weight", { precision: 10, scale: 2 }), // maximum weight in kg
  destinationProvince: varchar("destination_province"), // specific province/state
  destinationCountry: varchar("destination_country"), // specific country
  
  // Markup configuration
  markupType: varchar("markup_type").notNull(), // percentage, fixed
  markupValue: decimal("markup_value", { precision: 10, scale: 2 }).notNull(),
  minMarkup: decimal("min_markup", { precision: 10, scale: 2 }), // minimum markup amount
  maxMarkup: decimal("max_markup", { precision: 10, scale: 2 }), // maximum markup amount
  
  // Rule priority (lower number = higher priority)
  priority: integer("priority").default(100),
  description: text("description"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Returns
export const returns = pgTable("returns", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  originalShipmentId: varchar("original_shipment_id").references(() => shipments.id).notNull(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  returnTrackingNumber: varchar("return_tracking_number"),
  reason: text("reason"),
  status: varchar("status").default('requested'), // requested, approved, shipped, received
  returnLabelUrl: text("return_label_url"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Merchant API Keys (for external integrations like WooCommerce)
export const merchantApiKeys = pgTable("merchant_api_keys", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  keyPrefix: varchar("key_prefix").notNull(), // First 12 chars of the key (e.g., "goablp_abc12") for display and prefix-based rate limiting
  hashedApiKey: varchar("hashed_api_key").notNull(), // Bcrypt hash of the API key - never exposed
  name: varchar("name").notNull(), // Friendly name, e.g., "My WooCommerce Store"
  description: text("description"), // Optional description
  isActive: boolean("is_active").default(true),
  lastUsedAt: timestamp("last_used_at"),
  requestCount: integer("request_count").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Blaze Portal Settings (admin configurable)
export const blazeSettings = pgTable("blaze_settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  partnerApiKey: text("partner_api_key"), // Blaze Partner API Key (encrypted/stored securely)
  partnerApiSecret: text("partner_api_secret"), // Blaze Partner API Secret
  // Excluded carriers for cannabis shipments (US-based carriers with restrictions)
  excludedCarriers: text("excluded_carriers").array().default(sql`ARRAY['UPS', 'FedEx', 'DHL']::text[]`),
  // Allowed shipment types (no pallets for cannabis)
  allowedShipmentTypes: text("allowed_shipment_types").array().default(sql`ARRAY['package', 'envelope']::text[]`),
  isActive: boolean("is_active").default(true),
  updatedBy: varchar("updated_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Blaze Dispensary Connections (links dispensaries to GoABLP)
export const blazeConnections = pgTable("blaze_connections", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(), // GoABLP user account
  dispensaryName: varchar("dispensary_name").notNull(),
  dispensaryApiKey: text("dispensary_api_key").notNull(), // Blaze dispensary API key
  dispensaryId: varchar("dispensary_id"), // Blaze dispensary ID
  // Connection status
  isActive: boolean("is_active").default(true),
  lastSyncAt: timestamp("last_sync_at"),
  syncStatus: varchar("sync_status").default('pending'), // pending, connected, error
  syncErrorMessage: text("sync_error_message"),
  // Usage tracking
  totalOrders: integer("total_orders").default(0),
  totalShipments: integer("total_shipments").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Blaze Shipments (tracks shipments from Blaze portal)
export const blazeShipments = pgTable("blaze_shipments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  connectionId: varchar("connection_id").references(() => blazeConnections.id).notNull(),
  shipmentId: varchar("shipment_id").references(() => shipments.id), // Link to main shipments table
  blazeOrderId: varchar("blaze_order_id"), // Original Blaze order ID
  blazeCartId: varchar("blaze_cart_id"), // Blaze cart ID
  customerName: varchar("customer_name"),
  customerEmail: varchar("customer_email"),
  customerPhone: varchar("customer_phone"),
  deliveryAddress: jsonb("delivery_address"),
  orderTotal: decimal("order_total", { precision: 10, scale: 2 }),
  shippingCost: decimal("shipping_cost", { precision: 10, scale: 2 }),
  status: varchar("status").default('pending'), // pending, label_created, shipped, delivered
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Zod schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertShipmentSchema = createInsertSchema(shipments).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertClientBrandingSchema = createInsertSchema(clientBranding).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertRateMarkupSchema = createInsertSchema(rateMarkups).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertReturnSchema = createInsertSchema(returns).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertUserActivitySchema = createInsertSchema(userActivity).omit({
  id: true,
  createdAt: true,
});

export const insertMerchantApiKeySchema = createInsertSchema(merchantApiKeys).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  lastUsedAt: true,
  requestCount: true,
});

export const insertBlazeSettingsSchema = createInsertSchema(blazeSettings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertBlazeConnectionSchema = createInsertSchema(blazeConnections).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  lastSyncAt: true,
  totalOrders: true,
  totalShipments: true,
});

export const insertBlazeShipmentSchema = createInsertSchema(blazeShipments).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type UserActivity = typeof userActivity.$inferSelect;
export type InsertUserActivity = z.infer<typeof insertUserActivitySchema>;
export type Shipment = typeof shipments.$inferSelect;
export type InsertShipment = z.infer<typeof insertShipmentSchema>;
export type ClientBranding = typeof clientBranding.$inferSelect;
export type InsertClientBranding = z.infer<typeof insertClientBrandingSchema>;
export type RateMarkup = typeof rateMarkups.$inferSelect;
export type InsertRateMarkup = z.infer<typeof insertRateMarkupSchema>;
export type Return = typeof returns.$inferSelect;
export type InsertReturn = z.infer<typeof insertReturnSchema>;
export type MerchantApiKey = typeof merchantApiKeys.$inferSelect;
export type InsertMerchantApiKey = z.infer<typeof insertMerchantApiKeySchema>;
export type BlazeSettings = typeof blazeSettings.$inferSelect;
export type InsertBlazeSettings = z.infer<typeof insertBlazeSettingsSchema>;
export type BlazeConnection = typeof blazeConnections.$inferSelect;
export type InsertBlazeConnection = z.infer<typeof insertBlazeConnectionSchema>;
export type BlazeShipment = typeof blazeShipments.$inferSelect;
export type InsertBlazeShipment = z.infer<typeof insertBlazeShipmentSchema>;
