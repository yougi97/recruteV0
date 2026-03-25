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

    public Users getUserByEmail(String email) {
        return userRepository.findByEmail(email);
    }

    public Users getUserById(Long id) {
        return userRepository.findById(id).orElse(null);
    }

    public Users updatUsers(Users user, Long id) {
        Users oldUsers = userRepository.getReferenceById(id);
        oldUsers.setEmail(user.getEmail());
        oldUsers.setPassword(user.getPassword());
        oldUsers.setUserType(user.getUserType());
        oldUsers.setFirstName(user.getFirstName());
        oldUsers.setLastName(user.getLastName());
        return userRepository.save(oldUsers);
    }
}
