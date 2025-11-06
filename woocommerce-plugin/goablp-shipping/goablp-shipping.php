<?php
/**
 * Plugin Name: GoABLP Shipping
 * Plugin URI: https://goablp.com
 * Description: Real-time shipping rates from GoABLP for Canadian and US shipments. Get competitive rates from Canada Post, Purolator, UPS, FedEx, DHL, and more.
 * Version: 1.0.9
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

/**
 * AJAX handler for testing API connection
 */
function goablp_test_connection_ajax() {
    // Verify nonce for security
    if (!check_ajax_referer('goablp_test_connection', 'nonce', false)) {
        wp_send_json_error(array(
            'message' => __('Security check failed. Please refresh the page and try again.', 'goablp-shipping')
        ));
        wp_die();
    }
    
    $api_url = isset($_POST['api_url']) ? sanitize_text_field($_POST['api_url']) : '';
    $api_key = isset($_POST['api_key']) ? sanitize_text_field($_POST['api_key']) : '';
    
    if (empty($api_url) || empty($api_key)) {
        wp_send_json_error(array(
            'message' => __('Please enter both API URL and API Key before testing.', 'goablp-shipping')
        ));
        wp_die();
    }
    
    // Test API connection with a simple request
    $response = wp_remote_post($api_url, array(
        'headers' => array(
            'Authorization' => 'Bearer ' . $api_key,
            'Content-Type' => 'application/json',
        ),
        'body' => json_encode(array(
            'origin' => array('postalCode' => 'M5H2N2'),
            'destination' => array('postalCode' => 'V6B1A1'),
            'package' => array(
                'weight' => 1,
                'length' => 10,
                'width' => 10,
                'height' => 10,
            ),
        )),
        'timeout' => 30,
        'sslverify' => true,
    ));
    
    if (is_wp_error($response)) {
        wp_send_json_error(array(
            'message' => sprintf(__('Connection failed: %s', 'goablp-shipping'), $response->get_error_message())
        ));
        wp_die();
    }
    
    $status_code = wp_remote_retrieve_response_code($response);
    $body = wp_remote_retrieve_body($response);
    
    if ($status_code === 200) {
        $decoded = json_decode($body, true);
        $rate_count = isset($decoded['rates']) ? count($decoded['rates']) : 0;
        wp_send_json_success(array(
            'message' => sprintf(__('✓ Connection successful! API returned %d shipping rates.', 'goablp-shipping'), $rate_count)
        ));
        wp_die();
    } elseif ($status_code === 401) {
        wp_send_json_error(array(
            'message' => __('Authentication failed. Please check your API key.', 'goablp-shipping')
        ));
        wp_die();
    } elseif ($status_code === 429) {
        wp_send_json_error(array(
            'message' => __('Rate limit exceeded. Please wait a moment and try again.', 'goablp-shipping')
        ));
        wp_die();
    } else {
        $error_message = '';
        $decoded_body = json_decode($body, true);
        if (isset($decoded_body['error'])) {
            $error_message = $decoded_body['error'];
        }
        
        wp_send_json_error(array(
            'message' => sprintf(
                __('Connection failed with status %d: %s', 'goablp-shipping'),
                $status_code,
                $error_message ?: $body
            )
        ));
        wp_die();
    }
}
add_action('wp_ajax_goablp_test_connection', 'goablp_test_connection_ajax');
