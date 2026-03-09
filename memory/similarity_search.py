import numpy as np
from sentence_transformers import SentenceTransformer
from .memory_store import memory_index, memory_data

model = SentenceTransformer("all-MiniLM-L6-v2")


def retrieve_similar(problem, k=2):
    """
    Retrieve similar past problems from memory.
    """

    if len(memory_data) == 0:
        return []

    vector = model.encode(problem)

    D, I = memory_index.search(np.array([vector]), k)

    results = []

    for idx in I[0]:
        if idx < len(memory_data):
            results.append(memory_data[idx])

    return results