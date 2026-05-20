package com.smartclass.backend.repositories;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import com.smartclass.backend.models.Subject;

@Repository
public interface SubjectRepository extends JpaRepository<Subject, Long> {}
