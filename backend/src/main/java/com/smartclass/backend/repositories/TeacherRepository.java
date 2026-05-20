package com.smartclass.backend.repositories;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import com.smartclass.backend.models.Teacher;

@Repository
public interface TeacherRepository extends JpaRepository<Teacher, Long> {}
