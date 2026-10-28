package com.jxbs.erp.demo.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.jxbs.erp.demo.domain.ApprovalLog;
import com.jxbs.erp.demo.domain.view.ApprovalLogView;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

import java.util.List;

public interface ApprovalLogMapper extends BaseMapper<ApprovalLog> {

    @Select("""
            SELECT id, step, action, approver, remark, created_at
            FROM sys_approval_log
            WHERE approval_id = #{approvalId}
            ORDER BY id
            """)
    List<ApprovalLogView> selectViews(@Param("approvalId") Long approvalId);
}
