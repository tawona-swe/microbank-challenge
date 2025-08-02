package com.example.bankingservice.controller;

import com.example.bankingservice.model.Transaction;
import com.example.bankingservice.service.TransactionService;
import com.example.bankingservice.service.UserValidationService;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal; // Added import for BigDecimal
import java.util.List; // Added import for List

@RestController
@RequestMapping("/api/banking")
public class BankingController {

    @Autowired
    private TransactionService transactionService;

    @Autowired
    private UserValidationService userValidationService;

    @PostMapping("/deposit")
    public ResponseEntity<?> deposit(@RequestHeader("Authorization") String authHeader,
                                     @RequestBody Transaction tx) {
        if (!userValidationService.validateUser(authHeader)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("User is blacklisted or invalid");
        }

        return ResponseEntity.ok(transactionService.deposit(tx));
    }

    @PostMapping("/withdraw")
    public ResponseEntity<?> withdraw(@RequestHeader("Authorization") String authHeader,
                                      @RequestBody Transaction tx) {
        if (!userValidationService.validateUser(authHeader)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("User is blacklisted or invalid");
        }

        return ResponseEntity.ok(transactionService.withdraw(tx));
    }

    // --- NEW GET ENDPOINTS ADDED BELOW THIS LINE ---

    /**
     * Retrieves all transactions for the authenticated user's account.
     * Assumes userValidationService can extract the user ID from the token.
     *
     * @param authHeader The Authorization header containing the JWT.
     * @return A list of transactions or a 403 Forbidden if the user is invalid/blacklisted.
     */
    @GetMapping("/transactions")
    public ResponseEntity<?> getTransactions(@RequestHeader("Authorization") String authHeader) {
        // First, validate the user and get their ID
        // This method needs to be implemented in UserValidationService to extract the Long userId
        Long userId = userValidationService.getUserIdFromToken(authHeader);
        if (userId == null || !userValidationService.validateUser(authHeader)) { // Re-validate blacklist status
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("User is blacklisted or invalid");
        }

        List<Transaction> transactions = transactionService.getTransactionsByAccountId(userId);
        return ResponseEntity.ok(transactions);
    }

    /**
     * Retrieves the current balance for the authenticated user's account.
     * Assumes userValidationService can extract the user ID from the token.
     *
     * @param authHeader The Authorization header containing the JWT.
     * @return The current balance as BigDecimal or a 403 Forbidden if the user is invalid/blacklisted.
     */
    @GetMapping("/balance")
    public ResponseEntity<?> getBalance(@RequestHeader("Authorization") String authHeader) {
        // First, validate the user and get their ID
        // This method needs to be implemented in UserValidationService to extract the Long userId
        Long userId = userValidationService.getUserIdFromToken(authHeader);
        if (userId == null || !userValidationService.validateUser(authHeader)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("User is blacklisted or invalid");
        }

        BigDecimal balance = transactionService.getCurrentBalance(userId);
        return ResponseEntity.ok(balance);
    }
}