import { getStyle } from './styles';
import { getContent } from './content';
import {
  buildNav, buildFooter, buildHomeBody, buildAboutBody,
  buildServicesBody, buildGalleryBody, buildReviewsBody,
  buildContactBody, buildImprintBody,
} from './pageBuilders';

export const PAGE_DEFS = [
  { id: 'home', label: 'Home', filename: 'index.html', builder: buildHomeBody, essential: true },
  { id: 'ueber-uns', label: 'Über uns', filename: 'ueber-uns.html', builder: buildAboutBody },
  { id: 'leistungen', label: 'Leistungen', filename: 'leistungen.html', builder: buildServicesBody },
  { id: 'galerie', label: 'Galerie', filename: 'galerie.html', builder: buildGalleryBody },
  { id: 'bewertungen', label: 'Bewertungen', filename: 'bewertungen.html', builder: buildReviewsBody },
  { id: 'kontakt', label: 'Kontakt', filename: 'kontakt.html', builder: buildContactBody, essential: true },
  { id: 'impressum', label: 'Impressum', filename: 'impressum.html', builder: buildImprintBody },
];

export const PAGE_COUNT_PRESETS = {
  3: ['home', 'leistungen', 'kontakt'],
  4: ['home', 'ueber-uns', 'leistungen', 'kontakt'],
  5: ['home', 'ueber-uns', 'leistungen', 'galerie', 'kontakt'],
  6: ['home', 'ueber-uns', 'leistungen', 'galerie', 'bewertungen', 'kontakt'],
};

function labelFor(id, content) {
  if (id === 'leistungen') return content.servicesTitle;
  return PAGE_DEFS.find((p) => p.id === id)?.label || id;
}

export function buildCss(style) {
  const c = style.colors;
  return `:root{--bg:${c.bg};--surface:${c.surface};--text:${c.text};--muted:${c.muted};--line:${c.line};--accent:${c.accent};--accent-text:${c.accentText};--radius:${style.radius};}
*{box-sizing:border-box;}
body{margin:0;background:var(--bg);color:var(--text);font-family:${style.fontBody};line-height:1.6;-webkit-font-smoothing:antialiased;}
h1,h2,h3{font-family:${style.fontHeading};line-height:1.15;margin:0 0 14px;font-weight:600;}
h1{font-size:clamp(34px,5vw,58px);letter-spacing:-.02em;}
h2{font-size:clamp(24px,3vw,34px);letter-spacing:-.01em;}
h3{font-size:18px;margin-bottom:8px;}
p{margin:0 0 12px;color:var(--muted);}
a{color:inherit;}
.wrap{width:min(1120px,90vw);margin:0 auto;}
img{max-width:100%;display:block;}
.btn{display:inline-flex;align-items:center;justify-content:center;padding:13px 22px;border-radius:var(--radius);font-weight:600;font-size:14px;text-decoration:none;border:1px solid transparent;cursor:pointer;}
.btn-accent{background:var(--accent);color:var(--accent-text);}
.btn-outline{border-color:var(--line);color:var(--text);margin-top:6px;}
.btn-ghost{color:var(--muted);}
.site-header{position:sticky;top:0;z-index:20;background:var(--bg);border-bottom:1px solid var(--line);}
.header-inner{display:flex;align-items:center;justify-content:space-between;height:76px;}
.logo{font-family:${style.fontHeading};font-weight:700;font-size:19px;text-decoration:none;}
.site-nav{display:flex;gap:26px;}
.site-nav a{text-decoration:none;color:var(--muted);font-size:14px;font-weight:500;}
.site-nav a.active,.site-nav a:hover{color:var(--text);}
.nav-toggle{display:none;background:none;border:1px solid var(--line);border-radius:8px;color:var(--text);width:38px;height:38px;}
.hero{padding:90px 0 70px;text-align:${style.heroLayout === 'center' ? 'center' : 'left'};border-bottom:1px solid var(--line);}
.hero-inner{max-width:${style.heroLayout === 'center' ? '760px' : '640px'};margin:${style.heroLayout === 'center' ? '0 auto' : '0'};}
.kicker{display:inline-block;text-transform:uppercase;letter-spacing:.14em;font-size:11px;font-weight:700;color:var(--accent);margin-bottom:14px;}
.hero p{font-size:16px;max-width:520px;${style.heroLayout === 'center' ? 'margin-left:auto;margin-right:auto;' : ''}}
.hero-actions{display:flex;gap:12px;margin-top:26px;${style.heroLayout === 'center' ? 'justify-content:center;' : ''}flex-wrap:wrap;}
.section{padding:64px 0;}
.section-alt{background:var(--surface);}
.eyebrow{display:block;text-transform:uppercase;letter-spacing:.12em;font-size:11px;font-weight:700;color:var(--accent);margin-bottom:10px;}
.two-col{display:grid;grid-template-columns:1.1fr .9fr;gap:48px;align-items:center;}
.lead{font-size:16px;}
.check-list{list-style:none;padding:0;margin:18px 0;}
.check-list li{padding:8px 0 8px 26px;position:relative;color:var(--text);font-size:14px;}
.check-list li::before{content:'✓';position:absolute;left:0;color:var(--accent);font-weight:700;}
.placeholder-block{background:var(--surface);border:1px dashed var(--line);border-radius:var(--radius);min-height:280px;display:flex;align-items:center;justify-content:center;color:var(--muted);font-size:13px;}
.placeholder-block.small{min-height:150px;}
.card-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:18px;margin:26px 0;}
.card{background:var(--surface);border:1px solid var(--line);border-radius:var(--radius);padding:24px;}
.card .price{display:inline-block;color:var(--accent);font-weight:700;font-size:13px;margin-bottom:8px;}
.product-card{display:flex;flex-direction:column;}
.product-card .placeholder-block{min-height:170px;margin-bottom:16px;}
.order-btn{margin-top:auto;padding-top:14px;align-self:flex-start;}
.shipping-box{margin-top:10px;}
.testimonial-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:18px;margin-top:24px;}
.testimonial{background:var(--surface);border:1px solid var(--line);border-radius:var(--radius);padding:22px;margin:0;}
.testimonial p{color:var(--text);font-size:15px;font-style:italic;}
.testimonial cite{color:var(--muted);font-size:12px;font-style:normal;}
.cta{text-align:center;}
.cta-inner{max-width:560px;margin:0 auto;}
.gallery-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:14px;margin:26px 0 10px;}
.contact-form{display:flex;flex-direction:column;gap:14px;margin-top:20px;}
.contact-form label{font-size:12px;font-weight:600;color:var(--muted);display:flex;flex-direction:column;gap:6px;}
.contact-form input,.contact-form textarea{font:inherit;padding:11px 13px;border-radius:calc(var(--radius) - 2px);border:1px solid var(--line);background:var(--bg);color:var(--text);}
.info-box{background:var(--surface);border:1px solid var(--line);border-radius:var(--radius);padding:20px;margin-bottom:16px;}
.muted-note{font-size:12px;color:var(--muted);}
.narrow{max-width:680px;}
.site-footer{border-top:1px solid var(--line);padding:40px 0;margin-top:20px;}
.footer-inner{display:flex;justify-content:space-between;gap:20px;flex-wrap:wrap;font-size:13px;color:var(--muted);}
.footer-inner a{color:var(--muted);}
.footer-copy{width:100%;border-top:1px solid var(--line);padding-top:16px;margin-top:8px;font-size:12px;}
@media (max-width:760px){
  .two-col{grid-template-columns:1fr;}
  .site-nav{position:absolute;top:76px;left:0;right:0;background:var(--bg);border-bottom:1px solid var(--line);flex-direction:column;padding:14px 5vw;gap:14px;display:none;}
  .site-nav.open{display:flex;}
  .nav-toggle{display:block;}
  .hero{padding:56px 0 44px;}
  .section{padding:44px 0;}
}`;
}

export function buildSite({ businessName, category, address, phone, email, tagline, styleId, pageIds, customCode }) {
  const style = getStyle(styleId);
  const content = getContent(category);
  const business = { name: businessName || 'Ihr Betrieb', address, phone, email, tagline };

  const orderedIds = PAGE_DEFS.filter((p) => pageIds.includes(p.id)).map((p) => p.id);
  const navPages = orderedIds.map((id) => {
    const def = PAGE_DEFS.find((p) => p.id === id);
    return { id, label: labelFor(id, content), filename: def.filename };
  });

  const googleFontUrl = `https://fonts.googleapis.com/css2?family=${style.googleFont}&display=swap`;

  const pages = orderedIds.map((id) => {
    const def = PAGE_DEFS.find((p) => p.id === id);
    const body = def.builder(business, content, navPages);
    const title = id === 'home' ? `${business.name} – ${content.heroKicker}` : `${labelFor(id, content)} – ${business.name}`;
    const html = `<!DOCTYPE html>
<html lang="de">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>${title}</title>
<meta name="description" content="${(content.heroSub || '').replace(/"/g, '')}" />
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link href="${googleFontUrl}" rel="stylesheet" />
<link rel="stylesheet" href="style.css" />
</head>
<body>
${buildNav(navPages, id, business.name)}
${body}
${buildFooter(business, content)}
${customCode ? `\n<!-- Eigener Code -->\n${customCode}\n` : ''}</body>
</html>`;
    return { id, label: labelFor(id, content), filename: def.filename, html };
  });

  return { pages, css: buildCss(style), style, content, business };
}

export async function downloadSite(options) {
  const { pages, css } = buildSite(options);
  const JSZip = (await import('jszip')).default;
  const zip = new JSZip();
  pages.forEach((p) => zip.file(p.filename, p.html));
  zip.file('style.css', css);
  zip.file('README.txt', 'Diese Website wurde als Vorlage mit LeadForge erstellt.\n\n- Öffnen Sie index.html im Browser für eine Vorschau.\n- Passen Sie Texte, Bilder (Platzhalter suchen) und Kontaktdaten an.\n- Das Kontaktformular ist nur eine Demo und muss an ein echtes Backend oder einen Formular-Service (z. B. Formspree) angebunden werden.\n- Für den Live-Betrieb einfach alle Dateien auf ein Hosting (z. B. Netlify, GitHub Pages) hochladen.\n');
  const blob = await zip.generateAsync({ type: 'blob' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const slug = (options.businessName || 'website').toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'website';
  a.href = url;
  a.download = `${slug}-website.zip`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
