package com.smartclass.backend.controllers;

import com.smartclass.backend.models.*;
import com.smartclass.backend.repositories.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/admin")
@CrossOrigin(origins = "*")
public class AdminController {

    @Autowired private TeacherRepository teacherRepo;
    @Autowired private StudentRepository studentRepo;
    @Autowired private ClassroomRepository classroomRepo;
    @Autowired private SubjectRepository subjectRepo;
    @Autowired private DepartmentRepository departmentRepo;
    @Autowired private TimetableRepository timetableRepo;
    @Autowired private AttendanceRepository attendanceRepo;
    @Autowired private NotificationRepository notificationRepo;
    @Autowired private AIRecommendationRepository aiRepo;

    // Teachers CRUD
    @GetMapping("/teachers")
    public List<Teacher> getTeachers() { return teacherRepo.findAll(); }
    @PostMapping("/teachers")
    public Teacher addTeacher(@RequestBody Teacher t) { return teacherRepo.save(t); }
    @PutMapping("/teachers/{id}")
    public Teacher updateTeacher(@PathVariable Long id, @RequestBody Teacher t) {
        t.setId(id); return teacherRepo.save(t);
    }
    @DeleteMapping("/teachers/{id}")
    public void deleteTeacher(@PathVariable Long id) { teacherRepo.deleteById(id); }

    // Students CRUD
    @GetMapping("/students")
    public List<Student> getStudents() { return studentRepo.findAll(); }
    @PostMapping("/students")
    public Student addStudent(@RequestBody Student s) { return studentRepo.save(s); }
    @PutMapping("/students/{id}")
    public Student updateStudent(@PathVariable Long id, @RequestBody Student s) {
        s.setId(id); return studentRepo.save(s);
    }
    @DeleteMapping("/students/{id}")
    public void deleteStudent(@PathVariable Long id) { studentRepo.deleteById(id); }

    // Classrooms CRUD
    @GetMapping("/classrooms")
    public List<Classroom> getClassrooms() { return classroomRepo.findAll(); }
    @PostMapping("/classrooms")
    public Classroom addClassroom(@RequestBody Classroom c) { return classroomRepo.save(c); }
    @PutMapping("/classrooms/{id}")
    public Classroom updateClassroom(@PathVariable Long id, @RequestBody Classroom c) {
        c.setId(id); return classroomRepo.save(c);
    }
    @DeleteMapping("/classrooms/{id}")
    public void deleteClassroom(@PathVariable Long id) { classroomRepo.deleteById(id); }

    // Subjects CRUD
    @GetMapping("/subjects")
    public List<Subject> getSubjects() { return subjectRepo.findAll(); }
    @PostMapping("/subjects")
    public Subject addSubject(@RequestBody Subject s) { return subjectRepo.save(s); }
    @DeleteMapping("/subjects/{id}")
    public void deleteSubject(@PathVariable Long id) { subjectRepo.deleteById(id); }

    // Departments CRUD
    @GetMapping("/departments")
    public List<Department> getDepartments() { return departmentRepo.findAll(); }
    @PostMapping("/departments")
    public Department addDepartment(@RequestBody Department d) { return departmentRepo.save(d); }
    @DeleteMapping("/departments/{id}")
    public void deleteDepartment(@PathVariable Long id) { departmentRepo.deleteById(id); }

    // Timetable
    @GetMapping("/timetable")
    public List<Timetable> getTimetable() { return timetableRepo.findAll(); }
    @PostMapping("/timetable")
    public Timetable addTimetable(@RequestBody Timetable t) { return timetableRepo.save(t); }
    @DeleteMapping("/timetable/{id}")
    public void deleteTimetable(@PathVariable Long id) { timetableRepo.deleteById(id); }

    // Attendance
    @GetMapping("/attendance")
    public List<Attendance> getAttendance() { return attendanceRepo.findAll(); }
    @PostMapping("/attendance")
    public Attendance markAttendance(@RequestBody Attendance a) { return attendanceRepo.save(a); }

    // Notifications
    @GetMapping("/notifications")
    public List<Notification> getNotifications() { return notificationRepo.findAll(); }
    @PostMapping("/notifications")
    public Notification addNotification(@RequestBody Notification n) { return notificationRepo.save(n); }

    // AI Recommendations
    @GetMapping("/recommendations")
    public List<AIRecommendation> getRecommendations() { return aiRepo.findAll(); }

    // Dashboard Stats
    @GetMapping("/dashboard")
    public ResponseEntity<?> getDashboard() {
        Map<String, Object> stats = new HashMap<>();
        stats.put("totalStudents", studentRepo.count());
        stats.put("totalTeachers", teacherRepo.count());
        stats.put("totalClassrooms", classroomRepo.count());
        stats.put("totalSubjects", subjectRepo.count());
        stats.put("totalDepartments", departmentRepo.count());
        stats.put("totalTimetableEntries", timetableRepo.count());
        long totalAtt = attendanceRepo.count();
        long presentAtt = attendanceRepo.findAll().stream().filter(a -> Boolean.TRUE.equals(a.getPresent())).count();
        stats.put("attendancePercentage", totalAtt > 0 ? Math.round((double) presentAtt / totalAtt * 100) : 0);
        stats.put("availableRooms", classroomRepo.findAll().stream().filter(c -> Boolean.TRUE.equals(c.getAvailable())).count());
        return ResponseEntity.ok(stats);
    }
}
