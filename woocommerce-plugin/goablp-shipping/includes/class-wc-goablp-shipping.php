<?php
/**
 * GoABLP Shipping Method Class
 *
 * Integrates GoABLP shipping rates with WooCommerce
 *
 * @package GoABLP_Shipping
 * @since 1.0.0
 */

if (!defined('ABSPATH')) {
    exit;
}

class WC_GoABLP_Shipping_Method extends WC_Shipping_Method {
    
    /**
     * Constructor
     */
    public function __construct($instance_id = 0) {
        $this->id                 = 'goablp';
        $this->instance_id        = absint($instance_id);
        $this->method_title       = __('GoABLP Shipping', 'goablp-shipping');
        $this->method_description = __('Get real-time shipping rates from Canada Post, Purolator, UPS, FedEx, DHL, and more via GoABLP', 'goablp-shipping');
        
        // Support for shipping zones and instance settings
        $this->supports = array(
            'shipping-zones',
            'instance-settings',
            'instance-settings-modal',
        );
        
        $this->init();
    }
    
    /**
     * Initialize settings
     */
    public function init() {
        // Initialize instance form fields for shipping zones
        $this->instance_form_fields = $this->get_instance_form_fields();
        
        // Get settings - use instance settings for shipping zones
        $this->enabled              = $this->get_option('enabled');
        $this->title                = $this->get_option('title');
        $this->api_url              = $this->get_option('api_url');
        $this->api_key              = $this->get_option('api_key');
        $this->fallback_enabled     = $this->get_option('fallback_enabled');
        $this->fallback_rate        = $this->get_option('fallback_rate');
        $this->debug_mode           = $this->get_option('debug_mode');
        $this->cache_duration       = $this->get_option('cache_duration', 15);
        $this->show_delivery_time   = $this->get_option('show_delivery_time');
        
        // Add inline admin scripts to footer
        add_action('admin_footer', array($this, 'add_inline_admin_scripts'));
    }
    
    /**
     * Define instance form fields for shipping zones
     */
    public function get_instance_form_fields() {
        return array(
            'enabled' => array(
                'title'   => __('Enable/Disable', 'goablp-shipping'),
                'type'    => 'checkbox',
                'label'   => __('Enable GoABLP shipping rates', 'goablp-shipping'),
                'default' => 'yes',
            ),
            'title' => array(
                'title'       => __('Method Title', 'goablp-shipping'),
                'type'        => 'text',
                'description' => __('This title will be shown on the cart and checkout pages', 'goablp-shipping'),
                'default'     => __('GoABLP Shipping', 'goablp-shipping'),
                'desc_tip'    => true,
            ),
            'api_url' => array(
                'title'       => __('API Endpoint URL', 'goablp-shipping'),
                'type'        => 'text',
                'description' => __('Your GoABLP API endpoint URL (e.g., https://your-domain.com/api/v1/merchant/rates)', 'goablp-shipping'),
                'default'     => '',
                'desc_tip'    => true,
                'placeholder' => 'https://your-domain.com/api/v1/merchant/rates',
            ),
            'api_key' => array(
                'title'       => __('API Key', 'goablp-shipping'),
                'type'        => 'password',
                'description' => __('Your GoABLP merchant API key (get this from your GoABLP admin dashboard)', 'goablp-shipping'),
                'default'     => '',
                'desc_tip'    => true,
            ),
            'test_connection' => array(
                'title'       => __('Test Connection', 'goablp-shipping'),
                'type'        => 'title',
                'description' => $this->get_test_connection_html(),
            ),
            'fallback_enabled' => array(
                'title'       => __('Enable Fallback Rate', 'goablp-shipping'),
                'type'        => 'checkbox',
                'label'       => __('Show a fallback rate if API fails', 'goablp-shipping'),
                'description' => __('Display a flat rate if the GoABLP API is unavailable', 'goablp-shipping'),
                'default'     => 'yes',
                'desc_tip'    => true,
            ),
            'fallback_rate' => array(
                'title'       => __('Fallback Rate', 'goablp-shipping'),
                'type'        => 'price',
                'description' => __('Flat rate to charge if API fails (in CAD)', 'goablp-shipping'),
                'default'     => '10.00',
                'desc_tip'    => true,
            ),
            'cache_duration' => array(
                'title'       => __('Cache Duration (minutes)', 'goablp-shipping'),
                'type'        => 'number',
                'description' => __('How long to cache shipping rates (reduces API calls)', 'goablp-shipping'),
                'default'     => '15',
                'desc_tip'    => true,
                'custom_attributes' => array(
                    'min' => '0',
                    'step' => '1',
                ),
            ),
            'show_delivery_time' => array(
                'title'       => __('Show Delivery Time', 'goablp-shipping'),
                'type'        => 'checkbox',
                'label'       => __('Display estimated delivery time in shipping label', 'goablp-shipping'),
                'default'     => 'yes',
            ),
            'debug_mode' => array(
                'title'       => __('Debug Mode', 'goablp-shipping'),
                'type'        => 'checkbox',
                'label'       => __('Enable logging for troubleshooting', 'goablp-shipping'),
                'description' => __('Log API requests and responses to WooCommerce → Status → Logs', 'goablp-shipping'),
                'default'     => 'no',
                'desc_tip'    => true,
            ),
        );
    }
    
    /**
     * Get HTML for test connection button
     */
    private function get_test_connection_html() {
        return '<button type="button" class="button" id="goablp_test_connection">' . __('Test API Connection', 'goablp-shipping') . '</button><div id="goablp_test_result" style="margin-top: 10px;"></div>';
    }
    
    /**
     * Add inline admin scripts to footer
     */
    public function add_inline_admin_scripts() {
        // Only output on admin pages
        if (!is_admin()) {
            return;
        }
        
        // Output the inline JavaScript
        ?>
        <script type="text/javascript">
        console.log('GoABLP: Inline script loading...');
        
        var goablp_admin = {
            ajax_url: '<?php echo esc_js(admin_url('admin-ajax.php')); ?>',
            nonce: '<?php echo wp_create_nonce('goablp_test_connection'); ?>'
        };
        
        jQuery(document).ready(function($) {
            console.log('GoABLP: Admin script loaded successfully (INLINE v1.0.13)');
            console.log('GoABLP: goablp_admin =', goablp_admin);
            
            // Test connection button handler
            $(document).on('click', '#goablp_test_connection', function(e) {
                e.preventDefault();
                
                console.log('GoABLP: Test button clicked!');
                
                var $button = $(this);
                var $result = $('#goablp_test_result');
                var $form = $button.closest('form');
                
                // Get API credentials from form - try multiple selectors
                var apiUrl = $form.find('input[name*="api_url"]').val() || 
                             $form.find('#woocommerce_goablp_api_url').val() ||
                             $form.find('[id*="api_url"]').val();
                
                var apiKey = $form.find('input[name*="api_key"]').val() || 
                             $form.find('#woocommerce_goablp_api_key').val() ||
                             $form.find('[id*="api_key"]').val();
                
                console.log('GoABLP: API URL:', apiUrl);
                console.log('GoABLP: API Key:', apiKey ? 'Present (hidden)' : 'Missing');
                
                // Clear previous results
                $result.html('');
                
                // Validate inputs
                if (!apiUrl || !apiKey) {
                    $result.html('<div style="padding: 10px; background: #f8d7da; color: #721c24; border: 1px solid #f5c6cb; border-radius: 4px;">Please enter both API URL and API Key before testing.</div>');
                    return;
                }
                
                // Disable button and show loading
                $button.prop('disabled', true).text('Testing...');
                
                console.log('GoABLP: Sending AJAX request...');
                
                // Send AJAX request
                $.ajax({
                    url: goablp_admin.ajax_url,
                    type: 'POST',
                    data: {
                        action: 'goablp_test_connection',
                        nonce: goablp_admin.nonce,
                        api_url: apiUrl,
                        api_key: apiKey
                    },
                    success: function(response) {
                        console.log('GoABLP Test Response:', response);
                        if (response && response.success) {
                            $result.html('<div style="padding: 10px; background: #d4edda; color: #155724; border: 1px solid #c3e6cb; border-radius: 4px;">' + response.data.message + '</div>');
                        } else if (response && response.data && response.data.message) {
                            $result.html('<div style="padding: 10px; background: #f8d7da; color: #721c24; border: 1px solid #f5c6cb; border-radius: 4px;">' + response.data.message + '</div>');
                        } else {
                            $result.html('<div style="padding: 10px; background: #f8d7da; color: #721c24; border: 1px solid #f5c6cb; border-radius: 4px;">Unexpected response format. Check browser console for details.</div>');
                        }
                    },
                    error: function(xhr, status, error) {
                        console.log('GoABLP Test Error:', {xhr: xhr, status: status, error: error, responseText: xhr.responseText});
                        var errorMsg = 'AJAX error: ' + error;
                        if (xhr.responseText) {
                            errorMsg += '<br><small>Response: ' + xhr.responseText.substring(0, 200) + '</small>';
                        }
                        $result.html('<div style="padding: 10px; background: #f8d7da; color: #721c24; border: 1px solid #f5c6cb; border-radius: 4px;">' + errorMsg + '</div>');
                    },
                    complete: function() {
                        console.log('GoABLP: Request complete');
                        $button.prop('disabled', false).text('Test API Connection');
                    }
                });
            });
        });
        </script>
        <?php
    }
    
    /**
     * Calculate shipping rates
     */
    public function calculate_shipping($package = array()) {
        
        // Validate API credentials
        if (empty($this->api_url) || empty($this->api_key)) {
            $this->log_debug('API credentials not configured');
            $this->add_fallback_rate();
            return;
        }
        
        // Prepare request data
        $request_data = $this->prepare_api_request($package);
        
        // Check cache first
        $cache_key = 'goablp_rates_' . md5(json_encode($request_data));
        $cached_rates = get_transient($cache_key);
        
        if ($cached_rates && is_array($cached_rates)) {
            $this->log_debug('Using cached rates');
            foreach ($cached_rates as $rate) {
                $this->add_rate($rate);
            }
            return;
        }
        
        // Call GoABLP API
        $api_response = $this->fetch_shipping_rates($request_data);
        
        if (is_wp_error($api_response)) {
            $this->log_debug('API error: ' . $api_response->get_error_message());
            $this->add_fallback_rate();
            return;
        }
        
        // Parse and add rates
        $rates = $this->parse_api_response($api_response);
        
        if (empty($rates)) {
            $this->log_debug('No rates returned from API');
            $this->add_fallback_rate();
            return;
        }
        
        // Cache the rates
        set_transient($cache_key, $rates, $this->cache_duration * MINUTE_IN_SECONDS);
        
        // Add each rate to WooCommerce
        foreach ($rates as $rate) {
            $this->add_rate($rate);
        }
    }
    
    /**
     * Prepare data for API request
     */
    private function prepare_api_request($package) {
        
        $total_weight = 0;
        $items = array();
        
        // Calculate total weight and build items array
        foreach ($package['contents'] as $item) {
            $product = $item['data'];
            $weight = $product->get_weight();
            
            // Convert weight to kg if needed
            $weight_unit = get_option('woocommerce_weight_unit');
            if ($weight_unit === 'lbs') {
                $weight = $weight * 0.453592; // Convert lbs to kg
            } else if ($weight_unit === 'g') {
                $weight = $weight / 1000; // Convert g to kg
            } else if ($weight_unit === 'oz') {
                $weight = $weight * 0.0283495; // Convert oz to kg
            }
            
            $total_weight += floatval($weight) * $item['quantity'];
            
            $items[] = array(
                'name'     => $product->get_name(),
                'quantity' => $item['quantity'],
                'weight'   => floatval($weight),
            );
        }
        
        // Get package dimensions (use product dimensions or defaults)
        $length = 30; // Default 30cm
        $width = 20;  // Default 20cm
        $height = 15; // Default 15cm
        
        // Try to get dimensions from first product
        foreach ($package['contents'] as $item) {
            $product = $item['data'];
            if ($product->get_length() && $product->get_width() && $product->get_height()) {
                $dimension_unit = get_option('woocommerce_dimension_unit');
                
                $length = floatval($product->get_length());
                $width = floatval($product->get_width());
                $height = floatval($product->get_height());
                
                // Convert to cm if needed
                if ($dimension_unit === 'in') {
                    $length = $length * 2.54;
                    $width = $width * 2.54;
                    $height = $height * 2.54;
                } else if ($dimension_unit === 'm') {
                    $length = $length * 100;
                    $width = $width * 100;
                    $height = $height * 100;
                }
                break;
            }
        }
        
        return array(
            'origin' => array(
                'postalCode' => get_option('woocommerce_store_postcode'),
                'country'    => WC()->countries->get_base_country(),
            ),
            'destination' => array(
                'postalCode' => $package['destination']['postcode'],
                'city'       => $package['destination']['city'],
                'province'   => $package['destination']['state'],
                'state'      => $package['destination']['state'],
                'country'    => $package['destination']['country'],
            ),
            'package' => array(
                'weight' => max(0.1, $total_weight), // Minimum 0.1kg
                'length' => $length,
                'width'  => $width,
                'height' => $height,
            ),
        );
    }
    
    /**
     * Fetch rates from GoABLP API
     */
    private function fetch_shipping_rates($request_data) {
        
        $this->log_debug('API Request: ' . json_encode($request_data));
        
        $response = wp_remote_post($this->api_url, array(
            'method'  => 'POST',
            'timeout' => 15,
            'headers' => array(
                'Content-Type'  => 'application/json',
                'Authorization' => 'Bearer ' . trim($this->api_key),
                'X-Requested-With' => 'XMLHttpRequest',
            ),
            'body' => json_encode($request_data),
        ));
        
        if (is_wp_error($response)) {
            $this->log_debug('HTTP Error: ' . $response->get_error_message());
            return $response;
        }
        
        $status_code = wp_remote_retrieve_response_code($response);
        $body = wp_remote_retrieve_body($response);
        
        $this->log_debug('API Response (' . $status_code . '): ' . $body);
        
        if ($status_code !== 200) {
            return new WP_Error('api_error', 'API returned status code ' . $status_code);
        }
        
        $data = json_decode($body, true);
        
        if (!$data || !isset($data['success'])) {
            return new WP_Error('invalid_response', 'Invalid API response format');
        }
        
        return $data;
    }
    
    /**
     * Parse API response into WooCommerce rate format
     */
    private function parse_api_response($api_data) {
        
        $rates = array();
        $local_rates = array();
        $standard_rates = array();
        
        if (!isset($api_data['rates']) || !is_array($api_data['rates'])) {
            return $rates;
        }
        
        foreach ($api_data['rates'] as $index => $rate) {
            $service_name = isset($rate['service_name']) ? $rate['service_name'] : 'Shipping';
            $cost = isset($rate['total_price']) ? floatval($rate['total_price']) : 0;
            
            // Check if this is a local delivery rate (handle both camelCase and snake_case)
            $is_local_delivery = false;
            if ((isset($rate['isLocalDelivery']) && $rate['isLocalDelivery']) ||
                (isset($rate['is_local_delivery']) && $rate['is_local_delivery'])) {
                $is_local_delivery = true;
            } elseif (isset($rate['carrier']) && stripos($rate['carrier'], 'uber') !== false) {
                $is_local_delivery = true;
            }
            
            // Add delivery time to label if enabled
            if ($this->show_delivery_time === 'yes' && !empty($rate['description'])) {
                $service_name .= ' (' . $rate['description'] . ')';
            }
            
            // Add "Same Day Local" badge for local delivery rates
            if ($is_local_delivery) {
                $service_name = '⚡ Same Day Local - ' . $service_name;
            }
            
            $rate_data = array(
                'id'    => $this->id . ':' . ($is_local_delivery ? 'local_' : '') . $index,
                'label' => $service_name,
                'cost'  => $cost,
                'meta_data' => array(
                    'carrier' => isset($rate['carrier']) ? $rate['carrier'] : '',
                    'delivery_days' => isset($rate['delivery_days']) ? $rate['delivery_days'] : null,
                    'is_local_delivery' => $is_local_delivery,
                ),
            );
            
            // Separate local and standard rates for sorting
            if ($is_local_delivery) {
                $local_rates[] = $rate_data;
            } else {
                $standard_rates[] = $rate_data;
            }
        }
        
        // Sort local rates by cost (lowest first)
        usort($local_rates, function($a, $b) {
            return $a['cost'] <=> $b['cost'];
        });
        
        // Combine: local rates first, then standard rates
        $rates = array_merge($local_rates, $standard_rates);
        
        return $rates;
    }
    
    /**
     * Add fallback rate
     */
    private function add_fallback_rate() {
        if ($this->fallback_enabled === 'yes') {
            $this->add_rate(array(
                'id'    => $this->id . ':fallback',
                'label' => $this->title . ' (Estimated)',
                'cost'  => floatval($this->fallback_rate),
            ));
        }
    }
    
    /**
     * Debug logging
     */
    private function log_debug($message) {
        if ($this->debug_mode === 'yes') {
            $logger = wc_get_logger();
            $logger->debug($message, array('source' => 'goablp-shipping'));
        }
    }
}
