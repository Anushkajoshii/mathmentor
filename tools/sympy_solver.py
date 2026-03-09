import sympy as sp

def solve_equation(problem):

    x = sp.symbols('x')

    try:

        equation = sp.sympify(problem)

        solution = sp.solve(equation, x)

        return solution

    except:

        return None