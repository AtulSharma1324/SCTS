package com.smartclass.backend.repositories;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import com.smartclass.backend.models.Department;

@Repository
public interface DepartmentRepository extends JpaRepository<Department, Long> {}
