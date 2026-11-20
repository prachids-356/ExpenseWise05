package com.expensewise.controller;

import com.expensewise.dto.AuthResponse;
import com.expensewise.dto.LoginRequest;
import com.expensewise.dto.RegisterRequest;
import com.expensewise.service.AuthService;
import jakarta.validation.Valid;
import java.util.Map;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {
    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/register")
    public AuthResponse register(@Valid @RequestBody RegisterRequest request) {
        return authService.register(request);
    }

    @PostMapping("/login")
    public AuthResponse login(@Valid @RequestBody LoginRequest request) {
        return authService.login(request);
    }

    @GetMapping("/me")
    public Map<String, String> me(org.springframework.security.core.Authentication authentication) {
        return Map.of("email", authentication.getName());
    }
}
