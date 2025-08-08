import { MailService } from '@sendgrid/mail';

if (!process.env.SENDGRID_API_KEY) {
  throw new Error("SENDGRID_API_KEY environment variable must be set");
}

const mailService = new MailService();
mailService.setApiKey(process.env.SENDGRID_API_KEY);

interface EmailParams {
  to: string;
  from: string;
  subject: string;
  text?: string;
  html?: string;
}

export interface ShipmentNotificationData {
  shipmentId: string;
  trackingNumber: string;
  status: string;
  carrierName: string;
  serviceName: string;
  customerEmail: string;
  customerName?: string;
  fromAddress: any;
  toAddress: any;
  totalCost: string;
  createdAt: string;
  updatedAt?: string;
}

class EmailService {
  private fromEmail = 'noreply@ablplogistics.ca';

  async sendShipmentNotification(data: ShipmentNotificationData): Promise<boolean> {
    try {
      const subject = this.getSubjectForStatus(data.status, data.trackingNumber);
      const htmlContent = this.generateShipmentEmailHTML(data);
      const textContent = this.generateShipmentEmailText(data);

      await mailService.send({
        to: data.customerEmail,
        from: this.fromEmail,
        subject,
        text: textContent,
        html: htmlContent,
      });

      console.log(`Shipment notification sent for ${data.trackingNumber} (${data.status})`);
      return true;
    } catch (error) {
      console.error('Failed to send shipment notification:', error);
      return false;
    }
  }

  private getSubjectForStatus(status: string, trackingNumber: string): string {
    switch (status) {
      case 'processing':
        return `Your shipment ${trackingNumber} is being processed`;
      case 'shipped':
      case 'in_transit':
        return `Your shipment ${trackingNumber} is on the way`;
      case 'delivered':
        return `Your shipment ${trackingNumber} has been delivered`;
      case 'cancelled':
        return `Your shipment ${trackingNumber} has been cancelled`;
      default:
        return `Update for your shipment ${trackingNumber}`;
    }
  }

  private formatAddress(address: any): string {
    if (typeof address === 'string') {
      try {
        address = JSON.parse(address);
      } catch {
        return 'Address not available';
      }
    }
    
    if (!address || typeof address !== 'object') {
      return 'Address not available';
    }

    const parts = [
      address.streetAddress,
      address.city,
      address.state,
      address.postalCode,
    ].filter(Boolean);
    
    return parts.join(', ') || 'Address not available';
  }

  private generateShipmentEmailHTML(data: ShipmentNotificationData): string {
    const statusMessage = this.getStatusMessage(data.status);
    const nextSteps = this.getNextSteps(data.status);

    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Shipment Update - ${data.trackingNumber}</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #1E40AF; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: white; padding: 30px; border: 1px solid #e5e7eb; }
        .footer { background: #f9fafb; padding: 20px; text-align: center; border-radius: 0 0 8px 8px; color: #6b7280; font-size: 14px; }
        .status-badge { display: inline-block; padding: 8px 16px; border-radius: 20px; font-weight: bold; margin: 15px 0; }
        .status-shipped { background: #fef3c7; color: #92400e; }
        .status-delivered { background: #d1fae5; color: #065f46; }
        .status-processing { background: #dbeafe; color: #1e40af; }
        .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin: 20px 0; }
        .info-item { background: #f9fafb; padding: 15px; border-radius: 6px; }
        .info-label { font-weight: bold; color: #374151; margin-bottom: 5px; }
        .info-value { color: #6b7280; }
        .track-button { display: inline-block; background: #1E40AF; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 20px 0; }
        @media (max-width: 600px) { .info-grid { grid-template-columns: 1fr; } }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1 style="margin: 0; font-size: 24px;">ShipSwift</h1>
            <p style="margin: 10px 0 0 0; opacity: 0.9;">Subsidiary of ABLP Logistics</p>
        </div>
        
        <div class="content">
            <h2 style="color: #1f2937; margin-top: 0;">Shipment Update</h2>
            
            <p>Hello${data.customerName ? ` ${data.customerName}` : ''},</p>
            
            <p>${statusMessage}</p>
            
            <div class="status-badge status-${data.status.replace('_', '-')}">
                ${data.status.replace('_', ' ').toUpperCase()}
            </div>
            
            <div class="info-grid">
                <div class="info-item">
                    <div class="info-label">Tracking Number</div>
                    <div class="info-value">${data.trackingNumber}</div>
                </div>
                <div class="info-item">
                    <div class="info-label">Carrier</div>
                    <div class="info-value">${data.carrierName}</div>
                </div>
                <div class="info-item">
                    <div class="info-label">Service</div>
                    <div class="info-value">${data.serviceName}</div>
                </div>
                <div class="info-item">
                    <div class="info-label">Cost</div>
                    <div class="info-value">$${parseFloat(data.totalCost).toFixed(2)} CAD</div>
                </div>
            </div>
            
            <div style="margin: 25px 0;">
                <h3 style="color: #374151; margin-bottom: 15px;">Shipping Details</h3>
                <div class="info-grid">
                    <div class="info-item">
                        <div class="info-label">From</div>
                        <div class="info-value">${this.formatAddress(data.fromAddress)}</div>
                    </div>
                    <div class="info-item">
                        <div class="info-label">To</div>
                        <div class="info-value">${this.formatAddress(data.toAddress)}</div>
                    </div>
                </div>
            </div>
            
            ${nextSteps}
            
            <div style="text-align: center; margin: 30px 0;">
                <a href="https://ablplogistics.ca/track?id=${data.trackingNumber}" class="track-button">
                    Track Your Shipment
                </a>
            </div>
            
            <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
                If you have any questions about your shipment, please contact our support team.
            </p>
        </div>
        
        <div class="footer">
            <p style="margin: 0 0 10px 0;"><strong>ShipSwift</strong></p>
            <p style="margin: 0;">44322 Yale Rd #3, Chilliwack, BC V2R 4H1</p>
            <p style="margin: 5px 0 0 0;">Phone: (604) 392-3923 | Email: support@ablplogistics.ca</p>
        </div>
    </div>
</body>
</html>
    `;
  }

  private generateShipmentEmailText(data: ShipmentNotificationData): string {
    const statusMessage = this.getStatusMessage(data.status);
    
    return `
ShipSwift - Shipment Update

Hello${data.customerName ? ` ${data.customerName}` : ''},

${statusMessage}

SHIPMENT DETAILS:
- Tracking Number: ${data.trackingNumber}
- Status: ${data.status.replace('_', ' ').toUpperCase()}
- Carrier: ${data.carrierName}
- Service: ${data.serviceName}
- Cost: $${parseFloat(data.totalCost).toFixed(2)} CAD

FROM: ${this.formatAddress(data.fromAddress)}
TO: ${this.formatAddress(data.toAddress)}

Track your shipment online: https://ablplogistics.ca/track?id=${data.trackingNumber}

If you have any questions, please contact us:
Phone: (604) 392-3923
Email: support@ablplogistics.ca

Thank you for choosing ShipSwift!

ShipSwift
Subsidiary of ABLP Logistics
44322 Yale Rd #3, Chilliwack, BC V2R 4H1
    `;
  }

  private getStatusMessage(status: string): string {
    switch (status) {
      case 'processing':
        return 'Your shipment has been created and is being processed by the carrier.';
      case 'shipped':
      case 'in_transit':
        return 'Great news! Your shipment is now on its way to the destination.';
      case 'delivered':
        return 'Your shipment has been successfully delivered!';
      case 'cancelled':
        return 'Your shipment has been cancelled. If this was unexpected, please contact our support team.';
      default:
        return 'Your shipment status has been updated.';
    }
  }

  private getNextSteps(status: string): string {
    switch (status) {
      case 'processing':
        return '<p><strong>Next Steps:</strong> Your shipment will be picked up by the carrier within 1-2 business days.</p>';
      case 'shipped':
      case 'in_transit':
        return '<p><strong>Next Steps:</strong> Your package is on its way! You can track its progress using the tracking number above.</p>';
      case 'delivered':
        return '<p><strong>Delivery Complete:</strong> Your package has been delivered. If you haven\'t received it, please check with neighbors or building management.</p>';
      case 'cancelled':
        return '<p><strong>Next Steps:</strong> If you need to create a new shipment or have questions about this cancellation, please contact our support team.</p>';
      default:
        return '';
    }
  }
}

export const emailService = new EmailService();