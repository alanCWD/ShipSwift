jQuery(document).ready(function($) {
    
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
    
    console.log('GoABLP: Admin script loaded successfully');
    
});
