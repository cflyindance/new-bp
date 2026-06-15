/**
 * 团队管理 · 绩效与培训
 * 路径：/team/training-performance
 */

export const TEAM_TRAINING_PERFORMANCE_PATH = "/team/training-performance";

const COURSES_STORAGE_KEY = "bplant-team-training-courses-v1";
const COMPLETIONS_STORAGE_KEY = "bplant-team-training-completions-v1";
const REVIEWS_STORAGE_KEY = "bplant-team-performance-reviews-v1";
const EMPLOYEES_STORAGE_KEY = "tipout-employees-roster-v1";

type TrainingTab = "courses" | "reviews" | "progress";

type CourseStatus = "draft" | "published";

type TrainingCourse = {
  id: string;
  title: string;
  category: string;
  durationMinutes: number;
  requiredRoles: string[];
  status: CourseStatus;
  description: string;
};

type TrainingCompletion = {
  id: string;
  employeeId: string;
  courseId: string;
  status: "not-started" | "in-progress" | "completed";
  completedAt?: string;
  score?: number;
};

type ReviewStatus = "draft" | "completed";

type PerformanceReview = {
  id: string;
  employeeId: string;
  period: string;
  reviewDate: string;
  scores: {
    punctuality: number;
    serviceQuality: number;
    teamwork: number;
    salesTarget: number;
    overall: number;
  };
  note: string;
  status: ReviewStatus;
};

type RosterEmployee = {
  id: string;
  name: string;
  role?: string;
};

const COURSE_CATEGORIES = ["服务规范", "食品安全", "POS 操作", "管理技能"] as const;

const DEFAULT_EMPLOYEES: RosterEmployee[] = [
  { id: "emp-boss", name: "Boss", role: "Owner" },
  { id: "emp-demo-1", name: "Maria Garcia", role: "Server" },
  { id: "emp-demo-2", name: "Jason Chen", role: "Server" },
  { id: "emp-demo-3", name: "Mike Johnson", role: "Bartender" },
  { id: "emp-demo-4", name: "Tom Wilson", role: "Kitchen" },
];

const DEFAULT_COURSES: TrainingCourse[] = [
  {
    id: "course-service-101",
    title: "前厅服务标准",
    category: "服务规范",
    durationMinutes: 45,
    requiredRoles: ["Server", "Bartender"],
    status: "published",
    description: "迎宾、点单、巡台与客诉处理基础流程。",
  },
  {
    id: "course-food-safety",
    title: "食品安全与卫生",
    category: "食品安全",
    durationMinutes: 60,
    requiredRoles: ["Kitchen", "Server"],
    status: "published",
    description: "个人卫生、食材储存、过敏原与清洁消毒规范。",
  },
  {
    id: "course-pos-basic",
    title: "POS 基础操作",
    category: "POS 操作",
    durationMinutes: 30,
    requiredRoles: ["Server", "Bartender"],
    status: "published",
    description: "开台、下单、结账、退菜与常见异常处理。",
  },
];

const FORM_INPUT =
  "h-9 w-full rounded-md border border-input bg-background px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";
const FORM_SELECT = FORM_INPUT;
const SECTION_CARD = "rounded-xl border border-border bg-card shadow-sm";

let activeTab: TrainingTab = "courses";
let courseEditor: TrainingCourse | null = null;
let courseEditorOpen = false;
let reviewEditor: PerformanceReview | null = null;
let reviewEditorOpen = false;
let progressFilter = { employeeId: "", courseId: "" };
let reviewFilter = { employeeId: "", period: "" };

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function newId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function currentPeriod(): string {
  const d = new Date();
  const q = Math.floor(d.getMonth() / 3) + 1;
  return `${d.getFullYear()}-Q${q}`;
}

function readEmployees(): RosterEmployee[] {
  try {
    const raw = localStorage.getItem(EMPLOYEES_STORAGE_KEY);
    if (!raw) return [...DEFAULT_EMPLOYEES];
    const parsed = JSON.parse(raw) as RosterEmployee[];
    if (!Array.isArray(parsed) || parsed.length === 0) return [...DEFAULT_EMPLOYEES];
    return parsed.map((e) => ({ id: e.id, name: e.name, role: e.role }));
  } catch {
    return [...DEFAULT_EMPLOYEES];
  }
}

function normalizeCourse(raw: Partial<TrainingCourse> & Pick<TrainingCourse, "id" | "title">): TrainingCourse {
  return {
    id: raw.id,
    title: raw.title.trim() || "未命名课程",
    category: COURSE_CATEGORIES.includes(raw.category as (typeof COURSE_CATEGORIES)[number])
      ? raw.category!
      : COURSE_CATEGORIES[0],
    durationMinutes: Math.max(5, Math.round(Number(raw.durationMinutes)) || 30),
    requiredRoles: Array.isArray(raw.requiredRoles)
      ? raw.requiredRoles.map((r) => String(r).trim()).filter(Boolean)
      : [],
    status: raw.status === "published" ? "published" : "draft",
    description: typeof raw.description === "string" ? raw.description : "",
  };
}

function readCourses(): TrainingCourse[] {
  try {
    const raw = localStorage.getItem(COURSES_STORAGE_KEY);
    if (!raw) {
      writeCourses(DEFAULT_COURSES);
      return DEFAULT_COURSES.map((c) => ({ ...c }));
    }
    const parsed = JSON.parse(raw) as Partial<TrainingCourse>[];
    if (!Array.isArray(parsed) || parsed.length === 0) return DEFAULT_COURSES.map((c) => ({ ...c }));
    return parsed
      .filter((c) => c?.id && c?.title)
      .map((c) => normalizeCourse(c as TrainingCourse));
  } catch {
    return DEFAULT_COURSES.map((c) => ({ ...c }));
  }
}

function writeCourses(courses: TrainingCourse[]): void {
  localStorage.setItem(COURSES_STORAGE_KEY, JSON.stringify(courses));
}

function readCompletions(): TrainingCompletion[] {
  try {
    const raw = localStorage.getItem(COMPLETIONS_STORAGE_KEY);
    if (!raw) return seedCompletions();
    const parsed = JSON.parse(raw) as Partial<TrainingCompletion>[];
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((c) => c?.id && c?.employeeId && c?.courseId)
      .map((c) => ({
        id: String(c.id),
        employeeId: String(c.employeeId),
        courseId: String(c.courseId),
        status:
          c.status === "in-progress" || c.status === "completed" || c.status === "not-started"
            ? c.status
            : "not-started",
        completedAt: typeof c.completedAt === "string" ? c.completedAt : undefined,
        score: typeof c.score === "number" ? Math.min(100, Math.max(0, c.score)) : undefined,
      }));
  } catch {
    return [];
  }
}

function writeCompletions(items: TrainingCompletion[]): void {
  localStorage.setItem(COMPLETIONS_STORAGE_KEY, JSON.stringify(items));
}

function seedCompletions(): TrainingCompletion[] {
  const demo: TrainingCompletion[] = [
    {
      id: "comp-1",
      employeeId: "emp-demo-1",
      courseId: "course-service-101",
      status: "completed",
      completedAt: todayIso(),
      score: 92,
    },
    {
      id: "comp-2",
      employeeId: "emp-demo-1",
      courseId: "course-pos-basic",
      status: "in-progress",
    },
    {
      id: "comp-3",
      employeeId: "emp-demo-4",
      courseId: "course-food-safety",
      status: "completed",
      completedAt: todayIso(),
      score: 88,
    },
  ];
  writeCompletions(demo);
  return demo;
}

function clampScore(n: number): number {
  return Math.min(5, Math.max(1, Math.round(n)));
}

function normalizeReview(raw: Partial<PerformanceReview> & Pick<PerformanceReview, "id" | "employeeId" | "period">): PerformanceReview {
  const scores = raw.scores ?? {
    punctuality: 3,
    serviceQuality: 3,
    teamwork: 3,
    salesTarget: 3,
    overall: 3,
  };
  return {
    id: raw.id,
    employeeId: raw.employeeId,
    period: raw.period,
    reviewDate: raw.reviewDate ?? todayIso(),
    scores: {
      punctuality: clampScore(scores.punctuality),
      serviceQuality: clampScore(scores.serviceQuality),
      teamwork: clampScore(scores.teamwork),
      salesTarget: clampScore(scores.salesTarget),
      overall: clampScore(scores.overall),
    },
    note: typeof raw.note === "string" ? raw.note : "",
    status: raw.status === "completed" ? "completed" : "draft",
  };
}

function readReviews(): PerformanceReview[] {
  try {
    const raw = localStorage.getItem(REVIEWS_STORAGE_KEY);
    if (!raw) return seedReviews();
    const parsed = JSON.parse(raw) as Partial<PerformanceReview>[];
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((r) => r?.id && r?.employeeId && r?.period)
      .map((r) => normalizeReview(r as PerformanceReview));
  } catch {
    return [];
  }
}

function writeReviews(reviews: PerformanceReview[]): void {
  localStorage.setItem(REVIEWS_STORAGE_KEY, JSON.stringify(reviews));
}

function seedReviews(): PerformanceReview[] {
  const demo: PerformanceReview[] = [
    normalizeReview({
      id: "review-1",
      employeeId: "emp-demo-1",
      period: currentPeriod(),
      reviewDate: todayIso(),
      scores: { punctuality: 5, serviceQuality: 4, teamwork: 5, salesTarget: 4, overall: 4 },
      note: "客诉处理及时，可加强 upsell。",
      status: "completed",
    }),
    normalizeReview({
      id: "review-2",
      employeeId: "emp-demo-3",
      period: currentPeriod(),
      reviewDate: todayIso(),
      scores: { punctuality: 4, serviceQuality: 4, teamwork: 3, salesTarget: 5, overall: 4 },
      note: "",
      status: "draft",
    }),
  ];
  writeReviews(demo);
  return demo;
}

function completionCountForCourse(courseId: string): number {
  return readCompletions().filter((c) => c.courseId === courseId && c.status === "completed").length;
}

function getOrCreateCompletion(employeeId: string, courseId: string): TrainingCompletion {
  const existing = readCompletions().find((c) => c.employeeId === employeeId && c.courseId === courseId);
  if (existing) return existing;
  return {
    id: newId("comp"),
    employeeId,
    courseId,
    status: "not-started",
  };
}

function completionStatusLabel(status: TrainingCompletion["status"]): string {
  switch (status) {
    case "not-started":
      return "未开始";
    case "in-progress":
      return "进行中";
    case "completed":
      return "已完成";
  }
}

function completionBadgeClass(status: TrainingCompletion["status"]): string {
  switch (status) {
    case "not-started":
      return "bg-muted text-muted-foreground";
    case "in-progress":
      return "bg-amber-500/15 text-amber-700 dark:text-amber-400";
    case "completed":
      return "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400";
  }
}

function renderEmployeeOptions(employees: RosterEmployee[], selected: string, allLabel: string): string {
  const opts = [`<option value="">${escapeHtml(allLabel)}</option>`];
  for (const e of employees) {
    const sel = e.id === selected ? " selected" : "";
    opts.push(`<option value="${escapeHtml(e.id)}"${sel}>${escapeHtml(e.name)}</option>`);
  }
  return opts.join("");
}

function renderTabBar(): string {
  const tabs: { key: TrainingTab; label: string }[] = [
    { key: "courses", label: "培训课程" },
    { key: "reviews", label: "绩效评估" },
    { key: "progress", label: "学习进度" },
  ];
  return `
    <div class="flex shrink-0 gap-1 border-b border-border" role="tablist" aria-label="绩效与培训">
      ${tabs
        .map((tab) => {
          const selected = activeTab === tab.key;
          return `
        <button type="button" role="tab" data-training-tab="${tab.key}"
          class="min-h-10 border-b-2 px-4 text-sm font-medium transition-colors ${
            selected ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:border-border hover:text-foreground"
          }"
          ${selected ? 'aria-selected="true"' : 'aria-selected="false"'}
        >${tab.label}</button>`;
        })
        .join("")}
    </div>`;
}

function renderCoursesPanel(): string {
  const courses = readCourses();
  const rows =
    courses.length > 0
      ? courses
          .map((c) => {
            const roles = c.requiredRoles.length > 0 ? c.requiredRoles.join("、") : "—";
            const statusCls =
              c.status === "published"
                ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"
                : "bg-muted text-muted-foreground";
            return `
        <tr class="border-b border-border/60 hover:bg-muted/20">
          <td class="px-3 py-2.5">
            <span class="font-medium text-foreground">${escapeHtml(c.title)}</span>
            ${c.description ? `<span class="mt-0.5 block max-w-md truncate text-xs text-muted-foreground">${escapeHtml(c.description)}</span>` : ""}
          </td>
          <td class="px-3 py-2.5 text-sm text-muted-foreground">${escapeHtml(c.category)}</td>
          <td class="px-3 py-2.5 text-sm tabular-nums">${c.durationMinutes} 分</td>
          <td class="px-3 py-2.5"><span class="inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${statusCls}">${c.status === "published" ? "已发布" : "草稿"}</span></td>
          <td class="px-3 py-2.5 text-sm text-muted-foreground">${escapeHtml(roles)}</td>
          <td class="px-3 py-2.5 text-sm tabular-nums">${completionCountForCourse(c.id)}</td>
          <td class="px-3 py-2.5">
            <div class="flex flex-wrap gap-1">
              <button type="button" data-course-edit="${escapeHtml(c.id)}" class="rounded border border-border px-2 py-1 text-xs hover:bg-muted">编辑</button>
              ${c.status === "draft" ? `<button type="button" data-course-publish="${escapeHtml(c.id)}" class="rounded border border-border px-2 py-1 text-xs text-primary hover:bg-muted">发布</button>` : ""}
              <button type="button" data-course-delete="${escapeHtml(c.id)}" class="rounded border border-border px-2 py-1 text-xs text-destructive hover:bg-muted">删除</button>
            </div>
          </td>
        </tr>`;
          })
          .join("")
      : `<tr><td colspan="7" class="px-4 py-10 text-center text-sm text-muted-foreground">暂无课程，点击右上角新增</td></tr>`;

  return `
    <div class="flex min-h-0 flex-1 flex-col gap-3" data-training-courses-panel>
      <div class="flex items-center justify-between gap-2">
        <p class="text-sm text-muted-foreground">管理培训课程与必修岗位；员工学习进度见「学习进度」。</p>
        <button type="button" data-course-add class="h-9 shrink-0 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90">+ 新增课程</button>
      </div>
      <div class="${SECTION_CARD} overflow-x-auto">
        <table class="w-full min-w-[52rem] text-left text-sm">
          <thead class="border-b border-border bg-muted/30 text-xs text-muted-foreground">
            <tr>
              <th class="px-3 py-2.5 font-medium">课程</th>
              <th class="px-3 py-2.5 font-medium">分类</th>
              <th class="px-3 py-2.5 font-medium">时长</th>
              <th class="px-3 py-2.5 font-medium">状态</th>
              <th class="px-3 py-2.5 font-medium">必修岗位</th>
              <th class="px-3 py-2.5 font-medium">完成人数</th>
              <th class="px-3 py-2.5 font-medium">操作</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    </div>`;
}

function renderReviewsPanel(): string {
  const employees = readEmployees();
  const empMap = new Map(employees.map((e) => [e.id, e]));
  const reviews = readReviews().filter((r) => {
    if (reviewFilter.employeeId && r.employeeId !== reviewFilter.employeeId) return false;
    if (reviewFilter.period && r.period !== reviewFilter.period) return false;
    return true;
  });

  const periods = [...new Set(readReviews().map((r) => r.period))].sort().reverse();
  const periodOpts = [
    `<option value="">全部周期</option>`,
    ...periods.map((p) => {
      const sel = reviewFilter.period === p ? " selected" : "";
      return `<option value="${escapeHtml(p)}"${sel}>${escapeHtml(p)}</option>`;
    }),
  ].join("");

  const rows =
    reviews.length > 0
      ? reviews
          .map((r) => {
            const emp = empMap.get(r.employeeId);
            const statusCls =
              r.status === "completed"
                ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"
                : "bg-amber-500/15 text-amber-700 dark:text-amber-400";
            return `
        <tr class="border-b border-border/60 hover:bg-muted/20">
          <td class="px-3 py-2.5 text-sm font-medium">${escapeHtml(emp?.name ?? r.employeeId)}</td>
          <td class="px-3 py-2.5 text-sm">${escapeHtml(r.period)}</td>
          <td class="px-3 py-2.5 text-sm tabular-nums">${r.scores.punctuality}</td>
          <td class="px-3 py-2.5 text-sm tabular-nums">${r.scores.serviceQuality}</td>
          <td class="px-3 py-2.5 text-sm tabular-nums">${r.scores.teamwork}</td>
          <td class="px-3 py-2.5 text-sm tabular-nums">${r.scores.salesTarget}</td>
          <td class="px-3 py-2.5 text-sm font-medium tabular-nums">${r.scores.overall}</td>
          <td class="px-3 py-2.5"><span class="inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${statusCls}">${r.status === "completed" ? "已完成" : "草稿"}</span></td>
          <td class="px-3 py-2.5">
            <button type="button" data-review-edit="${escapeHtml(r.id)}" class="rounded border border-border px-2 py-1 text-xs hover:bg-muted">编辑</button>
          </td>
        </tr>`;
          })
          .join("")
      : `<tr><td colspan="9" class="px-4 py-10 text-center text-sm text-muted-foreground">暂无绩效评估记录</td></tr>`;

  return `
    <div class="flex min-h-0 flex-1 flex-col gap-3" data-training-reviews-panel>
      <div class="flex flex-wrap items-center justify-between gap-2">
        <p class="text-sm text-muted-foreground">周期性绩效评分（1–5 分）；汇总报表见 <a href="#/team/reports/performance" class="text-primary hover:underline">员工报表 · 绩效</a>。</p>
        <button type="button" data-review-add class="h-9 shrink-0 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90">+ 新建评估</button>
      </div>
      <div class="flex flex-wrap gap-3">
        <select data-review-employee-filter class="${FORM_SELECT} w-auto min-w-[10rem]">${renderEmployeeOptions(employees, reviewFilter.employeeId, "全部员工")}</select>
        <select data-review-period-filter class="${FORM_SELECT} w-auto min-w-[8rem]">${periodOpts}</select>
      </div>
      <div class="${SECTION_CARD} overflow-x-auto">
        <table class="w-full min-w-[56rem] text-left text-sm">
          <thead class="border-b border-border bg-muted/30 text-xs text-muted-foreground">
            <tr>
              <th class="px-3 py-2.5 font-medium">员工</th>
              <th class="px-3 py-2.5 font-medium">周期</th>
              <th class="px-3 py-2.5 font-medium">准时性</th>
              <th class="px-3 py-2.5 font-medium">服务质量</th>
              <th class="px-3 py-2.5 font-medium">协作</th>
              <th class="px-3 py-2.5 font-medium">销售达成</th>
              <th class="px-3 py-2.5 font-medium">综合</th>
              <th class="px-3 py-2.5 font-medium">状态</th>
              <th class="px-3 py-2.5 font-medium">操作</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    </div>`;
}

function renderProgressPanel(): string {
  const employees = readEmployees();
  const courses = readCourses().filter((c) => c.status === "published");
  const completions = readCompletions();

  const courseOpts = [
    `<option value="">全部课程</option>`,
    ...courses.map((c) => {
      const sel = progressFilter.courseId === c.id ? " selected" : "";
      return `<option value="${escapeHtml(c.id)}"${sel}>${escapeHtml(c.title)}</option>`;
    }),
  ].join("");

  const rows: string[] = [];
  for (const emp of employees) {
    if (progressFilter.employeeId && emp.id !== progressFilter.employeeId) continue;
    for (const course of courses) {
      if (progressFilter.courseId && course.id !== progressFilter.courseId) continue;
      const comp = completions.find((c) => c.employeeId === emp.id && c.courseId === course.id) ?? {
        id: "",
        employeeId: emp.id,
        courseId: course.id,
        status: "not-started" as const,
      };
      rows.push(`
        <tr class="border-b border-border/60 hover:bg-muted/20">
          <td class="px-3 py-2.5 text-sm font-medium">${escapeHtml(emp.name)}</td>
          <td class="px-3 py-2.5 text-sm">${escapeHtml(course.title)}</td>
          <td class="px-3 py-2.5"><span class="inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${completionBadgeClass(comp.status)}">${completionStatusLabel(comp.status)}</span></td>
          <td class="px-3 py-2.5 text-sm tabular-nums">${comp.completedAt ? escapeHtml(comp.completedAt) : "—"}</td>
          <td class="px-3 py-2.5 text-sm tabular-nums">${typeof comp.score === "number" ? `${comp.score}` : "—"}</td>
          <td class="px-3 py-2.5">
            <div class="flex flex-wrap gap-1">
              ${comp.status !== "completed" ? `<button type="button" data-progress-complete="${escapeHtml(emp.id)}" data-progress-course="${escapeHtml(course.id)}" class="rounded border border-border px-2 py-1 text-xs text-primary hover:bg-muted">标记完成</button>` : ""}
              ${comp.status === "not-started" ? `<button type="button" data-progress-start="${escapeHtml(emp.id)}" data-progress-course="${escapeHtml(course.id)}" class="rounded border border-border px-2 py-1 text-xs hover:bg-muted">开始学习</button>` : ""}
            </div>
          </td>
        </tr>`);
    }
  }

  const tableBody =
    rows.length > 0
      ? rows.join("")
      : `<tr><td colspan="6" class="px-4 py-10 text-center text-sm text-muted-foreground">暂无学习记录</td></tr>`;

  return `
    <div class="flex min-h-0 flex-1 flex-col gap-3" data-training-progress-panel>
      <p class="text-sm text-muted-foreground">跟踪员工课程完成情况；可手动更新学习状态与测验分数。</p>
      <div class="flex flex-wrap gap-3">
        <select data-progress-employee-filter class="${FORM_SELECT} w-auto min-w-[10rem]">${renderEmployeeOptions(employees, progressFilter.employeeId, "全部员工")}</select>
        <select data-progress-course-filter class="${FORM_SELECT} w-auto min-w-[12rem]">${courseOpts}</select>
      </div>
      <div class="${SECTION_CARD} overflow-x-auto">
        <table class="w-full min-w-[48rem] text-left text-sm">
          <thead class="border-b border-border bg-muted/30 text-xs text-muted-foreground">
            <tr>
              <th class="px-3 py-2.5 font-medium">员工</th>
              <th class="px-3 py-2.5 font-medium">课程</th>
              <th class="px-3 py-2.5 font-medium">状态</th>
              <th class="px-3 py-2.5 font-medium">完成日期</th>
              <th class="px-3 py-2.5 font-medium">测验分</th>
              <th class="px-3 py-2.5 font-medium">操作</th>
            </tr>
          </thead>
          <tbody>${tableBody}</tbody>
        </table>
      </div>
    </div>`;
}

function renderCourseEditorDialog(): string {
  if (!courseEditorOpen || !courseEditor) return "";
  const c = courseEditor;
  const catOpts = COURSE_CATEGORIES.map(
    (cat) => `<option value="${escapeHtml(cat)}"${c.category === cat ? " selected" : ""}>${escapeHtml(cat)}</option>`,
  ).join("");
  const statusOpts = [
    `<option value="draft"${c.status === "draft" ? " selected" : ""}>草稿</option>`,
    `<option value="published"${c.status === "published" ? " selected" : ""}>已发布</option>`,
  ].join("");

  return `
    <div class="fixed inset-0 z-50 flex items-center justify-center p-4" data-course-editor-dialog role="dialog" aria-modal="true">
      <button type="button" class="absolute inset-0 bg-black/40" data-course-editor-backdrop aria-label="关闭"></button>
      <div class="relative z-10 max-h-[90vh] w-full max-w-lg overflow-auto rounded-xl border border-border bg-card p-5 shadow-lg">
        <h2 class="text-base font-semibold">${c.id.startsWith("course-new") ? "新增课程" : "编辑课程"}</h2>
        <div class="mt-4 space-y-3">
          <label class="block text-sm"><span class="mb-1 block text-muted-foreground">课程名称</span>
            <input type="text" data-course-field="title" value="${escapeHtml(c.title)}" class="${FORM_INPUT}" /></label>
          <label class="block text-sm"><span class="mb-1 block text-muted-foreground">分类</span>
            <select data-course-field="category" class="${FORM_SELECT}">${catOpts}</select></label>
          <label class="block text-sm"><span class="mb-1 block text-muted-foreground">时长（分钟）</span>
            <input type="number" min="5" step="5" data-course-field="durationMinutes" value="${c.durationMinutes}" class="${FORM_INPUT}" /></label>
          <label class="block text-sm"><span class="mb-1 block text-muted-foreground">必修岗位（逗号分隔）</span>
            <input type="text" data-course-field="requiredRoles" value="${escapeHtml(c.requiredRoles.join(", "))}" placeholder="Server, Kitchen" class="${FORM_INPUT}" /></label>
          <label class="block text-sm"><span class="mb-1 block text-muted-foreground">状态</span>
            <select data-course-field="status" class="${FORM_SELECT}">${statusOpts}</select></label>
          <label class="block text-sm"><span class="mb-1 block text-muted-foreground">课程简介</span>
            <textarea data-course-field="description" rows="3" class="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">${escapeHtml(c.description)}</textarea></label>
        </div>
        <div class="mt-5 flex justify-end gap-2">
          <button type="button" data-course-editor-cancel class="rounded-md border border-border px-4 py-2 text-sm hover:bg-muted">取消</button>
          <button type="button" data-course-editor-save class="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">保存</button>
        </div>
      </div>
    </div>`;
}

function renderReviewEditorDialog(): string {
  if (!reviewEditorOpen || !reviewEditor) return "";
  const r = reviewEditor;
  const employees = readEmployees();
  const empOpts = employees
    .map((e) => {
      const sel = e.id === r.employeeId ? " selected" : "";
      return `<option value="${escapeHtml(e.id)}"${sel}>${escapeHtml(e.name)}</option>`;
    })
    .join("");
  const statusOpts = [
    `<option value="draft"${r.status === "draft" ? " selected" : ""}>草稿</option>`,
    `<option value="completed"${r.status === "completed" ? " selected" : ""}>已完成</option>`,
  ].join("");

  const scoreField = (key: keyof PerformanceReview["scores"], label: string) => `
    <label class="block text-sm">
      <span class="mb-1 block text-muted-foreground">${label}（1–5）</span>
      <input type="number" min="1" max="5" step="1" data-review-score="${key}" value="${r.scores[key]}" class="${FORM_INPUT} max-w-[6rem]" />
    </label>`;

  return `
    <div class="fixed inset-0 z-50 flex items-center justify-center p-4" data-review-editor-dialog role="dialog" aria-modal="true">
      <button type="button" class="absolute inset-0 bg-black/40" data-review-editor-backdrop aria-label="关闭"></button>
      <div class="relative z-10 max-h-[90vh] w-full max-w-lg overflow-auto rounded-xl border border-border bg-card p-5 shadow-lg">
        <h2 class="text-base font-semibold">${r.id.startsWith("review-new") ? "新建绩效评估" : "编辑绩效评估"}</h2>
        <div class="mt-4 space-y-3">
          <label class="block text-sm"><span class="mb-1 block text-muted-foreground">员工</span>
            <select data-review-field="employeeId" class="${FORM_SELECT}">${empOpts}</select></label>
          <label class="block text-sm"><span class="mb-1 block text-muted-foreground">评估周期</span>
            <input type="text" data-review-field="period" value="${escapeHtml(r.period)}" placeholder="2026-Q2" class="${FORM_INPUT}" /></label>
          <label class="block text-sm"><span class="mb-1 block text-muted-foreground">评估日期</span>
            <input type="date" data-review-field="reviewDate" value="${escapeHtml(r.reviewDate)}" class="${FORM_INPUT}" /></label>
          <div class="grid gap-3 sm:grid-cols-2">
            ${scoreField("punctuality", "准时性")}
            ${scoreField("serviceQuality", "服务质量")}
            ${scoreField("teamwork", "协作")}
            ${scoreField("salesTarget", "销售达成")}
            ${scoreField("overall", "综合")}
          </div>
          <label class="block text-sm"><span class="mb-1 block text-muted-foreground">状态</span>
            <select data-review-field="status" class="${FORM_SELECT}">${statusOpts}</select></label>
          <label class="block text-sm"><span class="mb-1 block text-muted-foreground">备注</span>
            <textarea data-review-field="note" rows="3" class="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">${escapeHtml(r.note)}</textarea></label>
        </div>
        <div class="mt-5 flex justify-end gap-2">
          <button type="button" data-review-editor-cancel class="rounded-md border border-border px-4 py-2 text-sm hover:bg-muted">取消</button>
          <button type="button" data-review-editor-save class="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">保存</button>
        </div>
      </div>
    </div>`;
}

export function isTeamTrainingPerformancePath(path: string): boolean {
  return (
    path === TEAM_TRAINING_PERFORMANCE_PATH ||
    path.startsWith(`${TEAM_TRAINING_PERFORMANCE_PATH}/`)
  );
}

export function renderTeamTrainingPerformancePage(): string {
  const panel =
    activeTab === "courses"
      ? renderCoursesPanel()
      : activeTab === "reviews"
        ? renderReviewsPanel()
        : renderProgressPanel();

  return `
    <div class="team-training-performance-page flex min-h-0 flex-1 flex-col gap-4" data-team-training-performance-page>
      <p class="shrink-0 text-sm text-muted-foreground">管理培训课程、绩效评估与学习进度，支撑门店人员培养与考核。</p>
      ${renderTabBar()}
      ${panel}
      ${renderCourseEditorDialog()}
      ${renderReviewEditorDialog()}
    </div>`;
}

function collectCourseFromDialog(): TrainingCourse | null {
  const dialog = document.querySelector("[data-course-editor-dialog]");
  if (!dialog || !courseEditor) return null;
  const title = dialog.querySelector<HTMLInputElement>('[data-course-field="title"]')?.value.trim() ?? "";
  if (!title) return null;
  const category = dialog.querySelector<HTMLSelectElement>('[data-course-field="category"]')?.value ?? COURSE_CATEGORIES[0];
  const durationMinutes = Number(dialog.querySelector<HTMLInputElement>('[data-course-field="durationMinutes"]')?.value) || 30;
  const rolesRaw = dialog.querySelector<HTMLInputElement>('[data-course-field="requiredRoles"]')?.value ?? "";
  const status = dialog.querySelector<HTMLSelectElement>('[data-course-field="status"]')?.value === "published" ? "published" : "draft";
  const description = dialog.querySelector<HTMLTextAreaElement>('[data-course-field="description"]')?.value ?? "";
  return normalizeCourse({
    id: courseEditor.id,
    title,
    category,
    durationMinutes,
    requiredRoles: rolesRaw.split(/[,，]/).map((s) => s.trim()).filter(Boolean),
    status,
    description,
  });
}

function collectReviewFromDialog(): PerformanceReview | null {
  const dialog = document.querySelector("[data-review-editor-dialog]");
  if (!dialog || !reviewEditor) return null;
  const employeeId = dialog.querySelector<HTMLSelectElement>('[data-review-field="employeeId"]')?.value ?? "";
  const period = dialog.querySelector<HTMLInputElement>('[data-review-field="period"]')?.value.trim() ?? "";
  if (!employeeId || !period) return null;
  const reviewDate = dialog.querySelector<HTMLInputElement>('[data-review-field="reviewDate"]')?.value ?? todayIso();
  const status = dialog.querySelector<HTMLSelectElement>('[data-review-field="status"]')?.value === "completed" ? "completed" : "draft";
  const note = dialog.querySelector<HTMLTextAreaElement>('[data-review-field="note"]')?.value ?? "";
  const scores = {
    punctuality: Number(dialog.querySelector<HTMLInputElement>('[data-review-score="punctuality"]')?.value) || 3,
    serviceQuality: Number(dialog.querySelector<HTMLInputElement>('[data-review-score="serviceQuality"]')?.value) || 3,
    teamwork: Number(dialog.querySelector<HTMLInputElement>('[data-review-score="teamwork"]')?.value) || 3,
    salesTarget: Number(dialog.querySelector<HTMLInputElement>('[data-review-score="salesTarget"]')?.value) || 3,
    overall: Number(dialog.querySelector<HTMLInputElement>('[data-review-score="overall"]')?.value) || 3,
  };
  return normalizeReview({ id: reviewEditor.id, employeeId, period, reviewDate, scores, note, status });
}

function upsertCompletion(item: TrainingCompletion): void {
  const all = readCompletions().filter((c) => !(c.employeeId === item.employeeId && c.courseId === item.courseId));
  all.push(item);
  writeCompletions(all);
}

export function bindTeamTrainingPerformanceUi(remount: () => void): void {
  const root = document.querySelector<HTMLElement>("[data-team-training-performance-page]");
  if (!root || root.dataset.trainingPerformanceBound === "1") return;
  root.dataset.trainingPerformanceBound = "1";

  root.querySelectorAll("[data-training-tab]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const tab = btn.getAttribute("data-training-tab") as TrainingTab;
      if (!tab || tab === activeTab) return;
      activeTab = tab;
      remount();
    });
  });

  root.querySelector("[data-course-add]")?.addEventListener("click", () => {
    courseEditor = normalizeCourse({
      id: newId("course-new"),
      title: "",
      category: COURSE_CATEGORIES[0],
      durationMinutes: 30,
      requiredRoles: [],
      status: "draft",
      description: "",
    });
    courseEditorOpen = true;
    remount();
  });

  root.querySelectorAll("[data-course-edit]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.getAttribute("data-course-edit");
      const course = readCourses().find((c) => c.id === id);
      if (!course) return;
      courseEditor = { ...course };
      courseEditorOpen = true;
      remount();
    });
  });

  root.querySelectorAll("[data-course-publish]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.getAttribute("data-course-publish");
      if (!id) return;
      const courses = readCourses().map((c) => (c.id === id ? { ...c, status: "published" as const } : c));
      writeCourses(courses);
      remount();
    });
  });

  root.querySelectorAll("[data-course-delete]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.getAttribute("data-course-delete");
      if (!id || !window.confirm("确定删除此课程？")) return;
      writeCourses(readCourses().filter((c) => c.id !== id));
      writeCompletions(readCompletions().filter((c) => c.courseId !== id));
      remount();
    });
  });

  const courseDialog = root.querySelector("[data-course-editor-dialog]");
  courseDialog?.querySelector("[data-course-editor-backdrop]")?.addEventListener("click", () => {
    courseEditorOpen = false;
    courseEditor = null;
    remount();
  });
  courseDialog?.querySelector("[data-course-editor-cancel]")?.addEventListener("click", () => {
    courseEditorOpen = false;
    courseEditor = null;
    remount();
  });
  courseDialog?.querySelector("[data-course-editor-save]")?.addEventListener("click", () => {
    const updated = collectCourseFromDialog();
    if (!updated) return;
    const courses = readCourses().filter((c) => c.id !== updated.id);
    courses.push(updated);
    writeCourses(courses);
    courseEditorOpen = false;
    courseEditor = null;
    remount();
  });

  root.querySelector("[data-review-add]")?.addEventListener("click", () => {
    const employees = readEmployees();
    reviewEditor = normalizeReview({
      id: newId("review-new"),
      employeeId: employees[0]?.id ?? "",
      period: currentPeriod(),
      reviewDate: todayIso(),
      scores: { punctuality: 3, serviceQuality: 3, teamwork: 3, salesTarget: 3, overall: 3 },
      note: "",
      status: "draft",
    });
    reviewEditorOpen = true;
    remount();
  });

  root.querySelectorAll("[data-review-edit]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.getAttribute("data-review-edit");
      const review = readReviews().find((r) => r.id === id);
      if (!review) return;
      reviewEditor = { ...review, scores: { ...review.scores } };
      reviewEditorOpen = true;
      remount();
    });
  });

  const reviewDialog = root.querySelector("[data-review-editor-dialog]");
  reviewDialog?.querySelector("[data-review-editor-backdrop]")?.addEventListener("click", () => {
    reviewEditorOpen = false;
    reviewEditor = null;
    remount();
  });
  reviewDialog?.querySelector("[data-review-editor-cancel]")?.addEventListener("click", () => {
    reviewEditorOpen = false;
    reviewEditor = null;
    remount();
  });
  reviewDialog?.querySelector("[data-review-editor-save]")?.addEventListener("click", () => {
    const updated = collectReviewFromDialog();
    if (!updated) return;
    const reviews = readReviews().filter((r) => r.id !== updated.id);
    reviews.push(updated);
    writeReviews(reviews);
    reviewEditorOpen = false;
    reviewEditor = null;
    remount();
  });

  root.querySelector("[data-review-employee-filter]")?.addEventListener("change", () => {
    reviewFilter.employeeId = root.querySelector<HTMLSelectElement>("[data-review-employee-filter]")?.value ?? "";
    remount();
  });
  root.querySelector("[data-review-period-filter]")?.addEventListener("change", () => {
    reviewFilter.period = root.querySelector<HTMLSelectElement>("[data-review-period-filter]")?.value ?? "";
    remount();
  });

  root.querySelector("[data-progress-employee-filter]")?.addEventListener("change", () => {
    progressFilter.employeeId = root.querySelector<HTMLSelectElement>("[data-progress-employee-filter]")?.value ?? "";
    remount();
  });
  root.querySelector("[data-progress-course-filter]")?.addEventListener("change", () => {
    progressFilter.courseId = root.querySelector<HTMLSelectElement>("[data-progress-course-filter]")?.value ?? "";
    remount();
  });

  root.querySelectorAll("[data-progress-start]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const employeeId = btn.getAttribute("data-progress-start");
      const courseId = btn.getAttribute("data-progress-course");
      if (!employeeId || !courseId) return;
      const item = getOrCreateCompletion(employeeId, courseId);
      item.status = "in-progress";
      upsertCompletion(item);
      remount();
    });
  });

  root.querySelectorAll("[data-progress-complete]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const employeeId = btn.getAttribute("data-progress-complete");
      const courseId = btn.getAttribute("data-progress-course");
      if (!employeeId || !courseId) return;
      const scoreStr = window.prompt("测验分数（0–100，可留空）", "85");
      const item = getOrCreateCompletion(employeeId, courseId);
      item.status = "completed";
      item.completedAt = todayIso();
      if (scoreStr !== null && scoreStr.trim() !== "") {
        item.score = Math.min(100, Math.max(0, Number(scoreStr) || 0));
      }
      upsertCompletion(item);
      remount();
    });
  });
}
