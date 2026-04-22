/**
 * Static Site Generator - Build Orchestration
 *
 * Responsibilities:
 * - clean output directory
 * - load content pages
 * - build site graph
 * - generate HTML pages
 * - copy static assets
 * - minify final output
 */

import * as fs from "node:fs";
import path from "node:path";
import { globSync } from "glob";

import { renderPage } from "../core/renderer.js";
import { preprocessPage } from "../core/block-processors.js";
import { minifyDirectory } from "./minify.js";
import { readPortfolioConfig } from "./portfolio-config.js";
import { resolveContentConfigReferences } from "./content-resolver.js";
import { buildSiteGraph, outputPathFor } from "./site-graph.js";
import {
  generateNavigation,
  generateBreadcrumb,
  generateRelatedPages
} from "./navigation.js";
import { copyDir } from "./assets.js";

const CONTENT_DIR = "src/content";
const OUTPUT_DIR = "public";
const TEMPLATE_ROOT_DIR = "templates";
const CORE_RUNTIME_SOURCE_DIR = path.join("scripts", "core", "runtime");
const CORE_RUNTIME_OUTPUT_DIR = path.join(OUTPUT_DIR, "assets", "core", "js");
const CORE_RUNTIME_SCRIPTS = [{ src: "assets/core/js/runtime.js", module: true }];
const BASE_PATH = process.env.BASE_PATH || "";
const buildCliOptions = parseBuildCliOptions(process.argv.slice(2));

const portfolioConfig = readPortfolioConfig();
const siteData = portfolioConfig.site || {};
const siteBranding = siteData?.branding || {};
const SITE_TITLE = siteData?.title || "My Static Site";
const templateCache = new Map();
const templateManifestCache = new Map();
const usedTemplateNames = new Set();
const referencedPublicAssetPaths = new Set();

function parseBuildCliOptions(args) {
  const options = { page: "" };
  for (let index = 0; index < args.length; index += 1) {
    const arg = String(args[index] || "");
    if (arg === "--page") {
      const next = String(args[index + 1] || "").trim();
      if (!next || next.startsWith("--")) {
        throw new Error('Missing value for "--page". Example: npm run build:page -- src/content/1-news/1/1-post-1.json');
      }
      options.page = next;
      index += 1;
      continue;
    }
    if (arg === "--help" || arg === "-h") {
      console.log([
        "Usage:",
        "  node scripts/builders/build.js",
        "  node scripts/builders/build.js --page <content-json-path>"
      ].join("\n"));
      process.exit(0);
    }
    throw new Error(`Unknown build option: ${arg}`);
  }
  return options;
}

function normalizeFileSystemPath(filePath) {
  return path.resolve(String(filePath || "")).replace(/\\/g, "/").toLowerCase();
}

function selectPagesToRender(pages, pageArg) {
  if (!pageArg) return pages;

  const normalizedRequested = normalizeFileSystemPath(pageArg);
  const match = pages.find((page) => normalizeFileSystemPath(page.file) === normalizedRequested);

  if (!match) {
    throw new Error(
      `Single-page build target not found: ${pageArg}\nExpected a content JSON path such as "src/content/1-news/1/1-post-1.json".`
    );
  }

  console.log(`Single-page build mode enabled for ${match.file}`);
  return [match];
}

function cleanDirectoryContents(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
  for (const entry of fs.readdirSync(dirPath, { withFileTypes: true })) {
    const entryPath = path.join(dirPath, entry.name);
    fs.rmSync(entryPath, { recursive: true, force: true, maxRetries: 3, retryDelay: 100 });
  }
}

cleanDirectoryContents(OUTPUT_DIR);
console.log("Output directory cleaned");

function applyTemplate(template, variables) {
  return template.replaceAll(/{{(\w+)}}/g, (_, key) => variables[key] ?? "");
}

function loadTemplate(templatePath) {
  if (!templateCache.has(templatePath)) {
    templateCache.set(templatePath, fs.readFileSync(templatePath, "utf-8"));
  }
  return templateCache.get(templatePath);
}

function normalizeRelativeAssetPath(assetPath, kind = "asset") {
  const normalized = String(assetPath || "").trim().replace(/\\/g, "/");
  if (!normalized || normalized.includes("..")) {
    throw new Error(`Invalid ${kind} path "${assetPath}"`);
  }
  if (normalized.startsWith("/")) {
    throw new Error(`Template ${kind} paths must be relative: "${assetPath}"`);
  }
  return normalized;
}

function normalizeTemplateName(templateName) {
  const normalized = String(templateName || "").trim();
  if (!/^[a-z0-9-]+$/.test(normalized)) {
    throw new Error(
      `Invalid template name "${templateName}". Use lowercase letters, numbers, and '-'.`
    );
  }
  return normalized;
}

function resolveTemplateDefinition(templateName) {
  const defaultTemplateName = normalizeTemplateName(
    portfolioConfig.templates?.default || "default"
  );
  const selectedTemplateName = normalizeTemplateName(templateName || defaultTemplateName);
  if (templateManifestCache.has(selectedTemplateName)) {
    return templateManifestCache.get(selectedTemplateName);
  }

  const templateDir = path.join(TEMPLATE_ROOT_DIR, selectedTemplateName);
  const templateConfigPath = path.join(templateDir, "template-config.json");

  if (fs.existsSync(templateConfigPath)) {
    const raw = JSON.parse(fs.readFileSync(templateConfigPath, "utf-8"));
    if (!raw.html) {
      throw new Error(`Template "${selectedTemplateName}" is missing required "html" in template-config.json`);
    }
    const htmlRelativePath = normalizeRelativeAssetPath(raw.html, "template html");
    const definition = {
      name: selectedTemplateName,
      dir: templateDir,
      htmlPath: path.join(templateDir, htmlRelativePath),
      styles: Array.isArray(raw.styles) ? raw.styles : [],
      scripts: Array.isArray(raw.scripts) ? raw.scripts : []
    };
    templateManifestCache.set(selectedTemplateName, definition);
    return definition;
  }

  throw new Error(
    `Template "${selectedTemplateName}" not found. Expected "${templateConfigPath}".`
  );
}

function normalizeAssetHref(assetPath) {
  if (!assetPath) return null;
  const normalized = String(assetPath).trim().replace(/\\/g, "/");
  if (!normalized || normalized.includes("..")) {
    throw new Error(`Invalid asset path "${assetPath}"`);
  }

  if (/^https?:\/\//i.test(normalized)) {
    return normalized;
  }

  if (normalized.startsWith("/")) {
    return `${BASE_PATH}${normalized}`;
  }

  return `${BASE_PATH}/${normalized}`;
}

function normalizeTemplateAssetHref(templateDefinition, assetPath, kind = "asset") {
  const normalized = String(assetPath || "").trim().replace(/\\/g, "/");
  if (/^https?:\/\//i.test(normalized) || normalized.startsWith("/")) {
    return normalizeAssetHref(normalized);
  }

  const relative = normalizeRelativeAssetPath(normalized, kind);
  return normalizeAssetHref(`assets/templates/${templateDefinition.name}/${relative}`);
}

function resolveBrandingAssets() {
  const logo = siteBranding?.logo || {};
  return {
    faviconHref: normalizeAssetHref(siteBranding?.favicon || "assets/icons/favicon-reprofolio-grid.svg"),
    logoSrc: normalizeAssetHref(logo.src || "assets/images/branding/logo-reprofolio-grid.svg"),
    logoAlt: String(logo.alt || `${SITE_TITLE} logo`).trim() || `${SITE_TITLE} logo`
  };
}

const brandingAssets = resolveBrandingAssets();

function unique(items) {
  return [...new Set(items)];
}

function uniqueScriptEntries(entries) {
  const seen = new Set();
  const output = [];

  for (const entry of entries) {
    const key = `${entry.src}|${entry.module ? "m" : "c"}`;
    if (seen.has(key)) continue;
    seen.add(key);
    output.push(entry);
  }

  return output;
}

function normalizeScriptEntry(entry) {
  if (typeof entry === "string") {
    return {
      src: normalizeAssetHref(entry),
      module: false
    };
  }

  if (entry && typeof entry === "object") {
    if (!entry.src) {
      throw new Error(`Invalid script entry: ${JSON.stringify(entry)}`);
    }
    return {
      src: normalizeAssetHref(entry.src),
      module: Boolean(entry.module)
    };
  }

  throw new Error(`Unsupported script entry type: ${typeof entry}`);
}

function normalizeTemplateScriptEntry(templateDefinition, entry) {
  if (typeof entry === "string") {
    return {
      src: normalizeTemplateAssetHref(templateDefinition, entry, "script"),
      module: false
    };
  }

  if (entry && typeof entry === "object") {
    if (!entry.src) {
      throw new Error(`Invalid template script entry: ${JSON.stringify(entry)}`);
    }
    return {
      src: normalizeTemplateAssetHref(templateDefinition, entry.src, "script"),
      module: Boolean(entry.module)
    };
  }

  throw new Error(`Unsupported template script entry type: ${typeof entry}`);
}

function resolvePageAssets(pageJson) {
  const presentation = pageJson.presentation || {};
  const templateDefinition = resolveTemplateDefinition(presentation.template || null);
  const customStyles = Array.isArray(portfolioConfig.custom?.styles) ? portfolioConfig.custom.styles : [];
  const customScripts = Array.isArray(portfolioConfig.custom?.scripts) ? portfolioConfig.custom.scripts : [];
  const coreRuntimeScripts = CORE_RUNTIME_SCRIPTS.map(normalizeScriptEntry);

  const templateStyleHrefs = (templateDefinition.styles || []).map((assetPath) =>
    normalizeTemplateAssetHref(templateDefinition, assetPath, "style")
  );
  const baseStyles = templateStyleHrefs;
  const baseTemplateScripts = (templateDefinition.scripts || []).map((entry) =>
    normalizeTemplateScriptEntry(templateDefinition, entry)
  );
  const baseScripts = baseTemplateScripts;
  const globalCustomScripts = customScripts.map(normalizeScriptEntry);

  const stylesheetHrefs = unique([
    ...baseStyles,
    ...customStyles.map(normalizeAssetHref),
    ...(presentation.extraStyles || []).map(normalizeAssetHref)
  ]);

  const scriptEntries = uniqueScriptEntries([
    ...coreRuntimeScripts,
    ...baseScripts,
    ...globalCustomScripts,
    ...(presentation.extraScripts || []).map(normalizeScriptEntry)
  ]);

  usedTemplateNames.add(templateDefinition.name);
  return {
    stylesheetHrefs,
    scriptEntries,
    bodyClass: presentation.bodyClass || "",
    templateName: templateDefinition.name,
    templatePath: templateDefinition.htmlPath
  };
}

function copyUsedTemplateAssets() {
  for (const templateName of usedTemplateNames) {
    const templateAssetsDir = path.join(TEMPLATE_ROOT_DIR, templateName, "assets");
    const destination = path.join(OUTPUT_DIR, "assets", "templates", templateName, "assets");
    copyDir(templateAssetsDir, destination);
  }
}

function copyCoreRuntimeAssets() {
  copyDir(CORE_RUNTIME_SOURCE_DIR, CORE_RUNTIME_OUTPUT_DIR);
}

function extractAssetPathFromHref(href) {
  const normalizedHref = String(href || "").trim().replace(/\\/g, "/");
  if (!normalizedHref || /^https?:\/\//i.test(normalizedHref)) {
    return null;
  }

  let pathname = normalizedHref;
  if (pathname.startsWith("//")) return null;
  if (!pathname.startsWith("/")) {
    pathname = `/${pathname}`;
  }

  const normalizedBasePath = String(BASE_PATH || "").trim().replace(/\\/g, "/");
  const basePathPrefix = normalizedBasePath
    ? `/${normalizedBasePath.replace(/^\/+|\/+$/g, "")}`
    : "";
  if (basePathPrefix && pathname.startsWith(`${basePathPrefix}/`)) {
    pathname = pathname.slice(basePathPrefix.length);
  } else if (basePathPrefix && pathname === basePathPrefix) {
    pathname = "/";
  }

  if (!pathname.startsWith("/assets/")) {
    return null;
  }

  return pathname.slice(1);
}

function collectReferencedAssetsFromHtml(html) {
  const attrRegex = /\b(?:href|src)\s*=\s*["']([^"']+)["']/gi;
  let match;
  while ((match = attrRegex.exec(html)) !== null) {
    const assetPath = extractAssetPathFromHref(match[1]);
    if (assetPath) {
      referencedPublicAssetPaths.add(assetPath);
    }
  }
}

function copyReferencedProjectAssets() {
  for (const assetPath of [...referencedPublicAssetPaths].sort()) {
    if (assetPath.startsWith("assets/templates/") || assetPath.startsWith("assets/core/")) {
      continue;
    }

    let sourcePath;
    if (assetPath.startsWith("assets/css/")) {
      sourcePath = path.join("src/css", assetPath.slice("assets/css/".length));
    } else if (assetPath.startsWith("assets/js/")) {
      sourcePath = path.join("src/js", assetPath.slice("assets/js/".length));
    } else if (assetPath.startsWith("assets/")) {
      sourcePath = path.join("src/assets", assetPath.slice("assets/".length));
    } else {
      continue;
    }

    if (!fs.existsSync(sourcePath)) {
      console.warn(`Missing referenced asset source: ${sourcePath}`);
      continue;
    }

    const destinationPath = path.join(OUTPUT_DIR, assetPath);
    fs.mkdirSync(path.dirname(destinationPath), { recursive: true });
    fs.copyFileSync(sourcePath, destinationPath);
  }
}

function renderStylesheetTags(hrefs) {
  return hrefs
    .map((href) => `  <link rel="stylesheet" href="${href}" />`)
    .join("\n");
}

function renderScriptTags(entries) {
  return entries
    .map((entry) => `<script type="${entry.module ? "module" : "text/javascript"}" src="${entry.src}"></script>`)
    .join("\n");
}

function renderFooterSocialLinks() {
  const socials = Array.isArray(siteData?.contact?.socials) ? siteData.contact.socials : [];
  if (socials.length === 0) return "";

  return socials.map((social) => {
    const label = escapeHtml(social.label || social.key || "Social");
    const href = escapeHtml(social.url || "#");
    const icon = socialIconMarkup(social.key || "");
    return `<a class="footer-social-link" href="${href}" target="_blank" rel="noopener noreferrer" aria-label="${label}">${icon}</a>`;
  }).join("");
}

function renderFooterContactSummary() {
  const contact = siteData?.contact || {};
  const institutionalEmail = contact?.emails?.institutional || "";
  const phones = Array.isArray(contact?.phones) ? contact.phones : [];

  const parts = [];
  if (institutionalEmail) {
    parts.push(`<a href="mailto:${escapeHtml(institutionalEmail)}">${escapeHtml(institutionalEmail)}</a>`);
  }
  phones.forEach((phone) => {
    const phoneHref = String(phone || "").replace(/\s+/g, "");
    if (!phoneHref) return;
    parts.push(`<a href="tel:${escapeHtml(phoneHref)}">${escapeHtml(phone)}</a>`);
  });

  return parts.join(" | ");
}

function socialIconMarkup(key) {
  const iconByKey = {
    github: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M8 0C3.58 0 0 3.58 0 8a8 8 0 0 0 5.47 7.59c.4.07.55-.17.55-.38v-1.32c-2.23.49-2.7-.95-2.7-.95-.36-.92-.89-1.16-.89-1.16-.73-.5.05-.49.05-.49.81.06 1.24.84 1.24.84.71 1.23 1.87.87 2.33.67.07-.52.28-.87.5-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.58.82-2.14-.08-.2-.36-1.01.08-2.12 0 0 .67-.21 2.2.82A7.5 7.5 0 0 1 8 3.8c.68 0 1.37.09 2.01.26 1.53-1.03 2.2-.82 2.2-.82.44 1.11.16 1.92.08 2.12.51.56.82 1.27.82 2.14 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48v2.2c0 .21.14.46.55.38A8 8 0 0 0 16 8c0-4.42-3.58-8-8-8Z"/></svg>',
    linkedin: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4.98 3.5A2.48 2.48 0 1 0 5 8.46 2.48 2.48 0 0 0 4.98 3.5ZM3 9h4v12H3zm7 0h3.84v1.71h.05c.53-1 1.84-2.06 3.79-2.06 4.05 0 4.8 2.66 4.8 6.12V21h-4v-5.52c0-1.32-.02-3.02-1.84-3.02-1.85 0-2.13 1.45-2.13 2.92V21h-4z"/></svg>',
    x: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M18.9 2H22l-6.77 7.73L23.2 22h-6.24l-4.88-7.16L5.8 22H2.7l7.24-8.27L1.6 2h6.4l4.4 6.57L18.9 2zM17.8 20h1.73L7.08 3.9H5.22z"/></svg>',
    researchgate: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="11"/><text x="12" y="15" text-anchor="middle" font-size="8.5" font-weight="700" font-family="Arial, sans-serif" fill="currentColor">RG</text></svg>',
    orcid: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="11"/><text x="12" y="15" text-anchor="middle" font-size="8.5" font-weight="700" font-family="Arial, sans-serif" fill="currentColor">iD</text></svg>',
    googlescholar: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2 1 8l11 6 9-4.91V17h2V8L12 2z"/><path d="M6 12.9V17c0 2.76 2.69 5 6 5s6-2.24 6-5v-4.1l-6 3.28-6-3.28z"/></svg>'
  };

  const icon = iconByKey[String(key).toLowerCase()] || '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="10"/></svg>';
  return `<span class="footer-social-icon">${icon}</span>`;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll("\"", "&quot;")
    .replaceAll("'", "&#39;");
}

function stripTags(value) {
  return String(value ?? "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function trimDescription(value, maxLength = 160) {
  const text = stripTags(value);
  if (text.length <= maxLength) return text;
  return `${text.slice(0, Math.max(0, maxLength - 1)).trim()}...`;
}

function normalizePagePath(pagePath) {
  const normalized = `/${String(pagePath).replace(/\\/g, "/").replace(/^\/+/, "")}`;
  return normalized;
}

function toAbsoluteUrl(href, siteUrl) {
  if (!href) return "";
  if (/^https?:\/\//i.test(href)) return href;
  if (!siteUrl) return href;
  const base = siteUrl.replace(/\/+$/, "");
  const pathPart = href.startsWith("/") ? href : `/${href}`;
  return `${base}${pathPart}`;
}

function resolveSeo(page, outPathRelative) {
  const seoConfig = portfolioConfig.seo || {};
  const meta = page.json.meta || {};
  const social = meta.social || {};

  const pagePath = normalizePagePath(outPathRelative);
  const siteUrl = String(seoConfig.siteUrl || "").trim();
  const canonicalRaw = meta.canonical || pagePath;
  const canonicalUrl = toAbsoluteUrl(canonicalRaw, siteUrl);

  const title = page.json.meta?.title || page.json.header?.title || SITE_TITLE;
  const description = trimDescription(
    meta.description || page.json.header?.lead || siteData?.description || ""
  );
  const image = toAbsoluteUrl(
    social.image || meta.image || seoConfig.defaultImage || siteBranding?.favicon || "",
    siteUrl
  );
  const type = social.type || seoConfig.defaultType || "website";
  const robots = meta.robots || seoConfig.defaultRobots || "index,follow";
  const keywords = Array.isArray(meta.tags) && meta.tags.length > 0
    ? meta.tags.join(", ")
    : Array.isArray(siteData?.keywords)
      ? siteData.keywords.join(", ")
      : "";
  const locale = seoConfig.defaultLocale || "en_US";
  const author = siteData?.author || "";
  const twitterHandle = seoConfig.twitterHandle || "";
  const twitterCard = social.card || (image ? "summary_large_image" : "summary");
  const publishedTime = meta.publishedTime || "";
  const modifiedTime = meta.modifiedTime || "";
  const sameAs = Array.isArray(seoConfig.sameAs) ? seoConfig.sameAs.filter(Boolean) : [];
  const orgName = seoConfig.organizationName || siteData?.author || "";

  const tags = [];
  if (description) tags.push(`<meta name="description" content="${escapeHtml(description)}" />`);
  if (keywords) tags.push(`<meta name="keywords" content="${escapeHtml(keywords)}" />`);
  if (author) tags.push(`<meta name="author" content="${escapeHtml(author)}" />`);
  if (robots) tags.push(`<meta name="robots" content="${escapeHtml(robots)}" />`);
  if (canonicalUrl) tags.push(`<link rel="canonical" href="${escapeHtml(canonicalUrl)}" />`);

  tags.push(`<meta property="og:title" content="${escapeHtml(social.title || title)}" />`);
  if (description) tags.push(`<meta property="og:description" content="${escapeHtml(social.description || description)}" />`);
  tags.push(`<meta property="og:type" content="${escapeHtml(type)}" />`);
  if (canonicalUrl) tags.push(`<meta property="og:url" content="${escapeHtml(canonicalUrl)}" />`);
  tags.push(`<meta property="og:site_name" content="${escapeHtml(SITE_TITLE)}" />`);
  tags.push(`<meta property="og:locale" content="${escapeHtml(locale)}" />`);
  if (image) tags.push(`<meta property="og:image" content="${escapeHtml(image)}" />`);
  if (publishedTime) tags.push(`<meta property="article:published_time" content="${escapeHtml(publishedTime)}" />`);
  if (modifiedTime) tags.push(`<meta property="article:modified_time" content="${escapeHtml(modifiedTime)}" />`);

  tags.push(`<meta name="twitter:card" content="${escapeHtml(twitterCard)}" />`);
  tags.push(`<meta name="twitter:title" content="${escapeHtml(social.title || title)}" />`);
  if (description) tags.push(`<meta name="twitter:description" content="${escapeHtml(social.description || description)}" />`);
  if (image) tags.push(`<meta name="twitter:image" content="${escapeHtml(image)}" />`);
  if (twitterHandle) tags.push(`<meta name="twitter:site" content="${escapeHtml(twitterHandle)}" />`);

  const webPageLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    inLanguage: meta.language || "en",
    name: title,
    description,
    url: canonicalUrl || pagePath
  };
  if (modifiedTime) {
    webPageLd.dateModified = modifiedTime;
  }

  const graph = [webPageLd];
  if (orgName) {
    const orgLd = {
      "@context": "https://schema.org",
      "@type": "Person",
      name: orgName
    };
    if (sameAs.length > 0) {
      orgLd.sameAs = sameAs;
    }
    graph.push(orgLd);
  }

  const ldJson = JSON.stringify(
    graph.length === 1 ? graph[0] : { "@context": "https://schema.org", "@graph": graph }
  ).replaceAll("</script>", "<\\/script>");
  tags.push(`<script type="application/ld+json">${ldJson}</script>`);

  return {
    language: meta.language || "en",
    headMeta: tags.join("\n")
  };
}

function loadAllPages() {
  const files = globSync(`${CONTENT_DIR}/**/*.json`);
  return files.map((file) => ({
    file,
    json: resolveContentConfigReferences(
      JSON.parse(fs.readFileSync(file, "utf-8")),
      portfolioConfig
    ),
    dir: path.dirname(file),
    name: path.basename(file)
  }));
}

const pages = loadAllPages();
console.log(`Loaded ${pages.length} content pages`);
const pagesToRender = selectPagesToRender(pages, buildCliOptions.page);
if (pagesToRender.length !== pages.length) {
  console.log(`Rendering ${pagesToRender.length} page (single-page mode)`);
}

const siteGraph = buildSiteGraph(pages, CONTENT_DIR);
const navigationHtml = generateNavigation(siteGraph, BASE_PATH);
const lastModified = new Date().toISOString().split("T")[0];

for (const page of pagesToRender) {
  await preprocessPage(page);

  const renderedContent = renderPage(page.json);
  const contentHtml = applyTemplate(renderedContent, { basePath: BASE_PATH });

  const pageAssets = resolvePageAssets(page.json);
  const outPathRelative = outputPathFor(page, CONTENT_DIR);
  const seo = resolveSeo(page, outPathRelative);
  const templatePath = pageAssets.templatePath;
  if (!fs.existsSync(templatePath)) {
    throw new Error(`Template not found: ${templatePath}`);
  }
  const template = loadTemplate(templatePath);

  const finalHtml = applyTemplate(template, {
    basePath: BASE_PATH,
    title: page.json.meta?.title || page.json.header?.title || SITE_TITLE,
    siteTitle: SITE_TITLE,
    faviconHref: escapeHtml(brandingAssets.faviconHref),
    logoSrc: escapeHtml(brandingAssets.logoSrc),
    logoAlt: escapeHtml(brandingAssets.logoAlt),
    navigation: navigationHtml,
    breadcrumb: generateBreadcrumb(page, siteGraph, BASE_PATH),
    content: contentHtml,
    relatedPages: generateRelatedPages(page, siteGraph, BASE_PATH),
    year: new Date().getFullYear(),
    lastModified,
    stylesheets: renderStylesheetTags(pageAssets.stylesheetHrefs),
    scripts: renderScriptTags(pageAssets.scriptEntries),
    bodyClass: pageAssets.bodyClass,
    language: seo.language,
    headMeta: seo.headMeta,
    footerSocialLinks: renderFooterSocialLinks(),
    footerContactSummary: renderFooterContactSummary()
  });

  const outPath = path.join(OUTPUT_DIR, outPathRelative);
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, finalHtml);
  collectReferencedAssetsFromHtml(finalHtml);
  console.log(`Generated ${outPath}`);
}

console.log("Copying static assets...");
copyUsedTemplateAssets();
copyCoreRuntimeAssets();
copyReferencedProjectAssets();
console.log("Static assets copied");

console.log("Minifying output...");
await minifyDirectory(OUTPUT_DIR);
console.log("Minification complete");

console.log("\nStatic site generation complete.");

