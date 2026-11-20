package com.expensewise.dto;

public record AuthResponse(String token, String tokenType, Long userId, String name, String email) {}
