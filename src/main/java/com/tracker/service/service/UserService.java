package com.tracker.service.service;

import com.tracker.service.entity.User;
import com.tracker.service.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;

    public User getOrCreateUser(String email, String name, String pictureUrl) {
        Optional<User> optionalUser = userRepository.findByEmail(email);
        if (optionalUser.isPresent()) {
            return optionalUser.get();
        }

        User newUser = User.builder()
                .email(email)
                .name(name)
                .pictureUrl(pictureUrl)
                .role("ROLE_USER")
                .build();
        return userRepository.save(newUser);
    }
    
    public Optional<User> findById(Long id) {
        return userRepository.findById(id);
    }

    public Optional<User> findByEmail(String email) {
        return userRepository.findByEmail(email);
    }

    public User saveUser(User user) {
        return userRepository.save(user);
    }
}
