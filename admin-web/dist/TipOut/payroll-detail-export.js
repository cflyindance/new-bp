/* payroll-detail-export.js — Employees Detail PDF / CSV / Email export */



let collectPayrollDetailExportData = null;

let buildPayrollDetailPrintDocumentHtml = null;



function registerPayrollDetailExportCollector(fn) {

  collectPayrollDetailExportData = typeof fn === "function" ? fn : null;

}



function registerPayrollDetailPrintDocumentBuilder(fn) {

  buildPayrollDetailPrintDocumentHtml = typeof fn === "function" ? fn : null;

}



function T(key, vars) {

  return typeof payrollT === "function" ? payrollT(key, vars) : key;

}



function getPayrollDetailExportData() {

  if (typeof collectPayrollDetailExportData !== "function") {

    if (typeof showNotification === "function") showNotification(T("export.notReady"), "error");

    return null;

  }

  const data = collectPayrollDetailExportData();

  if (!data) {

    if (typeof showNotification === "function") showNotification(T("export.noData"), "warning");

    return null;

  }

  return data;

}



function togglePayrollDetailExportMenu() {

  document.getElementById("payrollDetailExportMenu")?.classList.toggle("show");

  document.getElementById("employeesDetailExportMenu")?.classList.remove("show");

}



function toggleEmployeesDetailExportMenu() {

  document.getElementById("employeesDetailExportMenu")?.classList.toggle("show");

  document.getElementById("payrollDetailExportMenu")?.classList.remove("show");

}



function closePayrollDetailExportMenus() {

  document.getElementById("payrollDetailExportMenu")?.classList.remove("show");

  document.getElementById("employeesDetailExportMenu")?.classList.remove("show");

}



document.addEventListener("click", function (e) {

  if (!e.target.closest(".payroll-detail-export-dropdown")) {

    document.getElementById("payrollDetailExportMenu")?.classList.remove("show");

  }

  if (!e.target.closest(".employees-detail-export-dropdown")) {

    document.getElementById("employeesDetailExportMenu")?.classList.remove("show");

  }

});



function exportPayrollDetailAs(type) {

  closePayrollDetailExportMenus();

  const data = getPayrollDetailExportData();

  if (!data) return;

  if (type === "pdf") exportPayrollDetailPDF(data);

  else if (type === "csv") exportPayrollDetailCSV(data);

}



function payrollDetailFileSlug(data) {

  const name = String(data.employeeName || "employee").replace(/[^\w\u4e00-\u9fa5-]+/g, "_");

  const period = String(data.periodNumber || "period");

  return `PayrollDetail_P${period}_${name}`;

}



function exportPayrollDetailCSV(data) {

  if (typeof showNotification === "function") showNotification(T("export.generatingCsv"), "info");

  const bom = "\uFEFF";

  const lines = [];

  lines.push("Employees Payroll Detail");

  lines.push(`"${csvCell(T("detail.meta.roles"))}","${csvCell(data.role)}"`);

  lines.push(`"${csvCell(T("detail.meta.hireDate"))}","${csvCell(data.hireDate)}"`);

  lines.push(`"${csvCell(T("detail.meta.employee"))}","${csvCell(data.employeeDisplay || data.employeeName)}"`);

  lines.push(`"${csvCell(T("detail.meta.ssn"))}","${csvCell(data.ssn || "")}"`);

  lines.push(`"${csvCell(T("detail.meta.payDate"))}","${csvCell(data.payDate || data.paycheckDate)}"`);

  lines.push(`"${csvCell(T("detail.meta.periodNo"))}","${csvCell(data.periodReportTitle || "")}"`);

  lines.push(`"${csvCell(T("detail.meta.payPeriod"))}","${csvCell(data.payPeriod || data.periodRange)}"`);

  lines.push(`"Department","${csvCell(data.department)}"`);

  lines.push(`"Store","${csvCell(data.store)}"`);

  lines.push(`"Period #","${csvCell(data.periodNumber)}"`);

  lines.push(`"Status","${data.confirmed ? "Confirmed" : "Draft Preview"}"`);

  lines.push("");

  lines.push("Summary");

  lines.push("Metric,Regular,OT,OT2,Total");

  lines.push(

    `"Hours",${num(data.summary.regH)},${num(data.summary.otH)},${num(data.summary.ot2H)},${num(data.summary.totalH)}`

  );

  lines.push(

    `"Amount",${num(data.summary.regAmt)},${num(data.summary.otAmt)},${num(data.summary.ot2Amt)},${num(data.summary.totalAmt)}`

  );

  lines.push(`"Service Charge",,,,${num(data.summary.svcw)}`);

  lines.push(`"Tips",,,,${num(data.summary.tips)}`);

  lines.push("");

  lines.push("Date,In,Out,Meal,Rate,Regular (h),OT (h),OT2 (h),Hours (h),Regular Amount,OT Amount,OT2 Amount,Total Amount");



  (data.dailyRows || []).forEach(function (row) {

    lines.push(

      [

        csvCell(row.date),

        csvCell(row.in),

        csvCell(row.out),

        csvCell(row.meal),

        num(row.rate),

        num(row.reg),

        num(row.ot),

        num(row.ot2),

        num(row.hours),

        num(row.regAmt),

        num(row.otAmt),

        num(row.ot2Amt),

        num(row.totalAmt),

      ].join(",")

    );

  });



  if (data.weekSummaries && data.weekSummaries.length) {

    lines.push("");

    lines.push("Week,Range,Total Hours,Regular,OT,OT2,Regular Amount,OT Amount,OT2 Amount,Total Amount");

    data.weekSummaries.forEach(function (wk) {

      lines.push(

        [

          csvCell(wk.title),

          csvCell(wk.range),

          num(wk.totalHours),

          num(wk.reg),

          num(wk.ot),

          num(wk.ot2),

          num(wk.regAmt),

          num(wk.otAmt),

          num(wk.ot2Amt),

          num(wk.amount),

        ].join(",")

      );

    });

  }



  lines.push("");

  lines.push(`"Declaration","${csvCell(data.declarationText)}"`);



  const blob = new Blob([bom + lines.join("\r\n")], { type: "text/csv;charset=utf-8;" });

  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");

  a.href = url;

  a.download = payrollDetailFileSlug(data) + ".csv";

  document.body.appendChild(a);

  a.click();

  document.body.removeChild(a);

  URL.revokeObjectURL(url);

  if (typeof showNotification === "function") showNotification(T("export.csvSuccess"), "success");

  if (typeof onPayrollDetailExported === "function") onPayrollDetailExported("csv", data);

}



function csvCell(v) {

  return String(v == null ? "" : v).replace(/"/g, '""');

}



function num(v) {

  const x = Number(v);

  return Number.isFinite(x) ? x.toFixed(2) : "0.00";

}



let _jspdfReady = false;

let _html2canvasReady = false;



function loadHtml2CanvasLib(callback) {

  if (_html2canvasReady || window.html2canvas) {

    _html2canvasReady = true;

    callback(true);

    return;

  }

  const cdns = [

    "https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js",

    "https://unpkg.com/html2canvas@1.4.1/dist/html2canvas.min.js",

  ];

  function tryLoad(idx) {

    if (idx >= cdns.length) {

      callback(false);

      return;

    }

    const s = document.createElement("script");

    s.src = cdns[idx];

    const t = setTimeout(function () {

      s.onload = s.onerror = null;

      tryLoad(idx + 1);

    }, 8000);

    s.onload = function () {

      clearTimeout(t);

      if (window.html2canvas) {

        _html2canvasReady = true;

        callback(true);

      } else tryLoad(idx + 1);

    };

    s.onerror = function () {

      clearTimeout(t);

      tryLoad(idx + 1);

    };

    document.head.appendChild(s);

  }

  tryLoad(0);

}



function loadJsPDFLib(callback) {

  if (_jspdfReady || window.jspdf) {

    _jspdfReady = true;

    callback(true);

    return;

  }

  const cdns = [

    "https://cdn.jsdelivr.net/npm/jspdf@2.5.2/dist/jspdf.umd.min.js",

    "https://unpkg.com/jspdf@2.5.2/dist/jspdf.umd.min.js",

  ];

  function tryLoad(idx) {

    if (idx >= cdns.length) {

      callback(false);

      return;

    }

    const s = document.createElement("script");

    s.src = cdns[idx];

    const t = setTimeout(function () {

      s.onload = s.onerror = null;

      tryLoad(idx + 1);

    }, 8000);

    s.onload = function () {

      clearTimeout(t);

      if (window.jspdf) {

        _jspdfReady = true;

        callback(true);

      } else tryLoad(idx + 1);

    };

    s.onerror = function () {

      clearTimeout(t);

      tryLoad(idx + 1);

    };

    document.head.appendChild(s);

  }

  tryLoad(0);

}



function getPayrollDetailPrintDocumentHtml() {

  if (typeof buildPayrollDetailPrintDocumentHtml !== "function") return null;

  return buildPayrollDetailPrintDocumentHtml();

}



function exportPayrollDetailPDF(data) {

  const docHtml = getPayrollDetailPrintDocumentHtml();

  if (!docHtml) {

    if (typeof showNotification === "function") showNotification(T("export.noPrintContent"), "error");

    return;

  }

  if (typeof showNotification === "function") showNotification(T("export.generatingPdf"), "info");

  loadHtml2CanvasLib(function (h2cReady) {

    loadJsPDFLib(function (jspdfReady) {

      if (h2cReady && jspdfReady) {

        renderPayrollDetailPdfFromPrintTemplate(docHtml, data);

      } else {

        openPayrollDetailPrintWindowAndPrint(docHtml, data);

      }

    });

  });

}



function preparePayrollDetailCaptureRoot(root) {

  if (!root) return { width: 0, height: 0 };

  root.querySelectorAll(".payroll-detail-daily-wrap").forEach(function (wrap) {

    wrap.style.overflow = "visible";

    wrap.style.width = "100%";

  });

  root.querySelectorAll(".payroll-detail-daily-table").forEach(function (table) {

    table.style.minWidth = "1080px";

    table.style.width = "max-content";

    table.style.maxWidth = "none";

  });

  const tableWidths = Array.prototype.map.call(

    root.querySelectorAll(".payroll-detail-daily-table"),

    function (table) {

      return table.scrollWidth || table.offsetWidth || 0;

    }

  );

  const widestTable = tableWidths.length ? Math.max.apply(null, tableWidths) : 0;

  const captureWidth = Math.max(root.scrollWidth, root.offsetWidth, widestTable + 48, 1080);

  const captureHeight = Math.max(root.scrollHeight, root.offsetHeight);

  root.style.maxWidth = "none";

  root.style.width = captureWidth + "px";

  return { width: captureWidth, height: captureHeight };

}



function renderPayrollDetailPdfFromPrintTemplate(docHtml, data) {

  const iframe = document.createElement("iframe");

  iframe.setAttribute("aria-hidden", "true");

  iframe.style.cssText = "position:fixed;left:-10000px;top:0;width:1280px;min-height:1600px;border:0;opacity:0;pointer-events:none";

  document.body.appendChild(iframe);



  let finished = false;

  let capturing = false;

  function cleanup() {

    iframe.remove();

  }

  function finishFallback() {

    if (finished) return;

    finished = true;

    cleanup();

    openPayrollDetailPrintWindowAndPrint(docHtml, data);

  }



  function runCapture() {

    if (finished || capturing) return;

    const idoc = iframe.contentDocument;

    const target = idoc && idoc.querySelector(".payroll-detail-print");

    if (!target || !window.html2canvas || !window.jspdf) {

      finishFallback();

      return;

    }

    capturing = true;

    const metrics = preparePayrollDetailCaptureRoot(target);

    const captureWidth = metrics.width || target.scrollWidth || target.offsetWidth;

    const captureHeight = metrics.height || target.scrollHeight || target.offsetHeight;

    window

      .html2canvas(target, {

        scale: 2,

        useCORS: true,

        logging: false,

        backgroundColor: "#ffffff",

        width: captureWidth,

        height: captureHeight,

        windowWidth: captureWidth,

        windowHeight: captureHeight,

      })

      .then(function (canvas) {

        if (finished) return;

        finished = true;

        const imgData = canvas.toDataURL("image/png");

        const pdf = new window.jspdf.jsPDF("p", "mm", "a4");

        const pageW = pdf.internal.pageSize.getWidth();

        const pageH = pdf.internal.pageSize.getHeight();

        const imgW = pageW;

        const imgH = (canvas.height * imgW) / canvas.width;

        let heightLeft = imgH;

        let position = 0;

        pdf.addImage(imgData, "PNG", 0, position, imgW, imgH);

        heightLeft -= pageH;

        while (heightLeft > 0) {

          position = heightLeft - imgH;

          pdf.addPage();

          pdf.addImage(imgData, "PNG", 0, position, imgW, imgH);

          heightLeft -= pageH;

        }

        pdf.save(payrollDetailFileSlug(data) + ".pdf");

        cleanup();

        if (typeof showNotification === "function") showNotification(T("export.pdfSuccess"), "success");

        if (typeof onPayrollDetailExported === "function") onPayrollDetailExported("pdf", data);

      })

      .catch(function () {

        capturing = false;

        finishFallback();

      });

  }



  const idoc = iframe.contentDocument;

  idoc.open();

  idoc.write(docHtml);

  idoc.close();

  iframe.onload = function () {

    setTimeout(runCapture, 500);

  };

  setTimeout(runCapture, 1500);

}



function openPayrollDetailPrintWindowAndPrint(docHtml, data) {

  if (typeof showNotification === "function") showNotification(T("export.printPreview"), "info");

  const win = window.open("", "_blank");

  if (!win) {

    if (typeof showNotification === "function") showNotification(T("export.popupBlocked"), "error");

    return;

  }

  win.document.open();

  win.document.write(docHtml);

  win.document.close();

  win.onload = function () {

    setTimeout(function () {

      win.focus();

      win.print();

    }, 400);

  };

  if (typeof showNotification === "function") {

    showNotification(T("export.printOpened"), "success");

  }

  if (typeof onPayrollDetailExported === "function") onPayrollDetailExported("pdf", data);

}



function openPayrollDetailEmailModal() {

  closePayrollDetailExportMenus();

  if (typeof openModal === "function") openModal("payrollDetailEmailModal");

}



function sendPayrollDetailEmail() {

  const email = document.getElementById("payrollDetailExportEmail")?.value.trim();

  if (!email) {

    if (typeof showNotification === "function") showNotification(T("email.required"), "error");

    return;

  }

  const emailReg = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const emails = email.split(",").map(function (e) {

    return e.trim();

  });

  for (let i = 0; i < emails.length; i++) {

    if (!emailReg.test(emails[i])) {

      if (typeof showNotification === "function") showNotification(T("email.invalid", { email: emails[i] }), "error");

      return;

    }

  }

  const fmtEl = document.querySelector('input[name="payrollDetailEmailFormat"]:checked');

  const fmt = (fmtEl ? fmtEl.value : "pdf").toUpperCase();

  if (typeof closeModal === "function") closeModal("payrollDetailEmailModal");

  if (typeof showNotification === "function") {

    showNotification(T("email.sending", { fmt: fmt, emails: emails.join(", ") }), "info");

  }

  setTimeout(function () {

    if (typeof showNotification === "function") showNotification(T("email.success"), "success");

    const data = getPayrollDetailExportData();

    if (data && typeof onPayrollDetailExported === "function") onPayrollDetailExported("email", data);

  }, 1500);

}


