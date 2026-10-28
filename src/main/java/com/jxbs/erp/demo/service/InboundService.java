package com.jxbs.erp.demo.service;

import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.jxbs.erp.demo.domain.view.InboundView;
import com.jxbs.erp.demo.exception.BusinessException;
import com.jxbs.erp.demo.mapper.PurchaseInboundLineMapper;
import com.jxbs.erp.demo.mapper.PurchaseInboundMapper;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

@Service
public class InboundService {

    private final PurchaseInboundMapper inboundMapper;
    private final PurchaseInboundLineMapper inboundLineMapper;

    public InboundService(PurchaseInboundMapper inboundMapper,
                          PurchaseInboundLineMapper inboundLineMapper) {
        this.inboundMapper = inboundMapper;
        this.inboundLineMapper = inboundLineMapper;
    }

    public IPage<InboundView> page(long current, long size, String keyword) {
        long safeSize = Math.min(Math.max(size, 1), 100);
        return inboundMapper.selectPageViews(new Page<>(Math.max(current, 1), safeSize), keyword);
    }

    public InboundView detail(Long id) {
        InboundView view = inboundMapper.selectViewById(id);
        if (view == null) {
            throw new BusinessException(HttpStatus.NOT_FOUND, "采购入库单不存在");
        }
        view.setLines(inboundLineMapper.selectViews(id));
        return view;
    }
}
