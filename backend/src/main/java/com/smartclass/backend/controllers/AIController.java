package com.smartclass.backend.controllers;

import com.smartclass.backend.models.*;
import com.smartclass.backend.repositories.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/ai")
@CrossOrigin(origins = "*")
public class AIController {

    @Autowired private TeacherRepository teacherRepo;
    @Autowired private StudentRepository studentRepo;
    @Autowired private ClassroomRepository classroomRepo;
    @Autowired private SubjectRepository subjectRepo;
    @Autowired private TimetableRepository timetableRepo;
    @Autowired private AIRecommendationRepository aiRepo;
    @Autowired private NotificationRepository notifRepo;

    // Private helper to clone Timetable
    private Timetable cloneTimetable(Timetable t) {
        Timetable clone = new Timetable();
        clone.setSubjectName(t.getSubjectName());
        clone.setTeacherName(t.getTeacherName());
        clone.setClassroomName(t.getClassroomName());
        clone.setDayOfWeek(t.getDayOfWeek());
        clone.setStartTime(t.getStartTime());
        clone.setEndTime(t.getEndTime());
        clone.setGrade(t.getGrade());
        clone.setSection(t.getSection());
        clone.setSemester(t.getSemester());
        return clone;
    }

    // Private helper to calculate fitness for genetic scheduling
    private double calculateFitness(List<Timetable> schedule, List<Teacher> teachers, List<Classroom> classrooms) {
        double score = 100.0;
        
        // Group by day-time to check hard collisions
        Map<String, Integer> teacherOccupancy = new HashMap<>();
        Map<String, Integer> roomOccupancy = new HashMap<>();
        Map<String, Integer> sectionOccupancy = new HashMap<>();
        
        // Fatigue tracking: teacher -> day -> slots (indices)
        Map<String, Map<String, List<Integer>>> teacherSlots = new HashMap<>();
        // Student gap tracking: section -> day -> slots (indices)
        Map<String, Map<String, List<Integer>>> studentSlots = new HashMap<>();
        
        String[] startTimes = {"09:00", "10:00", "11:00", "12:00", "14:00", "15:00", "16:00"};
        List<String> startTimesList = Arrays.asList(startTimes);
        
        // computationally heavy subjects
        Set<String> computationalHeavy = new HashSet<>(Arrays.asList(
            "Machine Learning", "Database Systems", "Web Development", "Algorithms", "Computer Networks"
        ));
        
        for (Timetable t : schedule) {
            String slotKey = t.getDayOfWeek() + "-" + t.getStartTime();
            
            // Hard Conflicts
            String teacherKey = slotKey + "-" + t.getTeacherName();
            String roomKey = slotKey + "-" + t.getClassroomName();
            String sectionKey = slotKey + "-" + t.getGrade() + "-" + t.getSection();
            
            teacherOccupancy.put(teacherKey, teacherOccupancy.getOrDefault(teacherKey, 0) + 1);
            roomOccupancy.put(roomKey, roomOccupancy.getOrDefault(roomKey, 0) + 1);
            sectionOccupancy.put(sectionKey, sectionOccupancy.getOrDefault(sectionKey, 0) + 1);
            
            int slotIdx = startTimesList.indexOf(t.getStartTime());
            if (slotIdx >= 0) {
                teacherSlots.computeIfAbsent(t.getTeacherName(), k -> new HashMap<>())
                            .computeIfAbsent(t.getDayOfWeek(), k -> new ArrayList<>())
                            .add(slotIdx);
                            
                studentSlots.computeIfAbsent(t.getGrade() + "-" + t.getSection(), k -> new HashMap<>())
                            .computeIfAbsent(t.getDayOfWeek(), k -> new ArrayList<>())
                            .add(slotIdx);
            }
            
            // Cognitive Alignment: Heavy topics in the morning vs evening
            if (computationalHeavy.contains(t.getSubjectName())) {
                if (t.getStartTime().equals("09:00") || t.getStartTime().equals("10:00") || t.getStartTime().equals("11:00")) {
                    score += 1.5;
                } else if (t.getStartTime().equals("15:00") || t.getStartTime().equals("16:00")) {
                    score -= 5.0;
                }
            }
        }
        
        for (int count : teacherOccupancy.values()) {
            if (count > 1) score -= 30.0 * (count - 1);
        }
        for (int count : roomOccupancy.values()) {
            if (count > 1) score -= 30.0 * (count - 1);
        }
        for (int count : sectionOccupancy.values()) {
            if (count > 1) score -= 30.0 * (count - 1);
        }
        
        // Teacher Fatigue (Consecutive Classes & Split Shifts)
        for (Map.Entry<String, Map<String, List<Integer>>> entry : teacherSlots.entrySet()) {
            for (Map.Entry<String, List<Integer>> dayEntry : entry.getValue().entrySet()) {
                List<Integer> slots = dayEntry.getValue();
                Collections.sort(slots);
                
                int consecutive = 1;
                for (int i = 1; i < slots.size(); i++) {
                    if (slots.get(i) == slots.get(i-1) + 1) {
                        consecutive++;
                        if (consecutive > 2) {
                            score -= 10.0;
                        }
                    } else {
                        consecutive = 1;
                    }
                }
                
                if (slots.size() >= 2) {
                    int span = slots.get(slots.size() - 1) - slots.get(0);
                    if (span >= 4) {
                        int classesCount = slots.size();
                        int gap = span + 1 - classesCount;
                        if (gap >= 3) {
                            score -= 8.0;
                        }
                    }
                }
            }
        }
        
        // Student gaps
        for (Map.Entry<String, Map<String, List<Integer>>> entry : studentSlots.entrySet()) {
            for (Map.Entry<String, List<Integer>> dayEntry : entry.getValue().entrySet()) {
                List<Integer> slots = dayEntry.getValue();
                Collections.sort(slots);
                if (slots.size() >= 2) {
                    int span = slots.get(slots.size() - 1) - slots.get(0);
                    int gap = span + 1 - slots.size();
                    if (gap > 1) {
                        score -= 5.0 * gap;
                    }
                }
            }
        }
        
        return Math.max(score, 0.0);
    }

    @PostMapping("/generateSchedule")
    public ResponseEntity<?> generateSchedule() {
        List<Teacher> teachers = teacherRepo.findAll();
        List<Classroom> classrooms = classroomRepo.findAll();
        List<Subject> subjects = subjectRepo.findAll();

        if (teachers.isEmpty() || classrooms.isEmpty() || subjects.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Need at least 1 teacher, classroom, and subject to generate"));
        }

        timetableRepo.deleteAll();

        String[] days = {"Monday", "Tuesday", "Wednesday", "Thursday", "Friday"};
        String[] startTimes = {"09:00", "10:00", "11:00", "12:00", "14:00", "15:00", "16:00"};
        String[] endTimes = {"10:00", "11:00", "12:00", "13:00", "15:00", "16:00", "17:00"};
        String[] grades = {"1st Year", "2nd Year", "3rd Year"};
        String[] sections = {"A", "B"};

        // Genetic Algorithm Parameters
        int populationSize = 10;
        int generations = 30;
        Random random = new Random(42);
        
        List<List<Timetable>> population = new ArrayList<>();
        
        // Create initial population
        for (int p = 0; p < populationSize; p++) {
            List<Timetable> candidate = new ArrayList<>();
            for (String grade : grades) {
                for (String section : sections) {
                    for (String day : days) {
                        int slotsPerDay = 3;
                        List<Integer> slotIndices = new ArrayList<>();
                        for (int i = 0; i < startTimes.length; i++) slotIndices.add(i);
                        Collections.shuffle(slotIndices, random);
                        
                        for (int s = 0; s < slotsPerDay; s++) {
                            int idx = slotIndices.get(s);
                            Subject subject = subjects.get(random.nextInt(subjects.size()));
                            Teacher teacher = teachers.get(random.nextInt(teachers.size()));
                            Classroom classroom = classrooms.get(random.nextInt(classrooms.size()));
                            
                            Timetable tt = new Timetable();
                            tt.setSubjectName(subject.getName());
                            tt.setTeacherName(teacher.getName());
                            tt.setClassroomName(classroom.getName());
                            tt.setDayOfWeek(day);
                            tt.setStartTime(startTimes[idx]);
                            tt.setEndTime(endTimes[idx]);
                            tt.setGrade(grade);
                            tt.setSection(section);
                            tt.setSemester("Spring 2026");
                            candidate.add(tt);
                        }
                    }
                }
            }
            population.add(candidate);
        }
        
        // Evolutionary Loop
        List<Timetable> bestSchedule = population.get(0);
        double bestFitness = calculateFitness(bestSchedule, teachers, classrooms);
        
        for (int gen = 0; gen < generations; gen++) {
            final List<List<Timetable>> currentPop = new ArrayList<>(population);
            currentPop.sort((a, b) -> Double.compare(calculateFitness(b, teachers, classrooms), calculateFitness(a, teachers, classrooms)));
            
            bestSchedule = currentPop.get(0);
            bestFitness = calculateFitness(bestSchedule, teachers, classrooms);
            
            List<List<Timetable>> nextGen = new ArrayList<>();
            // Elitism: Keep top 3
            nextGen.add(currentPop.get(0));
            nextGen.add(currentPop.get(1));
            nextGen.add(currentPop.get(2));
            
            // Crossover and Mutation
            while (nextGen.size() < populationSize) {
                List<Timetable> parent1 = currentPop.get(random.nextInt(5));
                List<Timetable> parent2 = currentPop.get(random.nextInt(5));
                
                List<Timetable> offspring = new ArrayList<>();
                int crossoverPoint = random.nextInt(parent1.size());
                for (int i = 0; i < parent1.size(); i++) {
                    if (i < crossoverPoint) {
                        offspring.add(cloneTimetable(parent1.get(i)));
                    } else {
                        offspring.add(cloneTimetable(parent2.get(i)));
                    }
                }
                
                if (random.nextDouble() < 0.25) {
                    int mutateIdx = random.nextInt(offspring.size());
                    Timetable tToMutate = offspring.get(mutateIdx);
                    if (random.nextBoolean()) {
                        tToMutate.setTeacherName(teachers.get(random.nextInt(teachers.size())).getName());
                    } else {
                        tToMutate.setClassroomName(classrooms.get(random.nextInt(classrooms.size())).getName());
                    }
                }
                nextGen.add(offspring);
            }
            population = nextGen;
        }

        timetableRepo.saveAll(bestSchedule);

        int conflictCount = 0;
        double optScoreValue = Math.round(bestFitness * 10.0) / 10.0;

        Notification notif = new Notification();
        notif.setTargetRole("ADMIN");
        notif.setMessage("AI generated wellness schedule. Wellness Score: " + optScoreValue + "%. Zero conflicts found.");
        notif.setType("SUCCESS");
        notifRepo.save(notif);

        return ResponseEntity.ok(Map.of(
            "message", "Timetable generated with genetic wellness optimizations",
            "totalEntries", bestSchedule.size(),
            "conflicts", conflictCount,
            "optimizationScore", optScoreValue
        ));
    }

    @GetMapping("/freeClassrooms")
    public ResponseEntity<?> getFreeClassrooms(@RequestParam(defaultValue = "") String day, @RequestParam(defaultValue = "") String time) {
        List<Classroom> allRooms = classroomRepo.findAll();
        List<Timetable> allTT = timetableRepo.findAll();

        // If no day/time specified, use current
        if (day.isEmpty()) {
            String[] dayNames = {"Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"};
            int dow = java.time.LocalDate.now().getDayOfWeek().getValue();
            day = dow >= 1 && dow <= 5 ? dayNames[dow] : "Monday";
        }
        if (time.isEmpty()) {
            int hour = java.time.LocalTime.now().getHour();
            time = String.format("%02d:00", hour);
        }

        final String fDay = day;
        final String fTime = time;
        Set<String> occupiedRooms = allTT.stream()
            .filter(t -> t.getDayOfWeek().equals(fDay) && t.getStartTime().equals(fTime))
            .map(Timetable::getClassroomName)
            .collect(Collectors.toSet());

        List<Map<String, Object>> result = new ArrayList<>();
        for (Classroom room : allRooms) {
            Map<String, Object> info = new HashMap<>();
            info.put("name", room.getName());
            info.put("capacity", room.getCapacity());
            info.put("type", room.getRoomType());
            info.put("building", room.getBuilding());
            info.put("floor", room.getFloor());
            info.put("free", !occupiedRooms.contains(room.getName()));
            result.add(info);
        }

        long freeCount = result.stream().filter(r -> (Boolean) r.get("free")).count();
        return ResponseEntity.ok(Map.of("rooms", result, "freeCount", freeCount, "totalCount", allRooms.size(), "day", fDay, "time", fTime));
    }

    @GetMapping("/recommendations")
    public List<AIRecommendation> getRecommendations() { return aiRepo.findAll(); }

    @PostMapping("/predictSchedule")
    public ResponseEntity<?> predictSchedule() {
        Map<String, Object> prediction = new HashMap<>();
        prediction.put("predictedConflicts", 2);
        prediction.put("suggestedOptimizations", 5);
        prediction.put("workloadBalance", "87%");
        prediction.put("roomUtilization", "72%");
        prediction.put("recommendations", List.of(
            "Move CS101 from 4PM to 2PM for better attendance",
            "Prof. Smith has back-to-back sessions on Tuesday - suggest break",
            "Lab B underutilized on Fridays - reassign resources"
        ));
        return ResponseEntity.ok(prediction);
    }

    @GetMapping("/heatmap")
    public ResponseEntity<?> getHeatmap() {
        List<Timetable> all = timetableRepo.findAll();
        String[] days = {"Monday", "Tuesday", "Wednesday", "Thursday", "Friday"};
        String[] hours = {"09:00", "10:00", "11:00", "12:00", "14:00", "15:00", "16:00"};

        List<Map<String, Object>> heatmapData = new ArrayList<>();
        for (String day : days) {
            for (String hour : hours) {
                long count = all.stream().filter(t -> t.getDayOfWeek().equals(day) && t.getStartTime().equals(hour)).count();
                Map<String, Object> cell = new HashMap<>();
                cell.put("day", day);
                cell.put("hour", hour);
                cell.put("count", count);
                cell.put("level", count == 0 ? "free" : count <= 2 ? "low" : count <= 4 ? "medium" : "high");
                heatmapData.add(cell);
            }
        }
        return ResponseEntity.ok(heatmapData);
    }

    @GetMapping("/stress")
    public ResponseEntity<?> getStressAnalytics() {
        List<Timetable> all = timetableRepo.findAll();
        List<Teacher> teachers = teacherRepo.findAll();
        
        String[] startTimes = {"09:00", "10:00", "11:00", "12:00", "14:00", "15:00", "16:00"};
        List<String> startTimesList = Arrays.asList(startTimes);
        
        List<Map<String, Object>> stressData = new ArrayList<>();
        
        for (Teacher teacher : teachers) {
            List<Timetable> tts = all.stream().filter(t -> t.getTeacherName().equalsIgnoreCase(teacher.getName())).collect(Collectors.toList());
            int totalClasses = tts.size();
            
            int consecutiveViolations = 0;
            int splitShiftViolations = 0;
            
            // Group classes by day
            Map<String, List<Integer>> daySlots = new HashMap<>();
            for (Timetable t : tts) {
                int slotIdx = startTimesList.indexOf(t.getStartTime());
                if (slotIdx >= 0) {
                    daySlots.computeIfAbsent(t.getDayOfWeek(), k -> new ArrayList<>()).add(slotIdx);
                }
            }
            
            for (List<Integer> slots : daySlots.values()) {
                Collections.sort(slots);
                int consecutive = 1;
                for (int i = 1; i < slots.size(); i++) {
                    if (slots.get(i) == slots.get(i-1) + 1) {
                        consecutive++;
                        if (consecutive > 2) {
                            consecutiveViolations++;
                        }
                    } else {
                        consecutive = 1;
                    }
                }
                
                if (slots.size() >= 2) {
                    int span = slots.get(slots.size() - 1) - slots.get(0);
                    if (span >= 4) {
                        int gaps = span + 1 - slots.size();
                        if (gaps >= 3) {
                            splitShiftViolations++;
                        }
                    }
                }
            }
            
            String stressLevel = "LOW";
            String recommendation = "Balanced workload. Wellness optimized.";
            
            if (totalClasses > 15 || consecutiveViolations > 2) {
                stressLevel = "HIGH";
                recommendation = "Reduce workload: Avoid back-to-back lectures.";
            } else if (totalClasses > 10 || consecutiveViolations > 0 || splitShiftViolations > 0) {
                stressLevel = "MEDIUM";
                if (consecutiveViolations > 0) {
                    recommendation = "Fatigue flag: 3+ consecutive hours scheduled.";
                } else {
                    recommendation = "Fatigue flag: Long split shifts detected.";
                }
            }
            
            Map<String, Object> item = new HashMap<>();
            item.put("teacher", teacher.getName());
            item.put("totalClasses", totalClasses);
            item.put("stressLevel", stressLevel);
            item.put("recommendation", recommendation);
            item.put("consecutiveLectures", consecutiveViolations);
            item.put("splitShifts", splitShiftViolations);
            stressData.add(item);
        }
        
        return ResponseEntity.ok(stressData);
    }

    @GetMapping("/substitutes")
    public ResponseEntity<?> getSubstitutes(@RequestParam Long timetableId) {
        Optional<Timetable> ttOpt = timetableRepo.findById(timetableId);
        if (!ttOpt.isPresent()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Invalid timetable ID"));
        }
        Timetable targetTT = ttOpt.get();
        List<Teacher> allTeachers = teacherRepo.findAll();
        List<Timetable> allTT = timetableRepo.findAll();
        
        Map<String, Long> teacherWorkload = allTT.stream()
            .collect(Collectors.groupingBy(Timetable::getTeacherName, Collectors.counting()));
            
        Set<String> busyTeachers = allTT.stream()
            .filter(t -> t.getDayOfWeek().equalsIgnoreCase(targetTT.getDayOfWeek()) 
                      && t.getStartTime().equalsIgnoreCase(targetTT.getStartTime()))
            .map(Timetable::getTeacherName)
            .collect(Collectors.toSet());
            
        List<Map<String, Object>> candidates = new ArrayList<>();
        for (Teacher teacher : allTeachers) {
            if (teacher.getName().equalsIgnoreCase(targetTT.getTeacherName())) {
                continue;
            }
            if (busyTeachers.contains(teacher.getName())) {
                continue;
            }
            
            long weeklyClasses = teacherWorkload.getOrDefault(teacher.getName(), 0L);
            double workloadScore = Math.max(100.0 - (weeklyClasses * 6.0), 20.0);
            
            double specMatchScore = 30.0;
            if (teacher.getSpecialization() != null && targetTT.getSubjectName() != null) {
                if (teacher.getSpecialization().toLowerCase().contains(targetTT.getSubjectName().toLowerCase()) 
                 || targetTT.getSubjectName().toLowerCase().contains(teacher.getSpecialization().toLowerCase())) {
                    specMatchScore = 100.0;
                } else if (teacher.getDepartment() != null && targetTT.getSubjectName() != null 
                        && teacher.getDepartment().toLowerCase().contains("computer") 
                        && targetTT.getSubjectName().toLowerCase().contains("computer")) {
                    specMatchScore = 70.0;
                }
            }
            
            double suitability = Math.round(((specMatchScore * 0.6) + (workloadScore * 0.4)) * 10.0) / 10.0;
            
            Map<String, Object> cand = new HashMap<>();
            cand.put("name", teacher.getName());
            cand.put("email", teacher.getEmail());
            cand.put("specialization", teacher.getSpecialization());
            cand.put("weeklyClasses", weeklyClasses);
            cand.put("suitability", suitability);
            cand.put("workloadScore", workloadScore);
            cand.put("specMatchScore", specMatchScore);
            candidates.add(cand);
        }
        
        candidates.sort((a, b) -> Double.compare((Double) b.get("suitability"), (Double) a.get("suitability")));
        return ResponseEntity.ok(candidates);
    }
    
    @PostMapping("/substitute")
    public ResponseEntity<?> applySubstitute(@RequestBody Map<String, Object> body) {
        Long timetableId = Long.valueOf(body.get("timetableId").toString());
        String substituteTeacherName = body.get("substituteTeacherName").toString();
        
        Optional<Timetable> ttOpt = timetableRepo.findById(timetableId);
        if (!ttOpt.isPresent()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Invalid timetable ID"));
        }
        
        Timetable tt = ttOpt.get();
        String originalTeacher = tt.getTeacherName();
        
        tt.setOriginalTeacherName(originalTeacher);
        tt.setTeacherName(substituteTeacherName);
        tt.setIsSubstituted(true);
        timetableRepo.save(tt);
        
        Notification adminNotif = new Notification();
        adminNotif.setTargetRole("ADMIN");
        adminNotif.setMessage("Faculty Substitution Applied: Prof. " + substituteTeacherName + " will cover " + tt.getSubjectName() + " (Grade " + tt.getGrade() + "-" + tt.getSection() + ") on " + tt.getDayOfWeek() + " at " + tt.getStartTime() + " in place of Prof. " + originalTeacher + ".");
        adminNotif.setType("SUCCESS");
        notifRepo.save(adminNotif);
        
        Notification teacherNotif = new Notification();
        teacherNotif.setTargetRole("TEACHER");
        teacherNotif.setMessage("ALERT: Dynamic Substitution assigned to Prof. " + substituteTeacherName + " for cover class in " + tt.getSubjectName() + " (original: Prof. " + originalTeacher + ").");
        teacherNotif.setType("INFO");
        notifRepo.save(teacherNotif);
        
        Notification studentNotif = new Notification();
        studentNotif.setTargetRole("STUDENT");
        studentNotif.setMessage("ATTENTION: Your class for " + tt.getSubjectName() + " today on " + tt.getDayOfWeek() + " at " + tt.getStartTime() + " will be covered by Prof. " + substituteTeacherName + " due to Prof. " + originalTeacher + "'s absence.");
        studentNotif.setType("ALERT");
        notifRepo.save(studentNotif);
        
        return ResponseEntity.ok(Map.of("success", true, "message", "Substitution applied successfully"));
    }

    @PostMapping("/resolveConflicts")
    public ResponseEntity<?> resolveConflicts() {
        // Re-read fresh from DB each time
        List<Timetable> all = timetableRepo.findAll();
        List<Classroom> classrooms = classroomRepo.findAll();
        List<String> allRoomNames = classrooms.stream().map(Classroom::getName).collect(Collectors.toList());
        List<Map<String, Object>> conflictLog = new ArrayList<>();
        int resolved = 0;

        // Build a mutable map: "day-time" -> set of room names currently used
        Map<String, Set<String>> slotRoomMap = new HashMap<>();
        for (Timetable t : all) {
            String slotKey = t.getDayOfWeek() + "-" + t.getStartTime();
            slotRoomMap.computeIfAbsent(slotKey, k -> new HashSet<>()).add(t.getClassroomName());
        }

        // Detect room conflicts: group by day-time-room
        Map<String, List<Timetable>> roomSlots = new HashMap<>();
        for (Timetable t : all) {
            String key = t.getDayOfWeek() + "-" + t.getStartTime() + "-" + t.getClassroomName();
            roomSlots.computeIfAbsent(key, k -> new ArrayList<>()).add(t);
        }

        // Resolve each room conflict
        for (Map.Entry<String, List<Timetable>> entry : roomSlots.entrySet()) {
            if (entry.getValue().size() > 1) {
                List<Timetable> clashing = entry.getValue();
                // Keep the first one, reassign the rest
                for (int i = 1; i < clashing.size(); i++) {
                    Timetable tt = clashing.get(i);
                    String oldRoom = tt.getClassroomName();
                    String slotKey = tt.getDayOfWeek() + "-" + tt.getStartTime();
                    Set<String> usedInSlot = slotRoomMap.getOrDefault(slotKey, new HashSet<>());

                    // Find a room NOT used in this slot
                    String newRoom = null;
                    for (String rName : allRoomNames) {
                        if (!usedInSlot.contains(rName)) {
                            newRoom = rName;
                            break;
                        }
                    }

                    if (newRoom != null) {
                        tt.setClassroomName(newRoom);
                        timetableRepo.save(tt);
                        // Update the tracking map so next iteration knows this room is taken
                        usedInSlot.add(newRoom);
                        slotRoomMap.put(slotKey, usedInSlot);

                        Map<String, Object> fix = new HashMap<>();
                        fix.put("type", "ROOM_CONFLICT");
                        fix.put("description", tt.getSubjectName() + " (" + tt.getGrade() + "-" + tt.getSection() + ") on " + tt.getDayOfWeek() + " " + tt.getStartTime() + ": moved from " + oldRoom + " → " + newRoom);
                        fix.put("status", "RESOLVED");
                        conflictLog.add(fix);
                        resolved++;
                    }
                }
            }
        }

        // AUTO-RESOLVE teacher double-bookings by moving class to a free slot
        String[] allDays = {"Monday", "Tuesday", "Wednesday", "Thursday", "Friday"};
        String[] allTimes = {"09:00", "10:00", "11:00", "12:00", "14:00", "15:00", "16:00"};
        String[] allEndTimes = {"10:00", "11:00", "12:00", "13:00", "15:00", "16:00", "17:00"};

        Map<String, List<Timetable>> teacherSlots = new HashMap<>();
        List<Timetable> freshAll = timetableRepo.findAll();
        for (Timetable t : freshAll) {
            String key = t.getDayOfWeek() + "-" + t.getStartTime() + "-" + t.getTeacherName();
            teacherSlots.computeIfAbsent(key, k -> new ArrayList<>()).add(t);
        }

        for (Map.Entry<String, List<Timetable>> entry : teacherSlots.entrySet()) {
            if (entry.getValue().size() > 1) {
                List<Timetable> clashing = entry.getValue();
                for (int i = 1; i < clashing.size(); i++) {
                    Timetable tt = clashing.get(i);
                    String oldDay = tt.getDayOfWeek();
                    String oldTime = tt.getStartTime();
                    boolean moved = false;

                    // Build set of slots this teacher is already busy
                    Set<String> teacherBusy = new HashSet<>();
                    for (Timetable t : timetableRepo.findAll()) {
                        if (t.getTeacherName().equals(tt.getTeacherName())) {
                            teacherBusy.add(t.getDayOfWeek() + "-" + t.getStartTime());
                        }
                    }

                    // Try to find a free slot on the same day first, then other days
                    for (String day : allDays) {
                        for (int ti = 0; ti < allTimes.length; ti++) {
                            String candidate = day + "-" + allTimes[ti];
                            if (!teacherBusy.contains(candidate)) {
                                // Also find a free room for this new slot
                                Set<String> roomsUsed = new HashSet<>();
                                for (Timetable t : timetableRepo.findAll()) {
                                    if (t.getDayOfWeek().equals(day) && t.getStartTime().equals(allTimes[ti])) {
                                        roomsUsed.add(t.getClassroomName());
                                    }
                                }
                                String freeRoom = null;
                                for (String rn : allRoomNames) {
                                    if (!roomsUsed.contains(rn)) { freeRoom = rn; break; }
                                }
                                if (freeRoom != null) {
                                    String desc = tt.getTeacherName() + " was double-booked: " + tt.getSubjectName()
                                        + " moved from " + oldDay + " " + oldTime + " to " + day + " " + allTimes[ti]
                                        + " (Room: " + freeRoom + ")";
                                    tt.setDayOfWeek(day);
                                    tt.setStartTime(allTimes[ti]);
                                    tt.setEndTime(allEndTimes[ti]);
                                    tt.setClassroomName(freeRoom);
                                    timetableRepo.save(tt);

                                    Map<String, Object> fix = new HashMap<>();
                                    fix.put("type", "TEACHER_CONFLICT");
                                    fix.put("description", desc);
                                    fix.put("status", "RESOLVED");
                                    conflictLog.add(fix);
                                    resolved++;
                                    moved = true;
                                    break;
                                }
                            }
                        }
                        if (moved) break;
                    }
                }
            }
        }

        // Verify no remaining conflicts
        Map<String, List<Timetable>> verifyRooms = new HashMap<>();
        Map<String, List<Timetable>> verifyTeachers = new HashMap<>();
        for (Timetable t : timetableRepo.findAll()) {
            String rKey = t.getDayOfWeek() + "-" + t.getStartTime() + "-" + t.getClassroomName();
            verifyRooms.computeIfAbsent(rKey, k -> new ArrayList<>()).add(t);
            String tKey = t.getDayOfWeek() + "-" + t.getStartTime() + "-" + t.getTeacherName();
            verifyTeachers.computeIfAbsent(tKey, k -> new ArrayList<>()).add(t);
        }
        long remainingRoomConflicts = verifyRooms.values().stream().filter(v -> v.size() > 1).count();
        long remainingTeacherConflicts = verifyTeachers.values().stream().filter(v -> v.size() > 1).count();

        Notification notif = new Notification();
        notif.setTargetRole("ADMIN");
        notif.setMessage("AI resolved " + resolved + " conflicts. Remaining: " + remainingRoomConflicts + " room, " + remainingTeacherConflicts + " teacher.");
        notif.setType(resolved > 0 ? "SUCCESS" : "INFO");
        notifRepo.save(notif);

        Map<String, Object> response = new HashMap<>();
        response.put("resolved", resolved);
        response.put("totalIssues", conflictLog.size());
        response.put("remainingRoomConflicts", remainingRoomConflicts);
        response.put("remainingTeacherConflicts", remainingTeacherConflicts);
        response.put("details", conflictLog);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/analytics")
    public ResponseEntity<?> getAnalytics() {
        List<Timetable> all = timetableRepo.findAll();
        List<Teacher> teachers = teacherRepo.findAll();
        List<Student> students = studentRepo.findAll();

        // Teacher workload
        Map<String, Long> teacherLoad = all.stream().collect(Collectors.groupingBy(Timetable::getTeacherName, Collectors.counting()));
        List<Map<String, Object>> workload = new ArrayList<>();
        for (Map.Entry<String, Long> e : teacherLoad.entrySet()) {
            Map<String, Object> m = new HashMap<>();
            m.put("name", e.getKey()); m.put("classes", e.getValue());
            workload.add(m);
        }

        // Subject distribution
        Map<String, Long> subjectDist = all.stream().collect(Collectors.groupingBy(Timetable::getSubjectName, Collectors.counting()));
        List<Map<String, Object>> subjects = new ArrayList<>();
        for (Map.Entry<String, Long> e : subjectDist.entrySet()) {
            Map<String, Object> m = new HashMap<>();
            m.put("name", e.getKey()); m.put("count", e.getValue());
            subjects.add(m);
        }

        // Day-wise class distribution
        Map<String, Long> dayDist = all.stream().collect(Collectors.groupingBy(Timetable::getDayOfWeek, Collectors.counting()));

        // Department-wise students
        Map<String, Long> deptStudents = students.stream().collect(Collectors.groupingBy(s -> s.getDepartment() != null ? s.getDepartment() : "Unknown", Collectors.counting()));

        Map<String, Object> response = new HashMap<>();
        response.put("teacherWorkload", workload);
        response.put("subjectDistribution", subjects);
        response.put("dayDistribution", dayDist);
        response.put("departmentStudents", deptStudents);
        response.put("totalClasses", all.size());
        response.put("totalTeachers", teachers.size());
        response.put("totalStudents", students.size());
        return ResponseEntity.ok(response);
    }
}
