/**
 * GoABLP Local Delivery Frontend Script
 * Adds styling classes to local delivery options for browsers without :has() support
 */
(function($) {
    'use strict';
    
    function highlightLocalDeliveryOptions() {
        // Find all shipping method labels
        $('.woocommerce-shipping-methods li label').each(function() {
            var $label = $(this);
            var $li = $label.closest('li');
            var $input = $li.find('input[type="radio"]');
            var labelText = $label.text();
            var inputValue = $input.val() || '';
            
            // Check if this is a local delivery option
            if (labelText.indexOf('Same Day Local') !== -1 || 
                inputValue.indexOf('local_') !== -1 ||
                labelText.indexOf('⚡') !== -1) {
                $li.addClass('goablp-local-delivery');
            }
        });
    }
    
    // Run on page load
    $(document).ready(function() {
        highlightLocalDeliveryOptions();
    });
    
    // Re-run when shipping methods are updated (AJAX)
    $(document.body).on('updated_checkout updated_shipping_method', function() {
        setTimeout(highlightLocalDeliveryOptions, 100);
    });
    
    // Also listen for WooCommerce cart/checkout fragment updates
    $(document.body).on('wc_fragments_refreshed wc_fragments_loaded', function() {
        setTimeout(highlightLocalDeliveryOptions, 100);
    });
    
})(jQuery);
