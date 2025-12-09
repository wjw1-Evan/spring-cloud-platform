package com.example.console.web.dto;

public record ServiceInstanceView(String serviceId, String instanceId, String host, int port, String status) {
}
