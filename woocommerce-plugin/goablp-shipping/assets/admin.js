jQuery(document).ready(function($) {
    
    // Test connection button handler
    $(document).on('click', '#goablp_test_connection', function(e) {
        e.preventDefault();
        
        var $button = $(this);
        var $result = $('#goablp_test_result');
        
        // Get current API URL and Key from the form
        // Handle both instance settings modal and regular settings
        var $form = $button.closest('form');
        var apiUrl = $form.find('input[name*="api_url"]').val();
        var apiKey = $form.find('input[name*="api_key"]').val();
        
        // Clear previous results
        $result.html('');
        
        // Disable button and show loading
        $button.prop('disabled', true).text('Testing...');
        
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
                if (response.success) {
                    $result.html('<div style="padding: 10px; background: #d4edda; color: #155724; border: 1px solid #c3e6cb; border-radius: 4px;">' + response.data.message + '</div>');
                } else {
                    $result.html('<div style="padding: 10px; background: #f8d7da; color: #721c24; border: 1px solid #f5c6cb; border-radius: 4px;">' + response.data.message + '</div>');
                }
            },
            error: function() {
                $result.html('<div style="padding: 10px; background: #f8d7da; color: #721c24; border: 1px solid #f5c6cb; border-radius: 4px;">An unexpected error occurred. Please try again.</div>');
            },
            complete: function() {
                // Re-enable button
                $button.prop('disabled', false).text('Test API Connection');
            }
        });
    });
    
});
