import {
  ApartmentOutlined,
  AppstoreOutlined,
  AuditOutlined,
  ClusterOutlined,
  DatabaseOutlined,
  ExperimentOutlined,
  FileTextOutlined,
  FundOutlined,
  HomeOutlined,
  InboxOutlined,
  SendOutlined,
  ShoppingCartOutlined,
  TeamOutlined,
  WalletOutlined,
} from '@ant-design/icons'
import { Layout, Menu, Typography, type MenuProps } from 'antd'
import { Navigate, NavLink, Route, Routes, useLocation } from 'react-router-dom'
import ApprovalsPage from './pages/ApprovalsPage'
import BomPage from './pages/BomPage'
import DashboardPage from './pages/DashboardPage'
import DeliveriesPage from './pages/DeliveriesPage'
import InventoryPage from './pages/InventoryPage'
import BatchesPage from './pages/BatchesPage'
import InboundsPage from './pages/InboundsPage'
import InvoicesPage from './pages/InvoicesPage'
import LedgerPage from './pages/LedgerPage'
import OutboundsPage from './pages/OutboundsPage'
import MaterialMasterPage from './pages/MaterialMasterPage'
import MaterialsPage from './pages/MaterialsPage'
import OrganizationPage from './pages/OrganizationPage'
import PartnersPage from './pages/PartnersPage'
import PurchaseFinancePage from './pages/PurchaseFinancePage'
import PrintPage from './pages/PrintPage'
import PurchaseOrdersPage from './pages/PurchaseOrdersPage'
import PurchaseReceiptsPage from './pages/PurchaseReceiptsPage'
import ReceiptsPage from './pages/ReceiptsPage'
import ReconcilePage from './pages/ReconcilePage'
import SalesOrdersPage from './pages/SalesOrdersPage'
import WarehousesPage from './pages/WarehousesPage'
import WorkOrdersPage from './pages/WorkOrdersPage'

const { Header, Sider, Content } = Layout

const routes: { path: string; key: string }[] = [
  { path: '/work-orders', key: '/work-orders' },
  { path: '/approvals', key: '/approvals' },
  { path: '/boms', key: '/boms' },
  { path: '/purchase-receipts', key: '/purchase-receipts' },
  { path: '/inbounds', key: '/inbounds' },
  { path: '/outbounds', key: '/outbounds' },
  { path: '/batches', key: '/batches' },
  { path: '/ledger', key: '/ledger' },
  { path: '/reconcile', key: '/reconcile' },
  { path: '/purchase-finance', key: '/purchase-finance' },
  { path: '/purchase', key: '/purchase' },
  { path: '/deliveries', key: '/deliveries' },
  { path: '/invoices', key: '/invoices' },
  { path: '/receipts', key: '/receipts' },
  { path: '/sales', key: '/sales' },
  { path: '/organization', key: '/organization' },
  { path: '/materials', key: '/materials' },
  { path: '/material-master', key: '/material-master' },
  { path: '/inventory', key: '/inventory' },
  { path: '/warehouses', key: '/warehouses' },
  { path: '/partners', key: '/partners' },
]

const menuItems: MenuProps['items'] = [
  {
    key: '/',
    icon: <AppstoreOutlined />,
    label: <NavLink to="/">工作台</NavLink>,
  },
  {
    key: '/approvals',
    icon: <AuditOutlined />,
    label: <NavLink to="/approvals">审批中心</NavLink>,
  },
  {
    key: 'sales',
    icon: <ShoppingCartOutlined />,
    label: '销售',
    children: [
      {
        key: '/sales',
        icon: <ShoppingCartOutlined />,
        label: <NavLink to="/sales">销售订单</NavLink>,
      },
      {
        key: '/deliveries',
        icon: <SendOutlined />,
        label: <NavLink to="/deliveries">销售发货</NavLink>,
      },
    ],
  },
  {
    key: 'purchase',
    icon: <InboxOutlined />,
    label: '采购',
    children: [
      {
        key: '/purchase',
        icon: <ShoppingCartOutlined />,
        label: <NavLink to="/purchase">采购订单</NavLink>,
      },
      {
        key: '/purchase-receipts',
        icon: <InboxOutlined />,
        label: <NavLink to="/purchase-receipts">采购收货</NavLink>,
      },
    ],
  },
  {
    key: 'manufacturing',
    icon: <ExperimentOutlined />,
    label: '生产',
    children: [
      {
        key: '/boms',
        icon: <ExperimentOutlined />,
        label: <NavLink to="/boms">物料清单</NavLink>,
      },
      {
        key: '/work-orders',
        icon: <SendOutlined />,
        label: <NavLink to="/work-orders">生产工单</NavLink>,
      },
    ],
  },
  {
    key: 'finance',
    icon: <WalletOutlined />,
    label: '财务',
    children: [
      {
        key: '/invoices',
        icon: <FileTextOutlined />,
        label: <NavLink to="/invoices">销售发票与应收</NavLink>,
      },
      {
        key: '/receipts',
        icon: <WalletOutlined />,
        label: <NavLink to="/receipts">收款与核销</NavLink>,
      },
      {
        key: '/purchase-finance',
        icon: <FileTextOutlined />,
        label: <NavLink to="/purchase-finance">采购发票与应付</NavLink>,
      },
    ],
  },
  {
    key: 'inventory',
    icon: <FundOutlined />,
    label: '库存',
    children: [
      {
        key: '/inventory',
        icon: <FundOutlined />,
        label: <NavLink to="/inventory">库存余额</NavLink>,
      },
      {
        key: '/inbounds',
        icon: <InboxOutlined />,
        label: <NavLink to="/inbounds">采购入库单</NavLink>,
      },
      {
        key: '/outbounds',
        icon: <SendOutlined />,
        label: <NavLink to="/outbounds">销售出库单</NavLink>,
      },
      {
        key: '/ledger',
        icon: <FileTextOutlined />,
        label: <NavLink to="/ledger">库存流水</NavLink>,
      },
      {
        key: '/reconcile',
        icon: <AuditOutlined />,
        label: <NavLink to="/reconcile">库存对账</NavLink>,
      },
      {
        key: '/batches',
        icon: <ClusterOutlined />,
        label: <NavLink to="/batches">批次档案</NavLink>,
      },
      {
        key: '/warehouses',
        icon: <HomeOutlined />,
        label: <NavLink to="/warehouses">仓库管理</NavLink>,
      },
      {
        key: '/materials',
        icon: <DatabaseOutlined />,
        label: <NavLink to="/materials">物料管理</NavLink>,
      },
      {
        key: '/material-master',
        icon: <ApartmentOutlined />,
        label: <NavLink to="/material-master">分类与单位</NavLink>,
      },
    ],
  },
  {
    key: 'master',
    icon: <TeamOutlined />,
    label: '基础资料',
    children: [
      {
        key: '/organization',
        icon: <ApartmentOutlined />,
        label: <NavLink to="/organization">组织架构</NavLink>,
      },
      {
        key: '/partners',
        icon: <TeamOutlined />,
        label: <NavLink to="/partners">客商管理</NavLink>,
      },
    ],
  },
]

function findSelectedKey(pathname: string) {
  return routes.find((route) => pathname.startsWith(route.path))?.key ?? '/'
}

interface MenuGroup {
  key: string
  children: { key: string }[]
}

function isMenuGroup(item: unknown): item is MenuGroup {
  if (typeof item !== 'object' || item === null) {
    return false
  }
  if (!('key' in item) || !('children' in item)) {
    return false
  }
  return Array.isArray(item.children)
}

function findOpenKeys(pathname: string) {
  const selected = findSelectedKey(pathname)
  return (menuItems ?? [])
    .filter(isMenuGroup)
    .filter((group) => group.children.some((child) => child.key === selected))
    .map((group) => String(group.key))
}

export default function App() {
  const location = useLocation()
  const selectedKey = findSelectedKey(location.pathname)
  const openKeys = findOpenKeys(location.pathname)

  if (location.pathname.startsWith('/print/')) {
    return (
      <Routes>
        <Route path="/print/:type/:id" element={<PrintPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    )
  }

  return (
    <Layout className="app-shell">
      <Sider width={208} theme="dark" className="app-sider">
        <div className="brand">
          <span className="brand-mark">E</span>
          <div>
            <div className="brand-title">ERP Demo</div>
            <div className="brand-subtitle">Spring Boot 4 · React 19</div>
          </div>
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[selectedKey]}
          defaultOpenKeys={openKeys}
          items={menuItems}
        />
      </Sider>
      <Layout>
        <Header className="app-header">
          <Typography.Text strong>企业资源计划演示</Typography.Text>
          <Typography.Text type="secondary">
            PostgreSQL 18 · MyBatis-Plus 3.5.17
          </Typography.Text>
        </Header>
        <Content className="app-content">
          <Routes>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/organization" element={<OrganizationPage />} />
            <Route path="/materials" element={<MaterialsPage />} />
            <Route path="/material-master" element={<MaterialMasterPage />} />
            <Route path="/sales" element={<SalesOrdersPage />} />
            <Route path="/deliveries" element={<DeliveriesPage />} />
            <Route path="/invoices" element={<InvoicesPage />} />
            <Route path="/receipts" element={<ReceiptsPage />} />
            <Route path="/boms" element={<BomPage />} />
            <Route path="/work-orders" element={<WorkOrdersPage />} />
            <Route path="/approvals" element={<ApprovalsPage />} />
            <Route path="/purchase" element={<PurchaseOrdersPage />} />
            <Route path="/purchase-receipts" element={<PurchaseReceiptsPage />} />
            <Route path="/purchase-finance" element={<PurchaseFinancePage />} />
            <Route path="/inventory" element={<InventoryPage />} />
            <Route path="/inbounds" element={<InboundsPage />} />
            <Route path="/outbounds" element={<OutboundsPage />} />
            <Route path="/ledger" element={<LedgerPage />} />
            <Route path="/reconcile" element={<ReconcilePage />} />
            <Route path="/batches" element={<BatchesPage />} />
            <Route path="/warehouses" element={<WarehousesPage />} />
            <Route path="/partners" element={<PartnersPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Content>
      </Layout>
    </Layout>
  )
}
