/**
 * 后厨管理中心 · KDS 终端配置（display / workflow）分组与组内顺序。
 * 依据：docs/项目文档/后厨管理中心-KDS终端配置-语义重设计方案.md v1.0
 * seq 701–721 为 catalog 虚拟项（待产品分配正式 seq）。
 */

/** KDS 显示与交互 · 二级导航展示顺序 */
export const KDS_DISPLAY_SETTINGS_GROUP_ORDER = [
  "kds-display-layout",
  "kds-display-theme",
  "kds-display-lines",
  "kds-display-order-alert",
];

/** KDS 出餐流程 · 二级导航展示顺序 */
export const KDS_WORKFLOW_SETTINGS_GROUP_ORDER = [
  "kds-workflow-status",
  "kds-workflow-confirm",
  "kds-workflow-cross-terminal",
  "kds-workflow-advanced",
  "kds-workflow-alert",
];

const KDS_DISPLAY_LAYOUT_SEQ_ORDER = [701];
const KDS_DISPLAY_THEME_SEQ_ORDER = [702, 703, 704];
const KDS_DISPLAY_LINES_SEQ_ORDER = [705, 706];
const KDS_DISPLAY_ORDER_ALERT_SEQ_ORDER = [707, 708];

const KDS_WORKFLOW_STATUS_SEQ_ORDER = [709];
const KDS_WORKFLOW_CONFIRM_SEQ_ORDER = [710, 711];
const KDS_WORKFLOW_CROSS_TERMINAL_SEQ_ORDER = [712, 713, 714];
const KDS_WORKFLOW_ADVANCED_SEQ_ORDER = [715, 716, 717, 718];
const KDS_WORKFLOW_ALERT_SEQ_ORDER = [719, 720, 721];

/** @type {Record<number, number>} */
export const KDS_TERMINAL_INTRA_GROUP_SORT_BY_SEQ = {};

function assignSort(seqList) {
  seqList.forEach((seq, index) => {
    KDS_TERMINAL_INTRA_GROUP_SORT_BY_SEQ[seq] = index;
  });
}

assignSort(KDS_DISPLAY_LAYOUT_SEQ_ORDER);
assignSort(KDS_DISPLAY_THEME_SEQ_ORDER);
assignSort(KDS_DISPLAY_LINES_SEQ_ORDER);
assignSort(KDS_DISPLAY_ORDER_ALERT_SEQ_ORDER);
assignSort(KDS_WORKFLOW_STATUS_SEQ_ORDER);
assignSort(KDS_WORKFLOW_CONFIRM_SEQ_ORDER);
assignSort(KDS_WORKFLOW_CROSS_TERMINAL_SEQ_ORDER);
assignSort(KDS_WORKFLOW_ADVANCED_SEQ_ORDER);
assignSort(KDS_WORKFLOW_ALERT_SEQ_ORDER);
