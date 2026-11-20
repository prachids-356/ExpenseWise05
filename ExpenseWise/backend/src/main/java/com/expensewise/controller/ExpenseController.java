package com.expensewise.controller;

import com.expensewise.dto.ExpenseRequest;
import com.expensewise.dto.ExpenseResponse;
import com.expensewise.service.ExpenseService;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/expenses")
public class ExpenseController {
    private final ExpenseService expenseService;

    public ExpenseController(ExpenseService expenseService) {
        this.expenseService = expenseService;
    }

    @GetMapping
    public List<ExpenseResponse> list(Authentication authentication) {
        return expenseService.list(authentication.getName());
    }

    @PostMapping
    public ExpenseResponse create(Authentication authentication, @Valid @RequestBody ExpenseRequest request) {
        return expenseService.create(authentication.getName(), request);
    }

    @PutMapping("/{id}")
    public ExpenseResponse update(Authentication authentication, @PathVariable Long id,
                                  @Valid @RequestBody ExpenseRequest request) {
        return expenseService.update(authentication.getName(), id, request);
    }

    @DeleteMapping("/{id}")
    public void delete(Authentication authentication, @PathVariable Long id) {
        expenseService.delete(authentication.getName(), id);
    }
}
