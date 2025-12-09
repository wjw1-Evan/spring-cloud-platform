package com.example.console.service;

import com.example.console.web.dto.ServiceInstanceView;
import org.springframework.cloud.client.ServiceInstance;
import org.springframework.cloud.client.discovery.DiscoveryClient;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.ArrayList;
import java.util.List;

@Service
public class ConsoleService {

    private final DiscoveryClient discoveryClient;
    private final RestTemplate restTemplate;

    public ConsoleService(DiscoveryClient discoveryClient, RestTemplate restTemplate) {
        this.discoveryClient = discoveryClient;
        this.restTemplate = restTemplate;
    }

    public List<ServiceInstanceView> listInstances() {
        List<ServiceInstanceView> result = new ArrayList<>();
        for (String serviceId : discoveryClient.getServices()) {
            List<ServiceInstance> instances = discoveryClient.getInstances(serviceId);
            for (ServiceInstance instance : instances) {
                String status = "UNKNOWN";
                try {
                    var health = restTemplate.getForObject(instance.getUri() + "/actuator/health", String.class);
                    status = health != null && health.contains("UP") ? "UP" : "DOWN";
                } catch (Exception ignored) {
                    status = "DOWN";
                }
                result.add(new ServiceInstanceView(serviceId, instance.getInstanceId(), instance.getHost(), instance.getPort(), status));
            }
        }
        return result;
    }
}
