<?php
/**
 * Plugin Name: GoABLP Shipping
 * Plugin URI: https://goablp.com
 * Description: Real-time shipping rates from GoABLP for Canadian and US shipments. Get competitive rates from Canada Post, Purolator, UPS, FedEx, DHL, and more.
 * Version: 1.0.0
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

// Check if WooCommerce is active
if (in_array('woocommerce/woocommerce.php', apply_filters('active_plugins', get_option('active_plugins')))) {
    
    /**
     * Initialize the shipping method
     */
    function goablp_shipping_init() {
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
        $settings_link = '<a href="admin.php?page=wc-settings&tab=shipping&section=goablp">' . __('Settings', 'goablp-shipping') . '</a>';
        array_unshift($links, $settings_link);
        return $links;
    }
    add_filter('plugin_action_links_' . plugin_basename(__FILE__), 'goablp_add_settings_link');
}
