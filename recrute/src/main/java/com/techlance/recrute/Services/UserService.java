package com.techlance.recrute.Services;

import java.util.List;

import org.springframework.stereotype.Service;

import com.techlance.recrute.Entities.Users;
import com.techlance.recrute.Repositories.UserRepository;

@Service
public class UserService {

    private final UserRepository userRepository;
    public UserService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    public Users createUser(Users user) {
        return userRepository.save(user);
    }

    public List<Users> getAllUsers() {
        return userRepository.findAll();
    }
}
