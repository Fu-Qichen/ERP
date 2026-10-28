package com.jxbs.erp.demo.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.jxbs.erp.demo.domain.Supplier;
import com.jxbs.erp.demo.domain.view.SupplierView;
import org.apache.ibatis.annotations.Select;

import java.util.List;

public interface SupplierMapper extends BaseMapper<Supplier> {

    @Select("""
            SELECT s.id,
                   s.supplier_code,
                   s.supplier_name,
                   s.class_id,
                   sc.class_name,
                   s.currency_id,
                   cur.currency_name,
                   s.pay_condition_id,
                   pc.condition_name AS pay_condition_name,
                   s.status
            FROM md_supplier s
            LEFT JOIN md_supplier_class sc ON sc.id = s.class_id
            LEFT JOIN md_currency cur ON cur.id = s.currency_id
            LEFT JOIN md_pay_condition pc ON pc.id = s.pay_condition_id
            ORDER BY s.supplier_code
            """)
    List<SupplierView> selectViews();
}
