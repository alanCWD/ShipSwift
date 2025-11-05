# GoABLP Shipping for WooCommerce

Real-time multi-carrier shipping rates for Canadian e-commerce stores.

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![WooCommerce](https://img.shields.io/badge/WooCommerce-6.0+-green)
![WordPress](https://img.shields.io/badge/WordPress-5.8+-green)
![PHP](https://img.shields.io/badge/PHP-7.4+-purple)

## Overview

GoABLP Shipping integrates your WooCommerce store with the GoABLP platform, providing real-time shipping rates from major Canadian and US carriers including:

- 📬 **Canada Post**
- 📦 **Purolator**
- 🚚 **UPS**
- ✈️ **FedEx**
- 🌍 **DHL Express**
- 📪 **Canpar**
- 🚛 **Loomis**
- And more...

## Features

✅ **Real-Time Rates** - Customers see accurate shipping costs at checkout  
✅ **Multi-Carrier** - Compare rates from 10+ carriers automatically  
✅ **Smart Caching** - 15-minute rate caching reduces API calls  
✅ **Fallback Rates** - Optional backup rates if API is unavailable  
✅ **Delivery Times** - Show estimated delivery days to customers  
✅ **Canadian & US** - Full support for domestic and cross-border  
✅ **Debug Mode** - Detailed logging for troubleshooting  
✅ **Easy Setup** - 5-minute installation process  

## Requirements

- WordPress 5.8+
- WooCommerce 6.0+
- PHP 7.4+
- GoABLP merchant account
- GoABLP API key

## Installation

See [INSTALLATION.md](./INSTALLATION.md) for detailed setup instructions.

### Quick Install

1. Upload `goablp-shipping.zip` to WordPress
2. Activate the plugin
3. Get your API key from GoABLP admin dashboard
4. Configure in WooCommerce → Settings → Shipping
5. Test and go live!

## Configuration

### Required Settings

| Setting | Description |
|---------|-------------|
| **API Endpoint URL** | Your GoABLP API URL |
| **API Key** | Merchant API key from GoABLP |
| **Store Postal Code** | Set in WooCommerce General Settings |
| **Product Weights** | Configure on each product |

### Optional Settings

| Setting | Default | Purpose |
|---------|---------|---------|
| Fallback Rate | Enabled | Shows backup rate if API fails |
| Cache Duration | 15 min | How long to cache rates |
| Show Delivery Time | Yes | Display "2-3 days" to customers |
| Debug Mode | No | Enable logging for troubleshooting |

## Usage

Once configured, the plugin automatically:

1. Detects when customer enters shipping address
2. Sends request to GoABLP API with package details
3. Receives rates from multiple carriers
4. Displays options at checkout sorted by price
5. Caches rates for 15 minutes for performance

### Customer Experience

At checkout, customers see:

```
Shipping Options:
⚡ Canada Post - Expedited ($15.50) - 2-3 business days
📦 Purolator - Ground ($18.25) - 1-2 business days
🚚 UPS - Standard ($16.75) - 2-5 business days
```

## API Integration

### Request Format

```json
POST /api/v1/merchant/rates
Authorization: Bearer YOUR_API_KEY

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

### Response Format

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

## Troubleshooting

### No Rates Showing?

**Common fixes:**

1. ✅ Verify API key is active in GoABLP admin
2. ✅ Check store postal code is set (WooCommerce → Settings)
3. ✅ Ensure products have weights configured
4. ✅ Verify shipping zone covers customer's location
5. ✅ Enable debug mode and check logs

### Debug Logs

1. Enable Debug Mode in plugin settings
2. Go to WooCommerce → Status → Logs
3. Select "goablp-shipping" log
4. Review API requests and responses

### Test Connection

Use the built-in connection test:

1. Go to plugin settings
2. Click "Test API Connection"
3. Should see: ✅ "Connection successful"

## Support

### GoABLP Support

- **Phone**: 1-800-225-7564
- **Email**: support@ablplogistics.com
- **Hours**: Mon-Fri 9 AM - 5 PM PST

### Documentation

- [Installation Guide](./INSTALLATION.md)
- [GoABLP Docs](https://goablp.com/docs)
- [WooCommerce Docs](https://docs.woocommerce.com)

## File Structure

```
goablp-shipping/
├── goablp-shipping.php          # Main plugin file
├── includes/
│   └── class-wc-goablp-shipping.php  # Shipping method class
├── readme.txt                   # WordPress.org readme
└── languages/                   # Translation files
```

## Development

### Testing Locally

1. Set up local WordPress with WooCommerce
2. Clone this repository to `wp-content/plugins/`
3. Activate the plugin
4. Configure with test API credentials
5. Test with various shipping scenarios

### Hooks & Filters

```php
// Modify API request before sending
add_filter('goablp_api_request_data', function($data) {
    // Customize request data
    return $data;
});

// Modify rates before displaying
add_filter('goablp_shipping_rates', function($rates) {
    // Customize rates
    return $rates;
});
```

## Changelog

### 1.0.0 - 2025-11-06
- Initial release
- Multi-carrier rate integration
- Smart caching system
- Fallback rate support
- Debug logging
- Delivery time display
- Full Canadian & US support

## License

GPL v2 or later

## Credits

Developed by **ABLP Logistics**  
Website: https://ablplogistics.com

---

**Ready to get started?** See [INSTALLATION.md](./INSTALLATION.md) for setup instructions!
