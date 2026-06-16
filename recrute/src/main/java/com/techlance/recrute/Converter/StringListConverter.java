package com.techlance.recrute.Converter;

import java.util.List;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

@Converter
public class StringListConverter implements AttributeConverter<List<String>, String> {

    private final ObjectMapper objectMapper = new ObjectMapper();

    // Java -> DB
    @Override
    public String convertToDatabaseColumn(List<String> attribute) {
        try {
            return objectMapper.writeValueAsString(attribute); // transforme la liste en JSON
        } catch (JsonProcessingException e) {
            throw new IllegalArgumentException("Erreur conversion JSON", e);
        }
    }

    // DB -> Java
    @Override
    public List<String> convertToEntityAttribute(String dbData) {
        try {
            return objectMapper.readValue(dbData, new TypeReference<List<String>>() {}); // parse JSON en liste
        } catch (JsonProcessingException e) {
            throw new IllegalArgumentException("Erreur lecture JSON", e);
        }
    }
}
