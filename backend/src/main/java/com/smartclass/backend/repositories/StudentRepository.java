package com.smartclass.backend.repositories;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import com.smartclass.backend.models.Student;

@Repository
public interface StudentRepository extends JpaRepository<Student, Long> {}
