<?php
/**
 * Plugin Name: GoABLP Shipping
 * Plugin URI: https://goablp.com
 * Description: Real-time shipping rates from GoABLP for Canadian and US shipments. Get competitive rates from Canada Post, Purolator, UPS, FedEx, DHL, and more.
 * Version: 1.0.1
 * Author: ABLP Logistics
 * Author URI: https://ablplogistics.com
 * License: GPL v2 or later
 * License URI: https://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain: goablp-shipping
 * Domain Path: /languages
 * Requires at least: 5.8
 * Requires PHP: 7.4
 * WC requires at least: 6.0
 * WC tested up to: 9.7
 */

if (!defined('ABSPATH')) {
    exit; // Exit if accessed directly
}

/**
 * Check if WooCommerce is active
 */
function goablp_check_woocommerce() {
    if (!class_exists('WooCommerce')) {
        add_action('admin_notices', 'goablp_woocommerce_missing_notice');
        return false;
    }
    return true;
}

/**
 * Display admin notice if WooCommerce is not active
 */
function goablp_woocommerce_missing_notice() {
    ?>
    <div class="notice notice-error">
        <p><?php _e('GoABLP Shipping requires WooCommerce to be installed and active.', 'goablp-shipping'); ?></p>
    </div>
    <?php
}

/**
 * Display setup instructions after plugin activation
 */
function goablp_activation_notice() {
    if (get_transient('goablp_activation_notice')) {
        ?>
        <div class="notice notice-success is-dismissible">
            <p><strong><?php _e('GoABLP Shipping activated!', 'goablp-shipping'); ?></strong></p>
            <p><?php _e('To configure shipping rates:', 'goablp-shipping'); ?></p>
            <ol style="list-style: decimal; margin-left: 20px;">
                <li><?php _e('Go to WooCommerce → Settings → Shipping → Shipping Zones', 'goablp-shipping'); ?></li>
                <li><?php _e('Create or edit a shipping zone', 'goablp-shipping'); ?></li>
                <li><?php _e('Click "Add shipping method" and select "GoABLP Shipping"', 'goablp-shipping'); ?></li>
                <li><?php _e('Configure your API URL and API Key', 'goablp-shipping'); ?></li>
            </ol>
            <p><a href="<?php echo admin_url('admin.php?page=wc-settings&tab=shipping'); ?>" class="button button-primary"><?php _e('Configure Shipping Zones', 'goablp-shipping'); ?></a></p>
        </div>
        <?php
        delete_transient('goablp_activation_notice');
    }
}
add_action('admin_notices', 'goablp_activation_notice');

/**
 * Set activation notice flag
 */
function goablp_activate() {
    set_transient('goablp_activation_notice', true, 60);
}
register_activation_hook(__FILE__, 'goablp_activate');

/**
 * Initialize the shipping method
 */
function goablp_shipping_init() {
    if (!goablp_check_woocommerce()) {
        return;
    }
    
    if (!class_exists('WC_Shipping_Method')) {
        return;
    }
    
    require_once plugin_dir_path(__FILE__) . 'includes/class-wc-goablp-shipping.php';
}
add_action('woocommerce_shipping_init', 'goablp_shipping_init');

/**
 * Register the shipping method with WooCommerce
 */
function add_goablp_shipping_method($methods) {
    $methods['goablp'] = 'WC_GoABLP_Shipping_Method';
    return $methods;
}
add_filter('woocommerce_shipping_methods', 'add_goablp_shipping_method');

/**
 * Add settings link on plugins page
 */
function goablp_add_settings_link($links) {
    $settings_link = '<a href="admin.php?page=wc-settings&tab=shipping">' . __('Setup Shipping Zones', 'goablp-shipping') . '</a>';
    array_unshift($links, $settings_link);
    return $links;
}
add_filter('plugin_action_links_' . plugin_basename(__FILE__), 'goablp_add_settings_link');
