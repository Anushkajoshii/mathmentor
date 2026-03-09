from utils.llm import call_llm

def explain(problem, solution):

    prompt = f"""
Explain step by step.

Problem:
{problem}

Solution:
{solution}
"""

    return call_llm(prompt)