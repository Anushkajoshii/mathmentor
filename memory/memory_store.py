import faiss
import numpy as np
from sentence_transformers import SentenceTransformer

# embedding model
model = SentenceTransformer("all-MiniLM-L6-v2")

dimension = 384

# FAISS index
memory_index = faiss.IndexFlatL2(dimension)

# stored memory
memory_data = []


def store_memory(problem, parsed_problem, context, solution, feedback):
    """
    Store solved problem and metadata in memory
    """

    vector = model.encode(problem)

    memory_index.add(np.array([vector]))

    memory_data.append({
        "problem": problem,
        "parsed": parsed_problem,
        "context": context,
        "solution": solution,
        "feedback": feedback
    })


def get_memory_size():
    return len(memory_data)