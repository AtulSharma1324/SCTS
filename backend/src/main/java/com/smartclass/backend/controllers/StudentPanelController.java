package com.smartclass.backend.controllers;

import com.smartclass.backend.models.*;
import com.smartclass.backend.repositories.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/student")
@CrossOrigin(origins = "*")
public class StudentPanelController {

    @Autowired private TimetableRepository timetableRepo;
    @Autowired private AttendanceRepository attendanceRepo;
    @Autowired private NotificationRepository notifRepo;
    @Autowired private StudentMarkRepository studentMarkRepo;

    @GetMapping("/timetable")
    public List<Timetable> getMyTimetable(@RequestParam String grade, @RequestParam String section) {
        return timetableRepo.findByGradeAndSection(grade, section);
    }

    @GetMapping("/marks")
    public List<StudentMark> getMyMarks(@RequestParam String name) {
        return studentMarkRepo.findByStudentName(name);
    }

    @GetMapping("/attendance")
    public List<Attendance> getMyAttendance(@RequestParam String name) {
        return attendanceRepo.findByStudentName(name);
    }

    @GetMapping("/notifications")
    public List<Notification> getNotifications(@RequestParam(defaultValue = "STUDENT") String role) {
        return notifRepo.findByTargetRoleOrTargetUser(role, role);
    }
}
