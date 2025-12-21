import { storage } from '../storage';
import { stripeService } from './stripe-service';
import type { Shipment } from '@shared/schema';

interface DimensionalWeight {
  length: number;
  width: number;
  height: number;
  weight: number;
}

interface OverageCalculation {
  hasOverage: boolean;
  originalCost: number;
  adjustedCost: number;
  overageAmount: number;
  reason: string;
  details: {
    originalWeight: number;
    actualWeight: number;
    originalDimWeight: number;
    actualDimWeight: number;
    weightDifference: number;
    dimWeightDifference: number;
  };
}

class OverageService {
  private readonly DIM_FACTOR = 5000;
  private readonly OVERAGE_THRESHOLD_PERCENT = 5;
  private readonly MIN_OVERAGE_AMOUNT = 1.00;

  calculateDimensionalWeight(dimensions: { length: number; width: number; height: number }): number {
    return (dimensions.length * dimensions.width * dimensions.height) / this.DIM_FACTOR;
  }

  calculateBillableWeight(weight: number, dimensions: { length: number; width: number; height: number }): number {
    const dimWeight = this.calculateDimensionalWeight(dimensions);
    return Math.max(weight, dimWeight);
  }

  calculateOverage(
    originalData: DimensionalWeight,
    actualData: DimensionalWeight,
    originalCost: number
  ): OverageCalculation {
    const originalBillableWeight = this.calculateBillableWeight(originalData.weight, originalData);
    const actualBillableWeight = this.calculateBillableWeight(actualData.weight, actualData);

    const weightDifference = actualBillableWeight - originalBillableWeight;
    const percentIncrease = (weightDifference / originalBillableWeight) * 100;

    const hasOverage = weightDifference > 0 && percentIncrease > this.OVERAGE_THRESHOLD_PERCENT;

    let adjustedCost = originalCost;
    let overageAmount = 0;

    if (hasOverage) {
      const costMultiplier = actualBillableWeight / originalBillableWeight;
      adjustedCost = originalCost * costMultiplier;
      overageAmount = adjustedCost - originalCost;

      if (overageAmount < this.MIN_OVERAGE_AMOUNT) {
        overageAmount = 0;
      }
    }

    const reason = hasOverage
      ? `Shipment exceeded declared dimensions/weight by ${percentIncrease.toFixed(1)}%`
      : 'No overage - dimensions/weight within threshold';

    return {
      hasOverage: overageAmount > 0,
      originalCost,
      adjustedCost: parseFloat(adjustedCost.toFixed(2)),
      overageAmount: parseFloat(overageAmount.toFixed(2)),
      reason,
      details: {
        originalWeight: originalData.weight,
        actualWeight: actualData.weight,
        originalDimWeight: this.calculateDimensionalWeight(originalData),
        actualDimWeight: this.calculateDimensionalWeight(actualData),
        weightDifference: parseFloat(weightDifference.toFixed(2)),
        dimWeightDifference: parseFloat(
          (this.calculateDimensionalWeight(actualData) - this.calculateDimensionalWeight(originalData)).toFixed(2)
        ),
      },
    };
  }

  async processShipmentOverage(
    shipmentId: string,
    actualWeight: number,
    actualDimensions: { length: number; width: number; height: number }
  ): Promise<{
    success: boolean;
    message: string;
    overageAmount?: number;
    chargeId?: string;
    calculation?: OverageCalculation;
  }> {
    try {
      const shipment = await storage.getShipment(shipmentId);
      if (!shipment) {
        return { success: false, message: 'Shipment not found' };
      }

      const packageDetails = shipment.packageDetails as any;
      if (!packageDetails) {
        return { success: false, message: 'Missing package details on shipment' };
      }

      const originalWeight = parseFloat(shipment.originalWeight || packageDetails.weight || '0');
      const originalDimensions = (shipment.originalDimensions as any) || {
        length: parseFloat(packageDetails.length || '0'),
        width: parseFloat(packageDetails.width || '0'),
        height: parseFloat(packageDetails.height || '0'),
      };

      const originalData: DimensionalWeight = {
        ...originalDimensions,
        weight: originalWeight,
      };

      const actualData: DimensionalWeight = {
        ...actualDimensions,
        weight: actualWeight,
      };

      const originalCost = parseFloat(shipment.totalCost);
      const calculation = this.calculateOverage(originalData, actualData, originalCost);

      await storage.updateShipmentActualDimensions(shipmentId, {
        actualWeight: actualWeight.toString(),
        actualDimensions,
      });

      if (!calculation.hasOverage) {
        return {
          success: true,
          message: 'No overage - dimensions/weight within acceptable threshold',
          calculation,
        };
      }

      await storage.updateShipmentOverage(shipmentId, {
        overageAmount: calculation.overageAmount.toFixed(2),
        overageStatus: 'pending',
      });

      const user = await storage.getUser(shipment.userId);
      if (!user?.stripeCustomerId || !user?.defaultPaymentMethodId) {
        return {
          success: false,
          message: 'Overage detected but user has no saved payment method. Manual collection required.',
          overageAmount: calculation.overageAmount,
          calculation,
        };
      }

      const stripeConfigured = await stripeService.loadCredentials();
      if (!stripeConfigured) {
        return {
          success: false,
          message: 'Payment service not configured. Manual collection required.',
          overageAmount: calculation.overageAmount,
          calculation,
        };
      }

      const chargeResult = await stripeService.chargeOverage(
        shipmentId,
        shipment.userId,
        Math.round(calculation.overageAmount * 100),
        calculation.reason
      );

      if (chargeResult.success) {
        return {
          success: true,
          message: `Overage of $${calculation.overageAmount.toFixed(2)} CAD charged successfully`,
          overageAmount: calculation.overageAmount,
          chargeId: chargeResult.chargeId,
          calculation,
        };
      } else {
        return {
          success: false,
          message: chargeResult.error || 'Failed to charge overage',
          overageAmount: calculation.overageAmount,
          calculation,
        };
      }
    } catch (error: any) {
      console.error('Error processing shipment overage:', error);
      return {
        success: false,
        message: error.message || 'Unexpected error processing overage',
      };
    }
  }

  async getOverageSummary(shipmentId: string): Promise<{
    shipment: Shipment | null;
    hasOverage: boolean;
    overageStatus: string | null;
    overageAmount: string | null;
    canAutoCharge: boolean;
  }> {
    const shipment = await storage.getShipment(shipmentId);
    if (!shipment) {
      return {
        shipment: null,
        hasOverage: false,
        overageStatus: null,
        overageAmount: null,
        canAutoCharge: false,
      };
    }

    const user = await storage.getUser(shipment.userId);
    const canAutoCharge = !!(user?.stripeCustomerId && user?.defaultPaymentMethodId);

    return {
      shipment,
      hasOverage: !!shipment.overageAmount && parseFloat(shipment.overageAmount) > 0,
      overageStatus: shipment.overageStatus,
      overageAmount: shipment.overageAmount,
      canAutoCharge,
    };
  }
}

export const overageService = new OverageService();
