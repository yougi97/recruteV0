package com.techlance.recrute.Filtre;

import java.util.List;

import com.techlance.recrute.Enum.ContratType;
import com.techlance.recrute.Enum.NiveauEtude;

public class JobOfferFilter {
    private List<ContratType> contratTypes;
    private List<NiveauEtude> niveauEtudes;
    private List<String> locations;

    public List<ContratType> getContratTypes() {
        return contratTypes;
    }

    public void setContratTypes(List<ContratType> contratTypes) {
        this.contratTypes = contratTypes;
    }

    public List<NiveauEtude> getNiveauEtudes() {
        return niveauEtudes;
    }

    public void setNiveauEtudes(List<NiveauEtude> niveauEtudes) {
        this.niveauEtudes = niveauEtudes;
    }

    public List<String> getLocations() {
        return locations;
    }

    public void setLocations(List<String> locations) {
        this.locations = locations;
    }
}
