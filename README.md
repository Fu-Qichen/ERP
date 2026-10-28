# erp-demo

可运行的 ERP 全栈切片：组织与伙伴主数据、仓库、物料、销售订单/发货/出库/发票/应收/收款核销、采购订单/收货/入库/发票/应付/付款核销、库存余额与库存流水。用来验证 Spring Boot 4 + MyBatis-Plus + PostgreSQL 18 + React 19 组合。

## 技术栈

| 层 | 版本 |
| --- | --- |
| Java | 21 |
| Spring Boot | 4.1.2 |
| MyBatis-Plus | 3.5.17（`mybatis-plus-spring-boot4-starter`） |
| PostgreSQL | 18 |
| Flyway | Boot 4 管理的版本，使用 `spring-boot-starter-flyway` |
| 构建 | Maven 3.9.x |

## 数据库

默认连接 `jdbc:postgresql://127.0.0.1:5432/erp_demo`，用户名/密码默认 `postgres/postgres`，可用环境变量覆盖：

```bash
export DB_USERNAME=postgres
export DB_PASSWORD=postgres
```

首次启动由 Flyway 依次执行：

- `V1__init.sql`：`md_material`，两条种子物料。
- `V2__sales_inventory.sql`：客户、仓库、库存余额、库存流水、销售订单/明细，以及初始库存。
- `V3__purchase_inbound.sql`：供应商、采购订单/明细，以及采购单号序列。
- `V4__org_partner_master.sql`：部门、员工、客户/供应商分类、币种、结算方式、付款条件，并扩展客户/供应商关联字段。
- `V5__warehouse_master.sql`：仓库增加所属部门。
- `V6__delivery_outbound.sql`：销售发货单/明细、销售出库单、订单明细已发数量；历史已确认订单迁移为已出库。
- `V7__fix_delivery_sequences.sql`：按序列重排历史发货/出库单号。
- `V8__invoice_receivable.sql`：发货明细补价格字段，新增销售发票/发票明细/应收单。
- `V9__receipt_writeoff.sql`：新增收款单、收款核销明细。
- `V10__purchase_chain.sql`：采购订单改审核状态，新增收货单、入库单、采购发票、应付单、付款单及核销明细；历史已入库订单迁移为收货/入库单。
- `V11__outbound_line.sql`：新增销售出库明细 `so_outbound_line`，历史出库单按发货明细回填。
- `V12__material_class_uom.sql`：新增物料分类 `md_material_class`、计量单位 `md_uom`，物料改为引用 `class_id`/`uom_id`，按原文本单位回填。

核心表：`md_material`、`org_dept`、`org_staff`、`md_customer_class`、`md_supplier_class`、`md_currency`、`md_settle_method`、`md_pay_condition`、`md_customer`、`md_supplier`、`inv_warehouse`、`inv_balance`、`inv_ledger`、`so_order`、`so_order_line`、`po_order`、`po_order_line`。

## 启动

后端：

```bash
mvn -DskipTests package
java -jar target/erp-demo-0.0.1-SNAPSHOT.jar
```

或开发模式：

```bash
mvn spring-boot:run
```

默认端口 `8080`。

前端：

```bash
cd frontend
pnpm install
pnpm dev
```

默认 `http://127.0.0.1:5173`，`/api` 通过 Vite 代理到 `8080`。生产构建：

```bash
cd frontend
pnpm build
```

## 前端页面

菜单按业务分组：

| 分组 | 页面 | 说明 |
| --- | --- | --- |
| 工作台 | `/` | 物料、销售、采购、库存实时统计 |
| 销售 | `/sales` | 销售订单：查询、新增、审核、关闭、详情 |
| 销售 | `/deliveries` | 销售发货：按已审核订单发货、出库扣库存、生成出库单 |
| 采购 | `/purchase` | 采购订单：查询、新增、审核、关闭、详情 |
| 采购 | `/purchase-receipts` | 采购收货：按已审核订单收货、入库、生成入库单 |
| 财务 | `/invoices` | 销售发票与应收：开票、应收单查询 |
| 财务 | `/receipts` | 收款与核销：登记收款、核销应收 |
| 财务 | `/purchase-finance` | 采购发票与应付：开票、应付单、付款核销 |
| 库存 | `/inventory` | 库存余额与缺货提示 |
| 库存 | `/inbounds` | 采购入库单：单号、收货单、明细、过账时间 |
| 库存 | `/outbounds` | 销售出库单：单号、发货单、明细、过账时间 |
| 库存 | `/ledger` | 库存流水：按物料/仓库/业务类型过滤，出入库合计 |
| 库存 | `/warehouses` | 仓库 CRUD 与所属部门 |
| 库存 | `/materials` | 物料分页、关键字查询、按分类筛选、CRUD |
| 库存 | `/material-master` | 物料分类与计量单位维护 |
| 基础资料 | `/organization` | 部门树、员工档案 CRUD |
| 基础资料 | `/partners` | 客户/供应商 CRUD，基础字典维护 |

侧边栏默认只显示分组，进入页面时自动展开所属分组。

## 接口

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| GET | `/actuator/health` | 健康检查，包含数据库状态 |
| GET | `/api/materials?current=1&size=10&keyword=` | 分页/关键字查询 |
| GET | `/api/materials/{id}` | 按 ID 查询 |
| GET/POST | `/api/material-classes` | 物料分类列表 / 新增 |
| PUT/DELETE | `/api/material-classes/{id}` | 更新 / 删除物料分类 |
| GET/POST | `/api/uoms` | 计量单位列表 / 新增 |
| PUT/DELETE | `/api/uoms/{id}` | 更新 / 删除计量单位 |
| POST | `/api/materials` | 新增物料 |
| PUT | `/api/materials/{id}` | 更新物料（全量字段） |
| DELETE | `/api/materials/{id}` | 删除物料 |
| GET/POST | `/api/departments` | 部门列表 / 新增 |
| PUT/DELETE | `/api/departments/{id}` | 更新 / 删除部门 |
| GET/POST | `/api/staff` | 员工列表 / 新增 |
| PUT/DELETE | `/api/staff/{id}` | 更新 / 删除员工 |
| GET/POST | `/api/customers` | 客户列表（含分类/业务员/币种/结算/付款条件） / 新增 |
| PUT/DELETE | `/api/customers/{id}` | 更新 / 删除客户 |
| GET/POST | `/api/suppliers` | 供应商列表 / 新增 |
| PUT/DELETE | `/api/suppliers/{id}` | 更新 / 删除供应商 |
| GET/POST | `/api/customer-classes` | 客户分类列表 / 新增 |
| PUT/DELETE | `/api/customer-classes/{id}` | 更新 / 删除客户分类 |
| GET/POST | `/api/supplier-classes` | 供应商分类列表 / 新增 |
| PUT/DELETE | `/api/supplier-classes/{id}` | 更新 / 删除供应商分类 |
| GET/POST | `/api/currencies` | 币种列表 / 新增 |
| PUT/DELETE | `/api/currencies/{id}` | 更新 / 删除币种 |
| GET/POST | `/api/settle-methods` | 结算方式列表 / 新增 |
| PUT/DELETE | `/api/settle-methods/{id}` | 更新 / 删除结算方式 |
| GET/POST | `/api/pay-conditions` | 付款条件列表 / 新增 |
| PUT/DELETE | `/api/pay-conditions/{id}` | 更新 / 删除付款条件 |
| GET/POST | `/api/warehouses` | 仓库列表 / 新增 |
| PUT/DELETE | `/api/warehouses/{id}` | 更新 / 删除仓库 |
| GET | `/api/inventory?warehouseId=` | 库存余额 |
| GET | `/api/outbounds?current=1&size=10&keyword=` | 销售出库单分页 |
| GET | `/api/outbounds/{id}` | 销售出库单详情（含明细） |
| GET | `/api/inbounds?current=1&size=10&keyword=` | 采购入库单分页 |
| GET | `/api/inbounds/{id}` | 采购入库单详情（含明细） |
| GET | `/api/ledger?current=1&size=20&materialId=&warehouseId=&bizType=` | 库存流水分页 |
| GET | `/api/sales-orders?current=1&size=10&status=` | 销售订单分页 |
| GET | `/api/sales-orders/{id}` | 订单详情（含明细） |
| POST | `/api/sales-orders` | 新增草稿订单，不扣库存 |
| POST | `/api/sales-orders/{id}/audit` | 审核订单，只改状态 |
| POST | `/api/sales-orders/{id}/close` | 关闭订单（明细全部发货后） |
| GET | `/api/deliveries?current=1&size=10&status=` | 发货单分页 |
| GET | `/api/deliveries/{id}` | 发货单详情 |
| POST | `/api/deliveries` | 按订单创建发货单 |
| POST | `/api/deliveries/{id}/ship` | 发货出库，扣库存并生成出库单 |
| GET | `/api/invoices?current=1&size=10&keyword=` | 销售发票分页 |
| GET | `/api/invoices/{id}` | 发票详情（含明细） |
| POST | `/api/invoices` | 按已出库发货单开票，并生成应收单 |
| GET | `/api/receivables?current=1&size=10&status=&customerId=&openOnly=` | 应收单分页 |
| GET | `/api/receipts?current=1&size=10&keyword=` | 收款单分页 |
| GET | `/api/receipts/{id}` | 收款单详情（含核销明细） |
| POST | `/api/receipts` | 登记收款并核销应收 |
| GET | `/api/purchase-orders?current=1&size=10&status=` | 采购订单分页 |
| GET | `/api/purchase-orders/{id}` | 采购订单详情（含明细） |
| POST | `/api/purchase-orders` | 新增草稿采购单，不增加库存 |
| POST | `/api/purchase-orders/{id}/audit` | 审核采购订单，只改状态 |
| POST | `/api/purchase-orders/{id}/close` | 关闭采购订单（明细全部收货后） |
| GET | `/api/purchase-receipts?current=1&size=10&status=` | 收货单分页 |
| POST | `/api/purchase-receipts` | 按采购订单创建收货单 |
| POST | `/api/purchase-receipts/{id}/receive` | 收货入库，增加库存并生成入库单 |
| GET/POST | `/api/purchase-invoices` | 采购发票分页 / 开票并生成应付 |
| GET | `/api/payables?current=1&size=10&supplierId=&openOnly=` | 应付单分页 |
| GET/POST | `/api/payments` | 付款单分页 / 付款并核销应付 |

组织与伙伴主数据规则：

- 部门是树结构，禁止把部门挂到自己的下级；有子部门或员工时不能删除。
- 客户必须关联客户分类和币种，可选业务员、结算方式、付款条件。
- 供应商必须关联供应商分类和币种，可选付款条件。
- 客户被销售订单引用、供应商被采购订单引用时，数据库外键会阻止删除并返回 409。
- 分类/币种/结算方式/付款条件支持完整 CRUD；分类禁止挂到自己的下级，被客商引用或存在子分类时不能删除。
- 仓库必须归属部门；有库存余额或被销售/采购订单引用时不能删除。
- 物料必须归属分类与计量单位；分类有子分类或被物料引用、单位被物料引用时不能删除。

销售订单与发货规则：

- 订单状态：`0 草稿 → 1 已审核 → 2 已关闭`。
- 审核只改状态，不扣库存；库存扣减发生在发货出库。
- 只有已审核订单可以发货；发货数量受 `delivered_qty + 本次 <= quantity` 约束，防止超发。
- 发货出库使用 `SELECT ... FOR UPDATE` 锁发货单，重复出库返回 409。
- 库存扣减使用 `UPDATE ... WHERE qty >= ?`，任一明细不足整单回滚。
- 每条出库明细写一条 `SALES_OUT`、`direction=-1`、`source_type=DL` 的流水。
- 明细全部发货后才能关闭订单。

销售发票与应收规则：

- 只有已出库发货单可以开票；一张发货单只能开一张发票。
- 开票金额取自发货明细（含税单价用订单价格），税额按 `金额 × 税率 ÷ (100 + 税率)` 反算。
- 开票事务内同时生成应收单：`应收金额 = 发票含税金额`，`余额 = 应收金额 - 已收`。
- 金额为 0 的发票直接生成「已结清」应收单。
- 收款核销见下方规则。

收款与核销规则：

- 核销金额合计必须等于收款金额，否则 400。
- 应收单必须属于所选客户，否则 400。
- 核销前对每张应收单 `SELECT ... FOR UPDATE`，并用 `WHERE balance >= amount` 原子更新，超额核销返回 409。
- 核销后 `paid_amount += 核销额`、`balance -= 核销额`；`balance=0` 置为已结清，部分核销置为部分收款。
- 一次收款可核销多张应收单；并发核销同一张应收单只有一笔成功。

采购链路规则（与销售同构）：

- 采购订单状态：`0 草稿 → 1 已审核 → 2 已关闭`；审核只改状态。
- 只有已审核订单可以收货；收货数量受 `received_qty + 本次 <= quantity` 约束。
- 收货单入库时 `SELECT ... FOR UPDATE` 锁单头，重复入库返回 409。
- 库存增加使用 `INSERT ... ON CONFLICT DO UPDATE SET qty = qty + EXCLUDED.qty`，并发不丢数量。
- 每条入库明细写一条 `PURCHASE_IN`、`direction=1`、`source_type=GR` 的流水，并生成 `po_inbound` / `po_inbound_line`。
- 只有已入库收货单可以开票；一张收货单只能开一张发票，开票生成应付单。
- 付款核销规则与收款一致：核销合计等于付款金额、应付必须属于该供应商、超额核销 409。

新增物料示例：

```bash
curl -X POST http://127.0.0.1:8080/api/materials \
  -H "Content-Type: application/json" \
  -d '{"code":"M-003","name":"测试物料C","spec":"30x40","unit":"PCS"}'
```

校验失败返回 400，编码重复返回 409，记录不存在返回 404。
