/** All HTML slots must be trusted template markup with dynamic values escaped by the caller. */
export interface StandalonePageHeaderOptions {
  titleHtml: string;
  backHtml?: string;
  actionsHtml?: string;
  subtitleHtml?: string;
  className?: string;
  level?: 1 | 2;
}

const BACK_ICON = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M19 12H5m7-7-7 7 7 7"/></svg>';

/** Normalize only the explicit back slot; keep its tag and original event/navigation hooks. */
function renderBackControl(markup: string): string {
  const control = /^\s*<(a|button)\b([^>]*)>([\s\S]*?)<\/\1>\s*$/i.exec(markup);
  if (!control || /<\/?(?:a|button)\b/i.test(control[3])) return markup;
  const [, tag, originalAttributes, content] = control;
  let attributes = originalAttributes;
  const existingName = /(^|\s)aria-label\s*=\s*(["'])(.*?)\2/i.exec(attributes);
  const originalText = content.replace(/<[^>]*>/g, '').replace(/^[\s←‹〈❮⟵]+/, '').trim();
  const name = existingName?.[3].trim() || originalText || '返回';
  const attributeName = name.replace(/"/g, '&quot;');
  const classes = /(^|\s)class\s*=\s*(["'])(.*?)\2/i;
  attributes = classes.test(attributes)
    ? attributes.replace(classes, (_, space, quote, value) => `${space}class=${quote}${value} standalone-back-control${quote}`)
    : attributes + ' class="standalone-back-control"';
  if (!existingName) attributes += ` aria-label="${attributeName}"`;
  else if (!existingName[3].trim()) attributes = attributes.replace(existingName[0], `${existingName[1]}aria-label="${attributeName}"`);
  if (!/(^|\s)title\s*=/i.test(attributes)) attributes += ` title="${attributeName}"`;
  return `<${tag}${attributes}>${BACK_ICON}</${tag}>`;
}

export function renderStandalonePageHeader(options: StandalonePageHeaderOptions): string {
  const heading = options.level === 2 ? 'h2' : 'h1';
  return `<header class="standalone-page-header ${options.className ?? ''}" data-standalone-page-header><div class="standalone-page-heading">${options.backHtml ? `<div class="standalone-page-back">${renderBackControl(options.backHtml)}</div>` : ''}<div class="standalone-page-title"><${heading}>${options.titleHtml}</${heading}>${options.subtitleHtml ? `<div class="standalone-page-subtitle">${options.subtitleHtml}</div>` : ''}</div></div>${options.actionsHtml ? `<div class="standalone-page-actions">${options.actionsHtml}</div>` : ''}</header>`;
}
