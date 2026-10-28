package com.jxbs.erp.demo.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.jxbs.erp.demo.domain.ProductionReport;
import com.jxbs.erp.demo.domain.view.ReportRowView;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

import java.util.List;

public interface ProductionReportMapper extends BaseMapper<ProductionReport> {

    @Select("SELECT nextval('mfg_report_no_seq')")
    Long nextReportNoSeq();

    @Select("""
            SELECT r.id,
                   r.report_no,
                   r.work_order_id,
                   w.work_order_no,
                   r.product_id,
                   p.code AS product_code,
                   p.name AS product_name,
                   r.qty,
                   to_char(r.created_at, 'YYYY-MM-DD HH24:MI:SS') AS created_at
            FROM mfg_report r
            JOIN mfg_work_order w ON w.id = r.work_order_id
            JOIN md_material p ON p.id = r.product_id
            WHERE r.work_order_id = #{workOrderId}
            ORDER BY r.id DESC
            """)
    List<ReportRowView> selectViews(@Param("workOrderId") Long workOrderId);
}
