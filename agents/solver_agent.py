from utils.llm import call_llm
from tools.sympy_solver import solve_equation
from memory.similarity_search import retrieve_similar


def solve(parsed, context):

    problem = parsed["problem_text"]

    # 1️⃣ Retrieve similar solved problems
    similar = retrieve_similar(problem)

    memory_context = ""

    if similar:

        memory_context = "\nSimilar solved problem:\n"

        memory_context += similar[0]["problem"] + "\n"

        memory_context += "Solution:\n" + similar[0]["solution"]


    # 2️⃣ Try symbolic solver first
    sympy_solution = solve_equation(problem)

    if sympy_solution:

        return {
            "method": "sympy",
            "answer": str(sympy_solution),
            "memory_used": bool(similar)
        }


    # 3️⃣ Use LLM if symbolic fails
    prompt = f"""
Solve the following math problem step by step.

Problem:
{problem}

Relevant Knowledge:
{context}

Past Similar Problems:
{memory_context}

Give a clear step-by-step solution.
"""

    response = call_llm(prompt)

    return {
        "method": "llm",
        "answer": response,
        "memory_used": bool(similar)
    }