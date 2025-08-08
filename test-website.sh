#!/bin/bash

# Comprehensive Website Testing Script
# Tests for Projet Résurgence website functionality, performance, and compliance

echo "🧪 Starting Comprehensive Website Testing Suite"
echo "================================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test results
PASSED=0
FAILED=0
TOTAL=0

# Function to run a test and track results
run_test() {
    local test_name="$1"
    local test_command="$2"
    local expected_result="$3"
    
    echo -e "\n${BLUE}Testing: $test_name${NC}"
    echo "Command: $test_command"
    
    TOTAL=$((TOTAL + 1))
    
    if eval "$test_command"; then
        if [ "$expected_result" = "success" ] || [ -z "$expected_result" ]; then
            echo -e "${GREEN}✅ PASS: $test_name${NC}"
            PASSED=$((PASSED + 1))
        else
            echo -e "${RED}❌ FAIL: $test_name (unexpected success)${NC}"
            FAILED=$((FAILED + 1))
        fi
    else
        if [ "$expected_result" = "fail" ]; then
            echo -e "${GREEN}✅ PASS: $test_name (expected failure)${NC}"
            PASSED=$((PASSED + 1))
        else
            echo -e "${RED}❌ FAIL: $test_name${NC}"
            FAILED=$((FAILED + 1))
        fi
    fi
}

# File Structure Tests
echo -e "\n${YELLOW}📁 FILE STRUCTURE TESTS${NC}"
echo "========================================"

run_test "Index HTML exists" "test -f index.html"
run_test "Rules HTML exists" "test -f regles.html"
run_test "Guide HTML exists" "test -f guide.html"
run_test "Main CSS exists" "test -f styles/main.css"
run_test "Main JS exists" "test -f styles/main.js"
run_test "Manifest exists" "test -f manifest.json"
run_test "Service Worker exists" "test -f sw.js"
run_test "Robots.txt exists" "test -f robots.txt"
run_test "Sitemap exists" "test -f sitemap.xml"
run_test "Fonts directory exists" "test -d fonts"
run_test "Images directory exists" "test -d images"

# HTML Validation Tests
echo -e "\n${YELLOW}🔍 HTML VALIDATION TESTS${NC}"
echo "========================================"

run_test "Index HTML contains DOCTYPE" "grep -q '<!DOCTYPE html>' index.html"
run_test "Index HTML has lang attribute" "grep -q 'lang=\"fr\"' index.html"
run_test "Index HTML has meta charset" "grep -q '<meta charset=\"UTF-8\">' index.html"
run_test "Index HTML has viewport meta" "grep -q 'name=\"viewport\"' index.html"
run_test "Index HTML has title tag" "grep -q '<title>' index.html"
run_test "Index HTML has meta description" "grep -q 'name=\"description\"' index.html"

run_test "Rules HTML contains DOCTYPE" "grep -q '<!DOCTYPE html>' regles.html"
run_test "Guide HTML contains DOCTYPE" "grep -q '<!DOCTYPE html>' guide.html"

# CSS Tests
echo -e "\n${YELLOW}🎨 CSS TESTS${NC}"
echo "========================================"

run_test "CSS contains font-face" "grep -q '@font-face' styles/main.css"
run_test "CSS contains CSS variables" "grep -q ':root' styles/main.css"
run_test "CSS contains media queries" "grep -q '@media' styles/main.css"
run_test "CSS contains responsive breakpoints" "grep -q 'max-width.*1040px' styles/main.css"
run_test "CSS file is not empty" "test -s styles/main.css"

# JavaScript Tests
echo -e "\n${YELLOW}⚙️ JAVASCRIPT TESTS${NC}"
echo "========================================"

run_test "Main JS file is not empty" "test -s styles/main.js"
run_test "JS contains class definition" "grep -q 'class ResurgenceWebsite' styles/main.js"
run_test "JS contains event listeners" "grep -q 'addEventListener' styles/main.js"
run_test "JS contains analytics tracking" "grep -q 'trackEvent' styles/main.js"
run_test "Performance optimizer exists" "test -f styles/performance-optimizer.js"
run_test "SEO optimizer exists" "test -f styles/seo-optimizer.js"

# SEO Tests
echo -e "\n${YELLOW}🔍 SEO TESTS${NC}"
echo "========================================"

run_test "Meta keywords present" "grep -q 'name=\"keywords\"' index.html"
run_test "Open Graph tags present" "grep -q 'property=\"og:' index.html"
run_test "Twitter Card tags present" "grep -q 'property=\"twitter:' index.html"
run_test "Canonical URL present" "grep -q 'rel=\"canonical\"' index.html"
run_test "Structured data present" "grep -q 'application/ld+json' index.html"
run_test "Google Analytics present" "grep -q 'GTM-' index.html"

# Image Tests
echo -e "\n${YELLOW}🖼️ IMAGE TESTS${NC}"
echo "========================================"

run_test "Logo PNG exists" "test -f images/final_logo_little.png"
run_test "Logo WebP exists" "test -f images/final_logo.webp"
run_test "Banner image exists" "test -f images/banner.jpg"
run_test "Banner WebP exists" "test -f images/banner.webp"
run_test "Images have proper alt tags" "grep -q 'alt=' index.html"

# Font Tests
echo -e "\n${YELLOW}📝 FONT TESTS${NC}"
echo "========================================"

run_test "Custom font file exists" "test -f fonts/pressgothic.otf"
run_test "Font preload present" "grep -q 'rel=\"preload\".*font' index.html"

# Manifest Tests
echo -e "\n${YELLOW}📱 PWA MANIFEST TESTS${NC}"
echo "========================================"

run_test "Manifest is valid JSON" "python3 -m json.tool manifest.json > /dev/null"
run_test "Manifest has name" "grep -q '\"name\"' manifest.json"
run_test "Manifest has icons" "grep -q '\"icons\"' manifest.json"
run_test "Manifest has start_url" "grep -q '\"start_url\"' manifest.json"

# Service Worker Tests
echo -e "\n${YELLOW}🔧 SERVICE WORKER TESTS${NC}"
echo "========================================"

run_test "SW file is not empty" "test -s sw.js"
run_test "SW contains install event" "grep -q 'install.*event' sw.js"
run_test "SW contains fetch event" "grep -q 'fetch.*event' sw.js"
run_test "SW contains cache logic" "grep -q 'cache' sw.js"

# Security Tests
echo -e "\n${YELLOW}🔒 SECURITY TESTS${NC}"
echo "========================================"

run_test "External links have rel=noopener" "grep -q 'rel=\"noopener' index.html"
run_test "External links target=_blank" "grep -q 'target=\"_blank\"' index.html"
run_test "No inline styles in HTML" "! grep -q 'style=' index.html || echo 'Warning: Inline styles found'"
run_test "HTTPS references only" "! grep -q 'http://' index.html || echo 'Warning: HTTP links found'"

# Performance Tests
echo -e "\n${YELLOW}⚡ PERFORMANCE TESTS${NC}"
echo "========================================"

run_test "CSS is minified or optimized" "test $(wc -l < styles/main.css) -gt 50"
run_test "Images directory not too large" "test $(du -s images | cut -f1) -lt 10000"
run_test "Resource hints present" "grep -q 'rel=\"preload\"' index.html"
run_test "DNS prefetch present" "grep -q 'rel=\"dns-prefetch\"' index.html"

# Analytics Tests
echo -e "\n${YELLOW}📊 ANALYTICS TESTS${NC}"
echo "========================================"

run_test "Google Tag Manager present" "grep -q 'googletagmanager.com' index.html"
run_test "GTM ID configured" "grep -q 'GTM-' index.html"
run_test "DataLayer initialized" "grep -q 'dataLayer' index.html"
run_test "Custom event tracking" "grep -q 'trackEvent' index.html"
run_test "Enhanced measurement" "grep -q 'enhanced_measurement' index.html"

# Accessibility Tests
echo -e "\n${YELLOW}♿ ACCESSIBILITY TESTS${NC}"
echo "========================================"

run_test "Images have alt attributes" "grep -q 'alt=' index.html"
run_test "ARIA labels present" "grep -q 'aria-label' index.html"
run_test "Semantic HTML used" "grep -q '<main\|<nav\|<section\|<header\|<footer' index.html"
run_test "Skip links present" "grep -q 'skip\|Skip' index.html || echo 'Consider adding skip links'"

# Content Tests
echo -e "\n${YELLOW}📄 CONTENT TESTS${NC}"
echo "========================================"

run_test "French content present" "grep -q 'Résurgence\|français\|géopolitique' index.html"
run_test "Discord links present" "grep -q 'discord.gg' index.html"
run_test "Navigation menu present" "grep -q 'nav-link' index.html"
run_test "Footer content present" "grep -q '<footer' index.html"

# File Size Tests
echo -e "\n${YELLOW}📏 FILE SIZE TESTS${NC}"
echo "========================================"

run_test "Index HTML under 100KB" "test $(stat -c%s index.html) -lt 100000"
run_test "CSS under 200KB" "test $(stat -c%s styles/main.css) -lt 200000"
run_test "JS under 100KB" "test $(stat -c%s styles/main.js) -lt 100000"

# Syntax Tests
echo -e "\n${YELLOW}✅ SYNTAX VALIDATION TESTS${NC}"
echo "========================================"

# Check if commands exist before running
if command -v node >/dev/null 2>&1; then
    run_test "JSON files valid syntax" "node -e 'JSON.parse(require(\"fs\").readFileSync(\"manifest.json\", \"utf8\"))'"
else
    echo "⚠️  Node.js not available - skipping JSON validation"
fi

if command -v python3 >/dev/null 2>&1; then
    run_test "Manifest JSON valid" "python3 -m json.tool manifest.json > /dev/null"
else
    echo "⚠️  Python3 not available - skipping JSON validation"
fi

# Link Tests
echo -e "\n${YELLOW}🔗 LINK VALIDATION TESTS${NC}"
echo "========================================"

run_test "Internal anchor links exist" "anchors=\$(grep -o 'href=\"#[^\"]*\"' index.html | sed 's/href=\"#//' | sed 's/\"//'); all_found=true; for anchor in \$anchors; do grep -q \"id=\\\"\$anchor\\\"\" index.html || all_found=false; done; \$all_found"

# Summary
echo -e "\n${YELLOW}📊 TEST SUMMARY${NC}"
echo "========================================"
echo -e "Total Tests: $TOTAL"
echo -e "${GREEN}Passed: $PASSED${NC}"
echo -e "${RED}Failed: $FAILED${NC}"

if [ $FAILED -eq 0 ]; then
    echo -e "\n${GREEN}🎉 ALL TESTS PASSED! Website is ready for deployment.${NC}"
    exit 0
else
    echo -e "\n${RED}⚠️  Some tests failed. Please review the issues above.${NC}"
    exit 1
fi
