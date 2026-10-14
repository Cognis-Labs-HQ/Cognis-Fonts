export function renderFontPreferences({
    sectionId,
    fontOptions,
    i18n,
    escapeHtml,
}) {
    const headingId = `${sectionId}-heading`;
    const previewId = `${sectionId}-preview`;
    const fontHeading = i18n.t("module.fonts.name");
    const increaseFontSizeLabel = i18n.t("module.fonts.size.increase");
    const decreaseFontSizeLabel = i18n.t("module.fonts.size.decrease");
    const previewLabel = i18n.t("module.fonts.preview");
    const previewSample = i18n.t("module.fonts.preview.sample");
    const resetLabel = i18n.t("module.fonts.reset");
    return `
      <div class="module-fonts-heading" aria-labelledby="${escapeHtml(headingId)}">
        <h3 id="${escapeHtml(headingId)}">${escapeHtml(fontHeading)}</h3>
        <button id="module-pref-font-reset" type="button">${escapeHtml(resetLabel)}</button>
      </div>
      <div class="module-fonts-picker">
        <label class="module-fonts-label">
          ${escapeHtml(fontHeading)}
          <select id="module-pref-font-select" class="theme-select">${fontOptions}</select>
        </label>
        <div class="module-fonts-stepper">
          <button id="module-pref-font-size-up" class="module-fonts-size" type="button" aria-label="${escapeHtml(increaseFontSizeLabel)}"><svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path d="m6 15 6-6 6 6" fill="none" stroke="currentColor" stroke-width="2"/></svg></button>
          <span id="module-pref-font-size-value" role="status" aria-live="polite"></span>
          <button id="module-pref-font-size-down" class="module-fonts-size" type="button" aria-label="${escapeHtml(decreaseFontSizeLabel)}"><svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path d="m6 9 6 6 6-6" fill="none" stroke="currentColor" stroke-width="2"/></svg></button>
        </div>
      </div>
      <div class="module-fonts-preview">
        <h4>${escapeHtml(previewLabel)}</h4>
        <span id="${escapeHtml(previewId)}" role="region" aria-label="${escapeHtml(previewLabel)}">${escapeHtml(previewSample)}</span>
      </div>
    `;
}
