<?php
class ABLP_API_Client {

    private $api_url;
    private $username;
    private $password;
    private $access_token;

    public function __construct() {
        $environment = get_option('ablp_shiptime_environment', 'sandbox');
        $base_url = ($environment === 'production') ? 'https://restapi.shiptime.com' : 'https://sandboxapi.shiptime.com';
        $this->api_url = $base_url . '/rest/';
        $this->username = get_option('ablp_shiptime_username');
        $this->password = get_option('ablp_shiptime_password');
        add_action( 'wp_ajax_nopriv_get_shipping_rates', [ $this, 'ajax_get_shipping_rates' ] );
        add_action( 'wp_ajax_get_shipping_rates', [ $this, 'ajax_get_shipping_rates' ] );
        add_action( 'wp_ajax_purchase_shipment', [ $this, 'ajax_purchase_shipment' ] );
        add_action( 'wp_ajax_track_shipment', [ $this, 'ajax_track_shipment' ] );
    }
    
    private function send_error( $message = 'An unknown error occurred.' ) {
        if ( empty($message) ) { $message = 'An unspecified error occurred on the server.'; }
        header('Content-Type: application/json; charset=utf-8');
        wp_send_json_error( $message );
    }

    private function get_access_token() {
        if ( $this->access_token ) { return $this->access_token; }
        if ( empty($this->username) || empty($this->password) ) { return new WP_Error( 'auth_missing', 'ShipTime Username/Email or Password not set in settings.' ); }
        $auth_body = ['email' => $this->username, 'password' => $this->password];
        $auth_response = wp_remote_post( $this->api_url . 'token', [ 'headers' => ['Content-Type' => 'application/json'], 'body' => json_encode($auth_body), 'timeout' => 20 ]);
        if (is_wp_error($auth_response)) { return $auth_response; }
        $body = json_decode(wp_remote_retrieve_body($auth_response), true);
        if (isset($body['token'])) {
            $this->access_token = $body['token'];
            return $this->access_token;
        } else {
            $error_detail = isset($body['message']) ? $body['message'] : 'Check credentials. Raw Response: ' . wp_remote_retrieve_body($auth_response);
            return new WP_Error('auth_failed', 'Could not authenticate with ShipTime. ' . $error_detail);
        }
    }

    private function make_request( $endpoint, $body = [], $method = 'POST' ) {
        $token = $this->get_access_token();
        if (is_wp_error($token)) { return $token; }
        return wp_remote_request($this->api_url . $endpoint, [ 'method'  => $method, 'headers' => ['Authorization' => 'Bearer ' . $token, 'Content-Type'  => 'application/json'], 'body'    => !empty($body) ? json_encode($body) : null, 'timeout' => 30, ]);
    }

    public function ajax_get_shipping_rates() {
        try {
            check_ajax_referer( 'ablp_get_rates_nonce', 'nonce' );
            $rates_payload = [];
            if ( isset($_POST['from_streetAddress']) && !empty($_POST['from_streetAddress']) ) {
                $rates_payload = [
                    'from' => [ 'companyName' => sanitize_text_field($_POST['from_attention']), 'streetAddress' => sanitize_text_field($_POST['from_streetAddress']), 'city' => sanitize_text_field($_POST['from_city']), 'state' => sanitize_text_field($_POST['from_state']), 'postalCode' => sanitize_text_field($_POST['from_postalCode']), 'countryCode' => sanitize_text_field($_POST['from_country']), 'attention' => sanitize_text_field($_POST['from_attention']), 'phone' => sanitize_text_field($_POST['from_phone']), ],
                    'to' => [ 'companyName' => sanitize_text_field($_POST['to_attention']), 'streetAddress' => sanitize_text_field($_POST['to_streetAddress']), 'city' => sanitize_text_field($_POST['to_city']), 'state' => sanitize_text_field($_POST['to_state']), 'postalCode' => sanitize_text_field($_POST['to_postalCode']), 'countryCode' => sanitize_text_field($_POST['to_country']), 'attention' => sanitize_text_field($_POST['to_attention']), 'phone' => sanitize_text_field($_POST['to_phone']), ],
                ];
            } else {
                $rates_payload = [
                    'from' => [ 'countryCode' => sanitize_text_field($_POST['from_country']), 'postalCode' => sanitize_text_field($_POST['from_postalCode']) ],
                    'to' => [ 'countryCode' => sanitize_text_field($_POST['to_country']), 'postalCode' => sanitize_text_field($_POST['to_postalCode']) ],
                ];
            }
            $rates_payload['packageType'] = 'PACKAGE';
            $rates_payload['lineItems'] = [['length' => (float)$_POST['length'], 'width'  => (float)$_POST['width'], 'height' => (float)$_POST['height'], 'weight' => (float)$_POST['weight']]];
            $rates_payload['unitOfMeasurement'] = 'METRIC';
            $rates_payload['shipDate'] = date('c');
            $response = $this->make_request('rates', $rates_payload);
            if (is_wp_error($response)) { $this->send_error( $response->get_error_message() ); }
            $http_code = wp_remote_retrieve_response_code($response);
            $response_body = json_decode(wp_remote_retrieve_body($response), true);
            if ($http_code >= 400) { $this->send_error("API Request Failed (HTTP " . $http_code . "). Server says: " . wp_remote_retrieve_body($response)); }
            if (empty($response_body) || !isset($response_body['availableRates'])) { $this->send_error("API returned a successful response, but it contained no rate data. This usually means no carriers service this route, or the address combination is invalid. Server Response: " . wp_remote_retrieve_body($response)); }
            $processed_rates = [];
            $surcharge_percentage = (float) get_option('ablp_rate_surcharge', '0');
            $multiplier = 1 + ($surcharge_percentage / 100);
            foreach ($response_body['availableRates'] as $rate) {
                $api_total_cents = 0;
                $base_charge_key = isset($rate['baseCharge']) ? 'baseCharge' : 'base Charge';
                if (isset($rate[$base_charge_key]['amount'])) { $api_total_cents += $rate[$base_charge_key]['amount']; }
                if (isset($rate['surcharges']) && is_array($rate['surcharges'])) { foreach ($rate['surcharges'] as $surcharge) { if (isset($surcharge['price']['amount'])) { $api_total_cents += $surcharge['price']['amount']; } } }
                if (isset($rate['taxes']) && is_array($rate['taxes'])) { foreach ($rate['taxes'] as $tax) { if (isset($tax['price']['amount'])) { $api_total_cents += $tax['price']['amount']; } } }
                $total_in_dollars = $api_total_cents / 100;
                $final_total = $total_in_dollars * $multiplier;
                $processed_rate = $rate;
                $processed_rate['totalCharge'] = number_format($final_total, 2, '.', '');
                $processed_rates[] = $processed_rate;
            }
            wp_send_json_success(['rates' => $processed_rates]);
        } catch (Exception $e) {
            $this->send_error("A fatal error occurred in the get_shipping_rates function: " . $e->getMessage());
        }
    }

    public function ajax_purchase_shipment() {
        try {
            $raw_post_data = file_get_contents('php://input');
            $data = json_decode($raw_post_data, true);
            if (json_last_error() !== JSON_ERROR_NONE) { $this->send_error("Could not parse the JSON data sent from the browser. Raw data received: " . $raw_post_data); }
            if ( !isset($data['nonce']) || !wp_verify_nonce($data['nonce'], 'ablp_get_rates_nonce') ) { $this->send_error("Security check failed."); }
            $rate_data = isset($data['rate_data']) ? $data['rate_data'] : null;
            if (empty($rate_data) || !isset($rate_data['rateId'])) { $this->send_error("Invalid rate data provided for purchase. Full data received: " . print_r($data, true)); }
            $shipment_payload = [
                'rateId' => $rate_data['rateId'],
                'from' => [ 'attention' => sanitize_text_field($data['from_name']), 'streetAddress' => sanitize_text_field($data['from_address']), 'city' => sanitize_text_field($data['from_city']), 'state' => sanitize_text_field($data['from_province']), 'countryCode' => sanitize_text_field($data['from_country']), 'postalCode' => sanitize_text_field($data['from_postal_code']), 'phone' => sanitize_text_field($data['from_phone']), ],
                'to' => [ 'attention' => sanitize_text_field($data['to_name']), 'streetAddress' => sanitize_text_field($data['to_address']), 'city' => sanitize_text_field($data['to_city']), 'state' => sanitize_text_field($data['to_province']), 'countryCode' => sanitize_text_field($data['to_country']), 'postalCode' => sanitize_text_field($data['to_postal_code']), 'phone' => sanitize_text_field($data['to_phone']), ],
                'packageType' => 'PACKAGE',
                'lineItems' => $rate_data['lineItems'],
                'unitOfMeasurement' => 'METRIC',
            ];
            $response = $this->make_request('shipments', $shipment_payload);
            if ( is_wp_error($response) ) { $this->send_error($response->get_error_message()); }
            $http_code = wp_remote_retrieve_response_code($response);
            $shipment_response = json_decode(wp_remote_retrieve_body($response), true);
            if ($http_code >= 400) { $this->send_error("API Error (HTTP " . $http_code . "): " . wp_remote_retrieve_body($response)); }
            $shipment_id = isset($shipment_response['id']) ? $shipment_response['id'] : null;
            $tracking_number = isset($shipment_response['trackingNumber']) ? $shipment_response['trackingNumber'] : 'N/A';
            $carrier_name = isset($shipment_response['carrier']['name']) ? $shipment_response['carrier']['name'] : 'N/A';
            $service_name = isset($shipment_response['service']['name']) ? $shipment_response['service']['name'] : 'N/A';
            $label_url = isset($shipment_response['labelUrl']) ? $shipment_response['labelUrl'] : null;
            if (empty($shipment_id) || empty($label_url)) { $this->send_error("Shipment API returned a successful but invalid response. Missing 'id' or 'labelUrl'. Full Response: " . print_r($shipment_response, true)); }
            global $wpdb;
            $table_name = $wpdb->prefix . 'ablp_shipments';
            $wpdb->insert($table_name, [
                'created_at' => current_time('mysql'), 'user_id' => get_current_user_id(),
                'shiptime_shipment_id' => $shipment_id, 'stripe_charge_id' => 'simulated_charge_' . uniqid(),
                'tracking_number' => $tracking_number, 'carrier_name' => $carrier_name,
                'service_name' => $service_name, 'total_cost' => (float) $rate_data['totalCharge'],
                'label_url' => $label_url,
            ]);
            wp_send_json_success(['label_url' => $label_url]);
        } catch (Exception $e) {
            $this->send_error("A fatal error occurred in the purchase_shipment function: " . $e->getMessage());
        }
    }
    
    public function ajax_track_shipment() {
        try {
            check_ajax_referer( 'ablp_get_rates_nonce', 'nonce' );
            if ( empty($_POST['shipment_id']) ) { $this->send_error('A valid Shipment ID is required.'); }
            $shipment_id = sanitize_text_field($_POST['shipment_id']);
            $endpoint = 'shipments/' . $shipment_id . '/track';
            $response = $this->make_request($endpoint, [], 'GET');
            if ( is_wp_error($response) ) { $this->send_error($response->get_error_message()); }
            $http_code = wp_remote_retrieve_response_code($response);
            $response_body = json_decode(wp_remote_retrieve_body($response), true);
            if ($http_code >= 400) { $this->send_error("API Error (HTTP " . $http_code . "): " . wp_remote_retrieve_body($response)); }
            if (empty($response_body)) { $this->send_error("Tracking API returned a successful but empty response."); }
            wp_send_json_success($response_body);
        } catch (Exception $e) {
            $this->send_error("A fatal error occurred in the track_shipment function: " . $e->getMessage());
        }
    }
}