# GoABLP WooCommerce Plugin - Installation Guide

## Quick Start (5 Minutes)

This guide will help you integrate real-time Canadian shipping rates into your WooCommerce store.

---

## Prerequisites

Before you begin, make sure you have:

- ✅ WordPress 5.8 or higher
- ✅ WooCommerce 6.0 or higher installed and activated
- ✅ PHP 7.4 or higher
- ✅ A GoABLP account (sign up at https://goablp.com)
- ✅ A GoABLP merchant API key

---

## Step 1: Get Your API Key

1. Log in to your GoABLP account at https://goablp.com
2. Navigate to **Admin → Merchant API Keys**
3. Click **"Create API Key"**
4. Give it a name (e.g., "My WooCommerce Store")
5. Copy the generated API key - you'll need it in Step 3
6. Copy your API endpoint URL (e.g., `https://goablp.com/api/v1/merchant/rates`)

**Important**: Keep your API key secure. It's like a password for accessing shipping rates.

---

## Step 2: Install the Plugin

### Option A: Manual Upload (Recommended)

1. Download `goablp-shipping.zip`
2. In WordPress admin, go to **Plugins → Add New → Upload Plugin**
3. Click **Choose File** and select `goablp-shipping.zip`
4. Click **Install Now**
5. Click **Activate Plugin**

### Option B: FTP Upload

1. Extract `goablp-shipping.zip`
2. Upload the `goablp-shipping` folder to `/wp-content/plugins/` via FTP
3. Go to WordPress admin → **Plugins**
4. Find "GoABLP Shipping" and click **Activate**

---

## Step 3: Configure the Plugin

1. Go to **WooCommerce → Settings → Shipping**
2. Click on a shipping zone (or create one if you don't have any)
3. Click **"Add shipping method"**
4. Select **"GoABLP Shipping"** from the dropdown
5. Click **"Add shipping method"**
6. Click on **"GoABLP Shipping"** to configure it

### Required Settings:

| Setting | Value | Example |
|---------|-------|---------|
| **Enabled** | ✅ Checked | Enable this shipping method |
| **Method Title** | Any name | "Canadian Shipping" or "GoABLP Shipping" |
| **API Endpoint URL** | Your GoABLP API URL | `https://goablp.com/api/v1/merchant/rates` |
| **API Key** | Your merchant API key | `goablp_a1b2c3d4e5f6...` |

### Test Your Connection:

1. Click the **"Test API Connection"** button
2. You should see: ✅ **"Connection successful"**
3. If you see an error, double-check your API key and URL

### Optional Settings:

| Setting | Recommended | Purpose |
|---------|------------|---------|
| **Enable Fallback Rate** | ✅ Yes | Shows a backup rate if API fails |
| **Fallback Rate** | $10.00 | What to charge if API is down |
| **Cache Duration** | 15 minutes | Reduces API calls, improves speed |
| **Show Delivery Time** | ✅ Yes | Shows "2-3 business days" to customers |
| **Debug Mode** | ❌ No (unless troubleshooting) | Logs API calls for debugging |

4. Click **"Save changes"**

---

## Step 4: Configure Your Store Settings

For accurate shipping rates, you need to configure:

### A. Store Address

1. Go to **WooCommerce → Settings → General**
2. Enter your complete store address:
   - Address Line 1
   - City
   - Province/State
   - **Postal Code** (required!)
   - Country
3. Save changes

### B. Product Weights

GoABLP needs product weights to calculate accurate rates.

1. Edit each product
2. Scroll to **"Shipping"** section
3. Enter the **Weight** (in kg or lbs - matching your WooCommerce settings)
4. Optionally enter **Dimensions** (Length, Width, Height)
5. Update product

**Pro Tip**: Use WooCommerce bulk edit to set weights for multiple products at once.

---

## Step 5: Test It Out!

1. Add a product to your cart
2. Proceed to checkout
3. Enter a Canadian postal code (e.g., M5H 3M7 for Toronto)
4. You should see multiple shipping options like:
   - ✉️ Canada Post - Expedited Parcel ($15.50) - 2-3 business days
   - 📦 Purolator - Ground ($18.25) - 1-2 business days
   - 🚚 UPS - Standard ($16.75) - 2-5 business days

If rates appear, **congratulations! You're all set!** 🎉

---

## Troubleshooting

### No Rates Showing at Checkout?

**Check these common issues:**

1. **API Key Issues**
   - Is your API key active in GoABLP admin?
   - Did you copy the entire key without spaces?
   - Try the "Test API Connection" button

2. **Store Settings**
   - Is your store postal code set? (WooCommerce → Settings → General)
   - Is it a valid Canadian postal code format? (e.g., V2R 4H1)

3. **Product Configuration**
   - Do your products have weights configured?
   - Are weights greater than 0?

4. **Shipping Zone**
   - Does your shipping zone cover the customer's location?
   - Is GoABLP Shipping enabled in that zone?

5. **Enable Debug Mode**
   - Turn on Debug Mode in plugin settings
   - Go to **WooCommerce → Status → Logs**
   - Select the "goablp-shipping" log file
   - Look for error messages

### Still Having Issues?

Contact GoABLP Support:
- **Email**: support@ablplogistics.com
- **Phone**: 1-800-225-7564
- **Hours**: Monday-Friday, 9 AM - 5 PM PST

Include this information:
- WordPress version
- WooCommerce version
- Error message from debug logs (if any)
- Screenshot of your plugin settings

---

## Advanced Configuration

### Multiple Shipping Zones

You can use GoABLP in multiple shipping zones:

1. **Domestic Zone** (Canada)
   - Add GoABLP Shipping
   - Shows Canadian carrier options

2. **US Zone**
   - Add GoABLP Shipping
   - Shows cross-border rates

3. **International Zone** (optional)
   - Use WooCommerce flat rate or other methods

### Free Shipping

To offer free shipping:

**Option 1: WooCommerce Free Shipping**
1. Add "Free Shipping" method to your zone
2. Set minimum order amount
3. GoABLP rates will show alongside free shipping

**Option 2: Coupons**
- Create a WooCommerce coupon with "Free Shipping" enabled
- Customers can apply it at checkout

### Custom Handling Fees

To add a handling fee to all GoABLP rates:

1. Go to **WooCommerce → Settings → Shipping → Shipping Options**
2. Set a **"Handling Fee"** (e.g., $2.00)
3. This will be added to all shipping methods

---

## Performance Tips

### Optimize Rate Loading

1. **Enable Caching**: Set cache duration to 15-30 minutes
2. **Use Shipping Classes**: Group similar products
3. **Set Default Dimensions**: Configure defaults in plugin settings

### Reduce API Calls

- Caching automatically reduces API calls
- Same origin/destination/weight = uses cached rate
- Cache expires after configured duration

---

## Security Best Practices

1. **Protect Your API Key**
   - Never share it publicly
   - Don't commit it to version control
   - Regenerate if compromised

2. **Keep WordPress Updated**
   - Update WordPress core regularly
   - Update WooCommerce and all plugins
   - Use strong admin passwords

3. **Monitor Usage**
   - Check API key request count in GoABLP admin
   - Watch for unusual activity

---

## Next Steps

- ✅ Set up email notifications for shipments
- ✅ Configure tax settings for your region
- ✅ Test checkout flow with various destinations
- ✅ Train staff on using the system
- ✅ Monitor shipping costs vs. what you charge customers

---

## Support Resources

- **GoABLP Documentation**: https://goablp.com/docs
- **WooCommerce Docs**: https://docs.woocommerce.com
- **WordPress Support**: https://wordpress.org/support

---

**Questions? We're here to help!**

Contact ABLP Logistics:
- Phone: 1-800-225-7564
- Email: support@ablplogistics.com
- Website: https://ablplogistics.com
