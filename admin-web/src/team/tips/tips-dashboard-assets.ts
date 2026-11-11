import icon0 from "./assets/dashboard/arrow-down.svg?raw";
import icon1 from "./assets/dashboard/arrow-left.svg?raw";
import icon2 from "./assets/dashboard/arrow-right.svg?raw";
import icon3 from "./assets/dashboard/calendar-days.svg?raw";
import icon4 from "./assets/dashboard/check.svg?raw";
import icon5 from "./assets/dashboard/chevron-down.svg?raw";
import icon6 from "./assets/dashboard/circle-alert.svg?raw";
import icon7 from "./assets/dashboard/ellipsis.svg?raw";
import icon8 from "./assets/dashboard/list-checks.svg?raw";
import icon9 from "./assets/dashboard/refresh-cw.svg?raw";
import icon10 from "./assets/dashboard/search.svg?raw";
import icon11 from "./assets/dashboard/store.svg?raw";
import icon12 from "./assets/dashboard/users.svg?raw";

// Bundle small SVGs with the application; root-site releases may omit public folders.
export const tipoutDashboardAssets: Record<string, string> = Object.fromEntries(
  [
    ["arrow-down.svg", icon0],
    ["arrow-left.svg", icon1],
    ["arrow-right.svg", icon2],
    ["calendar-days.svg", icon3],
    ["check.svg", icon4],
    ["chevron-down.svg", icon5],
    ["circle-alert.svg", icon6],
    ["ellipsis.svg", icon7],
    ["list-checks.svg", icon8],
    ["refresh-cw.svg", icon9],
    ["search.svg", icon10],
    ["store.svg", icon11],
    ["users.svg", icon12],
  ].map(([name, svg]) => [name, `data:image/svg+xml,${encodeURIComponent(svg)}`]),
);
