package com.smartclass.backend.repositories;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import com.smartclass.backend.models.ScheduleAnalytics;

@Repository
public interface ScheduleAnalyticsRepository extends JpaRepository<ScheduleAnalytics, Long> {}
