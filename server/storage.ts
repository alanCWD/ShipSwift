import {
  users,
  userActivity,
  shipments,
  clientBranding,
  rateMarkups,
  returns,
  systemSettings,
  type User,
  type InsertUser,
  type UserActivity,
  type InsertUserActivity,
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
import { eq, desc, and, like, or, count, sum, sql } from "drizzle-orm";

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, updates: Partial<User>): Promise<User>;
  
  // Admin user management operations
  getAllUsers(filters?: { search?: string; role?: string; status?: string }): Promise<User[]>;
  getUserStats(): Promise<{
    totalUsers: number;
    activeUsers: number;
    newUsersToday: number;
    totalRevenue: number;
    averageOrderValue: number;
  }>;
  getUserActivity(userId: string): Promise<UserActivity[]>;
  logUserActivity(activity: InsertUserActivity): Promise<void>;
  
  // Shipment operations
  getShipment(id: string): Promise<Shipment | undefined>;
  getShipmentsByUser(userId: string): Promise<Shipment[]>;
  createShipment(shipment: InsertShipment): Promise<Shipment>;
  updateShipment(id: string, updates: Partial<Shipment>): Promise<Shipment>;
  updateShipmentStatus(id: string, status: string): Promise<Shipment>;
  
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
  
  // Additional shipment methods
  getShipmentByTrackingNumber(trackingNumber: string): Promise<Shipment | undefined>;
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

  // Admin user management operations
  async getAllUsers(filters?: { search?: string; role?: string; status?: string }): Promise<User[]> {
    let query = db.select().from(users);
    const conditions: any[] = [];

    if (filters?.search) {
      const searchTerm = `%${filters.search}%`;
      conditions.push(
        or(
          like(users.email, searchTerm),
          like(users.firstName, searchTerm),
          like(users.lastName, searchTerm),
          like(users.companyName, searchTerm)
        )
      );
    }

    if (filters?.role && filters.role !== 'all') {
      conditions.push(eq(users.role, filters.role));
    }

    if (filters?.status && filters.status !== 'all') {
      conditions.push(eq(users.isActive, filters.status === 'active'));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    return await query.orderBy(desc(users.createdAt));
  }

  async getUserStats(): Promise<{
    totalUsers: number;
    activeUsers: number;
    newUsersToday: number;
    totalRevenue: number;
    averageOrderValue: number;
  }> {
    // Get user counts
    const [totalUsersResult] = await db.select({ count: count() }).from(users);
    const [activeUsersResult] = await db
      .select({ count: count() })
      .from(users)
      .where(eq(users.isActive, true));

    // Get new users today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const [newUsersTodayResult] = await db
      .select({ count: count() })
      .from(users)
      .where(sql`${users.createdAt} >= ${today}`);

    // Get revenue stats from shipments
    const [revenueResult] = await db
      .select({
        totalRevenue: sum(shipments.totalCost),
        totalShipments: count(),
      })
      .from(shipments)
      .where(eq(shipments.status, 'delivered'));

    const totalRevenue = parseFloat(revenueResult?.totalRevenue?.toString() || '0');
    const totalShipments = revenueResult?.totalShipments || 0;
    const averageOrderValue = totalShipments > 0 ? totalRevenue / totalShipments : 0;

    return {
      totalUsers: totalUsersResult?.count || 0,
      activeUsers: activeUsersResult?.count || 0,
      newUsersToday: newUsersTodayResult?.count || 0,
      totalRevenue,
      averageOrderValue,
    };
  }

  async getUserActivity(userId: string): Promise<UserActivity[]> {
    return await db
      .select()
      .from(userActivity)
      .where(eq(userActivity.userId, userId))
      .orderBy(desc(userActivity.createdAt))
      .limit(100); // Limit to last 100 activities
  }

  async logUserActivity(activity: InsertUserActivity): Promise<void> {
    await db.insert(userActivity).values(activity);
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

  async updateShipmentStatus(id: string, status: string): Promise<Shipment> {
    const [shipment] = await db
      .update(shipments)
      .set({
        status,
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

  // Additional shipment methods
  async getShipmentByTrackingNumber(trackingNumber: string): Promise<Shipment | undefined> {
    const [shipment] = await db
      .select()
      .from(shipments)
      .where(eq(shipments.trackingNumber, trackingNumber));
    return shipment;
  }
}

export const storage = new DatabaseStorage();
