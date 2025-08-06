<?php
class ABLP_Logistics {
    public function __construct() {
        $this->load_dependencies();
    }
    private function load_dependencies() {
        require_once ABLP_PLUGIN_DIR . 'admin/class-ablp-admin.php';
        require_once ABLP_PLUGIN_DIR . 'includes/class-ablp-api-client.php';
        require_once ABLP_PLUGIN_DIR . 'includes/class-ablp-public.php';
    }
    public function run() {
        $admin = new ABLP_Admin();
        $api_client = new ABLP_API_Client();
        $public = new ABLP_Public();
    }
}