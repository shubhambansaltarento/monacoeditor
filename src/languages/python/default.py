# Python with Dynamic Configuration
# This code is loaded from a JSON configuration file

import json
from typing import List, Dict, Optional
from dataclasses import dataclass
from functools import lru_cache

@dataclass
class Person:
    """Person dataclass with validation."""
    name: str
    age: int
    email: str
    
    def __post_init__(self):
        if self.age < 0:
            raise ValueError("Age cannot be negative")
        if "@" not in self.email:
            raise ValueError("Invalid email format")
    
    def is_adult(self) -> bool:
        return self.age >= 18
    
    def to_dict(self) -> Dict[str, any]:
        return {
            'name': self.name,
            'age': self.age,
            'email': self.email,
            'is_adult': self.is_adult()
        }

@lru_cache(maxsize=None)
def fibonacci(n: int) -> int:
    """Calculate fibonacci number with memoization."""
    if n <= 1:
        return n
    return fibonacci(n - 1) + fibonacci(n - 2)

class DataProcessor:
    """Data processing utilities."""
    
    @staticmethod
    def filter_adults(people: List[Person]) -> List[Person]:
        return [person for person in people if person.is_adult()]
    
    @staticmethod
    def group_by_age_range(people: List[Person]) -> Dict[str, List[Person]]:
        groups = {'minors': [], 'adults': [], 'seniors': []}
        for person in people:
            if person.age < 18:
                groups['minors'].append(person)
            elif person.age < 65:
                groups['adults'].append(person)
            else:
                groups['seniors'].append(person)
        return groups

def main():
    """Main function demonstrating various Python features."""
    print("Python Dynamic Configuration Example")
    print("=" * 40)
    
    # Create sample data
    people = [
        Person("Alice Johnson", 25, "alice@example.com"),
        Person("Bob Smith", 17, "bob@example.com"),
        Person("Charlie Brown", 30, "charlie@example.com"),
        Person("Diana Prince", 70, "diana@example.com")
    ]
    
    # Process data
    adults = DataProcessor.filter_adults(people)
    age_groups = DataProcessor.group_by_age_range(people)
    
    print(f"Total people: {len(people)}")
    print(f"Adults: {len(adults)}")
    
    # Display age groups
    for group_name, group_people in age_groups.items():
        print(f"{group_name.capitalize()}: {len(group_people)}")
    
    # JSON serialization
    adults_data = [person.to_dict() for person in adults]
    print("\\nAdults data (JSON):")
    print(json.dumps(adults_data, indent=2))
    
    # Fibonacci sequence
    print("\\nFibonacci sequence (first 15 numbers):")
    fib_sequence = [fibonacci(i) for i in range(15)]
    print(fib_sequence)
    
    # List comprehensions and generators
    squares = [x**2 for x in range(1, 11)]
    even_squares = [x for x in squares if x % 2 == 0]
    
    print(f"\\nSquares: {squares}")
    print(f"Even squares: {even_squares}")

if __name__ == "__main__":
    main()