package com.jxbs.erp.demo.controller;

import com.jxbs.erp.demo.domain.Dept;
import com.jxbs.erp.demo.domain.Staff;
import com.jxbs.erp.demo.dto.DeptRequest;
import com.jxbs.erp.demo.dto.StaffRequest;
import com.jxbs.erp.demo.service.OrganizationService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api")
public class OrganizationController {

    private final OrganizationService organizationService;

    public OrganizationController(OrganizationService organizationService) {
        this.organizationService = organizationService;
    }

    @GetMapping("/departments")
    public List<Dept> departments() {
        return organizationService.departments();
    }

    @PostMapping("/departments")
    @ResponseStatus(HttpStatus.CREATED)
    public Dept createDept(@Valid @RequestBody DeptRequest request) {
        return organizationService.createDept(request);
    }

    @PutMapping("/departments/{id}")
    public Dept updateDept(@PathVariable Long id, @Valid @RequestBody DeptRequest request) {
        return organizationService.updateDept(id, request);
    }

    @DeleteMapping("/departments/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteDept(@PathVariable Long id) {
        organizationService.deleteDept(id);
    }

    @GetMapping("/staff")
    public List<Staff> staff() {
        return organizationService.staff();
    }

    @PostMapping("/staff")
    @ResponseStatus(HttpStatus.CREATED)
    public Staff createStaff(@Valid @RequestBody StaffRequest request) {
        return organizationService.createStaff(request);
    }

    @PutMapping("/staff/{id}")
    public Staff updateStaff(@PathVariable Long id, @Valid @RequestBody StaffRequest request) {
        return organizationService.updateStaff(id, request);
    }

    @DeleteMapping("/staff/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteStaff(@PathVariable Long id) {
        organizationService.deleteStaff(id);
    }
}
