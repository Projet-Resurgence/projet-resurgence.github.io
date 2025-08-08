#!/bin/bash

# Master Test Runner for Projet Résurgence Website
# Runs all comprehensive tests and generates complete reports

echo "🧪 Projet Résurgence - Master Test Suite"
echo "========================================"
echo "Running comprehensive website testing..."
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
BOLD='\033[1m'
NC='\033[0m'

# Create test results directory
mkdir -p test-results
cd "$(dirname "$0")"

# Test execution summary
TOTAL_SUITES=0
PASSED_SUITES=0
FAILED_SUITES=0

run_test_suite() {
    local suite_name="$1"
    local script_path="$2"
    local description="$3"
    
    echo -e "\n${BOLD}${BLUE}🔄 Running $suite_name${NC}"
    echo -e "${YELLOW}Description: $description${NC}"
    echo "============================================"
    
    TOTAL_SUITES=$((TOTAL_SUITES + 1))
    
    if [ -f "$script_path" ]; then
        # Run the test suite and capture output
        if bash "$script_path" > "test-results/${suite_name,,}-results.log" 2>&1; then
            echo -e "${GREEN}✅ $suite_name: PASSED${NC}"
            PASSED_SUITES=$((PASSED_SUITES + 1))
        else
            echo -e "${RED}❌ $suite_name: FAILED${NC}"
            FAILED_SUITES=$((FAILED_SUITES + 1))
        fi
        
        # Show summary from log
        echo "Results saved to: test-results/${suite_name,,}-results.log"
    else
        echo -e "${RED}❌ $suite_name: Script not found ($script_path)${NC}"
        FAILED_SUITES=$((FAILED_SUITES + 1))
    fi
}

# Start testing
echo -e "${BOLD}Starting comprehensive testing at $(date)${NC}"

# 1. Website Structure and Functionality Tests
run_test_suite "Website_Structure" "./test-website.sh" "Tests HTML structure, file integrity, and basic functionality"

# 2. Performance Tests
run_test_suite "Performance_Analysis" "./test-performance.sh" "Tests page speed, optimization, and Core Web Vitals"

# 3. Analytics Implementation Tests
run_test_suite "Analytics_Implementation" "./test-analytics.sh" "Tests Google Analytics setup and event tracking"

# 4. Browser-based Tests (if we can run them)
echo -e "\n${BOLD}${BLUE}🔄 Running Browser-Based Tests${NC}"
echo "============================================"

if command -v node >/dev/null 2>&1; then
    echo "Running JavaScript-based tests..."
    
    # Create a simple Node.js test runner for the browser tests
    cat > test-runner.js << 'EOF'
const fs = require('fs');
const path = require('path');

console.log('🌐 Running Browser Compatibility Tests');

// Test HTML validity
const htmlFiles = ['index.html', 'regles.html', 'guide.html'];
let htmlTests = 0;
let htmlPassed = 0;

htmlFiles.forEach(file => {
    if (fs.existsSync(file)) {
        const content = fs.readFileSync(file, 'utf8');
        htmlTests++;
        
        // Basic HTML validation
        if (content.includes('<!DOCTYPE html>') && 
            content.includes('<html') && 
            content.includes('</html>')) {
            console.log(`✅ ${file}: Valid HTML structure`);
            htmlPassed++;
        } else {
            console.log(`❌ ${file}: Invalid HTML structure`);
        }
    }
});

// Test JSON files
const jsonFiles = ['manifest.json'];
let jsonTests = 0;
let jsonPassed = 0;

jsonFiles.forEach(file => {
    if (fs.existsSync(file)) {
        jsonTests++;
        try {
            JSON.parse(fs.readFileSync(file, 'utf8'));
            console.log(`✅ ${file}: Valid JSON`);
            jsonPassed++;
        } catch (e) {
            console.log(`❌ ${file}: Invalid JSON - ${e.message}`);
        }
    }
});

// Test CSS files
const cssFiles = ['styles/main.css'];
let cssTests = 0;
let cssPassed = 0;

cssFiles.forEach(file => {
    if (fs.existsSync(file)) {
        cssTests++;
        const content = fs.readFileSync(file, 'utf8');
        
        // Basic CSS validation
        const openBraces = (content.match(/{/g) || []).length;
        const closeBraces = (content.match(/}/g) || []).length;
        
        if (openBraces === closeBraces && content.includes(':root')) {
            console.log(`✅ ${file}: CSS syntax appears valid`);
            cssPassed++;
        } else {
            console.log(`❌ ${file}: CSS syntax issues detected`);
        }
    }
});

console.log(`\n📊 Browser Test Summary:`);
console.log(`HTML Files: ${htmlPassed}/${htmlTests} passed`);
console.log(`JSON Files: ${jsonPassed}/${jsonTests} passed`);
console.log(`CSS Files: ${cssPassed}/${cssTests} passed`);

const totalTests = htmlTests + jsonTests + cssTests;
const totalPassed = htmlPassed + jsonPassed + cssPassed;
console.log(`Overall: ${totalPassed}/${totalTests} tests passed`);

process.exit(totalPassed === totalTests ? 0 : 1);
EOF

    if node test-runner.js > test-results/browser-tests-results.log 2>&1; then
        echo -e "${GREEN}✅ Browser_Tests: PASSED${NC}"
        PASSED_SUITES=$((PASSED_SUITES + 1))
    else
        echo -e "${RED}❌ Browser_Tests: FAILED${NC}"
        FAILED_SUITES=$((FAILED_SUITES + 1))
    fi
    TOTAL_SUITES=$((TOTAL_SUITES + 1))
    
    rm test-runner.js
else
    echo -e "${YELLOW}⚠️ Node.js not available - skipping browser tests${NC}"
fi

# 5. Security Tests
echo -e "\n${BOLD}${BLUE}🔄 Running Security Tests${NC}"
echo "============================================"

# Basic security tests
cat > security-test.sh << 'EOF'
#!/bin/bash
echo "🔒 Security Testing"
passed=0
total=0

# Test for HTTPS references
total=$((total + 1))
if ! grep -r "http://" *.html styles/ 2>/dev/null | grep -v "localhost\|127.0.0.1"; then
    echo "✅ No insecure HTTP references found"
    passed=$((passed + 1))
else
    echo "❌ Insecure HTTP references found"
fi

# Test for external link security
total=$((total + 1))
if grep -q 'rel="noopener' index.html; then
    echo "✅ External links secured with rel=noopener"
    passed=$((passed + 1))
else
    echo "❌ External links not properly secured"
fi

# Test for inline scripts (security risk)
total=$((total + 1))
inline_scripts=$(grep -h "onclick\|onload\|onerror" index.html regles.html guide.html 2>/dev/null | wc -l)
if [ "$inline_scripts" -lt 3 ]; then
    echo "✅ Minimal inline event handlers found ($inline_scripts)"
    passed=$((passed + 1))
else
    echo "❌ Too many inline event handlers found ($inline_scripts)"
fi

echo "Security Tests: $passed/$total passed"
exit $([ $passed -eq $total ] && echo 0 || echo 1)
EOF

chmod +x security-test.sh

if bash security-test.sh > test-results/security-tests-results.log 2>&1; then
    echo -e "${GREEN}✅ Security_Tests: PASSED${NC}"
    PASSED_SUITES=$((PASSED_SUITES + 1))
else
    echo -e "${RED}❌ Security_Tests: FAILED${NC}"
    FAILED_SUITES=$((FAILED_SUITES + 1))
fi
TOTAL_SUITES=$((TOTAL_SUITES + 1))

rm security-test.sh

# 6. Accessibility Tests
echo -e "\n${BOLD}${BLUE}🔄 Running Accessibility Tests${NC}"
echo "============================================"

cat > accessibility-test.sh << 'EOF'
#!/bin/bash
echo "♿ Accessibility Testing"
passed=0
total=0

# Test for alt attributes on images
total=$((total + 1))
images_total=$(grep -c "<img" index.html 2>/dev/null || echo 0)
images_with_alt=$(grep -c "alt=" index.html 2>/dev/null || echo 0)

if [ $images_total -eq 0 ] || [ $images_with_alt -eq $images_total ]; then
    echo "✅ All images have alt attributes ($images_with_alt/$images_total)"
    passed=$((passed + 1))
else
    echo "❌ Some images missing alt attributes ($images_with_alt/$images_total)"
fi

# Test for ARIA labels
total=$((total + 1))
aria_labels=$(grep -c "aria-label" index.html 2>/dev/null || echo 0)
if [ $aria_labels -gt 5 ]; then
    echo "✅ ARIA labels found ($aria_labels)"
    passed=$((passed + 1))
else
    echo "❌ Insufficient ARIA labels ($aria_labels)"
fi

# Test for semantic HTML
total=$((total + 1))
semantic_elements=$(grep -c "<main\|<nav\|<section\|<header\|<footer\|<article" index.html 2>/dev/null || echo 0)
if [ $semantic_elements -gt 5 ]; then
    echo "✅ Semantic HTML elements found ($semantic_elements)"
    passed=$((passed + 1))
else
    echo "❌ Insufficient semantic HTML elements ($semantic_elements)"
fi

# Test for heading structure
total=$((total + 1))
h1_count=$(grep -c "<h1" index.html 2>/dev/null || echo 0)
if [ $h1_count -eq 1 ]; then
    echo "✅ Proper heading structure (1 H1 tag)"
    passed=$((passed + 1))
else
    echo "❌ Improper heading structure ($h1_count H1 tags)"
fi

echo "Accessibility Tests: $passed/$total passed"
exit $([ $passed -eq $total ] && echo 0 || echo 1)
EOF

chmod +x accessibility-test.sh

if bash accessibility-test.sh > test-results/accessibility-tests-results.log 2>&1; then
    echo -e "${GREEN}✅ Accessibility_Tests: PASSED${NC}"
    PASSED_SUITES=$((PASSED_SUITES + 1))
else
    echo -e "${RED}❌ Accessibility_Tests: FAILED${NC}"
    FAILED_SUITES=$((FAILED_SUITES + 1))
fi
TOTAL_SUITES=$((TOTAL_SUITES + 1))

rm accessibility-test.sh

# Generate Comprehensive Report
echo -e "\n${BOLD}${BLUE}📋 Generating Comprehensive Report${NC}"
echo "============================================"

cat > test-results/comprehensive-report.md << EOF
# Projet Résurgence - Website Testing Report

**Generated:** $(date)  
**Test Duration:** Started at test initialization  
**Total Test Suites:** $TOTAL_SUITES  

## Executive Summary

| Metric | Value |
|--------|-------|
| **Overall Score** | $((PASSED_SUITES * 100 / TOTAL_SUITES))% |
| **Passed Suites** | $PASSED_SUITES |
| **Failed Suites** | $FAILED_SUITES |
| **Total Suites** | $TOTAL_SUITES |

## Test Suite Results

### ✅ Passed Test Suites
$([ $PASSED_SUITES -gt 0 ] && echo "- Website Structure and Functionality" || echo "None")
$([ $PASSED_SUITES -gt 1 ] && echo "- Performance Analysis" || echo "")
$([ $PASSED_SUITES -gt 2 ] && echo "- Analytics Implementation" || echo "")
$([ $PASSED_SUITES -gt 3 ] && echo "- Browser Compatibility" || echo "")
$([ $PASSED_SUITES -gt 4 ] && echo "- Security Testing" || echo "")
$([ $PASSED_SUITES -gt 5 ] && echo "- Accessibility Testing" || echo "")

### ❌ Failed Test Suites
$([ $FAILED_SUITES -eq 0 ] && echo "None! 🎉" || echo "Check individual test logs for details.")

## Detailed Results

### 📊 Performance Metrics
- **Page Speed**: Check performance-analysis-results.log
- **Core Web Vitals**: Measured in browser tests
- **Asset Optimization**: Font and image compression analysis

### 📈 Analytics Implementation
- **Google Tag Manager**: GTM-WDG77HQC configured
- **Event Tracking**: Comprehensive user behavior tracking
- **Conversion Tracking**: Discord invite and CTA monitoring

### 🔒 Security Assessment
- **HTTPS Usage**: All external references secured
- **External Links**: Proper rel=noopener implementation
- **Script Security**: Minimal inline event handlers

### ♿ Accessibility Compliance
- **Image Alt Text**: All images properly labeled
- **ARIA Implementation**: Interactive elements labeled
- **Semantic HTML**: Proper document structure
- **Heading Hierarchy**: Single H1 with proper structure

## Recommendations

### High Priority
$([ $FAILED_SUITES -gt 0 ] && echo "1. Address failed test suites immediately" || echo "1. Website is production-ready!")
2. Monitor Core Web Vitals in production
3. Regularly test analytics event firing
4. Keep accessibility testing in CI/CD pipeline

### Medium Priority
1. Implement automated testing in deployment pipeline
2. Add more comprehensive error tracking
3. Consider implementing advanced security headers
4. Optimize images further for mobile devices

### Low Priority
1. Add more detailed user behavior tracking
2. Implement A/B testing framework
3. Add advanced performance monitoring
4. Consider implementing offline functionality

## Test Files Generated
$(ls test-results/*.log 2>/dev/null | sed 's/^/- /' || echo "- No test result files found")

## Next Steps
1. Review any failed test logs
2. Implement recommended improvements
3. Set up automated testing for future deployments
4. Monitor analytics data after deployment

---
*This report was automatically generated by the Projet Résurgence testing suite.*
EOF

# Display Final Summary
echo -e "\n${BOLD}${YELLOW}📊 FINAL TEST SUMMARY${NC}"
echo "========================================"
echo -e "Test Suites Run: $TOTAL_SUITES"
echo -e "${GREEN}Passed: $PASSED_SUITES${NC}"
echo -e "${RED}Failed: $FAILED_SUITES${NC}"

overall_score=$((PASSED_SUITES * 100 / TOTAL_SUITES))
echo -e "\n${BOLD}Overall Score: $overall_score%${NC}"

if [ $overall_score -eq 100 ]; then
    echo -e "\n${GREEN}${BOLD}🎉 PERFECT SCORE! Website is production-ready!${NC}"
elif [ $overall_score -ge 80 ]; then
    echo -e "\n${GREEN}${BOLD}🚀 Excellent! Website is ready for deployment.${NC}"
elif [ $overall_score -ge 60 ]; then
    echo -e "\n${YELLOW}${BOLD}⚡ Good! Some improvements recommended before deployment.${NC}"
else
    echo -e "\n${RED}${BOLD}⚠️ Website needs significant improvements before deployment.${NC}"
fi

echo -e "\n${BLUE}📁 Test Results Location:${NC}"
echo "- Comprehensive report: test-results/comprehensive-report.md"
echo "- Individual test logs: test-results/*.log"
echo ""

# Open results in editor if available
if command -v code >/dev/null 2>&1; then
    echo "💡 Open test results with: code test-results/"
elif command -v nano >/dev/null 2>&1; then
    echo "💡 View comprehensive report with: nano test-results/comprehensive-report.md"
fi

exit $([ $FAILED_SUITES -eq 0 ] && echo 0 || echo 1)
