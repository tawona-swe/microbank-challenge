package com.example.bankingservice.model;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.Column;

import java.math.BigDecimal;
import java.time.LocalDateTime; // Import LocalDateTime for transaction date

@Entity
@Table(name = "transactions")
public class Transaction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id; // Unique identifier for each transaction

    @Column(nullable = false)
    private String type; // "deposit" or "withdraw"

    @Column(nullable = false)
    private BigDecimal amount; // Amount of money involved in the transaction

    @Column(nullable = false)
    private Long accountId; // ID of the account associated with the transaction

    @Column(name = "transaction_date", nullable = false) // Added transaction_date column mapping
    private LocalDateTime transactionDate; // Field for transaction date and time

    // Constructors
    public Transaction() {
        // Default constructor
    }

    // Constructor for creating new transactions (automatically sets transactionDate)
    public Transaction(String type, BigDecimal amount, Long accountId) {
        this.type = type;
        this.amount = amount;
        this.accountId = accountId;
        this.transactionDate = LocalDateTime.now(); // Set to current time upon creation
    }

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public BigDecimal getAmount() {
        return amount;
    }

    public void setAmount(BigDecimal amount) {
        this.amount = amount;
    }

    public Long getAccountId() {
        return accountId;
    }

    public void setAccountId(Long accountId) {
        this.accountId = accountId;
    }

    // New getter and setter for transactionDate
    public LocalDateTime getTransactionDate() {
        return transactionDate;
    }

    public void setTransactionDate(LocalDateTime transactionDate) {
        this.transactionDate = transactionDate;
    }
}