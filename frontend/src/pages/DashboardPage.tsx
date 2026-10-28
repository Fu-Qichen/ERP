import { useQuery } from '@tanstack/react-query'
import { Card, Col, Row, Statistic, Typography } from 'antd'
import { listMaterials } from '../api/materials'
import { listInventory } from '../api/master'
import { listPurchaseOrders } from '../api/purchase'
import { listSalesOrders } from '../api/sales'

export default function DashboardPage() {
  const materials = useQuery({
    queryKey: ['materials', 'dashboard'],
    queryFn: () => listMaterials({ current: 1, size: 1 }),
  })
  const orders = useQuery({
    queryKey: ['sales-orders', 'dashboard'],
    queryFn: () => listSalesOrders({ current: 1, size: 1 }),
  })
  const purchases = useQuery({
    queryKey: ['purchase-orders', 'dashboard'],
    queryFn: () => listPurchaseOrders({ current: 1, size: 1 }),
  })
  const inventory = useQuery({
    queryKey: ['inventory', 'dashboard'],
    queryFn: () => listInventory(),
  })

  return (
    <div className="page">
      <div className="page-heading">
        <div>
          <Typography.Title level={3}>工作台</Typography.Title>
          <Typography.Text type="secondary">
            当前已打通物料、销售出库、采购入库与库存流水。
          </Typography.Text>
        </div>
      </div>

      <Row gutter={16}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="物料主数据"
              value={materials.data?.total ?? 0}
              loading={materials.isLoading}
              suffix="条"
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="销售订单"
              value={orders.data?.total ?? 0}
              loading={orders.isLoading}
              suffix="单"
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="采购订单"
              value={purchases.data?.total ?? 0}
              loading={purchases.isLoading}
              suffix="单"
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="库存物料"
              value={inventory.data?.length ?? 0}
              loading={inventory.isLoading}
              suffix="项"
            />
          </Card>
        </Col>
      </Row>

      <Card className="next-step-card" title="下一步">
        <Typography.Paragraph>
          1. 采购—入库—销售—出库闭环已打通，下一步补应收/应付与核销。
        </Typography.Paragraph>
        <Typography.Paragraph>
          2. 登录、角色、菜单与按钮权限。
        </Typography.Paragraph>
        <Typography.Paragraph>
          3. 库存流水报表、单据打印、异常对账。
        </Typography.Paragraph>
      </Card>
    </div>
  )
}
