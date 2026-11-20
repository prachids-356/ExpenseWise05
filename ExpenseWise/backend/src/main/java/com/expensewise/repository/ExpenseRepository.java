
package com.expensewise.repository;

import com.expensewise.entity.Expense;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ExpenseRepository extends JpaRepository<Expense, Long> {

    List<Expense> findAllByUser_IdOrderByDateDescIdDesc(Long userId);

    Optional<Expense> findByIdAndUser_Id(Long id, Long userId);
}
