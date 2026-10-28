package com.jxbs.erp.demo.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.jxbs.erp.demo.domain.PurchaseReceiptLine;
import com.jxbs.erp.demo.domain.view.PurchaseReceiptLineView;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

import java.util.List;

public interface PurchaseReceiptLineMapper extends BaseMapper<PurchaseReceiptLine> {

    @Select("""
            SELECT l.id,
                   l.order_line_id,
                   l.material_id,
                   m.code AS material_code,
                   m.name AS material_name,
                   l.batch_id,
                   bt.batch_no,
                   l.quantity,
                   l.tax_unit_price,
                   l.tax_rate,
                   l.amount
            FROM po_receipt_line l
            JOIN md_material m ON m.id = l.material_id
            LEFT JOIN inv_batch bt ON bt.id = l.batch_id
            WHERE l.receipt_id = #{receiptId}
            ORDER BY l.id
            """)
    List<PurchaseReceiptLineView> selectViews(@Param("receiptId") Long receiptId);
}
