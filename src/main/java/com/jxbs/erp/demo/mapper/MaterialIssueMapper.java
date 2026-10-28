package com.jxbs.erp.demo.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.jxbs.erp.demo.domain.MaterialIssue;
import com.jxbs.erp.demo.domain.view.IssueRowView;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

import java.util.List;

public interface MaterialIssueMapper extends BaseMapper<MaterialIssue> {

    @Select("SELECT nextval('mfg_issue_no_seq')")
    Long nextIssueNoSeq();

    @Select("""
            SELECT i.id,
                   i.issue_no,
                   i.work_order_id,
                   w.work_order_no,
                   i.material_id,
                   m.code AS material_code,
                   m.name AS material_name,
                   i.qty,
                   to_char(i.created_at, 'YYYY-MM-DD HH24:MI:SS') AS created_at
            FROM mfg_issue i
            JOIN mfg_work_order w ON w.id = i.work_order_id
            JOIN md_material m ON m.id = i.material_id
            WHERE i.work_order_id = #{workOrderId}
            ORDER BY i.id DESC
            """)
    List<IssueRowView> selectViews(@Param("workOrderId") Long workOrderId);
}
