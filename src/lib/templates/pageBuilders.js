function esc(str = '') {
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

export function buildNav(pages, activeId, businessName) {
  const links = pages
    .map((p) => `<a href="${p.filename}" class="${p.id === activeId ? 'active' : ''}">${esc(p.label)}</a>`)
    .join('\n        ');
  return `<header class="site-header">
  <div class="wrap header-inner">
    <a class="logo" href="${pages[0].filename}">${esc(businessName)}</a>
    <nav class="site-nav">
      ${links}
    </nav>
    <button class="nav-toggle" onclick="document.querySelector('.site-nav').classList.toggle('open')" aria-label="Menü">☰</button>
  </div>
</header>`;
}

export function buildFooter(business, content) {
  return `<footer class="site-footer">
  <div class="wrap footer-inner">
    <div>
      <strong>${esc(business.name)}</strong>
      <p>${esc(business.address || 'Musterstraße 1, 10115 Berlin')}</p>
    </div>
    <div>
      ${business.phone ? `<p>Tel: <a href="tel:${esc(business.phone.replace(/\s+/g, ''))}">${esc(business.phone)}</a></p>` : ''}
      ${business.email ? `<p>E-Mail: <a href="mailto:${esc(business.email)}">${esc(business.email)}</a></p>` : ''}
    </div>
    <div class="footer-copy">© ${new Date().getFullYear()} ${esc(business.name)} · <a href="impressum.html">Impressum</a></div>
  </div>
</footer>`;
}

export function buildHero(business, content, isHome) {
  return `<section class="hero">
  <div class="wrap hero-inner">
    <span class="kicker">${esc(content.heroKicker)}</span>
    <h1>${isHome ? esc(content.heroHeadline) : esc(business.name)}</h1>
    <p>${esc(isHome ? content.heroSub : business.tagline || content.heroSub)}</p>
    <div class="hero-actions">
      <a class="btn btn-accent" href="kontakt.html">Kontakt aufnehmen</a>
      <a class="btn btn-ghost" href="${isHome ? 'leistungen.html' : ''}">${isHome ? (content.servicesTitle) : ''}</a>
    </div>
  </div>
</section>`;
}

export function buildHomeBody(business, content, pages) {
  return `${buildHero(business, content, true)}
<section class="section">
  <div class="wrap two-col">
    <div>
      <span class="eyebrow">${esc(content.aboutTitle)}</span>
      <h2>${esc(business.name)}</h2>
      <p class="lead">${esc(content.aboutText)}</p>
      <ul class="check-list">
        ${content.aboutPoints.map((p) => `<li>${esc(p)}</li>`).join('\n        ')}
      </ul>
      <a class="btn btn-outline" href="ueber-uns.html">Mehr über uns</a>
    </div>
    <div class="placeholder-block" aria-hidden="true"><span>Bild</span></div>
  </div>
</section>
<section class="section section-alt">
  <div class="wrap">
    <span class="eyebrow">${esc(content.servicesTitle)}</span>
    <h2>Was wir anbieten</h2>
    <div class="card-grid">
      ${content.services.slice(0, 3).map((s) => `<div class="card">
        <h3>${esc(s.name)}</h3>
        ${s.price ? `<span class="price">${esc(s.price)}</span>` : ''}
        <p>${esc(s.desc)}</p>
      </div>`).join('\n      ')}
    </div>
    <a class="btn btn-outline" href="leistungen.html">${esc(content.servicesTitle)} ansehen</a>
  </div>
</section>
<section class="section">
  <div class="wrap">
    <span class="eyebrow">Stimmen</span>
    <h2>Was andere sagen</h2>
    <div class="testimonial-grid">
      ${content.testimonials.map((t) => `<blockquote class="testimonial">
        <p>„${esc(t.quote)}“</p>
        <cite>${esc(t.author)}</cite>
      </blockquote>`).join('\n      ')}
    </div>
  </div>
</section>
<section class="section cta">
  <div class="wrap cta-inner">
    <h2>${esc(content.ctaTitle)}</h2>
    <p>${esc(content.ctaText)}</p>
    <a class="btn btn-accent" href="kontakt.html">Jetzt Kontakt aufnehmen</a>
  </div>
</section>`;
}

export function buildAboutBody(business, content) {
  return `${buildHero(business, content, false)}
<section class="section">
  <div class="wrap two-col">
    <div>
      <span class="eyebrow">${esc(content.aboutTitle)}</span>
      <h2>Unsere Geschichte</h2>
      <p class="lead">${esc(content.aboutText)}</p>
      <p>Wir freuen uns, Sie bald bei ${esc(business.name)} begrüßen zu dürfen.</p>
    </div>
    <div class="placeholder-block" aria-hidden="true"><span>Bild</span></div>
  </div>
</section>
<section class="section section-alt">
  <div class="wrap">
    <span class="eyebrow">Warum wir</span>
    <div class="card-grid">
      ${content.aboutPoints.map((p) => `<div class="card">
        <h3>${esc(p)}</h3>
      </div>`).join('\n      ')}
    </div>
  </div>
</section>`;
}

export function buildServicesBody(business, content) {
  const isShop = Boolean(content.shop);
  return `${buildHero(business, content, false)}
<section class="section">
  <div class="wrap">
    <span class="eyebrow">${esc(content.servicesTitle)}</span>
    <h2>Im Überblick</h2>
    <div class="card-grid${isShop ? ' shop-grid' : ''}">
      ${content.services.map((s) => `<div class="card${isShop ? ' product-card' : ''}">
        ${isShop ? `<div class="placeholder-block small" aria-hidden="true"><span>Produktfoto</span></div>` : ''}
        <h3>${esc(s.name)}</h3>
        ${s.price ? `<span class="price">${esc(s.price)}</span>` : ''}
        <p>${esc(s.desc)}</p>
        ${isShop ? `<a class="btn btn-outline order-btn" href="mailto:${esc(business.email || '')}?subject=${encodeURIComponent(`Bestellung: ${s.name}`)}">Jetzt bestellen</a>` : ''}
      </div>`).join('\n      ')}
    </div>
    ${isShop && content.shippingInfo ? `<div class="info-box shipping-box">
      <h3>Versand &amp; Zahlung</h3>
      <p>${esc(content.shippingInfo)}</p>
    </div>` : ''}
  </div>
</section>
<section class="section cta">
  <div class="wrap cta-inner">
    <h2>${esc(content.ctaTitle)}</h2>
    <p>${esc(content.ctaText)}</p>
    <a class="btn btn-accent" href="kontakt.html">Jetzt Kontakt aufnehmen</a>
  </div>
</section>`;
}

export function buildGalleryBody(business, content) {
  const blocks = Array.from({ length: 6 }, (_, i) => i);
  return `${buildHero(business, content, false)}
<section class="section">
  <div class="wrap">
    <span class="eyebrow">Galerie</span>
    <h2>${esc(content.galleryCaption)}</h2>
    <div class="gallery-grid">
      ${blocks.map(() => `<div class="placeholder-block small" aria-hidden="true"><span>Bild</span></div>`).join('\n      ')}
    </div>
    <p class="muted-note">Tipp: Ersetzen Sie die Platzhalter durch eigene Fotos Ihres Betriebs.</p>
  </div>
</section>`;
}

export function buildReviewsBody(business, content) {
  const all = [...content.testimonials, ...content.testimonials].slice(0, 4);
  return `${buildHero(business, content, false)}
<section class="section">
  <div class="wrap">
    <span class="eyebrow">Bewertungen</span>
    <h2>Das sagt unsere Kundschaft</h2>
    <div class="testimonial-grid">
      ${all.map((t) => `<blockquote class="testimonial">
        <p>„${esc(t.quote)}“</p>
        <cite>${esc(t.author)}</cite>
      </blockquote>`).join('\n      ')}
    </div>
  </div>
</section>`;
}

export function buildContactBody(business, content) {
  return `${buildHero(business, content, false)}
<section class="section">
  <div class="wrap two-col">
    <div>
      <span class="eyebrow">Kontakt</span>
      <h2>Schreiben Sie uns</h2>
      <form class="contact-form" onsubmit="event.preventDefault(); alert('Demo-Formular – bitte an ein echtes Backend oder einen Formular-Service anbinden.');">
        <label>Name<input type="text" name="name" required /></label>
        <label>E-Mail<input type="email" name="email" required /></label>
        <label>Nachricht<textarea name="message" rows="5" required></textarea></label>
        <button class="btn btn-accent" type="submit">Nachricht senden</button>
      </form>
    </div>
    <div>
      <div class="info-box">
        <h3>Kontaktdaten</h3>
        <p>${esc(business.address || 'Musterstraße 1, 10115 Berlin')}</p>
        ${business.phone ? `<p><a href="tel:${esc(business.phone.replace(/\s+/g, ''))}">${esc(business.phone)}</a></p>` : ''}
        ${business.email ? `<p><a href="mailto:${esc(business.email)}">${esc(business.email)}</a></p>` : ''}
      </div>
      <div class="info-box">
        <h3>Öffnungszeiten</h3>
        <p>Mo–Fr: 09:00–18:00 Uhr<br/>Sa: 10:00–14:00 Uhr<br/>So: geschlossen</p>
        <span class="muted-note">Bitte an die echten Öffnungszeiten anpassen.</span>
      </div>
      <div class="placeholder-block" aria-hidden="true"><span>Karte / Anfahrt</span></div>
    </div>
  </div>
</section>`;
}

export function buildImprintBody(business, content) {
  return `${buildHero(business, content, false)}
<section class="section">
  <div class="wrap narrow">
    <span class="eyebrow">Impressum</span>
    <h2>Angaben gemäß § 5 TMG</h2>
    <p>${esc(business.name)}<br/>${esc(business.address || 'Musterstraße 1, 10115 Berlin')}</p>
    <p>${business.phone ? `Telefon: ${esc(business.phone)}<br/>` : ''}${business.email ? `E-Mail: ${esc(business.email)}` : ''}</p>
    <h3>Verantwortlich für den Inhalt</h3>
    <p>[Name der verantwortlichen Person einfügen]</p>
    <h3>Datenschutz</h3>
    <p>Hinweise zur Verarbeitung personenbezogener Daten finden Sie in unserer Datenschutzerklärung. [Platzhaltertext – bitte durch eine rechtssichere Datenschutzerklärung ersetzen, z. B. über einen Generator oder Rechtsberatung.]</p>
    <p class="muted-note">Dies ist ein Platzhalter und ersetzt keine Rechtsberatung.</p>
  </div>
</section>`;
}
