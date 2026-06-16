package com.techlance.recrute.Enum;

public enum NiveauEtude {
    bac("bac"),
    bac2("bac+2"),
    bac3("bac+3"),
    bac5("bac+5"),
    doctorat("doctotat"),
    autre("autre");

    private final String label;
    NiveauEtude (String label) {
        this.label = label;
    }

    public String getLabel() {
        return label;
    }
    
}
