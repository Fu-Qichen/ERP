package com.jxbs.erp.demo.service;

import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.jxbs.erp.demo.domain.view.LedgerView;
import com.jxbs.erp.demo.mapper.StockLedgerMapper;
import org.apache.poi.ss.usermodel.Cell;
import org.apache.poi.ss.usermodel.CellStyle;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Service
public class StockReportService {

    private static final DateTimeFormatter TIME = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");
    private static final DateTimeFormatter FILE_TIME = DateTimeFormatter.ofPattern("yyyyMMddHHmmss");

    private final StockLedgerMapper ledgerMapper;

    public StockReportService(StockLedgerMapper ledgerMapper) {
        this.ledgerMapper = ledgerMapper;
    }

    /**
     * 导出库存流水，条件与列表查询一致，最多 5 万行。
     */
    public byte[] exportLedger(Long materialId,
                               Long warehouseId,
                               String bizType,
                               String keyword) {
        IPage<LedgerView> page = ledgerMapper.selectPageViews(
                new Page<>(1, 50000),
                materialId,
                warehouseId,
                bizType,
                keyword
        );
        List<LedgerView> rows = page.getRecords();

        try (XSSFWorkbook workbook = new XSSFWorkbook();
             ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Sheet sheet = workbook.createSheet("库存流水");
            CellStyle bold = workbook.createCellStyle();
            bold.setFont(boldFont(workbook));

            String[] headers = {"发生时间", "物料编码", "物料名称", "仓库", "业务类型",
                    "方向", "数量", "来源单据", "备注"};
            Row header = sheet.createRow(0);
            for (int i = 0; i < headers.length; i++) {
                Cell cell = header.createCell(i);
                cell.setCellValue(headers[i]);
                cell.setCellStyle(bold);
            }

            int index = 1;
            for (LedgerView row : rows) {
                Row line = sheet.createRow(index++);
                line.createCell(0).setCellValue(
                        row.getOccurredAt() == null ? "" : row.getOccurredAt().format(TIME));
                line.createCell(1).setCellValue(row.getMaterialCode());
                line.createCell(2).setCellValue(row.getMaterialName());
                line.createCell(3).setCellValue(row.getWarehouseName());
                line.createCell(4).setCellValue(bizLabel(row.getBizType()));
                line.createCell(5).setCellValue(row.getDirection() > 0 ? "入库" : "出库");
                Cell qtyCell = line.createCell(6);
                qtyCell.setCellValue(row.getQty() == null ? 0 : row.getQty().doubleValue());
                line.createCell(7).setCellValue(row.getSourceNo() == null ? "" : row.getSourceNo());
                line.createCell(8).setCellValue(row.getRemark() == null ? "" : row.getRemark());
            }

            int[] widths = {20, 14, 22, 10, 14, 8, 12, 20, 40};
            for (int i = 0; i < widths.length; i++) {
                sheet.setColumnWidth(i, widths[i] * 256);
            }
            sheet.createFreezePane(0, 1);

            workbook.write(out);
            return out.toByteArray();
        } catch (IOException exception) {
            throw new IllegalStateException("导出库存流水失败", exception);
        }
    }

    public String ledgerFileName() {
        return "库存流水-" + LocalDateTime.now().format(FILE_TIME) + ".xlsx";
    }

    private org.apache.poi.ss.usermodel.Font boldFont(XSSFWorkbook workbook) {
        var font = workbook.createFont();
        font.setBold(true);
        return font;
    }

    private String bizLabel(String bizType) {
        if (bizType == null) {
            return "";
        }
        return switch (bizType) {
            case "PURCHASE_IN" -> "采购入库";
            case "SALES_OUT" -> "销售出库";
            case "PRODUCTION_ISSUE" -> "生产领料";
            case "PRODUCTION_IN" -> "生产入库";
            default -> bizType;
        };
    }
}
