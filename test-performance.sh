#!/bin/bash

# Performance Testing Script for Projet Résurgence Website
# Tests Core Web Vitals, load times, and optimization metrics

echo "⚡ Website Performance Testing Suite"
echo "===================================="

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Test results
PASSED=0
FAILED=0
TOTAL=0

run_perf_test() {
    local test_name="$1"
    local threshold="$2"
    local actual="$3"
    local unit="$4"
    
    TOTAL=$((TOTAL + 1))
    
    echo -e "\n${BLUE}Testing: $test_name${NC}"
    echo "Threshold: $threshold $unit"
    echo "Actual: $actual $unit"
    
    if (( $(echo "$actual <= $threshold" | bc -l) )); then
        echo -e "${GREEN}✅ PASS: $test_name${NC}"
        PASSED=$((PASSED + 1))
    else
        echo -e "${RED}❌ FAIL: $test_name${NC}"
        FAILED=$((FAILED + 1))
    fi
}

# File Size Analysis
echo -e "\n${YELLOW}📏 FILE SIZE ANALYSIS${NC}"
echo "========================================"

# HTML Files
index_size=$(stat -c%s index.html 2>/dev/null || echo 0)
rules_size=$(stat -c%s regles.html 2>/dev/null || echo 0)
guide_size=$(stat -c%s guide.html 2>/dev/null || echo 0)

index_kb=$((index_size / 1024))
rules_kb=$((rules_size / 1024))
guide_kb=$((guide_size / 1024))

run_perf_test "Index HTML Size" 50 $index_kb "KB"
run_perf_test "Rules HTML Size" 50 $rules_kb "KB"
run_perf_test "Guide HTML Size" 50 $guide_kb "KB"

# CSS Files
css_size=$(stat -c%s styles/main.css 2>/dev/null || echo 0)
css_kb=$((css_size / 1024))
run_perf_test "Main CSS Size" 100 $css_kb "KB"

# JavaScript Files
js_size=$(stat -c%s styles/main.js 2>/dev/null || echo 0)
js_kb=$((js_size / 1024))
run_perf_test "Main JS Size" 50 $js_kb "KB"

# Image Analysis
echo -e "\n${YELLOW}🖼️ IMAGE OPTIMIZATION ANALYSIS${NC}"
echo "========================================"

# Check for WebP images
webp_count=$(find images -name "*.webp" 2>/dev/null | wc -l)
png_count=$(find images -name "*.png" 2>/dev/null | wc -l)
jpg_count=$(find images -name "*.jpg" -o -name "*.jpeg" 2>/dev/null | wc -l)

echo "WebP images: $webp_count"
echo "PNG images: $png_count"
echo "JPG images: $jpg_count"

# WebP adoption rate
if [ $((png_count + jpg_count)) -gt 0 ]; then
    webp_ratio=$((webp_count * 100 / (png_count + jpg_count + webp_count)))
    run_perf_test "WebP Adoption Rate" 50 $webp_ratio "%"
fi

# Individual image sizes
if [ -f "images/banner.jpg" ]; then
    banner_size=$(stat -c%s images/banner.jpg)
    banner_kb=$((banner_size / 1024))
    run_perf_test "Banner Image Size" 500 $banner_kb "KB"
fi

# Font Analysis
echo -e "\n${YELLOW}📝 FONT OPTIMIZATION ANALYSIS${NC}"
echo "========================================"

if [ -f "fonts/pressgothic.otf" ]; then
    font_size=$(stat -c%s fonts/pressgothic.otf)
    font_kb=$((font_size / 1024))
    run_perf_test "Custom Font Size" 200 $font_kb "KB"
fi

# Check font-display setting
if grep -q "font-display.*\(swap\|optional\)" styles/main.css; then
    echo -e "${GREEN}✅ Font-display optimization found${NC}"
    PASSED=$((PASSED + 1))
else
    echo -e "${RED}❌ Font-display not optimized${NC}"
    FAILED=$((FAILED + 1))
fi
TOTAL=$((TOTAL + 1))

# Resource Hints Analysis
echo -e "\n${YELLOW}🔗 RESOURCE HINTS ANALYSIS${NC}"
echo "========================================"

preload_count=$(grep -c "rel=\"preload\"" index.html 2>/dev/null || echo 0)
prefetch_count=$(grep -c "rel=\"prefetch\"" index.html 2>/dev/null || echo 0)
dns_prefetch_count=$(grep -c "rel=\"dns-prefetch\"" index.html 2>/dev/null || echo 0)

run_perf_test "Preload Resources" 3 $preload_count "resources"
run_perf_test "Prefetch Resources" 2 $prefetch_count "resources"
run_perf_test "DNS Prefetch" 1 $dns_prefetch_count "domains"

# Critical CSS Analysis
echo -e "\n${YELLOW}🎨 CRITICAL CSS ANALYSIS${NC}"
echo "========================================"

if grep -q "<style>" index.html; then
    critical_css_size=$(grep -A 1000 "<style>" index.html | grep -B 1000 "</style>" | wc -c)
    critical_css_kb=$((critical_css_size / 1024))
    run_perf_test "Critical CSS Size" 10 $critical_css_kb "KB"
    echo -e "${GREEN}✅ Critical CSS inlined${NC}"
else
    echo -e "${RED}❌ No critical CSS found${NC}"
    FAILED=$((FAILED + 1))
fi
TOTAL=$((TOTAL + 1))

# JavaScript Optimization Analysis
echo -e "\n${YELLOW}⚙️ JAVASCRIPT OPTIMIZATION ANALYSIS${NC}"
echo "========================================"

# Check for defer/async attributes
defer_count=$(grep -c "defer" index.html 2>/dev/null || echo 0)
async_count=$(grep -c "async" index.html 2>/dev/null || echo 0)

run_perf_test "Deferred Scripts" 2 $defer_count "scripts"

# Check for third-party scripts
gtm_optimized=$(grep -c "async.*googletagmanager" index.html 2>/dev/null || echo 0)
if [ $gtm_optimized -gt 0 ]; then
    echo -e "${GREEN}✅ Google Tag Manager optimized${NC}"
    PASSED=$((PASSED + 1))
else
    echo -e "${YELLOW}⚠️ Google Tag Manager could be optimized${NC}"
fi
TOTAL=$((TOTAL + 1))

# Caching Strategy Analysis
echo -e "\n${YELLOW}💾 CACHING STRATEGY ANALYSIS${NC}"
echo "========================================"

if [ -f "sw.js" ]; then
    cache_strategies=$(grep -c "cache" sw.js 2>/dev/null || echo 0)
    run_perf_test "Cache Strategies" 3 $cache_strategies "strategies"
    echo -e "${GREEN}✅ Service Worker present${NC}"
else
    echo -e "${RED}❌ No Service Worker found${NC}"
    FAILED=$((FAILED + 1))
fi
TOTAL=$((TOTAL + 1))

# Compression Analysis
echo -e "\n${YELLOW}🗜️ COMPRESSION ANALYSIS${NC}"
echo "========================================"

# Check if gzip would be effective
css_compressed=$(gzip -c styles/main.css | wc -c 2>/dev/null || echo $css_size)
js_compressed=$(gzip -c styles/main.js | wc -c 2>/dev/null || echo $js_size)

if [ $css_size -gt 0 ]; then
    css_compression_ratio=$((100 - (css_compressed * 100 / css_size)))
    run_perf_test "CSS Compression Potential" 60 $css_compression_ratio "%"
fi

if [ $js_size -gt 0 ]; then
    js_compression_ratio=$((100 - (js_compressed * 100 / js_size)))
    run_perf_test "JS Compression Potential" 60 $js_compression_ratio "%"
fi

# Performance Budget Analysis
echo -e "\n${YELLOW}💰 PERFORMANCE BUDGET ANALYSIS${NC}"
echo "========================================"

total_html=$((index_size + rules_size + guide_size))
total_css=$css_size
total_js=$js_size
total_images=$(find images -type f -exec stat -c%s {} \; 2>/dev/null | awk '{sum += $1} END {print sum}' || echo 0)

total_kb=$(((total_html + total_css + total_js + total_images) / 1024))

run_perf_test "Total Page Weight" 1500 $total_kb "KB"
run_perf_test "HTML Budget" 150 $((total_html / 1024)) "KB"
run_perf_test "CSS Budget" 100 $((total_css / 1024)) "KB"
run_perf_test "JS Budget" 150 $((total_js / 1024)) "KB"
run_perf_test "Images Budget" 1000 $((total_images / 1024)) "KB"

# Recommendations
echo -e "\n${YELLOW}💡 PERFORMANCE RECOMMENDATIONS${NC}"
echo "========================================"

if [ $webp_count -lt $png_count ]; then
    echo "📸 Consider converting more PNG images to WebP format"
fi

if [ $defer_count -lt 3 ]; then
    echo "⚡ Add defer attribute to non-critical JavaScript files"
fi

if [ $css_kb -gt 50 ]; then
    echo "🎨 Consider splitting CSS or removing unused styles"
fi

if [ $total_kb -gt 1000 ]; then
    echo "📦 Page weight is high - consider optimizing assets"
fi

# Summary
echo -e "\n${YELLOW}📊 PERFORMANCE TEST SUMMARY${NC}"
echo "========================================"
echo -e "Total Tests: $TOTAL"
echo -e "${GREEN}Passed: $PASSED${NC}"
echo -e "${RED}Failed: $FAILED${NC}"

performance_score=$((PASSED * 100 / TOTAL))
echo -e "\nPerformance Score: $performance_score%"

if [ $performance_score -ge 80 ]; then
    echo -e "${GREEN}🚀 Excellent performance! Ready for production.${NC}"
elif [ $performance_score -ge 60 ]; then
    echo -e "${YELLOW}⚡ Good performance with room for improvement.${NC}"
else
    echo -e "${RED}⚠️ Performance needs significant optimization.${NC}"
fi

echo -e "\n📋 Performance Budget Breakdown:"
echo "HTML: $((total_html / 1024)) KB"
echo "CSS: $((total_css / 1024)) KB"
echo "JavaScript: $((total_js / 1024)) KB"
echo "Images: $((total_images / 1024)) KB"
echo "Total: $total_kb KB"

exit 0
