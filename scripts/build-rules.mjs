#!/usr/bin/env node
/**
 * One-off authoring tool: converts rules/*.md into the static HTML pasted
 * into regles.html. Not loaded by any page — run manually after editing a
 * rules/*.md file, then paste the printed HTML back into regles.html.
 *
 * Usage: node scripts/build-rules.mjs
 */
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const rulesDir = join(__dirname, "..", "rules");

const CATEGORIES = [
  {
    key: "hrp",
    file: "hrp.md",
    name: "HRP (Hors Roleplay)",
    icon: "💬",
    description: "Règles pour les discussions hors roleplay et la modération",
  },
  {
    key: "rp",
    file: "rp.md",
    name: "Roleplay",
    icon: "🎭",
    description: "Directives pour le roleplay, création de nations et interactions RP",
  },
  {
    key: "economique",
    file: "economique.md",
    name: "Économique",
    icon: "💰",
    description: "Mécaniques économiques, PIB, inflation et commerce",
  },
  {
    key: "technologique",
    file: "technologique.md",
    name: "Technologique",
    icon: "⚙️",
    description: "Système de recherche, brevets et développement technologique",
  },
  {
    key: "militaire",
    file: "militaire.md",
    name: "Militaire & Conflits",
    icon: "⚔️",
    description: "Règles concernant les guerres, batailles et opérations militaires",
  },
  {
    key: "territorial",
    file: "territorial.md",
    name: "Territorial",
    icon: "🗺️",
    description: "Gestion des territoires, frontières et expansions géographiques",
  },
];

function slugify(text) {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function escapeAttr(s) {
  return s.replace(/"/g, "&quot;");
}

function escapeHtml(s) {
  return s.replace(/&/g, "&amp;");
}

// Same conversions as the old scripts/markdown-parser.js, minus the
// index-based heading ids (replaced with stable, category-prefixed slugs).
function parseMarkdown(markdown, categoryKey) {
  const toc = [];

  let html = markdown
    // Headings: single ordered pass (up to ####) so the TOC matches
    // document order (running each level as a separate .replace() call
    // would push deeper-level entries before earlier shallower ones into
    // the toc array, and previously silently dropped #### entirely).
    .replace(/^(#{1,4}) (.+)$/gm, (_, hashes, text) => {
      const level = hashes.length;
      // Drop the markdown's top-level "# Règlement XXX" heading entirely —
      // the category section already has its own <h2 class="category-title">
      // with the same name, and the page must keep a single page-level <h1>
      // (the hero title), not one per category.
      if (level === 1) return "";
      const id = `${categoryKey}-${slugify(text)}`;
      toc.push({ level, id, text });
      const cls = level === 2 ? "rule-section" : "rule-subsection";
      const tag = `h${level}`;
      return `<${tag} class="${cls}" id="${id}">${text}</${tag}>`;
    })
    .replace(/^---+$/gm, "<hr class=\"rule-divider\">")
    // Warning/example call-outs before the generic bold pass consumes
    // the leading "**" they rely on to match.
    .replace(/\*\*⚠️(.+?)\*\*/g, '<div class="rule-warning"><strong>⚠️$1</strong></div>')
    .replace(/\*\*Exemple\s?:\*\*(.+?)$/gm, '<div class="rule-example"><strong>Exemple :</strong>$1</div>')
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*([^*]+?)\*/g, "<em>$1</em>")
    .replace(/_([^_]+?)_/g, "<em>$1</em>")
    .replace(/^- (.+)$/gm, "<li>$1</li>")
    // Collapse the newline strictly between two adjacent <li> lines so the
    // (non-dotAll) ul-wrap regex below sees them as one contiguous run —
    // multi-line lists were silently left unwrapped (a bug inherited from
    // the original client-side markdown-parser.js) otherwise.
    .replace(/<\/li>\n(?=<li>)/g, "</li>")
    .replace(/`(.+?)`/g, "<code>$1</code>")
    .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>')
    .replace(/\n\n/g, "</p><p>");

  // Lazy .*? bounds each <li> to its own nearest closing tag — the original
  // greedy .* (inherited from markdown-parser.js) would swallow every
  // unrelated heading/paragraph between this list and the LAST <li> later
  // in the whole category, since nothing here contains literal newlines
  // to stop it.
  html = html.replace(/((?:<li>.*?<\/li>\s*)+)/g, '<ul class="rule-list">$1</ul>');
  html = "<p>" + html + "</p>";
  html = html
    .replace(/<p><\/p>/g, "")
    .replace(/<p>(<h[1-6])/g, "$1")
    .replace(/(<\/h[1-6]>)<\/p>/g, "$1")
    .replace(/<p>(<ul|<div|<hr)/g, "$1")
    .replace(/(<\/ul>|<\/div>|<hr class="rule-divider">)<\/p>/g, "$1");

  return { html, toc };
}

function renderToc(toc) {
  if (toc.length === 0) return "";
  const items = toc
    .map((h) => `<li class="toc-level-${h.level}"><a href="#${h.id}">${h.text}</a></li>`)
    .join("\n                    ");
  return `<nav class="table-of-contents" aria-label="Sommaire">
                <h3>Sommaire</h3>
                <ul class="toc-list">
                    ${items}
                </ul>
            </nav>`;
}

function renderCategory(cat) {
  const markdown = readFileSync(join(rulesDir, cat.file), "utf-8");
  const { html, toc } = parseMarkdown(markdown, cat.key);

  return `        <section id="${cat.key}" class="rule-category-section" aria-labelledby="${cat.key}-heading">
            <div class="rule-header">
                <div class="rule-category-info">
                    <span class="category-icon" aria-hidden="true">${cat.icon}</span>
                    <div class="category-details">
                        <h2 class="category-title" id="${cat.key}-heading">${escapeHtml(cat.name)}</h2>
                        <p class="category-description">${escapeAttr(cat.description)}</p>
                    </div>
                </div>
            </div>
            <div class="rule-content-wrapper">
                ${renderToc(toc)}
                <div class="rule-content">
                    ${html}
                </div>
            </div>
        </section>`;
}

// Wiki-style layout: sticky left sidebar (categories) + scrollable right
// column (all 6 categories' full content, stacked). The sidebar is sticky
// relative to this two-column grid, not the whole page, so it never overlaps
// the text scrolling in the right column.
const sidebar = `        <nav class="rules-sidebar" aria-label="Catégories de règles">
${CATEGORIES.map(
  (c) => `            <a href="#${c.key}" class="rules-sidebar-link"><span aria-hidden="true">${c.icon}</span> ${escapeHtml(c.name)}</a>`
).join("\n")}
        </nav>`;

const sections = CATEGORIES.map(renderCategory).join("\n\n");

console.log(
  `        <div class="rules-layout">\n${sidebar}\n            <div class="rules-content">\n${sections}\n            </div>\n        </div>`
);
