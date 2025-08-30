#!/bin/bash

echo "🔍 Testing Modern Image Format Implementation"
echo "============================================="

# Check if all required image files exist
echo "📁 Checking image files..."
for format in avif webp png; do
    for image in banner final_logo final_logo_centered; do
        file="./images/${image}.${format}"
        if [ -f "$file" ]; then
            echo "✅ Found: $file"
        else
            echo "❌ Missing: $file"
        fi
    done
done

echo ""
echo "🔍 Checking HTML files for picture elements..."

# Check for picture elements in HTML files
for file in index.html regles.html guide.html; do
    if grep -q "<picture>" "$file"; then
        echo "✅ $file: Contains picture elements"
        picture_count=$(grep -c "<picture>" "$file")
        echo "   📊 Found $picture_count picture element(s)"
    else
        echo "❌ $file: No picture elements found"
    fi
done

echo ""
echo "🔍 Checking for WebP sources in picture elements..."

for file in index.html regles.html guide.html; do
    if grep -q 'srcset=".*\.webp"' "$file"; then
        echo "✅ $file: Contains WebP sources"
    else
        echo "❌ $file: No WebP sources found"
    fi
done

echo ""
echo "🔍 Checking CSS for modern image format support..."

if grep -q "@supports.*background-image.*webp" "./styles/main.css"; then
    echo "✅ CSS: WebP support detection found"
else
    echo "❌ CSS: No WebP support detection"
fi

if grep -q "@supports.*background-image.*avif" "./styles/main.css"; then
    echo "✅ CSS: AVIF support detection found"
else
    echo "❌ CSS: No AVIF support detection"
fi

echo ""
echo "🔍 Checking Service Worker for modern formats..."

if grep -q "banner\.webp\|banner\.avif" "./sw.js"; then
    echo "✅ Service Worker: Modern banner formats cached"
else
    echo "❌ Service Worker: Modern banner formats not cached"
fi

if grep -q "logo.*\.webp" "./sw.js"; then
    echo "✅ Service Worker: WebP logo formats cached"
else
    echo "❌ Service Worker: WebP logo formats not cached"
fi

echo ""
echo "🔍 Checking preload hints for modern formats..."

for file in index.html regles.html guide.html; do
    if grep -q 'rel="preload".*type="image/webp"' "$file"; then
        echo "✅ $file: WebP preload hints found"
    else
        echo "❌ $file: No WebP preload hints"
    fi
done

echo ""
echo "📊 Summary:"
echo "==========="

# Count total picture elements
total_pictures=$(grep -c "<picture>" *.html 2>/dev/null || echo "0")
echo "🖼️  Total picture elements: $total_pictures"

# Count total image files
total_images=$(ls images/*.{avif,webp,png} 2>/dev/null | wc -l)
echo "📁 Total image files: $total_images"

# Check if all tests passed
if grep -q "<picture>" *.html && grep -q "@supports.*webp" "./styles/main.css" && grep -q "webp" "./sw.js"; then
    echo "🎉 Modern image formats successfully implemented!"
else
    echo "⚠️  Some optimizations may be missing. Review the results above."
fi
