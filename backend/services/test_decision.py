from decision_engine import generate_decision

test_cases = [
    ("fire", 0.9, "Room 302"),
    ("medical", 0.8, "Lobby"),
    ("threat", 0.7, "Entrance"),
    ("normal", 0.95, "Room 101"),
    ("fire", 0.4, "Kitchen")
]

for case in test_cases:
    result = generate_decision(*case)
    print("\nINPUT:", case)
    print("OUTPUT:", result)