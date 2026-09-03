import fs from "node:fs";
const css=fs.readFileSync("src/styles/app.css","utf8"),page=fs.readFileSync("src/team/tips-page.ts","utf8"),main=fs.readFileSync("src/main.ts","utf8");
const failures=[];
for(const token of ["position: fixed", "z-index: 2147483000", "100dvh", "overscroll-behavior: contain"])if(!css.includes(token))failures.push(`css missing ${token}`);
for(const token of ["team-tips-flow-fullscreen", "data-team-tips-flow-fullscreen", "classList.remove", "removeAttribute"])if(!page.includes(token)||!main.includes("data-team-tips-flow-fullscreen"))failures.push(`host missing ${token}`);
if(failures.length){failures.forEach(console.error);process.exit(1)}console.log("Team tips fullscreen host verification passed.");
