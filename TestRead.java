import java.nio.file.*;

public class TestRead {
    public static void main(String[] args) {
        try {
            Path source = Paths.get("C:\\Users\\Atul Sharma\\.m2\\repository\\com\\h2database\\h2\\2.2.224\\h2-2.2.224.jar");
            Path target = Paths.get("D:\\Projects\\SCTS\\h2.jar");
            Files.copy(source, target, StandardCopyOption.REPLACE_EXISTING);
            System.out.println("SUCCESS: Copied H2 jar successfully!");
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
