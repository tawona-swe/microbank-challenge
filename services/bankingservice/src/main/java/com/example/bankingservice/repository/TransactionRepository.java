package com.example.bankingservice.repository;

import com.example.bankingservice.model.Transaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TransactionRepository extends JpaRepository<Transaction, Long> {

    // Custom query method to find transactions by accountId and order them by transactionDate in descending order
    // This is for fetching transaction history.
    List<Transaction> findByAccountIdOrderByTransactionDateDesc(Long accountId);

    // Custom query method to find all transactions for a given accountId (used for balance calculation)
    List<Transaction> findByAccountId(Long accountId);
}