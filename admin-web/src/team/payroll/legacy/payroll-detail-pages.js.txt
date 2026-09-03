/* payroll-detail-pages.js — shared deterministic A4 document builder */
(function (root) {
  "use strict";

  function extractBody(value) {
    const html = String(value || "");
    const match = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
    return match ? match[1] : html;
  }

  function extractHeadAssets(value) {
    const html = String(value || "");
    const match = html.match(/<head[^>]*>([\s\S]*?)<\/head>/i);
    if (!match) return "";
    return (match[1].match(/<(?:link|style)\b[\s\S]*?(?:<\/style>|>)/gi) || []).join("");
  }

  function buildPayrollDetailA4DocumentHtml(content, variant, pagination) {
    const mode = pagination === "paginate" ? "paginate" : "fit-one-page";
    const kind = variant === "compact" ? "compact" : "detail";
    return `<!doctype html><html><head><meta charset="UTF-8"><title>Payroll Detail</title>${extractHeadAssets(content)}<style>
      *{box-sizing:border-box}html,body{margin:0;background:#fff;color:#111;font-family:Arial,sans-serif}
      @page{size:A4 portrait;margin:0}
      .payroll-a4-page{position:relative;width:210mm;min-height:297mm;padding:8mm;background:#fff;break-after:page;overflow:hidden}
      .payroll-a4-page:last-child{break-after:auto}
      .payroll-a4-content{width:194mm;transform-origin:top left}
      body[data-pagination="fit-one-page"] .payroll-a4-page{height:297mm}
      body[data-pagination="fit-one-page"] .payroll-a4-content{max-height:281mm;overflow:hidden}
      body[data-pagination="paginate"] .payroll-a4-page{height:auto;overflow:visible}
      body[data-pagination="paginate"] .payroll-compact-week{break-inside:avoid-page}
      body[data-pagination="paginate"] thead{display:table-header-group}
      article{box-shadow:none!important;border:0!important;margin:0!important;max-width:none!important}
      .payroll-detail-daily-wrap{overflow:visible!important}.payroll-detail-daily-table{width:100%!important;min-width:0!important;font-size:7px!important}
      .payroll-detail-daily-table th,.payroll-detail-daily-table td{padding:3px!important;white-space:nowrap}
      .payroll-compact-detail{font-size:8pt}.payroll-compact-detail header{display:flex;justify-content:space-between;gap:8mm;margin-bottom:3mm}
      .payroll-compact-detail header>div{flex:1}.payroll-compact-detail header strong{font-size:13pt}
      .payroll-compact-detail dl{display:grid;grid-template-columns:auto 1fr;gap:1mm 3mm;margin:2mm 0 0}.payroll-compact-detail dt{color:#555}.payroll-compact-detail dd{margin:0}
      .payroll-compact-report-meta{text-align:right}.payroll-compact-report-meta h3{font-size:13pt;margin:0 0 2mm}.payroll-compact-report-meta p{margin:1mm 0}
      .payroll-compact-detail table{width:100%;border-collapse:collapse;table-layout:fixed}.payroll-compact-detail th,.payroll-compact-detail td{border:.25mm solid #555;padding:1.25mm;text-align:center}
      .payroll-compact-summary{margin-bottom:2mm}.payroll-compact-week{margin-top:2mm}.payroll-compact-week h4{display:flex;justify-content:center;margin:0 0 1mm;font-size:8pt;font-weight:500}.payroll-compact-week h4 span{margin-left:auto}
      .payroll-compact-more{margin-right:1mm}.payroll-compact-declaration{font-size:7pt;line-height:1.45;margin:3mm 3mm}
      .payroll-compact-signature>div{display:grid;grid-template-columns:1fr 40mm;gap:4mm;margin-top:8mm}.payroll-compact-signature span{border-top:.25mm solid #555;text-align:center;padding-top:1mm}.payroll-compact-signature p{margin:5mm 0 0;text-align:center;font-size:7pt}
      @media print{html,body{width:210mm}.payroll-a4-page{margin:0}}
    </style></head><body data-variant="${kind}" data-pagination="${mode}"><section class="payroll-a4-page"><div class="payroll-a4-content">${extractBody(content)}</div></section><script>
      (function(){if(document.body.dataset.pagination!=="fit-one-page")return;var page=document.querySelector('.payroll-a4-page');var layer=document.querySelector('.payroll-a4-content');requestAnimationFrame(function(){var sx=page.clientWidth/layer.scrollWidth;var sy=(page.clientHeight-1)/layer.scrollHeight;var scale=Math.min(1,sx,sy)*.995;layer.style.transform='scale('+scale+')';});})();
    <\/script></body></html>`;
  }

  root.buildPayrollDetailA4DocumentHtml = buildPayrollDetailA4DocumentHtml;
})(typeof window !== "undefined" ? window : globalThis);
