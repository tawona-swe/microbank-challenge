package com.example.bankingservice.service;

import com.example.bankingservice.model.Transaction;
import com.example.bankingservice.repository.TransactionRepository; // Import your TransactionRepository
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.List;

@Service
public class TransactionService {

    @Autowired // Autowire your TransactionRepository
    private TransactionRepository transactionRepository;

    // Method to handle deposits
    public Transaction deposit(Transaction tx) {
        // Implement deposit logic:
        // 1. You might want to get the current balance for accountId
        // 2. Add the deposit amount to the balance (this logic will be in your service)
        // 3. Save the new transaction record to the database
        tx.setType("deposit"); // Ensure type is correctly set
        // The transactionDate is set in the Transaction model's constructor, or you can set it here:
        // tx.setTransactionDate(LocalDateTime.now());
        return transactionRepository.save(tx); // Save the transaction to the database
    }

    // Method to handle withdrawals
    public Transaction withdraw(Transaction tx) {
        // Implement withdrawal logic:
        // 1. Get the current balance for accountId
        // 2. Check for overdraft: If amount > current balance, throw an exception or return an error
        // 3. Subtract the withdrawal amount from the balance
        // 4. Save the new transaction record to the database
        BigDecimal currentBalance = getCurrentBalance(tx.getAccountId());
        if (currentBalance.compareTo(tx.getAmount()) < 0) {
            throw new IllegalArgumentException("Insufficient funds for withdrawal.");
        }
        tx.setType("withdraw"); // Ensure type is correctly set
        // The transactionDate is set in the Transaction model's constructor, or you can set it here:
        // tx.setTransactionDate(LocalDateTime.now());
        return transactionRepository.save(tx); // Save the transaction to the database
    }

    // Method to get all transactions for a specific account, ordered by date
    public List<Transaction> getTransactionsByAccountId(Long accountId) {
        return transactionRepository.findByAccountIdOrderByTransactionDateDesc(accountId);
    }

    // Method to calculate the current balance for a specific account
    public BigDecimal getCurrentBalance(Long accountId) {
        List<Transaction> transactions = transactionRepository.findByAccountId(accountId);
        BigDecimal balance = BigDecimal.ZERO;
        for (Transaction tx : transactions) {
            if ("deposit".equalsIgnoreCase(tx.getType())) {
                balance = balance.add(tx.getAmount());
            } else if ("withdraw".equalsIgnoreCase(tx.getType())) {
                balance = balance.subtract(tx.getAmount());
            }
        }
        return balance;
    }
}