package com.jxbs.erp.demo.service;

import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.jxbs.erp.demo.domain.view.OutboundView;
import com.jxbs.erp.demo.exception.BusinessException;
import com.jxbs.erp.demo.mapper.OutboundLineMapper;
import com.jxbs.erp.demo.mapper.OutboundMapper;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

@Service
public class OutboundService {

    private final OutboundMapper outboundMapper;
    private final OutboundLineMapper outboundLineMapper;

    public OutboundService(OutboundMapper outboundMapper,
                           OutboundLineMapper outboundLineMapper) {
        this.outboundMapper = outboundMapper;
        this.outboundLineMapper = outboundLineMapper;
    }

    public IPage<OutboundView> page(long current, long size, String keyword) {
        long safeSize = Math.min(Math.max(size, 1), 100);
        return outboundMapper.selectPageViews(new Page<>(Math.max(current, 1), safeSize), keyword);
    }

    public OutboundView detail(Long id) {
        OutboundView view = outboundMapper.selectViewById(id);
        if (view == null) {
            throw new BusinessException(HttpStatus.NOT_FOUND, "销售出库单不存在");
        }
        view.setLines(outboundLineMapper.selectViews(id));
        return view;
    }
}
