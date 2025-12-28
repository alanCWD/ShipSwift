=== GoABLP Shipping ===
Contributors: ablplogistics
Tags: shipping, canada post, woocommerce, shipping rates, canada, purolator, ups, fedex, dhl
Requires at least: 5.8
Tested up to: 6.4
Requires PHP: 7.4
Stable tag: 1.0.13
License: GPLv2 or later
License URI: http://www.gnu.org/licenses/gpl-2.0.html

Get real-time shipping rates from Canada Post, Purolator, UPS, FedEx, DHL, and more via GoABLP for your WooCommerce store.

== Description ==

GoABLP Shipping integrates your WooCommerce store with GoABLP's multi-carrier shipping platform, providing real-time shipping rates from major Canadian and US carriers.

**Features:**

* **Multi-Carrier Rates**: Compare rates from Canada Post, Purolator, UPS, FedEx, DHL, and more
* **Real-Time Pricing**: Customers see accurate shipping costs at checkout
* **Automatic Calculation**: Rates calculated based on package weight, dimensions, and destination
* **Smart Caching**: Reduces API calls by caching rates for 15 minutes
* **Fallback Rates**: Optional flat rate fallback if API is unavailable
* **Debug Mode**: Detailed logging for troubleshooting
* **Delivery Time Display**: Show estimated delivery times to customers
* **Canadian & US Shipping**: Full support for both Canadian and cross-border shipments

**Supported Carriers:**

* Canada Post
* Purolator
* UPS
* FedEx
* DHL Express
* Canpar
* Loomis
* GLS
* And more via Stallion Express integration

**Requirements:**

* Active GoABLP account (sign up at https://goablp.com)
* GoABLP merchant API key
* WooCommerce 6.0 or higher
* Store postal code configured in WooCommerce settings
* Product weights configured for accurate rates

== Installation ==

1. Upload the `goablp-shipping` folder to `/wp-content/plugins/`
2. Activate the plugin through the 'Plugins' menu in WordPress
3. Go to WooCommerce → Settings → Shipping
4. Click on a Shipping Zone or create a new one
5. Click "Add shipping method" and select "GoABLP Shipping"
6. Configure the following settings:
   * API Endpoint URL: Your GoABLP API URL (e.g., https://your-domain.com/api/v1/merchant/rates)
   * API Key: Your merchant API key from GoABLP admin dashboard
   * Test the connection using the "Test API Connection" button
   * Configure fallback rate (optional)
   * Enable debug mode for troubleshooting (optional)
7. Save changes

== Frequently Asked Questions ==

= Where do I get an API key? =

Log in to your GoABLP account at https://goablp.com, go to Admin → Merchant API Keys, and generate a new API key for your WooCommerce store.

= Why are no rates showing at checkout? =

Common reasons:
* API key is incorrect or not active
* API endpoint URL is wrong
* Product weights are not configured
* Store postal code is not set in WooCommerce settings
* Destination postal code is invalid
* Enable debug mode to see detailed error logs

= How are rates calculated? =

Rates are calculated based on:
* Origin postal code (your store location)
* Destination postal code
* Package weight (sum of all cart items)
* Package dimensions (from product settings or defaults)
* Selected carrier and service level

= Does it work for US destinations? =

Yes! GoABLP supports shipping to both Canadian and US destinations via multiple carriers.

= Can I offer free shipping? =

Yes, you can create a separate WooCommerce shipping method for free shipping or use WooCommerce's built-in free shipping rules alongside GoABLP rates.

= What if the API is down? =

If fallback rates are enabled, customers will see your configured flat rate. Otherwise, no shipping options will be available. We recommend enabling fallback rates for reliability.

= How long are rates cached? =

Rates are cached for 15 minutes by default (configurable in settings). This reduces API calls and improves checkout speed while keeping rates reasonably current.

== Screenshots ==

1. Admin settings panel with API configuration
2. Real-time shipping rates displayed at checkout
3. Multiple carrier options for customers to choose from
4. Debug mode logging for troubleshooting

== Changelog ==

= 1.0.13 - 2025-12-28 =
* New: Same Day Local delivery rates now highlighted with amber styling on checkout
* New: Local delivery rates appear first in the shipping options list
* New: Lightning bolt icon and "Same Day Local" badge for local delivery options
* Added: Frontend CSS and JavaScript for local delivery highlighting
* Improved: Local delivery rates sorted by cost (lowest first)

= 1.0.12 - 2025-12-20 =
* Improved: Settings sync capabilities for dev/production environments
* Fixed: Various bug fixes and stability improvements

= 1.0.11 - 2025-11-06 =
* Fixed: Changed to admin_footer hook for proper inline script rendering
* This version correctly outputs JavaScript in the page footer
* Scripts now appear in browser console and Test API Connection button works

= 1.0.10 - 2025-11-06 =
* Fixed: Complete rewrite using inline JavaScript to bypass external file loading issues
* This version embeds the script directly in the page HTML for maximum compatibility
* Should resolve all script loading issues across different WordPress/WooCommerce configurations

= 1.0.9 - 2025-11-06 =
* Fixed: Aggressive script loading on all admin pages to ensure JavaScript loads
* Added: Cache busting to prevent old cached scripts from loading
* Added: Debug information to help troubleshoot script loading issues

= 1.0.8 - 2025-11-06 =
* Fixed: JavaScript not loading on shipping zone settings modal
* Fixed: Test API Connection button now works properly in all contexts
* Improved: Script enqueuing to support both main settings page and zone modals

= 1.0.7 - 2025-11-06 =
* Added: Test API Connection button with AJAX handler
* Added: External JavaScript file with comprehensive error handling
* Improved: Settings page layout and user experience

= 1.0.0 - 2025-11-01 =
* Initial release

== Upgrade Notice ==

= 1.0.0 =
Initial release of GoABLP Shipping for WooCommerce.

== Support ==

For support, please contact:
* Email: support@ablplogistics.com
* Phone: 1-800-225-7564
* Website: https://goablp.com

== Developer Notes ==

**API Endpoint Format:**

```
POST /api/v1/merchant/rates
Authorization: Bearer YOUR_API_KEY
Content-Type: application/json

{
  "origin": {
    "postalCode": "V2R4H1",
    "country": "CA"
  },
  "destination": {
    "postalCode": "M5H3M7",
    "city": "Toronto",
    "province": "ON",
    "country": "CA"
  },
  "package": {
    "weight": 5.5,
    "length": 30,
    "width": 20,
    "height": 15
  }
}
```

**Response Format:**

```json
{
  "success": true,
  "rates": [
    {
      "service_name": "Canada Post - Expedited Parcel",
      "service_code": "EXPEDITED_PARCEL",
      "total_price": "25.50",
      "currency": "CAD",
      "delivery_days": "2-3",
      "description": "Estimated 2-3 business days",
      "carrier": "Canada Post"
    }
  ]
}
```
