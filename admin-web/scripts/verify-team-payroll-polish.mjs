import fs from "node:fs";

const read = (path) => fs.readFileSync(path, "utf8");
const main = read("src/main.ts");
const mount = read("src/team/payroll-page.ts");
const generated = read("src/team/payroll/payroll-page.css");
const polish = read("src/team/payroll/payroll-polish.css");
const failures = [];

const requireText = (source, text, label) => {
  if (!source.includes(text)) failures.push(`${label}: missing ${text}`);
};

requireText(main, "data-team-payroll-scroll", "native route scroll owner");
requireText(mount, 'import payrollPolishCss from "./payroll/payroll-polish.css?raw"', "polish import");
requireText(mount, "${payrollCss}</style><style>${payrollPolishCss}", "CSS injection order");
requireText(mount, 'container.addEventListener("wheel", handleWheel', "mouse-wheel bridge");
requireText(mount, 'container.removeEventListener("wheel", handleWheel)', "mouse-wheel cleanup");
requireText(mount, "function canScroll(element: HTMLElement, deltaY: number)", "local scroll boundary helper");
requireText(mount, "function isScrollContainer(element: HTMLElement)", "local scroll container helper");
requireText(mount, '["auto", "scroll"].includes(window.getComputedStyle(element).overflowY)', "real scroll container detection");
requireText(mount, "const localScroller = eventPath.find", "local scroll target detection");
requireText(mount, "isScrollContainer(node)", "local scroll container ownership");
requireText(mount, "if (!canScroll(localScroller, event.deltaY)) event.preventDefault()", "local scroll boundary containment");
requireText(mount, "if (isModalInteraction) {", "modal background scroll lock");
requireText(generated, ".employees-detail-preview-body {", "employee detail body scroll selector");
requireText(generated, "--primary: #1677ff", "payroll theme variables");
if (generated.includes("display=swap');")) {
  failures.push("font import removal left invalid CSS before payroll theme variables");
}
if (generated.includes(".employees-detail-preview-.team-payroll-page")) {
  failures.push("employee detail body selector was corrupted while scoping body selectors");
}
requireText(polish, ":host", "Shadow host sizing");
requireText(polish, ".team-payroll-page.payroll-workspace-active .payroll-workspace-main", "workspace scroll reset");
[
  "--payroll-canvas-radius: 16px",
  "--payroll-control-height: 42px",
  "padding: 24px",
  "border-radius: 14px",
  "background: #f7f7f7",
  "border: 1px solid #d9d9d9",
  ".payroll-period-summary",
  "order: 4",
].forEach((token) => requireText(polish, token, "visual reference rule"));
[
  "@media (max-width: 1279px)",
  "@media (max-width: 1100px)",
  "grid-template-columns: repeat(2, minmax(0, 1fr))",
  ".payroll-seg-table-wrap",
  "overflow-x: auto",
].forEach((token) => requireText(polish, token, "responsive rule"));

if (/@import/i.test(polish)) failures.push("polish CSS must not import external styles");
if (/(^|[}\n])\s*(html|body|\*)\b[^,{]*[{,]/m.test(polish)) {
  failures.push("polish CSS contains an unscoped global selector");
}

if (failures.length) {
  failures.forEach((failure) => console.error(failure));
  process.exit(1);
}
console.log("Team Payroll polish verification passed.");
