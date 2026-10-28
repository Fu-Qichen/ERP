package com.jxbs.erp.demo;

import org.mybatis.spring.annotation.MapperScan;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
@MapperScan("com.jxbs.erp.demo.mapper")
public class ErpDemoApplication {

    public static void main(String[] args) {
        SpringApplication.run(ErpDemoApplication.class, args);
    }
}
