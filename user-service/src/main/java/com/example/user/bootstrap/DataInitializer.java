package com.example.user.bootstrap;

import com.example.user.model.UserAccount;
import com.example.user.repository.UserAccountRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.util.Set;

@Component
public class DataInitializer implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DataInitializer.class);

    private final UserAccountRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public DataInitializer(UserAccountRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) {
        userRepository.findByEmail("admin@example.com").ifPresentOrElse(
                user -> log.info("默认管理员已存在: {}", user.getEmail()),
                () -> {
                    UserAccount admin = UserAccount.builder()
                            .email("admin@example.com")
                            .password(passwordEncoder.encode("admin123"))
                            .roles(Set.of("ADMIN", "USER"))
                            .enabled(true)
                            .build();
                    userRepository.save(admin);
                    log.info("已创建默认管理员 admin@example.com / admin123");
                }
        );
    }
}
