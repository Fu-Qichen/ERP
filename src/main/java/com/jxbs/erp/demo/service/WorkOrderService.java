package com.jxbs.erp.demo.service;

import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.jxbs.erp.demo.domain.Bom;
import com.jxbs.erp.demo.domain.BomLine;
import com.jxbs.erp.demo.domain.Material;
import com.jxbs.erp.demo.domain.MaterialIssue;
import com.jxbs.erp.demo.domain.ProductionReport;
import com.jxbs.erp.demo.domain.StockLedger;
import com.jxbs.erp.demo.domain.WorkOrder;
import com.jxbs.erp.demo.domain.view.IssueRowView;
import com.jxbs.erp.demo.domain.view.ReportRowView;
import com.jxbs.erp.demo.domain.view.WorkOrderView;
import com.jxbs.erp.demo.dto.IssueRequest;
import com.jxbs.erp.demo.dto.WorkOrderRequest;
import com.jxbs.erp.demo.exception.BusinessException;
import com.jxbs.erp.demo.mapper.BomMapper;
import com.jxbs.erp.demo.mapper.BomLineMapper;
import com.jxbs.erp.demo.mapper.InventoryBalanceMapper;
import com.jxbs.erp.demo.mapper.MaterialIssueMapper;
import com.jxbs.erp.demo.mapper.MaterialMapper;
import com.jxbs.erp.demo.mapper.ProductionReportMapper;
import com.jxbs.erp.demo.mapper.StockLedgerMapper;
import com.jxbs.erp.demo.mapper.WarehouseMapper;
import com.jxbs.erp.demo.mapper.WorkOrderMapper;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Service
public class WorkOrderService {

    private static final DateTimeFormatter NO_DATE = DateTimeFormatter.BASIC_ISO_DATE;

    private final WorkOrderMapper workOrderMapper;
    private final MaterialIssueMapper issueMapper;
    private final ProductionReportMapper reportMapper;
    private final BomMapper bomMapper;
    private final BomLineMapper bomLineMapper;
    private final MaterialMapper materialMapper;
    private final WarehouseMapper warehouseMapper;
    private final InventoryBalanceMapper balanceMapper;
    private final StockLedgerMapper ledgerMapper;

    public WorkOrderService(WorkOrderMapper workOrderMapper,
                            MaterialIssueMapper issueMapper,
                            ProductionReportMapper reportMapper,
                            BomMapper bomMapper,
                            BomLineMapper bomLineMapper,
                            MaterialMapper materialMapper,
                            WarehouseMapper warehouseMapper,
                            InventoryBalanceMapper balanceMapper,
                            StockLedgerMapper ledgerMapper) {
        this.workOrderMapper = workOrderMapper;
        this.issueMapper = issueMapper;
        this.reportMapper = reportMapper;
        this.bomMapper = bomMapper;
        this.bomLineMapper = bomLineMapper;
        this.materialMapper = materialMapper;
        this.warehouseMapper = warehouseMapper;
        this.balanceMapper = balanceMapper;
        this.ledgerMapper = ledgerMapper;
    }

    public IPage<WorkOrderView> page(long current, long size, String keyword, Integer status) {
        long safeSize = Math.min(Math.max(size, 1), 100);
        return workOrderMapper.selectPageViews(
                new Page<>(Math.max(current, 1), safeSize),
                keyword,
                status
        );
    }

    public WorkOrderView detail(Long id) {
        WorkOrderView view = workOrderMapper.selectViewById(id);
        if (view == null) {
            throw new BusinessException(HttpStatus.NOT_FOUND, "生产工单不存在");
        }
        return view;
    }

    public List<IssueRowView> issues(Long workOrderId) {
        return issueMapper.selectViews(workOrderId);
    }

    public List<ReportRowView> reports(Long workOrderId) {
        return reportMapper.selectViews(workOrderId);
    }

    @Transactional
    public WorkOrderView create(WorkOrderRequest request) {
        Material product = materialMapper.selectById(request.productId());
        if (product == null) {
            throw new BusinessException(HttpStatus.BAD_REQUEST, "成品物料不存在");
        }
        Bom bom = bomMapper.selectById(request.bomId());
        if (bom == null) {
            throw new BusinessException(HttpStatus.BAD_REQUEST, "BOM 不存在");
        }
        if (!bom.getProductId().equals(request.productId())) {
            throw new BusinessException(HttpStatus.BAD_REQUEST, "BOM 与成品不匹配");
        }
        if (bom.getStatus() == null || bom.getStatus() != 1) {
            throw new BusinessException(HttpStatus.CONFLICT, "BOM 已停用，不能下达工单");
        }
        if (warehouseMapper.selectById(request.warehouseId()) == null) {
            throw new BusinessException(HttpStatus.BAD_REQUEST, "仓库不存在");
        }

        WorkOrder order = new WorkOrder();
        order.setWorkOrderNo(nextWorkOrderNo());
        order.setOrderDate(request.orderDate());
        order.setProductId(request.productId());
        order.setBomId(request.bomId());
        order.setWarehouseId(request.warehouseId());
        order.setPlanQty(request.planQty());
        order.setFinishQty(BigDecimal.ZERO);
        order.setStatus(0);
        order.setRemark(request.remark());
        workOrderMapper.insert(order);
        return detail(order.getId());
    }

    @Transactional
    public WorkOrderView release(Long id) {
        WorkOrder order = workOrderMapper.selectByIdForUpdate(id);
        if (order == null) {
            throw new BusinessException(HttpStatus.NOT_FOUND, "生产工单不存在");
        }
        if (workOrderMapper.changeStatus(id, 0, 1) == 0) {
            throw new BusinessException(HttpStatus.CONFLICT, "只有草稿工单可以下达");
        }
        return detail(id);
    }

    /**
     * 生产领料：扣减子件库存并写流水。任一子件不足整单回滚。
     */
    @Transactional
    public WorkOrderView issue(Long id, IssueRequest request) {
        WorkOrder order = workOrderMapper.selectByIdForUpdate(id);
        if (order == null) {
            throw new BusinessException(HttpStatus.NOT_FOUND, "生产工单不存在");
        }
        if (order.getStatus() == null || order.getStatus() != 1) {
            throw new BusinessException(HttpStatus.CONFLICT, "只有已下达工单可以领料");
        }

        for (IssueRequest.IssueLine line : request.lines()) {
            Material material = materialMapper.selectById(line.materialId());
            if (material == null) {
                throw new BusinessException(HttpStatus.BAD_REQUEST, "物料不存在：" + line.materialId());
            }
            if (balanceMapper.deduct(line.materialId(), order.getWarehouseId(), line.qty()) == 0) {
                throw new BusinessException(HttpStatus.CONFLICT, "物料 " + material.getCode() + " 库存不足");
            }

            MaterialIssue issue = new MaterialIssue();
            issue.setIssueNo(nextIssueNo());
            issue.setWorkOrderId(order.getId());
            issue.setWarehouseId(order.getWarehouseId());
            issue.setMaterialId(line.materialId());
            issue.setQty(line.qty());
            issue.setCreatedAt(LocalDateTime.now());
            issueMapper.insert(issue);

            StockLedger ledger = new StockLedger();
            ledger.setMaterialId(line.materialId());
            ledger.setWarehouseId(order.getWarehouseId());
            ledger.setBizType("PRODUCTION_ISSUE");
            ledger.setDirection(-1);
            ledger.setQty(line.qty());
            ledger.setSourceType("WO");
            ledger.setSourceId(order.getId());
            ledger.setOccurredAt(LocalDateTime.now());
            ledger.setRemark("生产工单 " + order.getWorkOrderNo() + " 领料");
            ledgerMapper.insert(ledger);
        }

        return detail(id);
    }

    /**
     * 生产报工：成品入库并写流水，累计完工数量，达到计划数量自动完工。
     */
    @Transactional
    public WorkOrderView report(Long id, BigDecimal qty) {
        WorkOrder order = workOrderMapper.selectByIdForUpdate(id);
        if (order == null) {
            throw new BusinessException(HttpStatus.NOT_FOUND, "生产工单不存在");
        }
        if (order.getStatus() == null || (order.getStatus() != 1 && order.getStatus() != 2)) {
            throw new BusinessException(HttpStatus.CONFLICT, "只有已下达或已完工工单可以报工");
        }
        if (order.getStatus() == 2 && order.getFinishQty().compareTo(order.getPlanQty()) >= 0) {
            throw new BusinessException(HttpStatus.CONFLICT, "工单已完工，不能继续报工");
        }

        balanceMapper.addStock(order.getProductId(), order.getWarehouseId(), qty);

        ProductionReport report = new ProductionReport();
        report.setReportNo(nextReportNo());
        report.setWorkOrderId(order.getId());
        report.setWarehouseId(order.getWarehouseId());
        report.setProductId(order.getProductId());
        report.setQty(qty);
        report.setCreatedAt(LocalDateTime.now());
        reportMapper.insert(report);

        StockLedger ledger = new StockLedger();
        ledger.setMaterialId(order.getProductId());
        ledger.setWarehouseId(order.getWarehouseId());
        ledger.setBizType("PRODUCTION_IN");
        ledger.setDirection(1);
        ledger.setQty(qty);
        ledger.setSourceType("WO");
        ledger.setSourceId(order.getId());
        ledger.setOccurredAt(LocalDateTime.now());
        ledger.setRemark("生产工单 " + order.getWorkOrderNo() + " 报工");
        ledgerMapper.insert(ledger);

        if (workOrderMapper.addFinish(id, qty) == 0) {
            throw new BusinessException(HttpStatus.CONFLICT, "报工数量超过计划数量");
        }

        return detail(id);
    }

    /**
     * 按 BOM 计算计划用料的建议领料数量，供前端一键填充。
     */
    public List<BomLine> plannedComponents(Long workOrderId) {
        WorkOrder order = workOrderMapper.selectById(workOrderId);
        if (order == null) {
            throw new BusinessException(HttpStatus.NOT_FOUND, "生产工单不存在");
        }
        return bomLineMapper.selectList(
                com.baomidou.mybatisplus.core.toolkit.Wrappers.<BomLine>lambdaQuery()
                        .eq(BomLine::getBomId, order.getBomId())
                        .orderByAsc(BomLine::getSortNo));
    }

    private String nextWorkOrderNo() {
        Long sequence = workOrderMapper.nextWorkOrderNoSeq();
        return "WO" + LocalDate.now().format(NO_DATE) + String.format("%06d", sequence);
    }

    private String nextIssueNo() {
        Long sequence = issueMapper.nextIssueNoSeq();
        return "MI" + LocalDate.now().format(NO_DATE) + String.format("%06d", sequence);
    }

    private String nextReportNo() {
        Long sequence = reportMapper.nextReportNoSeq();
        return "PR" + LocalDate.now().format(NO_DATE) + String.format("%06d", sequence);
    }
}
