# 活动时段多选独立时间

## 决策

活动时段支持勾选全天 / 午市 / 晚市；全天与午市、晚市互斥。每个已选时段可单独配置「全时段」或「指定时间」。

## 字段

`draft.conditions.businessHourSlots: Array<{ id, mode, from, to }>`

- `id`: `all` | `lunch` | `dinner`
- `mode`: `full` | `custom`
- `from` / `to`: `HH:MM`，仅 `custom` 使用

旧字段 `businessHour` / `businessHourTimeMode` / `businessHourFrom` / `businessHourTo` 由归一化镜像，仅兼容。

## 校验

至少选一时段；指定时间必填、开始早于结束、落在父边界内。
