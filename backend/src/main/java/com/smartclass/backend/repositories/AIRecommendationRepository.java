package com.smartclass.backend.repositories;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import com.smartclass.backend.models.AIRecommendation;

@Repository
public interface AIRecommendationRepository extends JpaRepository<AIRecommendation, Long> {}
