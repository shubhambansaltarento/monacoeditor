// Java with Dynamic Configuration
// This code is loaded from a JSON configuration file

import java.util.*;
import java.util.stream.Collectors;
import java.util.function.Predicate;

public class DynamicJavaExample {
    
    public static class Person {
        private final String name;
        private final int age;
        private final String email;
        
        public Person(String name, int age, String email) {
            this.name = Objects.requireNonNull(name, "Name cannot be null");
            this.age = age;
            this.email = Objects.requireNonNull(email, "Email cannot be null");
            
            if (age < 0) {
                throw new IllegalArgumentException("Age cannot be negative");
            }
        }
        
        // Getters
        public String getName() { return name; }
        public int getAge() { return age; }
        public String getEmail() { return email; }
        
        public boolean isAdult() {
            return age >= 18;
        }
        
        @Override
        public String toString() {
            return String.format("Person{name='%s', age=%d, email='%s'}", 
                               name, age, email);
        }
        
        @Override
        public boolean equals(Object obj) {
            if (this == obj) return true;
            if (obj == null || getClass() != obj.getClass()) return false;
            Person person = (Person) obj;
            return age == person.age && 
                   Objects.equals(name, person.name) && 
                   Objects.equals(email, person.email);
        }
        
        @Override
        public int hashCode() {
            return Objects.hash(name, age, email);
        }
    }
    
    public static void main(String[] args) {
        System.out.println("Java Dynamic Configuration Example");
        System.out.println("=".repeat(40));
        
        // Create list of people
        List<Person> people = Arrays.asList(
            new Person("Alice Johnson", 25, "alice@example.com"),
            new Person("Bob Smith", 17, "bob@example.com"),
            new Person("Charlie Brown", 30, "charlie@example.com"),
            new Person("Diana Prince", 70, "diana@example.com")
        );
        
        // Stream operations
        List<Person> adults = people.stream()
            .filter(Person::isAdult)
            .collect(Collectors.toList());
        
        System.out.println("Total people: " + people.size());
        System.out.println("Adults: " + adults.size());
        
        // Group by age ranges
        Map<String, List<Person>> ageGroups = people.stream()
            .collect(Collectors.groupingBy(person -> {
                if (person.getAge() < 18) return "minors";
                else if (person.getAge() < 65) return "adults";
                else return "seniors";
            }));
        
        ageGroups.forEach((group, groupPeople) -> 
            System.out.println(group + ": " + groupPeople.size()));
        
        System.out.println("\\nAdults:");
        adults.forEach(System.out::println);
        
        // Fibonacci sequence
        System.out.println("\\nFibonacci sequence (first 15 numbers):");
        List<Long> fibSequence = generateFibonacci(15);
        System.out.println(fibSequence);
        
        // Optional example
        Optional<Person> oldestPerson = people.stream()
            .max(Comparator.comparing(Person::getAge));
            
        oldestPerson.ifPresent(person -> 
            System.out.println("\\nOldest person: " + person));
    }
    
    public static List<Long> generateFibonacci(int count) {
        if (count <= 0) return Collections.emptyList();
        
        List<Long> sequence = new ArrayList<>();
        long prev = 0, curr = 1;
        
        for (int i = 0; i < count; i++) {
            if (i == 0) {
                sequence.add(0L);
            } else if (i == 1) {
                sequence.add(1L);
            } else {
                long next = prev + curr;
                sequence.add(next);
                prev = curr;
                curr = next;
            }
        }
        return sequence;
    }
}