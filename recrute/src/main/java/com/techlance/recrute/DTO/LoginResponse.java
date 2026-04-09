package com.techlance.recrute.DTO;

public class LoginResponse {
    private Long id;
    private String email;
    private String userType;
    private String firstName;
    private String lastName;

    public LoginResponse() {}

    public LoginResponse(Long id, String email, String userType, String firstName, String lastName) {
        this.id = id;
        this.email = email;
        this.userType = userType;
        this.firstName = firstName;
        this.lastName = lastName;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getUserType() {
        return userType;
    }

    public void setUserType(String userType) {
        this.userType = userType;
    }

    public String getFirstName() {
        return firstName;
    }

    public void setFirstName(String firstName) {
        this.firstName = firstName;
    }

    public String getLastName() {
        return lastName;
    }

    public void setLastName(String lastName) {
        this.lastName = lastName;
    }
}
