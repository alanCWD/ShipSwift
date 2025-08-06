import {
  users,
  shipments,
  clientBranding,
  rateMarkups,
  returns,
  systemSettings,
  type User,
  type InsertUser,
  type Shipment,
  type InsertShipment,
  type ClientBranding,
  type InsertClientBranding,
  type RateMarkup,
  type InsertRateMarkup,
  type Return,
  type InsertReturn,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and } from "drizzle-orm";

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, updates: Partial<User>): Promise<User>;
  
  // Shipment operations
  getShipment(id: string): Promise<Shipment | undefined>;
  getShipmentsByUser(userId: string): Promise<Shipment[]>;
  createShipment(shipment: InsertShipment): Promise<Shipment>;
  updateShipment(id: string, updates: Partial<Shipment>): Promise<Shipment>;
  
  // Client branding operations
  getClientBranding(userId: string): Promise<ClientBranding | undefined>;
  createClientBranding(branding: InsertClientBranding): Promise<ClientBranding>;
  updateClientBranding(userId: string, updates: Partial<ClientBranding>): Promise<ClientBranding>;
  
  // Rate markup operations (admin only)
  getRateMarkups(): Promise<RateMarkup[]>;
  createRateMarkup(markup: InsertRateMarkup): Promise<RateMarkup>;
  updateRateMarkup(id: string, updates: Partial<RateMarkup>): Promise<RateMarkup>;
  deleteRateMarkup(id: string): Promise<void>;
  
  // Returns operations
  getReturn(id: string): Promise<Return | undefined>;
  getReturnsByUser(userId: string): Promise<Return[]>;
  createReturn(returnData: InsertReturn): Promise<Return>;
  updateReturn(id: string, updates: Partial<Return>): Promise<Return>;
  
  // System settings (alias methods)
  getSetting(key: string): Promise<string | undefined>;
  setSetting(key: string, value: string, updatedBy: string): Promise<void>;
  getSystemSetting(key: string): Promise<string | undefined>;
  setSystemSetting(key: string, value: string, updatedBy: string): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createUser(userData: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values({
        ...userData,
        updatedAt: new Date(),
      })
      .returning();
    return user;
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User> {
    const [user] = await db
      .update(users)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  // Shipment operations
  async getShipment(id: string): Promise<Shipment | undefined> {
    const [shipment] = await db.select().from(shipments).where(eq(shipments.id, id));
    return shipment;
  }

  async getShipmentsByUser(userId: string): Promise<Shipment[]> {
    return await db
      .select()
      .from(shipments)
      .where(eq(shipments.userId, userId))
      .orderBy(desc(shipments.createdAt));
  }

  async createShipment(shipmentData: InsertShipment): Promise<Shipment> {
    const [shipment] = await db
      .insert(shipments)
      .values({
        ...shipmentData,
        updatedAt: new Date(),
      })
      .returning();
    return shipment;
  }

  async updateShipment(id: string, updates: Partial<Shipment>): Promise<Shipment> {
    const [shipment] = await db
      .update(shipments)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(shipments.id, id))
      .returning();
    return shipment;
  }

  // Client branding operations
  async getClientBranding(userId: string): Promise<ClientBranding | undefined> {
    const [branding] = await db
      .select()
      .from(clientBranding)
      .where(eq(clientBranding.userId, userId));
    return branding;
  }

  async createClientBranding(brandingData: InsertClientBranding): Promise<ClientBranding> {
    const [branding] = await db
      .insert(clientBranding)
      .values({
        ...brandingData,
        updatedAt: new Date(),
      })
      .returning();
    return branding;
  }

  async updateClientBranding(userId: string, updates: Partial<ClientBranding>): Promise<ClientBranding> {
    const [branding] = await db
      .update(clientBranding)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(clientBranding.userId, userId))
      .returning();
    return branding;
  }

  // Rate markup operations
  async getRateMarkups(): Promise<RateMarkup[]> {
    return await db.select().from(rateMarkups).where(eq(rateMarkups.isActive, true));
  }

  async createRateMarkup(markupData: InsertRateMarkup): Promise<RateMarkup> {
    const [markup] = await db
      .insert(rateMarkups)
      .values({
        ...markupData,
        updatedAt: new Date(),
      })
      .returning();
    return markup;
  }

  async updateRateMarkup(id: string, updates: Partial<RateMarkup>): Promise<RateMarkup> {
    const [markup] = await db
      .update(rateMarkups)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(rateMarkups.id, id))
      .returning();
    return markup;
  }

  async deleteRateMarkup(id: string): Promise<void> {
    await db
      .update(rateMarkups)
      .set({ isActive: false })
      .where(eq(rateMarkups.id, id));
  }

  // Returns operations
  async getReturn(id: string): Promise<Return | undefined> {
    const [returnData] = await db.select().from(returns).where(eq(returns.id, id));
    return returnData;
  }

  async getReturnsByUser(userId: string): Promise<Return[]> {
    return await db
      .select()
      .from(returns)
      .where(eq(returns.userId, userId))
      .orderBy(desc(returns.createdAt));
  }

  async createReturn(returnData: InsertReturn): Promise<Return> {
    const [returnRecord] = await db
      .insert(returns)
      .values({
        ...returnData,
        updatedAt: new Date(),
      })
      .returning();
    return returnRecord;
  }

  async updateReturn(id: string, updates: Partial<Return>): Promise<Return> {
    const [returnRecord] = await db
      .update(returns)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(returns.id, id))
      .returning();
    return returnRecord;
  }

  // System settings (alias methods for convenience)
  async getSetting(key: string): Promise<string | undefined> {
    return this.getSystemSetting(key);
  }

  async setSetting(key: string, value: string, updatedBy: string): Promise<void> {
    return this.setSystemSetting(key, value, updatedBy);
  }

  async getSystemSetting(key: string): Promise<string | undefined> {
    const [setting] = await db
      .select()
      .from(systemSettings)
      .where(eq(systemSettings.settingKey, key));
    return setting?.settingValue;
  }

  async setSystemSetting(key: string, value: string, updatedBy: string): Promise<void> {
    await db
      .insert(systemSettings)
      .values({
        settingKey: key,
        settingValue: value,
        updatedBy,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: systemSettings.settingKey,
        set: {
          settingValue: value,
          updatedBy,
          updatedAt: new Date(),
        },
      });
  }
}

export const storage = new DatabaseStorage();
