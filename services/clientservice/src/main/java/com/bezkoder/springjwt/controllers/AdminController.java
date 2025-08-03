package com.bezkoder.springjwt.controllers;

import com.bezkoder.springjwt.models.User;
import com.bezkoder.springjwt.repository.UserRepository;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@CrossOrigin(origins = "*") // Adjust CORS if needed
@RestController
@RequestMapping("/api/admin")
public class AdminController {

    @Autowired
    private UserRepository userRepository;

    // 🔁 Toggle blacklist status for a user by ID
    @PutMapping("/blacklist/{id}")
    public ResponseEntity<?> toggleBlacklist(@PathVariable Long id) {
        return userRepository.findById(id).map(user -> {
            user.setBlacklisted(!user.isBlacklisted());
            userRepository.save(user);
            return ResponseEntity.ok().body("User " + (user.isBlacklisted() ? "blacklisted" : "unblacklisted"));
        }).orElse(ResponseEntity.notFound().build());
    }

    // 📋 List all users (for admin dashboard)
    @GetMapping("/users")
    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    @GetMapping("/clients")
    // @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<User>> getClients() {
        return ResponseEntity.ok(userRepository.findAll());
    }
}
