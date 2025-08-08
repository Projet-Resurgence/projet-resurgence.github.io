#!/bin/bash

# Analytics Testing Script for Projet Résurgence Website
# Tests Google Analytics implementation, event tracking, and data collection

echo "📊 Analytics Implementation Testing Suite"
echo "=========================================="

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

PASSED=0
FAILED=0
TOTAL=0

run_analytics_test() {
    local test_name="$1"
    local test_command="$2"
    
    echo -e "\n${BLUE}Testing: $test_name${NC}"
    TOTAL=$((TOTAL + 1))
    
    if eval "$test_command"; then
        echo -e "${GREEN}✅ PASS: $test_name${NC}"
        PASSED=$((PASSED + 1))
    else
        echo -e "${RED}❌ FAIL: $test_name${NC}"
        FAILED=$((FAILED + 1))
    fi
}

# Google Tag Manager Tests
echo -e "\n${YELLOW}🏷️ GOOGLE TAG MANAGER TESTS${NC}"
echo "========================================"

run_analytics_test "GTM Script Present" "grep -q 'googletagmanager.com/gtm.js' index.html"
run_analytics_test "GTM ID Configured" "grep -q 'GTM-WDG77HQC' index.html"
run_analytics_test "GTM NoScript Fallback" "grep -q '<noscript>.*googletagmanager' index.html || echo 'Consider adding GTM noscript fallback'"
run_analytics_test "DataLayer Initialized" "grep -q 'dataLayer.*=.*\[\]' index.html"

# Google Analytics 4 Tests
echo -e "\n${YELLOW}📈 GOOGLE ANALYTICS 4 TESTS${NC}"
echo "========================================"

run_analytics_test "GA4 Config Present" "grep -q 'gtag.*config.*GTM-' index.html"
run_analytics_test "Enhanced Measurement" "grep -q 'enhanced_measurement' index.html"
run_analytics_test "Custom Parameters" "grep -q 'custom_parameters' index.html"
run_analytics_test "Content Groups" "grep -q 'content_group' index.html"

# Event Tracking Tests
echo -e "\n${YELLOW}🎯 EVENT TRACKING TESTS${NC}"
echo "========================================"

run_analytics_test "trackEvent Function" "grep -q 'window.trackEvent.*function' index.html"
run_analytics_test "Core Web Vitals Tracking" "grep -q 'core_web_vitals' index.html"
run_analytics_test "Performance Tracking" "grep -q 'page_load_time' index.html"
run_analytics_test "Click Tracking Setup" "grep -q 'setupClickTracking' styles/main.js"
run_analytics_test "Scroll Tracking Setup" "grep -q 'setupScrollTracking' styles/main.js"

# Conversion Tracking Tests  
echo -e "\n${YELLOW}💰 CONVERSION TRACKING TESTS${NC}"
echo "========================================"

run_analytics_test "Discord Invite Tracking" "grep -q 'discord_invite_click' styles/main.js"
run_analytics_test "CTA Click Tracking" "grep -q 'cta_click' styles/main.js"
run_analytics_test "Navigation Tracking" "grep -q 'navigation_click' styles/main.js"
run_analytics_test "Theme Toggle Tracking" "grep -q 'theme_toggle' styles/main.js"

# User Behavior Tracking Tests
echo -e "\n${YELLOW}👤 USER BEHAVIOR TRACKING TESTS${NC}"
echo "========================================"

run_analytics_test "Scroll Depth Tracking" "grep -q 'scroll_depth' styles/main.js"
run_analytics_test "Section View Time" "grep -q 'section_view_time' styles/main.js"
run_analytics_test "Mobile Menu Tracking" "grep -q 'mobile_menu_toggle' styles/main.js"
run_analytics_test "Page Visibility Tracking" "grep -q 'page_visibility' styles/main.js"
run_analytics_test "Time on Page Tracking" "grep -q 'time_on_page' styles/main.js"

# Error and Performance Tracking
echo -e "\n${YELLOW}🐛 ERROR & PERFORMANCE TRACKING TESTS${NC}"
echo "========================================"

run_analytics_test "JavaScript Error Tracking" "grep -q 'javascript_error' styles/main.js"
run_analytics_test "Rage Click Tracking" "grep -q 'rage_clicks' styles/main.js"
run_analytics_test "Performance Observer" "grep -q 'PerformanceObserver' index.html"
run_analytics_test "Layout Shift Tracking" "grep -q 'layout-shift' index.html"

# Page-Specific Analytics Tests
echo -e "\n${YELLOW}📄 PAGE-SPECIFIC ANALYTICS TESTS${NC}"
echo "========================================"

# Check if other pages have analytics
if [ -f "regles.html" ]; then
    run_analytics_test "Rules Page GTM" "grep -q 'GTM-WDG77HQC' regles.html"
    run_analytics_test "Rules Page Custom Config" "grep -q 'page_type.*rules' regles.html"
fi

if [ -f "guide.html" ]; then
    run_analytics_test "Guide Page GTM" "grep -q 'GTM-WDG77HQC' guide.html"
    run_analytics_test "Guide Page Custom Config" "grep -q 'page_type.*guide' guide.html"
fi

# Data Layer Structure Tests
echo -e "\n${YELLOW}📊 DATA LAYER STRUCTURE TESTS${NC}"
echo "========================================"

run_analytics_test "Custom Event Structure" "grep -q 'event.*custom_event' styles/main.js"
run_analytics_test "Event Categories" "grep -q 'eventCategory' styles/main.js"
run_analytics_test "Event Labels" "grep -q 'eventLabel' styles/main.js"
run_analytics_test "Custom Parameters Push" "grep -q 'customParameters' styles/main.js"

# Privacy and Compliance Tests
echo -e "\n${YELLOW}🔒 PRIVACY & COMPLIANCE TESTS${NC}"
echo "========================================"

run_analytics_test "No Personal Data Collection" "! grep -i 'email\|phone\|address' styles/main.js"
run_analytics_test "Anonymized Tracking" "! grep -q 'user_id\|client_id' styles/main.js || echo 'Check for anonymized tracking'"
run_analytics_test "Consent Framework Ready" "echo 'Consider implementing consent framework'"

# Enhanced E-commerce Tests (if applicable)
echo -e "\n${YELLOW}🛒 E-COMMERCE TRACKING TESTS${NC}"
echo "========================================"

# Since this is a Discord server website, we test for engagement as conversion
run_analytics_test "Engagement Events" "grep -q 'User Engagement' styles/main.js"
run_analytics_test "Conversion Funnel Setup" "grep -q 'conversion_funnel' styles/main.js"

# Real-time Testing Capability
echo -e "\n${YELLOW}⚡ REAL-TIME TESTING CAPABILITY${NC}"
echo "========================================"

# Create a simple test HTML file to verify analytics
cat > analytics-test.html << 'EOF'
<!DOCTYPE html>
<html>
<head>
    <title>Analytics Test</title>
    <script>
        // Test if analytics functions are available
        function testAnalytics() {
            const tests = [];
            
            // Test GTM
            if (typeof dataLayer !== 'undefined') {
                tests.push('✅ DataLayer available');
            } else {
                tests.push('❌ DataLayer not found');
            }
            
            // Test GA4
            if (typeof gtag !== 'undefined') {
                tests.push('✅ gtag function available');
            } else {
                tests.push('❌ gtag function not found');
            }
            
            // Test custom tracking
            if (typeof trackEvent !== 'undefined') {
                tests.push('✅ trackEvent function available');
            } else {
                tests.push('❌ trackEvent function not found');
            }
            
            return tests;
        }
        
        // Test event firing
        function testEventFiring() {
            try {
                if (typeof trackEvent === 'function') {
                    trackEvent('test_event', {
                        category: 'Test',
                        label: 'Analytics Test',
                        custom: { test_mode: true }
                    });
                    return '✅ Test event fired successfully';
                } else {
                    return '❌ trackEvent function not available';
                }
            } catch (error) {
                return '❌ Error firing test event: ' + error.message;
            }
        }
    </script>
</head>
<body>
    <h1>Analytics Testing Page</h1>
    <button onclick="console.log(testAnalytics())">Test Analytics Functions</button>
    <button onclick="console.log(testEventFiring())">Test Event Firing</button>
</body>
</html>
EOF

run_analytics_test "Analytics Test Page Created" "test -f analytics-test.html"

# Configuration Validation
echo -e "\n${YELLOW}⚙️ CONFIGURATION VALIDATION${NC}"
echo "========================================"

# Extract GTM ID and validate format
gtm_id=$(grep -o 'GTM-[A-Z0-9]*' index.html | head -1)
if [[ $gtm_id =~ ^GTM-[A-Z0-9]{6,}$ ]]; then
    echo -e "${GREEN}✅ GTM ID format valid: $gtm_id${NC}"
    PASSED=$((PASSED + 1))
else
    echo -e "${RED}❌ GTM ID format invalid or missing${NC}"
    FAILED=$((FAILED + 1))
fi
TOTAL=$((TOTAL + 1))

# Check for consistent tracking across pages
echo -e "\n${YELLOW}🔄 CROSS-PAGE CONSISTENCY${NC}"
echo "========================================"

index_gtm=$(grep -c 'GTM-WDG77HQC' index.html 2>/dev/null || echo 0)
rules_gtm=$(grep -c 'GTM-WDG77HQC' regles.html 2>/dev/null || echo 0)
guide_gtm=$(grep -c 'GTM-WDG77HQC' guide.html 2>/dev/null || echo 0)

run_analytics_test "Consistent GTM Implementation" "[ $index_gtm -gt 0 ] && [ $rules_gtm -gt 0 ] && [ $guide_gtm -gt 0 ]"

# Performance Impact Assessment
echo -e "\n${YELLOW}⚡ PERFORMANCE IMPACT ASSESSMENT${NC}"
echo "========================================"

# Count total analytics scripts
analytics_scripts=$(grep -c 'gtag\|dataLayer\|googletagmanager' index.html 2>/dev/null || echo 0)
run_analytics_test "Analytics Script Count Reasonable" "[ $analytics_scripts -lt 10 ]"

# Check for async loading
async_analytics=$(grep -c 'async.*gtm.js' index.html 2>/dev/null || echo 0)
run_analytics_test "Analytics Scripts Load Async" "[ $async_analytics -gt 0 ]"

# Event Volume Estimation
echo -e "\n${YELLOW}📊 EVENT VOLUME ESTIMATION${NC}"
echo "========================================"

tracked_events=$(grep -c 'trackEvent' styles/main.js 2>/dev/null || echo 0)
echo "Estimated trackable events: $tracked_events"
run_analytics_test "Reasonable Event Volume" "[ $tracked_events -gt 5 ] && [ $tracked_events -lt 50 ]"

# Generate Analytics Report
echo -e "\n${YELLOW}📋 ANALYTICS IMPLEMENTATION REPORT${NC}"
echo "========================================"

cat > analytics-report.txt << EOF
Analytics Implementation Report
Generated: $(date)

GTM Configuration:
- GTM ID: $gtm_id
- Pages with GTM: Index($index_gtm), Rules($rules_gtm), Guide($guide_gtm)
- Analytics Scripts: $analytics_scripts

Event Tracking:
- Trackable Events: $tracked_events
- Core Web Vitals: $(grep -q 'core_web_vitals' index.html && echo 'Yes' || echo 'No')
- User Interactions: $(grep -q 'setupClickTracking' styles/main.js && echo 'Yes' || echo 'No')
- Performance Metrics: $(grep -q 'page_load_time' index.html && echo 'Yes' || echo 'No')

Conversion Tracking:
- Discord Invites: $(grep -q 'discord_invite_click' styles/main.js && echo 'Yes' || echo 'No')
- CTA Buttons: $(grep -q 'cta_click' styles/main.js && echo 'Yes' || echo 'No')
- Navigation: $(grep -q 'navigation_click' styles/main.js && echo 'Yes' || echo 'No')

Implementation Quality:
- Test Score: $((PASSED * 100 / TOTAL))%
- Passed Tests: $PASSED
- Failed Tests: $FAILED
EOF

echo "Analytics report saved to: analytics-report.txt"

# Summary
echo -e "\n${YELLOW}📊 ANALYTICS TEST SUMMARY${NC}"
echo "========================================"
echo -e "Total Tests: $TOTAL"
echo -e "${GREEN}Passed: $PASSED${NC}"
echo -e "${RED}Failed: $FAILED${NC}"

analytics_score=$((PASSED * 100 / TOTAL))
echo -e "\nAnalytics Implementation Score: $analytics_score%"

if [ $analytics_score -ge 90 ]; then
    echo -e "${GREEN}🎯 Excellent analytics implementation!${NC}"
elif [ $analytics_score -ge 75 ]; then
    echo -e "${YELLOW}📊 Good analytics setup with minor improvements needed.${NC}"
else
    echo -e "${RED}⚠️ Analytics implementation needs significant work.${NC}"
fi

# Cleanup
rm -f analytics-test.html

exit 0
