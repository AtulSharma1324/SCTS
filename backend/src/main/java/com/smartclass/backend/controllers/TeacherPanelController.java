package com.smartclass.backend.controllers;

import com.smartclass.backend.models.*;
import com.smartclass.backend.repositories.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/teacher")
@CrossOrigin(origins = "*")
public class TeacherPanelController {

    @Autowired private TimetableRepository timetableRepo;
    @Autowired private AttendanceRepository attendanceRepo;
    @Autowired private NotificationRepository notifRepo;
    @Autowired private AIRecommendationRepository aiRepo;
    @Autowired private StudentMarkRepository studentMarkRepo;

    @GetMapping("/timetable")
    public List<Timetable> getMyTimetable(@RequestParam String name) {
        return timetableRepo.findByTeacherName(name);
    }

    @GetMapping("/subjects-taught")
    public List<String> getSubjectsTaught(@RequestParam String teacherName) {
        return timetableRepo.findByTeacherName(teacherName).stream()
            .map(Timetable::getSubjectName)
            .distinct()
            .sorted()
            .collect(java.util.stream.Collectors.toList());
    }

    @GetMapping("/marks")
    public List<StudentMark> getUploadedMarks(@RequestParam String teacherName) {
        return studentMarkRepo.findByTeacherName(teacherName);
    }

    @PostMapping("/marks")
    public org.springframework.http.ResponseEntity<?> uploadMark(@RequestBody StudentMark mark) {
        boolean teaches = timetableRepo.findByTeacherName(mark.getTeacherName()).stream()
            .anyMatch(t -> t.getSubjectName().equalsIgnoreCase(mark.getSubjectName()));

        if (!teaches) {
            return org.springframework.http.ResponseEntity.badRequest()
                .body(java.util.Map.of("error", "You can only upload marks for subjects you teach (" + mark.getSubjectName() + ")."));
        }

        StudentMark saved = studentMarkRepo.save(mark);

        try {
            Notification notif = new Notification();
            notif.setTargetUser(mark.getStudentName());
            notif.setTargetRole("STUDENT");
            notif.setMessage("New marks uploaded for " + mark.getSubjectName() + " (" + mark.getExamType() + "): " + mark.getMarksObtained() + "/" + mark.getMaxMarks());
            notif.setType("SUCCESS");
            notifRepo.save(notif);
        } catch (Exception e) {
            // Gracefully ignore notification failure
        }

        return org.springframework.http.ResponseEntity.ok(saved);
    }

    @DeleteMapping("/marks/{id}")
    public org.springframework.http.ResponseEntity<?> deleteMark(@PathVariable Long id) {
        if (studentMarkRepo.existsById(id)) {
            studentMarkRepo.deleteById(id);
            return org.springframework.http.ResponseEntity.ok(java.util.Map.of("success", true));
        } else {
            return org.springframework.http.ResponseEntity.notFound().build();
        }
    }

    @GetMapping("/attendance")
    public List<Attendance> getMyAttendance(@RequestParam String name) {
        return attendanceRepo.findByTeacherName(name);
    }

    @PostMapping("/attendance")
    public Attendance markAttendance(@RequestBody Attendance a) {
        return attendanceRepo.save(a);
    }

    @GetMapping("/notifications")
    public List<Notification> getNotifications(@RequestParam(defaultValue = "TEACHER") String role) {
        return notifRepo.findByTargetRoleOrTargetUser(role, role);
    }

    @GetMapping("/recommendations")
    public List<AIRecommendation> getRecommendations() {
        return aiRepo.findAll();
    }
}
