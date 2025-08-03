package com.example.bankingservice.controller;

import com.example.bankingservice.model.Transaction;
import com.example.bankingservice.service.TransactionService;
import com.example.bankingservice.service.UserValidationService;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import io.swagger.v3.oas.annotations.media.*;
import io.swagger.v3.oas.annotations.responses.ApiResponse;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.*;

@RestController
@RequestMapping("/api/banking")
@Tag(name = "Banking API", description = "Handles deposits, withdrawals, balance, and transaction history")
public class BankingController {

    @Autowired
    private TransactionService transactionService;

    @Autowired
    private UserValidationService userValidationService;

    @Operation(
        summary = "Deposit funds",
        description = "Deposits a specific amount into the authenticated user's account.",
        requestBody = @io.swagger.v3.oas.annotations.parameters.RequestBody(
            required = true,
            content = @Content(
                mediaType = "application/json",
                schema = @Schema(example = "{\"amount\": 100.0}")
            )
        )
    )
    @ApiResponse(responseCode = "200", description = "Deposit successful")
    @ApiResponse(responseCode = "403", description = "User is blacklisted or invalid")
    @PostMapping("/deposit")
    public ResponseEntity<?> deposit(
            @RequestHeader("Authorization") String authHeader,
            @RequestBody Map<String, Object> request) {

        if (!userValidationService.validateUser(authHeader)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("User is blacklisted or invalid");
        }

        Long userId = userValidationService.getUserIdFromToken(authHeader);
        if (userId == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Invalid token");

        BigDecimal amount = new BigDecimal(request.get("amount").toString());
        Transaction tx = new Transaction("deposit", amount, userId);
        return ResponseEntity.ok(transactionService.deposit(tx));
    }

    @Operation(
        summary = "Withdraw funds",
        description = "Withdraws a specific amount from the authenticated user's account.",
        requestBody = @io.swagger.v3.oas.annotations.parameters.RequestBody(
            required = true,
            content = @Content(
                mediaType = "application/json",
                schema = @Schema(example = "{\"amount\": 50.0}")
            )
        )
    )
    @ApiResponse(responseCode = "200", description = "Withdrawal successful")
    @ApiResponse(responseCode = "400", description = "Insufficient funds")
    @ApiResponse(responseCode = "403", description = "User is blacklisted or invalid")
    @PostMapping("/withdraw")
    public ResponseEntity<?> withdraw(
            @RequestHeader("Authorization") String authHeader,
            @RequestBody Map<String, Object> request) {

        if (!userValidationService.validateUser(authHeader)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("User is blacklisted or invalid");
        }

        Long userId = userValidationService.getUserIdFromToken(authHeader);
        if (userId == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Invalid token");

        BigDecimal amount = new BigDecimal(request.get("amount").toString());
        Transaction tx = new Transaction("withdraw", amount, userId);

        try {
            return ResponseEntity.ok(transactionService.withdraw(tx));
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body("Insufficient funds.");
        }
    }

    @Operation(summary = "Get transaction history", description = "Returns a list of recent transactions for the authenticated user.")
    @ApiResponse(responseCode = "200", description = "List of transactions")
    @ApiResponse(responseCode = "403", description = "User is blacklisted or invalid")
    @GetMapping("/transactions")
    public ResponseEntity<?> getTransactions(@RequestHeader("Authorization") String authHeader) {
        Long userId = userValidationService.getUserIdFromToken(authHeader);
        if (userId == null || !userValidationService.validateUser(authHeader)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("User is blacklisted or invalid");
        }

        return ResponseEntity.ok(transactionService.getTransactionsByAccountId(userId));
    }

    @Operation(summary = "Get account balance", description = "Returns the current balance for the authenticated user's account.")
    @ApiResponse(responseCode = "200", description = "Current balance")
    @ApiResponse(responseCode = "403", description = "User is blacklisted or invalid")
    @GetMapping("/balance")
    public ResponseEntity<?> getBalance(@RequestHeader("Authorization") String authHeader) {
        Long userId = userValidationService.getUserIdFromToken(authHeader);
        if (userId == null || !userValidationService.validateUser(authHeader)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("User is blacklisted or invalid");
        }

        BigDecimal balance = transactionService.getCurrentBalance(userId);
        Map<String, Object> result = new HashMap<>();
        result.put("balance", balance);
        return ResponseEntity.ok(result);
    }
}