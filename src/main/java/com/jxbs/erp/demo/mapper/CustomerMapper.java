package com.jxbs.erp.demo.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.jxbs.erp.demo.domain.Customer;
import com.jxbs.erp.demo.domain.view.CustomerView;
import org.apache.ibatis.annotations.Select;

import java.util.List;

public interface CustomerMapper extends BaseMapper<Customer> {

    @Select("""
            SELECT c.id,
                   c.customer_code,
                   c.customer_name,
                   c.class_id,
                   cc.class_name,
                   c.staff_id,
                   s.staff_name,
                   c.currency_id,
                   cur.currency_name,
                   c.settle_method_id,
                   sm.method_name AS settle_method_name,
                   c.pay_condition_id,
                   pc.condition_name AS pay_condition_name,
                   c.status
            FROM md_customer c
            LEFT JOIN md_customer_class cc ON cc.id = c.class_id
            LEFT JOIN org_staff s ON s.id = c.staff_id
            LEFT JOIN md_currency cur ON cur.id = c.currency_id
            LEFT JOIN md_settle_method sm ON sm.id = c.settle_method_id
            LEFT JOIN md_pay_condition pc ON pc.id = c.pay_condition_id
            ORDER BY c.customer_code
            """)
    List<CustomerView> selectViews();
}
