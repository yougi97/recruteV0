package com.techlance.recrute.Entities;


import java.sql.Date;

import com.techlance.recrute.Converter.StringListConverter;

import jakarta.persistence.Column;
import jakarta.persistence.Convert;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;

@Entity
public class JobSearches {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @ManyToOne
    @JoinColumn(name ="user_id")
    private Users user;
    private String query;
    @Column(columnDefinition="json")
    @Convert(converter = StringListConverter.class)
    private String filters;
    private Date searchedAt;
    public Long getId() {
        return id;
    }
    public void setId(Long id) {
        this.id = id;
    }
    public Users getUser() {
        return user;
    }
    public void setUser(Users user) {
        this.user = user;
    }
    public String getQuery() {
        return query;
    }
    public void setQuery(String query) {
        this.query = query;
    }
    public String getFilters() {
        return filters;
    }
    public void setFilters(String filters) {
        this.filters = filters;
    }
    public Date getSearchedAt() {
        return searchedAt;
    }
    public void setSearchedAt(Date searchedAt) {
        this.searchedAt = searchedAt;
    }
    
}
