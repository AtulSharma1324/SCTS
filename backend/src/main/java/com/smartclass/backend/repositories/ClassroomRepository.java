package com.smartclass.backend.repositories;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import com.smartclass.backend.models.Classroom;

@Repository
public interface ClassroomRepository extends JpaRepository<Classroom, Long> {}
