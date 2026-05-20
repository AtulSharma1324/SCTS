package com.smartclass.backend.config;

import com.smartclass.backend.models.*;
import com.smartclass.backend.repositories.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
public class DataSeeder implements CommandLineRunner {

    @Autowired private UserRepository userRepo;
    @Autowired private TeacherRepository teacherRepo;
    @Autowired private StudentRepository studentRepo;
    @Autowired private SubjectRepository subjectRepo;
    @Autowired private DepartmentRepository deptRepo;
    @Autowired private ClassroomRepository classroomRepo;
    @Autowired private NotificationRepository notifRepo;
    @Autowired private AIRecommendationRepository aiRepo;
    @Autowired private PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        // Default users
        if (userRepo.count() == 0) {
            userRepo.save(new User("Admin User", "admin@smart.edu", passwordEncoder.encode("admin123"), "ADMIN"));
            userRepo.save(new User("Dr. Sarah Johnson", "sarah@smart.edu", passwordEncoder.encode("teacher123"), "TEACHER"));
            userRepo.save(new User("Prof. Raj Patel", "raj@smart.edu", passwordEncoder.encode("teacher123"), "TEACHER"));
            userRepo.save(new User("Atul Sharma", "atul@smart.edu", passwordEncoder.encode("student123"), "STUDENT"));
            userRepo.save(new User("Priya Singh", "priya@smart.edu", passwordEncoder.encode("student123"), "STUDENT"));
        }

        // Departments
        if (deptRepo.count() == 0) {
            Department d1 = new Department(); d1.setName("Computer Science"); d1.setHead("Dr. Sarah Johnson"); d1.setBuilding("Block A"); deptRepo.save(d1);
            Department d2 = new Department(); d2.setName("Electronics"); d2.setHead("Prof. Raj Patel"); d2.setBuilding("Block B"); deptRepo.save(d2);
            Department d3 = new Department(); d3.setName("Mathematics"); d3.setHead("Dr. Meena Gupta"); d3.setBuilding("Block A"); deptRepo.save(d3);
            Department d4 = new Department(); d4.setName("Physics"); d4.setHead("Dr. Anil Kumar"); d4.setBuilding("Block C"); deptRepo.save(d4);
        }

        // Teachers
        if (teacherRepo.count() == 0) {
            String[][] teachers = {
                {"Dr. Sarah Johnson", "sarah@smart.edu", "Computer Science", "AI & Machine Learning", "9876543210"},
                {"Prof. Raj Patel", "raj@smart.edu", "Electronics", "VLSI Design", "9876543211"},
                {"Dr. Meena Gupta", "meena@smart.edu", "Mathematics", "Applied Mathematics", "9876543212"},
                {"Dr. Anil Kumar", "anil@smart.edu", "Physics", "Quantum Mechanics", "9876543213"},
                {"Prof. Kavita Sharma", "kavita@smart.edu", "Computer Science", "Data Structures", "9876543214"},
                {"Dr. Vikram Rao", "vikram@smart.edu", "Electronics", "Signal Processing", "9876543215"}
            };
            for (String[] t : teachers) {
                Teacher teacher = new Teacher();
                teacher.setName(t[0]); teacher.setEmail(t[1]); teacher.setDepartment(t[2]);
                teacher.setSpecialization(t[3]); teacher.setPhone(t[4]);
                teacherRepo.save(teacher);
            }
        }

        // Students
        if (studentRepo.count() == 0) {
            String[][] students = {
                {"Atul Sharma", "atul@smart.edu", "1st Year", "A", "Computer Science"},
                {"Priya Singh", "priya@smart.edu", "1st Year", "A", "Computer Science"},
                {"Rahul Kumar", "rahul@smart.edu", "1st Year", "B", "Electronics"},
                {"Sneha Joshi", "sneha@smart.edu", "2nd Year", "A", "Computer Science"},
                {"Amit Verma", "amit@smart.edu", "2nd Year", "B", "Mathematics"},
                {"Neha Gupta", "neha@smart.edu", "3rd Year", "A", "Physics"},
                {"Ravi Teja", "ravi@smart.edu", "3rd Year", "A", "Computer Science"},
                {"Divya Patel", "divya@smart.edu", "2nd Year", "A", "Electronics"},
                {"Karan Singh", "karan@smart.edu", "1st Year", "A", "Mathematics"},
                {"Ananya Reddy", "ananya@smart.edu", "3rd Year", "B", "Computer Science"}
            };
            for (String[] s : students) {
                Student student = new Student();
                student.setName(s[0]); student.setEmail(s[1]); student.setGrade(s[2]);
                student.setSection(s[3]); student.setDepartment(s[4]);
                studentRepo.save(student);
            }
        }

        // Subjects
        if (subjectRepo.count() == 0) {
            String[][] subjects = {
                {"Data Structures", "CS201", "Computer Science", "4"},
                {"Algorithms", "CS301", "Computer Science", "4"},
                {"Machine Learning", "CS401", "Computer Science", "3"},
                {"Digital Electronics", "EC201", "Electronics", "4"},
                {"Signal Processing", "EC301", "Electronics", "3"},
                {"Linear Algebra", "MA201", "Mathematics", "3"},
                {"Calculus", "MA101", "Mathematics", "4"},
                {"Quantum Physics", "PH301", "Physics", "3"},
                {"Database Systems", "CS202", "Computer Science", "4"},
                {"Computer Networks", "CS302", "Computer Science", "3"}
            };
            for (String[] s : subjects) {
                Subject subject = new Subject();
                subject.setName(s[0]); subject.setCode(s[1]); subject.setDepartment(s[2]);
                subject.setCredits(Integer.parseInt(s[3]));
                subjectRepo.save(subject);
            }
        }

        // Classrooms
        if (classroomRepo.count() == 0) {
            Object[][] rooms = {
                {"Room 101", 60, "LECTURE", "Block A", 1, true},
                {"Room 102", 60, "LECTURE", "Block A", 1, true},
                {"Room 201", 45, "LECTURE", "Block A", 2, true},
                {"Room 202", 45, "LECTURE", "Block A", 2, false},
                {"Lab A1", 30, "LAB", "Block B", 1, true},
                {"Lab A2", 30, "LAB", "Block B", 1, true},
                {"Lab B1", 25, "LAB", "Block B", 2, false},
                {"Seminar Hall", 120, "SEMINAR", "Block C", 1, true},
                {"Room 301", 50, "LECTURE", "Block C", 3, true},
                {"Room 302", 40, "LECTURE", "Block C", 3, true}
            };
            for (Object[] r : rooms) {
                Classroom c = new Classroom();
                c.setName((String) r[0]); c.setCapacity((Integer) r[1]); c.setRoomType((String) r[2]);
                c.setBuilding((String) r[3]); c.setFloor((Integer) r[4]); c.setAvailable((Boolean) r[5]);
                classroomRepo.save(c);
            }
        }

        // Notifications
        if (notifRepo.count() == 0) {
            String[][] notifs = {
                {"ADMIN", "AI Schedule optimizer ready. Click Generate to create an optimal timetable.", "INFO"},
                {"TEACHER", "Your teaching schedule for Spring 2026 is being optimized by AI.", "INFO"},
                {"STUDENT", "Smart timetable will be published soon. Stay tuned!", "INFO"},
                {"ADMIN", "3 classrooms need maintenance review before next semester.", "WARNING"},
                {"TEACHER", "New AI-powered attendance tracking is now available.", "SUCCESS"}
            };
            for (String[] n : notifs) {
                Notification notif = new Notification();
                notif.setTargetRole(n[0]); notif.setMessage(n[1]); notif.setType(n[2]);
                notifRepo.save(notif);
            }
        }

        // AI Recommendations
        if (aiRepo.count() == 0) {
            String[][] recs = {
                {"SCHEDULE", "Reduce Teacher Fatigue", "Dr. Sarah Johnson has 4 consecutive lectures on Tuesday. Suggest inserting a 30-min break.", "HIGH"},
                {"ROOM", "Optimize Lab Usage", "Lab B1 is under-maintenance but Lab A2 has 40% idle time. Redirect Lab B1 classes.", "MEDIUM"},
                {"ATTENDANCE", "Low Attendance Alert", "Physics 301 showing declining attendance on Friday afternoons. Consider rescheduling.", "HIGH"},
                {"WORKLOAD", "Balance Workload", "Prof. Raj Patel teaches 18 hours/week vs average 12. Redistribute 2 sections.", "HIGH"},
                {"ROOM", "Room Capacity Warning", "Room 201 assigned 55 students but capacity is 45. Move to Room 101.", "MEDIUM"}
            };
            for (String[] r : recs) {
                AIRecommendation rec = new AIRecommendation();
                rec.setType(r[0]); rec.setTitle(r[1]); rec.setMessage(r[2]); rec.setPriority(r[3]);
                aiRepo.save(rec);
            }
        }

        System.out.println("========================================");
        System.out.println("  Smart Classroom Data Seeded!");
        System.out.println("  Login Credentials:");
        System.out.println("  Admin:   admin@smart.edu / admin123");
        System.out.println("  Teacher: sarah@smart.edu / teacher123");
        System.out.println("  Student: atul@smart.edu  / student123");
        System.out.println("========================================");
    }
}
