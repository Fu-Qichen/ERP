package com.jxbs.erp.demo.service;

import com.baomidou.mybatisplus.core.toolkit.Wrappers;
import com.jxbs.erp.demo.domain.Dept;
import com.jxbs.erp.demo.domain.Staff;
import com.jxbs.erp.demo.dto.DeptRequest;
import com.jxbs.erp.demo.dto.StaffRequest;
import com.jxbs.erp.demo.exception.BusinessException;
import com.jxbs.erp.demo.mapper.DeptMapper;
import com.jxbs.erp.demo.mapper.StaffMapper;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class OrganizationService {

    private final DeptMapper deptMapper;
    private final StaffMapper staffMapper;

    public OrganizationService(DeptMapper deptMapper, StaffMapper staffMapper) {
        this.deptMapper = deptMapper;
        this.staffMapper = staffMapper;
    }

    public List<Dept> departments() {
        return deptMapper.selectList(
                Wrappers.<Dept>lambdaQuery()
                        .orderByAsc(Dept::getParentId)
                        .orderByAsc(Dept::getDeptCode)
        );
    }

    @Transactional
    public Dept createDept(DeptRequest request) {
        validateDeptParent(null, request.parentId());
        Dept dept = new Dept();
        applyDept(dept, request);
        deptMapper.insert(dept);
        return dept;
    }

    @Transactional
    public Dept updateDept(Long id, DeptRequest request) {
        Dept existing = deptMapper.selectById(id);
        if (existing == null) {
            throw new BusinessException(HttpStatus.NOT_FOUND, "部门不存在");
        }
        validateDeptParent(id, request.parentId());
        applyDept(existing, request);
        deptMapper.updateById(existing);
        return deptMapper.selectById(id);
    }

    @Transactional
    public void deleteDept(Long id) {
        if (deptMapper.selectById(id) == null) {
            throw new BusinessException(HttpStatus.NOT_FOUND, "部门不存在");
        }
        Long children = deptMapper.selectCount(
                Wrappers.<Dept>lambdaQuery().eq(Dept::getParentId, id)
        );
        if (children > 0) {
            throw new BusinessException(HttpStatus.CONFLICT, "部门下还有子部门，不能删除");
        }
        Long staff = staffMapper.selectCount(
                Wrappers.<Staff>lambdaQuery().eq(Staff::getDeptId, id)
        );
        if (staff > 0) {
            throw new BusinessException(HttpStatus.CONFLICT, "部门下还有员工，不能删除");
        }
        deptMapper.deleteById(id);
    }

    public List<Staff> staff() {
        return staffMapper.selectList(
                Wrappers.<Staff>lambdaQuery()
                        .orderByAsc(Staff::getDeptId)
                        .orderByAsc(Staff::getStaffNo)
        );
    }

    @Transactional
    public Staff createStaff(StaffRequest request) {
        validateDept(request.deptId());
        Staff staff = new Staff();
        applyStaff(staff, request);
        staffMapper.insert(staff);
        return staff;
    }

    @Transactional
    public Staff updateStaff(Long id, StaffRequest request) {
        Staff existing = staffMapper.selectById(id);
        if (existing == null) {
            throw new BusinessException(HttpStatus.NOT_FOUND, "员工不存在");
        }
        validateDept(request.deptId());
        applyStaff(existing, request);
        staffMapper.updateById(existing);
        return staffMapper.selectById(id);
    }

    @Transactional
    public void deleteStaff(Long id) {
        if (staffMapper.selectById(id) == null) {
            throw new BusinessException(HttpStatus.NOT_FOUND, "员工不存在");
        }
        staffMapper.deleteById(id);
    }

    private void applyDept(Dept dept, DeptRequest request) {
        dept.setDeptCode(request.deptCode());
        dept.setDeptName(request.deptName());
        dept.setParentId(request.parentId());
        dept.setStatus(request.status() == null ? 1 : request.status());
    }

    private void applyStaff(Staff staff, StaffRequest request) {
        staff.setStaffNo(request.staffNo());
        staff.setStaffName(request.staffName());
        staff.setDeptId(request.deptId());
        staff.setStatus(request.status() == null ? 1 : request.status());
    }

    private void validateDept(Long deptId) {
        if (deptMapper.selectById(deptId) == null) {
            throw new BusinessException(HttpStatus.BAD_REQUEST, "所属部门不存在");
        }
    }

    private void validateDeptParent(Long id, Long parentId) {
        if (parentId == null) {
            return;
        }
        if (id != null && id.equals(parentId)) {
            throw new BusinessException(HttpStatus.BAD_REQUEST, "上级部门不能是自己");
        }
        Long cursor = parentId;
        while (cursor != null) {
            if (id != null && id.equals(cursor)) {
                throw new BusinessException(HttpStatus.BAD_REQUEST, "上级部门不能是当前部门的下级");
            }
            Dept parent = deptMapper.selectById(cursor);
            if (parent == null) {
                throw new BusinessException(HttpStatus.BAD_REQUEST, "上级部门不存在");
            }
            cursor = parent.getParentId();
        }
    }
}
