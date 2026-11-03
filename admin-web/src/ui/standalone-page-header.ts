/** All HTML slots must be trusted template markup with dynamic values escaped by the caller. */
export interface StandalonePageHeaderOptions {
  titleHtml: string;
  backHtml?: string;
  actionsHtml?: string;
  subtitleHtml?: string;
  className?: string;
  level?: 1 | 2;
}

export function renderStandalonePageHeader(options: StandalonePageHeaderOptions): string {
  const heading = options.level === 2 ? 'h2' : 'h1';
  return `<header class="standalone-page-header ${options.className ?? ''}" data-standalone-page-header><div class="standalone-page-heading">${options.backHtml ? `<div class="standalone-page-back">${options.backHtml}</div>` : ''}<div class="standalone-page-title"><${heading}>${options.titleHtml}</${heading}>${options.subtitleHtml ? `<div class="standalone-page-subtitle">${options.subtitleHtml}</div>` : ''}</div></div>${options.actionsHtml ? `<div class="standalone-page-actions">${options.actionsHtml}</div>` : ''}</header>`;
}
