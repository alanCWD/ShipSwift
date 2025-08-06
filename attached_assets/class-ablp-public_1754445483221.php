<?php
class ABLP_Public {
    public function __construct() {
        add_action( 'init', [ $this, 'register_shortcode' ] );
        add_action( 'wp_enqueue_scripts', [ $this, 'enqueue_styles_and_scripts' ] );
        add_action( 'admin_post_nopriv_ablp_login', [ $this, 'handle_login' ] );
        add_action( 'admin_post_nopriv_ablp_register', [ $this, 'handle_register' ] );
    }
    public function register_shortcode() {
        add_shortcode( 'ablp_shipping_portal', [ $this, 'render_shipping_portal' ] );
        add_shortcode( 'ablp_express_widget', [ $this, 'render_express_widget' ] );
        add_shortcode( 'ablp_shipment_history', [ $this, 'render_shipment_history' ] );
    }
    public function render_shipping_portal() {
        ob_start();
        if ( is_user_logged_in() && ( current_user_can('ablp_customer') || current_user_can('administrator') ) ) {
            include ABLP_PLUGIN_DIR . 'public/templates/dashboard-public.php';
        } else {
            include ABLP_PLUGIN_DIR . 'public/templates/login-register-form.php';
        }
        return ob_get_clean();
    }
    public function render_express_widget() {
        ob_start();
        include ABLP_PLUGIN_DIR . 'public/templates/widget-express-rates.php';
        return ob_get_clean();
    }
    public function render_shipment_history() {
        if ( ! is_user_logged_in() ) { wp_redirect( home_url('/shipping-portal/') ); exit; }
        global $wpdb;
        $table_name = $wpdb->prefix . 'ablp_shipments';
        $current_user_id = get_current_user_id();
        $shipments = $wpdb->get_results( $wpdb->prepare( "SELECT * FROM $table_name WHERE user_id = %d ORDER BY created_at DESC", $current_user_id ) );
        ob_start();
        include ABLP_PLUGIN_DIR . 'public/templates/shipment-history.php';
        return ob_get_clean();
    }
    public function handle_login() {
        $credentials = [ 'user_login' => $_POST['log'], 'user_password' => $_POST['pwd'], 'remember' => true ];
        $user = wp_signon( $credentials, false );
        if ( is_wp_error( $user ) ) { wp_redirect( home_url( '/shipping-portal?login=failed' ) ); exit; }
        wp_redirect( home_url( '/shipping-portal/' ) );
        exit;
    }
    public function handle_register() {
        $userdata = [ 'user_login' => sanitize_text_field( $_POST['user_name'] ), 'user_email' => sanitize_email( $_POST['user_email'] ), 'user_pass'  => $_POST['user_pass'], 'role' => 'ablp_customer' ];
        $user_id = wp_insert_user( $userdata );
        if ( is_wp_error( $user_id ) ) {
            $error_message = $user_id->get_error_message();
            $redirect_url = home_url( '/shipping-portal?register=failed&reason=' . urlencode( $error_message ) );
            wp_redirect( $redirect_url );
            exit;
        }
        wp_set_auth_cookie( $user_id );
        $redirect_url = home_url( '/shipping-portal/' );
        echo '<p>Registration successful! Redirecting you to your dashboard...</p>';
        echo '<script>window.location.href = "' . esc_url_raw($redirect_url) . '";</script>';
        exit;
    }
    public function enqueue_styles_and_scripts() {
        global $post;
        if ( ! is_a( $post, 'WP_Post' ) ) { return; }
        $is_portal_page = is_page('shipping-portal');
        $is_shipments_page = has_shortcode($post->post_content, 'ablp_shipment_history');
        $has_widget_shortcode = has_shortcode($post->post_content, 'ablp_express_widget');
        if ( $is_portal_page || $is_shipments_page || $has_widget_shortcode ) {
            wp_enqueue_style( 'ablp-public-style', ABLP_PLUGIN_URL . 'public/css/public-style.css', [], ABLP_VERSION );
            wp_enqueue_script( 'stripe-js', 'https://js.stripe.com/v3/', [], false, true );
            wp_enqueue_script( 'ablp-public-js', ABLP_PLUGIN_URL . 'public/js/public-main.js', [ 'jquery', 'stripe-js' ], ABLP_VERSION, true );
            wp_localize_script( 'ablp-public-js', 'ablp_ajax_object', [ 
                'ajax_url' => admin_url( 'admin-ajax.php' ),
                'stripe_publishable_key' => get_option('ablp_stripe_publishable_key')
            ]);
        }
    }
}