# AGENTS.md

ERP demo 仓库约定。改代码前先读本文件与 `README.md`。

## 技术栈

| 层 | 选型 |
| --- | --- |
| 后端 | Java 21、Spring Boot 4.1.2、MyBatis-Plus 3.5.17、Flyway |
| 数据库 | PostgreSQL 18，库名 `erp_demo` |
| 前端 | React 19、TypeScript、Vite 8、Ant Design 6、TanStack Query |
| 包管理 | 后端 Maven；前端**只能 pnpm** |

## 目录

```
src/main/java/com/jxbs/erp/demo/
├── controller/    REST 入口，只做参数校验与调用 service
├── service/       事务边界；业务规则都放这里
├── mapper/        MyBatis-Plus BaseMapper + 注解 SQL
├── domain/        表实体（@TableName）
├── domain/view/   查询视图（多表 JOIN 结果）
├── dto/           请求体 record
└── exception/     BusinessException

src/main/resources/db/migration/   Flyway 脚本，只增不改
frontend/src/
├── api/           按业务域拆分的请求封装
├── pages/         页面
├── components/    共享组件
└── App.tsx        菜单 + 路由
```

## 命令

```bash
# 后端
mvn -DskipTests package
java -jar target/erp-demo-0.0.1-SNAPSHOT.jar     # http://127.0.0.1:8080

# 前端
cd frontend && pnpm install && pnpm dev          # http://127.0.0.1:5173
cd frontend && pnpm build                        # tsc --noEmit + vite build
```

## 硬性规则

- **数据库迁移只增不改**：已应用的 `V*__*.sql` 不允许修改，改结构新增版本号。
- **事务边界在 service**：`@Transactional` 只标 service 方法，controller 不写业务判断。
- **并发正确性**：单据确认/过账先 `SELECT ... FOR UPDATE`，金额与数量用条件更新（`WHERE balance >= ?`、`WHERE delivered_qty + ? <= quantity`）。
- **金额与数量用 `BigDecimal`**，结果 `setScale(6, RoundingMode.HALF_UP)`；禁止 `double`。
- **库存只认流水**：`inv_ledger` 是依据，`inv_balance` 是同步快照；出入库必须同时写流水。
- **业务异常用 `BusinessException`**：404 不存在、400 参数/归属错误、409 状态或余额冲突。

## 单据状态

| 单据 | 状态 |
| --- | --- |
| 销售订单 `so_order` | 0 草稿 → 1 已审核 → 2 已关闭 |
| 销售发货 `so_delivery` | 0 待出库 → 1 已出库 |
| 采购订单 `po_order` | 0 草稿 → 1 已审核 → 2 已关闭 |
| 采购收货 `po_receipt` | 0 待入库 → 1 已入库 |
| 应收/应付 | 0 未结 → 1 部分 → 2 已结清 |

## 前端约定

- API 类型定义在 `src/api/*.ts`，页面不直接写 `fetch`。
- 页面统一用 `App.useApp()` 拿 message，查询用 TanStack Query 并 `invalidateQueries` 刷新。
- 菜单在 `App.tsx`，按业务分组：销售、采购、财务、库存、基础资料。
- 提交前跑 `pnpm build`，`tsc` 报错必须清零。
