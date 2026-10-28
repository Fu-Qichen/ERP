import { useQuery } from '@tanstack/react-query'
import { Empty, Space, Table, Tag, Typography, type TableColumnsType } from 'antd'
import { listApprovalLogs, type ApprovalLog } from '../api/approval'

const actionMeta: Record<string, { color: string; label: string }> = {
  SUBMIT: { color: 'default', label: '提交' },
  APPROVE: { color: 'success', label: '通过' },
  REJECT: { color: 'error', label: '驳回' },
}

const columns: TableColumnsType<ApprovalLog> = [
  {
    title: '动作',
    dataIndex: 'action',
    width: 90,
    render: (value: string) => {
      const meta = actionMeta[value] ?? { color: 'default', label: value }
      return <Tag color={meta.color}>{meta.label}</Tag>
    },
  },
  { title: '审批人', dataIndex: 'approver', width: 120 },
  { title: '意见', dataIndex: 'remark', ellipsis: true },
  {
    title: '时间',
    dataIndex: 'createdAt',
    width: 170,
    render: (value: string) => new Date(value).toLocaleString('zh-CN'),
  },
]

export default function ApprovalTimeline({
  bizType,
  bizId,
}: {
  bizType: string
  bizId: number
}) {
  const logs = useQuery({
    queryKey: ['approval-logs', bizType, bizId],
    queryFn: () => listApprovalLogs(bizType, bizId),
  })

  if (!logs.isLoading && (logs.data ?? []).length === 0) {
    return (
      <Space direction="vertical" style={{ width: '100%' }}>
        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="尚未提交审批" />
        <Typography.Text type="secondary">
          点击列表中的“审核”会生成审批单并记录日志。
        </Typography.Text>
      </Space>
    )
  }

  return (
    <Table<ApprovalLog>
      rowKey="id"
      size="small"
      loading={logs.isLoading}
      pagination={false}
      columns={columns}
      dataSource={logs.data ?? []}
    />
  )
}
