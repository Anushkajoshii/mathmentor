import re

def parse_problem(text):
    """
    Converts raw text into a structured math problem.
    """

    variables = re.findall(r"[a-zA-Z]", text)

    constraints = []

    if ">" in text or "<" in text:
        constraints.append("inequality detected")

    topic = "algebra"

    if "probability" in text.lower():
        topic = "probability"

    if "limit" in text.lower() or "derivative" in text.lower():
        topic = "calculus"

    parsed = {
        "problem_text": text,
        "topic": topic,
        "variables": list(set(variables)),
        "constraints": constraints,
        "needs_clarification": False
    }

    if len(text.strip()) < 5:
        parsed["needs_clarification"] = True

    return parsed