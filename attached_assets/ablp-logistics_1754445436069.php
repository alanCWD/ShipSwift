<?php
/**
 * Plugin Name:       ABLP Logistics (Working Demo)
 * Description:       A WordPress plugin for a shipping dashboard with programmable rates, powered by the ShipTime API. Provides a front-end portal for customers to log in, get quotes, and create shipments.
 * Version:           2.2.1-gold
 * Author:            CityWide Digital
 * Author URI:        https://citywidedigital.ca
 * Text Domain:       ablp-logistics
 */

if ( ! defined( 'WPINC' ) ) { die; }

define( 'ABLP_VERSION', '2.2.1-gold' );
define( 'ABLP_PLUGIN_DIR', plugin_dir_path( __FILE__ ) );
define( 'ABLP_PLUGIN_URL', plugin_dir_url( __FILE__ ) );

function ablp_activate_plugin() {
    add_role( 'ablp_customer', 'ABLP Customer', [] );
    $portal_page = get_page_by_path('shipping-portal');
    if ( ! $portal_page ) {
        $portal_page_id = wp_insert_post(['post_title' => 'Shipping Portal', 'post_name' => 'shipping-portal', 'post_content' => '[ablp_shipping_portal]', 'post_status' => 'publish', 'post_type' => 'page']);
    } else { $portal_page_id = $portal_page->ID; }
    if ( ! get_page_by_path('shipping-portal/my-shipments') ) {
        wp_insert_post(['post_title' => 'My Shipments', 'post_name' => 'my-shipments', 'post_content' => '[ablp_shipment_history]', 'post_status' => 'publish', 'post_type' => 'page', 'post_parent' => $portal_page_id ]);
    }
    global $wpdb; $table_name = $wpdb->prefix . 'ablp_shipments'; $charset_collate = $wpdb->get_charset_collate(); $sql = "CREATE TABLE $table_name ( id mediumint(9) UNSIGNED NOT NULL AUTO_INCREMENT, created_at datetime NOT NULL DEFAULT CURRENT_TIMESTAMP, user_id bigint(20) UNSIGNED NOT NULL, shiptime_shipment_id varchar(255) NOT NULL, stripe_charge_id varchar(255) NOT NULL, tracking_number varchar(255) NOT NULL, carrier_name varchar(100) NOT NULL, service_name varchar(100) NOT NULL, total_cost decimal(10, 2) NOT NULL, label_url text NOT NULL, PRIMARY KEY (id) ) $charset_collate;"; require_once( ABSPATH . 'wp-admin/includes/upgrade.php' ); dbDelta( $sql );
}
register_activation_hook( __FILE__, 'ablp_activate_plugin' );

function ablp_customer_area_bouncer() {
    if ( ! is_user_logged_in() ) { return; }
    if ( current_user_can('ablp_customer') ) {
        if ( defined('DOING_AJAX') && DOING_AJAX ) { return; }
        if ( is_admin() ) { wp_safe_redirect( home_url('/shipping-portal/') ); exit; }
    }
}
add_action( 'init', 'ablp_customer_area_bouncer', 1 );

require_once ABLP_PLUGIN_DIR . 'includes/class-ablp-logistics.php';
function ablp_run_plugin() {
    $plugin = new ABLP_Logistics();
    $plugin->run();
}
ablp_run_plugin();