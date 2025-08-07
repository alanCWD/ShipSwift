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
  email: varchar("email").unique().notNull(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  companyName: varchar("company_name"),
  phone: varchar("phone"),
  address: text("address"),
  city: varchar("city"),
  province: varchar("province"),
  postalCode: varchar("postal_code"),
  country: varchar("country").default('CA'),
  role: varchar("role").default('customer'), // customer, admin
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
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
  packageDetails: jsonb("package_details").notNull(), // dimensions, weight, etc.
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
  primaryColor: varchar("primary_color").default('#1E40AF'),
  secondaryColor: varchar("secondary_color").default('#FFFFFF'),
  websiteUrl: text("website_url"),
  supportEmail: varchar("support_email"),
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

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Shipment = typeof shipments.$inferSelect;
export type InsertShipment = z.infer<typeof insertShipmentSchema>;
export type ClientBranding = typeof clientBranding.$inferSelect;
export type InsertClientBranding = z.infer<typeof insertClientBrandingSchema>;
export type RateMarkup = typeof rateMarkups.$inferSelect;
export type InsertRateMarkup = z.infer<typeof insertRateMarkupSchema>;
export type Return = typeof returns.$inferSelect;
export type InsertReturn = z.infer<typeof insertReturnSchema>;
