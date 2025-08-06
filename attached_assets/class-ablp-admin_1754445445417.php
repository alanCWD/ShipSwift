<?php
class ABLP_Admin {

    public function __construct() {
        add_action( 'admin_menu', [ $this, 'add_admin_menu' ] );
        add_action( 'admin_init', [ $this, 'register_settings' ] );
        add_action( 'admin_enqueue_scripts', [ $this, 'enqueue_styles_and_scripts' ] );
    }

    public function add_admin_menu() {
        add_menu_page('ABLP Logistics', 'ABLP Logistics', 'manage_options', 'ablp-dashboard', [ $this, 'render_dashboard_page' ], 'dashicons-delivery', 25);
        add_submenu_page('ablp-dashboard', 'Settings', 'Settings', 'manage_options', 'ablp-settings', [ $this, 'render_settings_page' ]);
    }

    public function register_settings() {
        register_setting( 'ablp_settings_group', 'ablp_shiptime_username' );
        register_setting( 'ablp_settings_group', 'ablp_shiptime_password' );
        register_setting( 'ablp_settings_group', 'ablp_shiptime_environment' );
        register_setting( 'ablp_settings_group', 'ablp_rate_surcharge' );
        register_setting( 'ablp_settings_group', 'ablp_stripe_secret_key' );
        register_setting( 'ablp_settings_group', 'ablp_stripe_publishable_key' );
    }

    public function render_dashboard_page() {
        require_once ABLP_PLUGIN_DIR . 'admin/templates/dashboard-template.php';
    }

    public function render_settings_page() {
        ?>
        <div class="wrap">
            <h1>ABLP Logistics Settings</h1>
            <form method="post" action="options.php">
                <?php settings_fields( 'ablp_settings_group' ); do_settings_sections( 'ablp_settings_group' ); ?>
                <table class="form-table">
                    <tr valign="top"><th scope="row" colspan="2"><h3>ShipTime Settings</h3></th></tr>
                    <tr valign="top">
                        <th scope="row">API Environment</th>
                        <td>
                            <select name="ablp_shiptime_environment">
                                <option value="sandbox" <?php selected( get_option('ablp_shiptime_environment'), 'sandbox' ); ?>>Sandbox (for Testing)</option>
                                <option value="production" <?php selected( get_option('ablp_shiptime_environment'), 'production' ); ?>>Production (for Live Shipments)</option>
                            </select>
                            <p class="description">Use Sandbox for development. You must get separate Sandbox credentials from ShipTime support.</p>
                        </td>
                    </tr>
                    <tr valign="top">
                        <th scope="row">ShipTime API Username/Email</th>
                        <td><input type="text" name="ablp_shiptime_username" value="<?php echo esc_attr( get_option('ablp_shiptime_username') ); ?>" class="regular-text"/></td>
                    </tr>
                    <tr valign="top">
                        <th scope="row">ShipTime API Password</th>
                        <td><input type="password" name="ablp_shiptime_password" value="<?php echo esc_attr( get_option('ablp_shiptime_password') ); ?>" class="regular-text"/></td>
                    </tr>
                    <tr valign="top">
                        <th scope="row">Rate Surcharge (%)</th>
                        <td>
                            <input type="number" name="ablp_rate_surcharge" value="<?php echo esc_attr( get_option('ablp_rate_surcharge', '2') ); ?>" class="small-text" step="0.1" min="0"/>
                            <p class="description">Enter a percentage to add to the base shipping rate. E.g., enter '2' for a 2% surcharge.</p>
                        </td>
                    </tr>
                    <tr valign="top"><th scope="row" colspan="2"><h3>Stripe Settings (for Demo)</h3></th></tr>
                    <tr valign="top">
                        <th scope="row">Stripe Publishable Key</th>
                        <td><input type="text" name="ablp_stripe_publishable_key" value="<?php echo esc_attr( get_option('ablp_stripe_publishable_key') ); ?>" class="regular-text"/></td>
                    </tr>
                    <tr valign="top">
                        <th scope="row">Stripe Secret Key</th>
                        <td><input type="text" name="ablp_stripe_secret_key" value="<?php echo esc_attr( get_option('ablp_stripe_secret_key') ); ?>" class="regular-text"/></td>
                    </tr>
                </table>
                <?php submit_button(); ?>
            </form>
        </div>
        <?php
    }

    public function enqueue_styles_and_scripts( $hook ) {
        if ( 'toplevel_page_ablp-dashboard' !== $hook && 'ablp-logistics_page_ablp-settings' !== $hook) { return; }
        wp_enqueue_style( 'ablp-admin-style', ABLP_PLUGIN_URL . 'assets/css/admin-style.css', [], ABLP_VERSION );
        if ( 'toplevel_page_ablp-dashboard' === $hook ) {
             wp_enqueue_script( 'ablp-admin-js', ABLP_PLUGIN_URL . 'assets/js/admin-main.js', [ 'jquery' ], ABLP_VERSION, true );
             wp_localize_script( 'ablp-admin-js', 'ablp_ajax_object', [ 'ajax_url' => admin_url( 'admin-ajax.php' ) ]);
        }
    }
}