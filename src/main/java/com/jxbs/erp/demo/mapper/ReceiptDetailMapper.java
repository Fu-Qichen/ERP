package com.jxbs.erp.demo.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.jxbs.erp.demo.domain.ReceiptDetail;
import com.jxbs.erp.demo.domain.view.ReceiptDetailView;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

import java.util.List;

public interface ReceiptDetailMapper extends BaseMapper<ReceiptDetail> {

    @Select("""
            SELECT d.id,
                   d.receivable_id,
                   r.receivable_no,
                   i.invoice_no,
                   d.amount
            FROM ar_receipt_detail d
            JOIN ar_receivable r ON r.id = d.receivable_id
            JOIN so_invoice i ON i.id = r.invoice_id
            WHERE d.receipt_id = #{receiptId}
            ORDER BY d.id
            """)
    List<ReceiptDetailView> selectViews(@Param("receiptId") Long receiptId);
}
