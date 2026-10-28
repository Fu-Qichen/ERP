import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  App,
  Button,
  Descriptions,
  Divider,
  Form,
  Input,
  Modal,
  Space,
  Table,
  Tabs,
  Tag,
  Typography,
  type TableColumnsType,
} from 'antd'
import { ReloadOutlined, SearchOutlined } from '@ant-design/icons'
import { useState } from 'react'
import {
  decideApproval,
  getApproval,
  listApprovals,
  type Approval,
  type ApprovalLog,
} from '../api/approval'

const statusMeta: Record<number, { color: string; label: string }> = {
  0: { color: 'processing', label: '待审批' },
  1: { color: 'success', label: '已通过' },
  2: { color: 'error', label: '已驳回' },
}

const actionLabel: Record<string, string> = {
  SUBMIT: '提交',
  APPROVE: '通过',
  REJECT: '驳回',
}

const bizLabel: Record<string, string> = {
  SALES_ORDER: '销售订单',
  PURCHASE_ORDER: '采购订单',
}

function money(value: string | number | null | undefined) {
  if (value === null || value === undefined || value === '') {
    return '-'
  }
  return Number(value).toLocaleString('zh-CN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

function ApprovalsTab({ status }: { status?: number }) {
  const { message } = App.useApp()
  const queryClient = useQueryClient()
  const [form] = Form.useForm<{ approver: string; remark?: string }>()

  const [current, setCurrent] = useState(1)
  const [size, setSize] = useState(10)
  const [keywordInput, setKeywordInput] = useState('')
  const [keyword, setKeyword] = useState('')
  const [detailId, setDetailId] = useState<number | null>(null)
  const [decideTarget, setDecideTarget] = useState<{
    id: number
    approved: boolean
  } | null>(null)

  const approvals = useQuery({
    queryKey: ['approvals', status, current, size, keyword],
    queryFn: () => listApprovals({ current, size, status, keyword }),
    placeholderData: (previous) => previous,
  })
  const detail = useQuery({
    queryKey: ['approval', detailId],
    queryFn: () => getApproval(detailId as number),
    enabled: detailId !== null,
  })

  const decideMutation = useMutation({
    mutationFn: (values: { approver: string; remark?: string }) => {
      if (!decideTarget) {
        throw new Error('缺少审批目标')
      }
      return decideApproval(decideTarget.id, {
        approver: values.approver,
        approved: decideTarget.approved,
        remark: values.remark,
      })
    },
    onSuccess: () => {
      message.success(decideTarget?.approved ? '已通过' : '已驳回')
      setDecideTarget(null)
      queryClient.invalidateQueries({ queryKey: ['approvals'] })
      queryClient.invalidateQueries({ queryKey: ['sales-orders'] })
      queryClient.invalidateQueries({ queryKey: ['purchase-orders'] })
    },
    onError: (error: Error) => message.error(error.message),
  })

  const openDecide = (id: number, approved: boolean) => {
    form.resetFields()
    form.setFieldsValue({ approver: '', remark: '' })
    setDecideTarget({ id, approved })
  }

  const submitDecide = async () => {
    decideMutation.mutate(await form.validateFields())
  }

  const columns: TableColumnsType<Approval> = [
    { title: '单据号', dataIndex: 'bizNo', width: 180, fixed: 'left' },
    {
      title: '类型',
      dataIndex: 'bizType',
      width: 110,
      render: (value: string) => bizLabel[value] ?? value,
    },
    {
      title: '金额',
      dataIndex: 'amount',
      width: 130,
      align: 'right',
      render: (value: string | null) => money(value),
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 100,
      render: (value: number) => {
        const meta = statusMeta[value] ?? statusMeta[0]
        return <Tag color={meta.color}>{meta.label}</Tag>
      },
    },
    {
      title: '提交时间',
      dataIndex: 'submittedAt',
      width: 170,
      render: (value: string) => new Date(value).toLocaleString('zh-CN'),
    },
    {
      title: '完成时间',
      dataIndex: 'finishedAt',
      width: 170,
      render: (value: string | null) =>
        value ? new Date(value).toLocaleString('zh-CN') : '-',
    },
    {
      title: '操作',
      key: 'action',
      width: 200,
      className: 'table-actions',
      render: (_, record) => (
        <Space>
          <Button type="link" size="small" onClick={() => setDetailId(record.id)}>
            详情
          </Button>
          {record.status === 0 && (
            <>
              <Button
                type="link"
                size="small"
                onClick={() => openDecide(record.id, true)}
              >
                通过
              </Button>
              <Button
                type="link"
                size="small"
                danger
                onClick={() => openDecide(record.id, false)}
              >
                驳回
              </Button>
            </>
          )}
        </Space>
      ),
    },
  ]

  const logColumns: TableColumnsType<ApprovalLog> = [
    { title: '步骤', dataIndex: 'step', width: 80 },
    {
      title: '动作',
      dataIndex: 'action',
      width: 100,
      render: (value: string) => actionLabel[value] ?? value,
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

  return (
    <>
      <div className="tab-toolbar">
        <Space wrap>
          <Input
            allowClear
            prefix={<SearchOutlined />}
            placeholder="单据号"
            value={keywordInput}
            onChange={(event) => setKeywordInput(event.target.value)}
            onPressEnter={() => {
              setKeyword(keywordInput.trim())
              setCurrent(1)
            }}
            style={{ width: 200 }}
          />
          <Button
            onClick={() => {
              setKeyword(keywordInput.trim())
              setCurrent(1)
            }}
          >
            查询
          </Button>
          <Button
            icon={<ReloadOutlined />}
            onClick={() => queryClient.invalidateQueries({ queryKey: ['approvals'] })}
          >
            刷新
          </Button>
        </Space>
      </div>

      <Table<Approval>
        rowKey="id"
        loading={approvals.isLoading}
        columns={columns}
        dataSource={approvals.data?.records ?? []}
        scroll={{ x: 1080 }}
        pagination={{
          current,
          pageSize: size,
          total: approvals.data?.total ?? 0,
          showSizeChanger: true,
          showTotal: (total) => `共 ${total} 条`,
          onChange: (nextPage, nextSize) => {
            setCurrent(nextPage)
            setSize(nextSize)
          },
        }}
      />

      <Modal
        title={decideTarget?.approved ? '审批通过' : '审批驳回'}
        open={decideTarget !== null}
        onOk={submitDecide}
        confirmLoading={decideMutation.isPending}
        onCancel={() => setDecideTarget(null)}
        okText="确认"
        cancelText="取消"
        destroyOnHidden
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="approver"
            label="审批人"
            rules={[{ required: true, message: '请输入审批人' }]}
          >
            <Input maxLength={64} placeholder="如 张伟" />
          </Form.Item>
          <Form.Item name="remark" label="审批意见">
            <Input.TextArea maxLength={255} rows={3} placeholder="可选" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={detail.data?.bizNo ?? '审批详情'}
        open={detailId !== null}
        width={820}
        footer={null}
        onCancel={() => setDetailId(null)}
        destroyOnHidden
      >
        {detail.data && (
          <>
            <Descriptions
              size="small"
              column={3}
              items={[
                {
                  key: 'type',
                  label: '单据类型',
                  children: bizLabel[detail.data.bizType] ?? detail.data.bizType,
                },
                {
                  key: 'amount',
                  label: '金额',
                  children: money(detail.data.amount),
                },
                {
                  key: 'status',
                  label: '状态',
                  children: (
                    <Tag color={statusMeta[detail.data.status]?.color}>
                      {statusMeta[detail.data.status]?.label}
                    </Tag>
                  ),
                },
                {
                  key: 'submitted',
                  label: '提交时间',
                  children: new Date(detail.data.submittedAt).toLocaleString('zh-CN'),
                },
                {
                  key: 'finished',
                  label: '完成时间',
                  children: detail.data.finishedAt
                    ? new Date(detail.data.finishedAt).toLocaleString('zh-CN')
                    : '-',
                },
                {
                  key: 'remark',
                  label: '提交说明',
                  children: detail.data.submitRemark || '-',
                },
              ]}
            />
            <Divider />
            <Table<ApprovalLog>
              rowKey="id"
              size="small"
              pagination={false}
              columns={logColumns}
              dataSource={detail.data.logs ?? []}
            />
          </>
        )}
      </Modal>
    </>
  )
}

export default function ApprovalsPage() {
  return (
    <div className="page">
      <div className="page-heading">
        <div>
          <Typography.Title level={3}>审批中心</Typography.Title>
          <Typography.Text type="secondary">
            销售与采购订单提交审核后进入这里，审批通过或驳回都会留痕。
          </Typography.Text>
        </div>
      </div>

      <Tabs
        items={[
          { key: 'pending', label: '待审批', children: <ApprovalsTab status={0} /> },
          { key: 'done', label: '已处理', children: <ApprovalsTab /> },
        ]}
      />
    </div>
  )
}
