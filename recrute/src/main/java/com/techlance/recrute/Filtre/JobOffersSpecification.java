package com.techlance.recrute.Filtre;

import java.util.List;

import org.springframework.data.jpa.domain.Specification;

import com.techlance.recrute.Entities.JobOffers;
import com.techlance.recrute.Enum.ContratType;
import com.techlance.recrute.Enum.NiveauEtude;

public class JobOffersSpecification {

    public static Specification<JobOffers> hasLocations(List<String> locations) {
        return (root, query, cb) -> {
            if (locations == null || locations.isEmpty()) return null;
            return root.get("location").in(locations);
        };
    }

    public static Specification<JobOffers> hasNiveauEtude(List<NiveauEtude> niveau) {
        return (root, query, cb) -> {
            if (niveau == null || niveau.isEmpty()) return null;
            return root.get("niveau_etude_min").in(niveau);
        };
    }

    public static Specification<JobOffers> hasContratType(List<ContratType> contratType) {
        return (root, query, cb) -> {
            if (contratType == null || contratType.isEmpty()) return null;
            return root.get("contract_type").in(contratType);
        };
    }
}
