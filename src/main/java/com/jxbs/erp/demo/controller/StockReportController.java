package com.jxbs.erp.demo.controller;

import com.jxbs.erp.demo.domain.view.ReconcileRowView;
import com.jxbs.erp.demo.service.ReconcileService;
import com.jxbs.erp.demo.service.StockReportService;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.nio.charset.StandardCharsets;
import java.util.List;

@RestController
@RequestMapping("/api")
public class StockReportController {

    private static final MediaType XLSX = MediaType.parseMediaType(
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");

    private final StockReportService reportService;
    private final ReconcileService reconcileService;

    public StockReportController(StockReportService reportService,
                                 ReconcileService reconcileService) {
        this.reportService = reportService;
        this.reconcileService = reconcileService;
    }

    @GetMapping("/ledger/export")
    public ResponseEntity<byte[]> exportLedger(@RequestParam(required = false) Long materialId,
                                               @RequestParam(required = false) Long warehouseId,
                                               @RequestParam(required = false) String bizType,
                                               @RequestParam(required = false) String keyword) {
        byte[] content = reportService.exportLedger(materialId, warehouseId, bizType, keyword);
        String filename = reportService.ledgerFileName();
        return ResponseEntity.ok()
                .contentType(XLSX)
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        ContentDisposition.attachment()
                                .filename(filename, StandardCharsets.UTF_8)
                                .build()
                                .toString())
                .body(content);
    }

    @GetMapping("/reconcile")
    public List<ReconcileRowView> reconcile(@RequestParam(required = false) Long warehouseId,
                                            @RequestParam(defaultValue = "false") boolean onlyDiff) {
        return reconcileService.reconcile(warehouseId, onlyDiff);
    }
}
