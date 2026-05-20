package com.smartclass.backend.repositories;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import com.smartclass.backend.models.Timetable;
import java.util.List;

@Repository
public interface TimetableRepository extends JpaRepository<Timetable, Long> {
    List<Timetable> findByTeacherName(String teacherName);
    List<Timetable> findByGradeAndSection(String grade, String section);
}
