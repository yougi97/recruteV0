package com.techlance.recrute.Services;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import com.techlance.recrute.DTO.categories;
import com.techlance.recrute.Entities.Categories;
import com.techlance.recrute.Entities.CvCategories;
import com.techlance.recrute.Entities.Cvs;
import com.techlance.recrute.Entities.JobCategories;
import com.techlance.recrute.Entities.JobOffers;
import com.techlance.recrute.Repositories.CategoriesRepository;
import com.techlance.recrute.Repositories.CvCategoriesRepository;
import com.techlance.recrute.Repositories.CvsRepository;
import com.techlance.recrute.Repositories.JobCategoriesRepository;
import com.techlance.recrute.Repositories.JobOfferRepository;

@Service
public class CategoriesService {
    private final CategoriesRepository categoriesRepository;
    private final JobCategoriesRepository jobCategoriesRepository;
    private final CvCategoriesRepository cvCategoriesRepository;
    private final CvsRepository cvsRepository;
    private final JobOfferRepository jobOfferRepository;

    public CategoriesService(CategoriesRepository categoriesRepository, JobCategoriesRepository jobCategoriesRepository,
            CvCategoriesRepository cvCategoriesRepository, CvsRepository cvsRepository, JobOfferRepository jobOfferRepository) {
        this.categoriesRepository = categoriesRepository;
        this.jobCategoriesRepository = jobCategoriesRepository;
        this.cvCategoriesRepository = cvCategoriesRepository;
        this.cvsRepository = cvsRepository;
        this.jobOfferRepository = jobOfferRepository;
    }

    public Categories createCategories(Categories category) {
        return categoriesRepository.save(category);
    }
    
    public CvCategories createCvCategories(Long id, categories categorie) {
        Cvs cv =cvsRepository.findById(id).orElseThrow(()->
            new ResponseStatusException(HttpStatus.BAD_REQUEST,
                String.format("Ce cv n'existe pas")
            )
        );
        Optional<Categories> OptnewCategory = categoriesRepository.findByNameAndType(categorie.getName(), categorie.getType());
         Categories newCategory;
         if (OptnewCategory.isPresent()) {
            newCategory = OptnewCategory.get();
         }
         else {
            newCategory = new Categories();
            newCategory.setName(categorie.getName());
            newCategory.setType(categorie.getType());
            categoriesRepository.save(newCategory);
         }
        

        CvCategories newCvCategories = new CvCategories();
        newCvCategories.setCv(cv);
        newCvCategories.setCategory(newCategory);
        newCvCategories.setConfidence(categorie.getConfidence());
        newCvCategories.setLevel(categorie.getLevel());
        
        return cvCategoriesRepository.save(newCvCategories);

    }

    public List<categories> getcategories(Long cvId) {
        List<categories> listcategories = new ArrayList<>();
        List<CvCategories> listcvcategories = cvCategoriesRepository.findByCvId(cvId);
        for (CvCategories cvCategories : listcvcategories) {
            categories categorie = new categories();
            categorie.setName(cvCategories.getCategory().getName());
            categorie.setLevel(cvCategories.getLevel());
            categorie.setType(cvCategories.getCategory().getType());
            categorie.setConfidence(cvCategories.getConfidence());
            listcategories.add(categorie);
        }
        return listcategories;
    }

    public JobCategories createJobCategories(Long id, JobCategories jobCategories) {
        JobOffers cv =jobOfferRepository.findById(id).orElseThrow(()->
            new ResponseStatusException(HttpStatus.BAD_REQUEST,
                String.format("Ce job n'existe pas")
            )
        );

        Optional<Categories> OptnewCategory = categoriesRepository.findByNameAndType(jobCategories.getCategory().getName(), jobCategories.getCategory().getType());
        Categories newCategory;
        if (OptnewCategory.isPresent()) {
            newCategory = OptnewCategory.get();
        }
        else {
            newCategory = new Categories();
            newCategory.setName(jobCategories.getCategory().getName());
            newCategory.setType(jobCategories.getCategory().getType());
            if (jobCategories.getCategory().getSource()!=null) {
                newCategory.setSource(jobCategories.getCategory().getSource());
            }
            categoriesRepository.save(newCategory);
        }
        JobCategories newJobCategories = new JobCategories();
        newJobCategories.setJobOffer(cv);
        newJobCategories.setCategory(newCategory);
        newJobCategories.setRequiredLevel(jobCategories.getRequiredLevel());
        newJobCategories.setMandatory(jobCategories.isMandatory());
        
        return jobCategoriesRepository.save(newJobCategories);

    }

    public List<Map<String,Object>> getcategoriesjob(Long jobId) {
        List<Map<String,Object>> listcategories = new ArrayList<>();
        List<JobCategories> listjobcategories = jobCategoriesRepository.findByjobOfferId(jobId);
        for (JobCategories jobCategories : listjobcategories) {
            Map<String,Object> mapCategories = new HashMap<>();
            mapCategories.put("name", jobCategories.getCategory().getName());
            mapCategories.put("type",jobCategories.getCategory().getType());
            mapCategories.put("required_level",jobCategories.getRequiredLevel());
            mapCategories.put("is_mandatory",jobCategories.getRequiredLevel());
            listcategories.add(mapCategories);
        }
        return listcategories;
    }

}
