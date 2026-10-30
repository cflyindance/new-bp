# 开通说明与停用原因文案验证

- 基线：main@4565207a；分支：codex/rights-explanation-labels-20261030；预览端口5296。
- 2026-10-30，通过scripts/verify-rights-explanation-labels.cjs：普通记录按钮及标题为开通说明；已停用且有原因的记录为停用原因；reference与disableReason原文保留；关闭返回历史抽屉；只读操作不写入。
- TypeScript及git diff --check通过。仅修改展示文案，字段、来源、权限、试用和收费规则不变。
- 页面截图：opening.png、stopped.png；三份需求文档V1.22，变更编号RIGHTS-EXPLANATION-LABELS-20261030-95。
