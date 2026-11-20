
package com.expensewise.service;

import com.expensewise.dto.ExpenseRequest;
import com.expensewise.dto.ExpenseResponse;
import com.expensewise.entity.Expense;
import com.expensewise.entity.User;
import com.expensewise.repository.ExpenseRepository;
import com.expensewise.repository.UserRepository;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class ExpenseService {
    private final ExpenseRepository expenses;
    private final UserRepository users;

    public ExpenseService(ExpenseRepository expenses, UserRepository users) {
        this.expenses = expenses;
        this.users = users;
    }

    @Transactional(readOnly = true)
    public List<ExpenseResponse> list(String email) {
        User user = getUser(email);
        return expenses.findAllByUser_IdOrderByDateDescIdDesc(user.getId())
            .stream().map(ExpenseResponse::from).toList();
    }

    public ExpenseResponse create(String email, ExpenseRequest request) {
        User user = getUser(email);
        Expense expense = new Expense(
            request.title().trim(),
            request.amount(),
            request.category().trim(),
            request.date(),
            request.notes(),
            user
        );
        return ExpenseResponse.from(expenses.save(expense));
    }

    public ExpenseResponse update(String email, Long id, ExpenseRequest request) {
        User user = getUser(email);
        Expense expense = expenses.findByIdAndUser_Id(id, user.getId())
            .orElseThrow(() -> new ResponseStatusException(
                HttpStatus.NOT_FOUND, "Expense not found"
            ));

        expense.update(
            request.title().trim(),
            request.amount(),
            request.category().trim(),
            request.date(),
            request.notes()
        );
        return ExpenseResponse.from(expenses.save(expense));
    }

    public void delete(String email, Long id) {
        User user = getUser(email);
        Expense expense = expenses.findByIdAndUser_Id(id, user.getId())
            .orElseThrow(() -> new ResponseStatusException(
                HttpStatus.NOT_FOUND, "Expense not found"
            ));
        expenses.delete(expense);
    }

    private User getUser(String email) {
        return users.findByEmail(email)
            .orElseThrow(() -> new ResponseStatusException(
                HttpStatus.UNAUTHORIZED, "User account not found"
            ));
    }
}
