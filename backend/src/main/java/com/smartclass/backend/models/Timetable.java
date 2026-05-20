package com.smartclass.backend.models;

import jakarta.persistence.*;

@Entity
@Table(name = "timetables")
public class Timetable {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String subjectName;
    private String teacherName;
    private String classroomName;
    private String dayOfWeek;
    private String startTime;
    private String endTime;
    private String grade;
    private String section;
    private String semester;

    private String originalTeacherName;
    private Boolean isSubstituted = false;

    public Timetable() {}
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getSubjectName() { return subjectName; }
    public void setSubjectName(String subjectName) { this.subjectName = subjectName; }
    public String getTeacherName() { return teacherName; }
    public void setTeacherName(String teacherName) { this.teacherName = teacherName; }
    public String getClassroomName() { return classroomName; }
    public void setClassroomName(String classroomName) { this.classroomName = classroomName; }
    public String getDayOfWeek() { return dayOfWeek; }
    public void setDayOfWeek(String dayOfWeek) { this.dayOfWeek = dayOfWeek; }
    public String getStartTime() { return startTime; }
    public void setStartTime(String startTime) { this.startTime = startTime; }
    public String getEndTime() { return endTime; }
    public void setEndTime(String endTime) { this.endTime = endTime; }
    public String getGrade() { return grade; }
    public void setGrade(String grade) { this.grade = grade; }
    public String getSection() { return section; }
    public void setSection(String section) { this.section = section; }
    public String getSemester() { return semester; }
    public void setSemester(String semester) { this.semester = semester; }
    public String getOriginalTeacherName() { return originalTeacherName; }
    public void setOriginalTeacherName(String originalTeacherName) { this.originalTeacherName = originalTeacherName; }
    public Boolean getIsSubstituted() { return isSubstituted != null ? isSubstituted : false; }
    public void setIsSubstituted(Boolean isSubstituted) { this.isSubstituted = isSubstituted; }
}
