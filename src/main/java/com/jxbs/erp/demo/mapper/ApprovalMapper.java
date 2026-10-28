package com.jxbs.erp.demo.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.jxbs.erp.demo.domain.Approval;
import com.jxbs.erp.demo.domain.view.ApprovalView;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;
import org.apache.ibatis.annotations.Update;

public interface ApprovalMapper extends BaseMapper<Approval> {

    @Select("""
            SELECT *
            FROM sys_approval
            WHERE biz_type = #{bizType} AND biz_id = #{bizId}
            ORDER BY id DESC
            LIMIT 1
            """)
    Approval selectLatest(@Param("bizType") String bizType, @Param("bizId") Long bizId);

    @Select("""
            SELECT *
            FROM sys_approval
            WHERE id = #{id}
            FOR UPDATE
            """)
    Approval selectByIdForUpdate(@Param("id") Long id);

    @Update("""
            UPDATE sys_approval
            SET status = #{status},
                current_step = #{step},
                finished_at = now()
            WHERE id = #{id} AND status = 0
            """)
    int finish(@Param("id") Long id,
               @Param("status") int status,
               @Param("step") int step);

    @Select("""
            <script>
            SELECT a.id,
                   a.biz_type,
                   a.biz_id,
                   a.biz_no,
                   a.status,
                   a.current_step,
                   a.total_steps,
                   a.amount,
                   a.submit_remark,
                   a.submitted_at,
                   a.finished_at
            FROM sys_approval a
            WHERE 1 = 1
            <if test="bizType != null and bizType != ''">AND a.biz_type = #{bizType}</if>
            <if test="status != null">AND a.status = #{status}</if>
            <if test="keyword != null and keyword != ''">
                AND a.biz_no ILIKE CONCAT('%', #{keyword}, '%')
            </if>
            ORDER BY a.id DESC
            </script>
            """)
    IPage<ApprovalView> selectPageViews(IPage<ApprovalView> page,
                                        @Param("bizType") String bizType,
                                        @Param("status") Integer status,
                                        @Param("keyword") String keyword);

    @Select("""
            SELECT a.id,
                   a.biz_type,
                   a.biz_id,
                   a.biz_no,
                   a.status,
                   a.current_step,
                   a.total_steps,
                   a.amount,
                   a.submit_remark,
                   a.submitted_at,
                   a.finished_at
            FROM sys_approval a
            WHERE a.id = #{id}
            """)
    ApprovalView selectViewById(@Param("id") Long id);
}
