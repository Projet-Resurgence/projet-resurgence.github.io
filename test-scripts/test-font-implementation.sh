#!/bin/bash

echo "🔍 Testing PressGothic Font Implementation for Projet Résurgence Titles"
echo "======================================================================"

# Check if font file exists
echo "📁 Checking font file..."
if [ -f "./fonts/pressgothic.otf" ]; then
    echo "✅ Found: ./fonts/pressgothic.otf"
else
    echo "❌ Missing: ./fonts/pressgothic.otf"
fi

echo ""
echo "🔍 Checking CSS font face declaration..."

if grep -q "@font-face" "./styles/main.css" && grep -q "PressGothic" "./styles/main.css"; then
    echo "✅ CSS: Font face declaration found"
else
    echo "❌ CSS: No font face declaration"
fi

echo ""
echo "🔍 Checking CSS variables for title font..."

if grep -E "\-\-font\-family\-title.*PressGothic" "./styles/main.css" > /dev/null; then
    echo "✅ CSS: Title font variable updated"
else
    echo "❌ CSS: Title font variable not updated"
fi

echo ""
echo "🔍 Checking logo-text class styling..."

if grep -A 5 "\.logo-text" "./styles/main.css" | grep -q "text-transform: uppercase"; then
    echo "✅ CSS: logo-text has uppercase transformation"
else
    echo "❌ CSS: logo-text missing uppercase transformation"
fi

if grep -A 5 "\.logo-text" "./styles/main.css" | grep -q "font-family.*--font-family-title"; then
    echo "✅ CSS: logo-text uses title font"
else
    echo "❌ CSS: logo-text not using title font"
fi

echo ""
echo "🔍 Checking hero-title class styling..."

if grep -A 8 "\.hero-title" "./styles/main.css" | grep -q "text-transform: uppercase"; then
    echo "✅ CSS: hero-title has uppercase transformation"
else
    echo "❌ CSS: hero-title missing uppercase transformation"
fi

if grep -A 8 "\.hero-title" "./styles/main.css" | grep -q "font-family.*--font-family-title"; then
    echo "✅ CSS: hero-title uses title font"
else
    echo "❌ CSS: hero-title not using title font"
fi

echo ""
echo "🔍 Checking project-title class for footer..."

if grep -q "\.project-title" "./styles/main.css"; then
    echo "✅ CSS: project-title class found"
    if grep -A 3 "\.project-title" "./styles/main.css" | grep -q "text-transform: uppercase"; then
        echo "✅ CSS: project-title has uppercase transformation"
    else
        echo "❌ CSS: project-title missing uppercase transformation"
    fi
else
    echo "❌ CSS: project-title class not found"
fi

echo ""
echo "🔍 Checking HTML files for capitalized titles..."

# Check logo-text spans
for file in index.html regles.html guide.html; do
    if grep -q 'class="logo-text">PROJET RÉSURGENCE</span>' "$file"; then
        echo "✅ $file: logo-text is capitalized"
    else
        echo "❌ $file: logo-text not capitalized"
    fi
done

# Check hero-title in index.html
if grep -q 'class="hero-title">PROJET RÉSURGENCE</h1>' "index.html"; then
    echo "✅ index.html: hero-title is capitalized"
else
    echo "❌ index.html: hero-title not capitalized"
fi

# Check footer project titles
for file in index.html regles.html guide.html; do
    if grep -q 'class="project-title">PROJET RÉSURGENCE</h3>' "$file"; then
        echo "✅ $file: footer project-title is capitalized"
    else
        echo "❌ $file: footer project-title not capitalized"
    fi
done

echo ""
echo "🔍 Checking font preload hints..."

for file in index.html regles.html guide.html; do
    if grep -q 'rel="preload".*pressgothic\.otf' "$file"; then
        echo "✅ $file: Font preload hint found"
    else
        echo "❌ $file: No font preload hint"
    fi
done

echo ""
echo "📊 Summary:"
echo "==========="

# Count total capitalized title instances
total_logo_texts=$(grep -l 'class="logo-text">PROJET RÉSURGENCE</span>' *.html 2>/dev/null | wc -l)
total_hero_titles=$(grep -l 'class="hero-title">PROJET RÉSURGENCE</h1>' *.html 2>/dev/null | wc -l)
total_footer_titles=$(grep -l 'class="project-title">PROJET RÉSURGENCE</h3>' *.html 2>/dev/null | wc -l)

echo "🔤 Capitalized logo-text instances: $total_logo_texts"
echo "🔤 Capitalized hero-title instances: $total_hero_titles"
echo "🔤 Capitalized footer project-title instances: $total_footer_titles"

# Check if all tests passed
if grep -q "@font-face" "./styles/main.css" && \
   grep -q "PressGothic" "./styles/main.css" && \
   grep -q "text-transform: uppercase" "./styles/main.css" && \
   [ "$total_logo_texts" -eq 3 ] && \
   [ "$total_hero_titles" -eq 1 ] && \
   [ "$total_footer_titles" -eq 3 ]; then
    echo "🎉 PressGothic font successfully implemented for all Projet Résurgence titles!"
else
    echo "⚠️  Some optimizations may be missing. Review the results above."
fi
