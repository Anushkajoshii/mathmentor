def route(problem):

    topic = problem["topic"]

    if topic == "algebra":
        return "algebra_solver"

    if topic == "probability":
        return "prob_solver"

    if topic == "calculus":
        return "calc_solver"

    return "general_solver"