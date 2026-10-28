package com.jxbs.erp.demo.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.jxbs.erp.demo.domain.Warehouse;
import com.jxbs.erp.demo.domain.view.WarehouseView;
import org.apache.ibatis.annotations.Select;

import java.util.List;

public interface WarehouseMapper extends BaseMapper<Warehouse> {

    @Select("""
            SELECT w.id,
                   w.warehouse_code,
                   w.warehouse_name,
                   w.dept_id,
                   d.dept_name,
                   w.status
            FROM inv_warehouse w
            LEFT JOIN org_dept d ON d.id = w.dept_id
            ORDER BY w.warehouse_code
            """)
    List<WarehouseView> selectViews();
}
