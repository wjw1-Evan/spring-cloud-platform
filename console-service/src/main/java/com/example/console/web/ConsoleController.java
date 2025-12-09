package com.example.console.web;

import com.example.console.service.ConsoleService;
import com.example.console.web.dto.ServiceInstanceView;
import com.example.common.api.ApiResponse;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/console")
public class ConsoleController {

    private final ConsoleService consoleService;

    public ConsoleController(ConsoleService consoleService) {
        this.consoleService = consoleService;
    }

    @GetMapping("/services")
    public ApiResponse<List<ServiceInstanceView>> listServices() {
        return ApiResponse.ok(consoleService.listInstances());
    }
}
