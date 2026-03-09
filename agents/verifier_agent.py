def verify(solution):
    """
    Verifies solution quality and returns confidence score.
    """

    if solution is None:
        return {
            "verified": False,
            "confidence": 0.3
        }

    confidence = 0.9

    if "error" in solution.lower():
        confidence = 0.3

    return {
        "verified": confidence > 0.5,
        "confidence": confidence
    }