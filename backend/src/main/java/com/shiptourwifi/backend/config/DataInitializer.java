package com.shiptourwifi.backend.config;

import com.shiptourwifi.backend.model.Role;
import com.shiptourwifi.backend.model.User;
import com.shiptourwifi.backend.model.WifiPlan;
import com.shiptourwifi.backend.repository.UserRepository;
import com.shiptourwifi.backend.repository.WifiPlanRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final WifiPlanRepository wifiPlanRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        // Seed default admin
        if (userRepository.findByEmail("admin@ship.com").isEmpty()) {
            User admin = User.builder()
                    .name("管理员")
                    .email("admin@ship.com")
                    .password(passwordEncoder.encode("admin"))
                    .role(Role.ADMIN)
                    .build();
            userRepository.save(admin);
            System.out.println("Default admin: admin@ship.com / admin");
        }

        // Seed default WiFi plans
        if (wifiPlanRepository.count() == 0) {
            wifiPlanRepository.saveAll(List.of(
                    WifiPlan.builder().name("轻量体验包").description("适合短时联网、消息收发与基础网页浏览。").price(12).durationMinutes(15).dataLimitMb(80).active(true).build(),
                    WifiPlan.builder().name("标准畅游包").description("适合日常浏览、地图查询与社交软件使用。").price(36).durationMinutes(120).dataLimitMb(512).active(true).build(),
                    WifiPlan.builder().name("长时尊享包").description("适合较长时段上网、影音娱乐与移动办公。").price(88).durationMinutes(360).dataLimitMb(2048).active(true).build()
            ));
            System.out.println("Default WiFi plans seeded (3 plans).");
        }
    }
}
