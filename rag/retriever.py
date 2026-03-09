import os
import faiss
import numpy as np
from .embeddings import embed

dimension = 384

index = faiss.IndexFlatL2(dimension)

documents = []


def chunk_text(text, size=300):

    chunks = []

    for i in range(0, len(text), size):
        chunks.append(text[i:i+size])

    return chunks


def add_document(text):

    chunks = chunk_text(text)

    for chunk in chunks:

        vector = embed(chunk)

        index.add(np.array([vector]))

        documents.append(chunk)


def build_index():

    folder = "data/rag_docs"

    for file in os.listdir(folder):

        if file.endswith(".md"):

            with open(os.path.join(folder, file), "r") as f:

                add_document(f.read())


def retrieve(query, k=3):

    if len(documents) == 0:
        return []

    vector = embed(query)

    D, I = index.search(np.array([vector]), k)

    results = []

    for i in I[0]:
        if i < len(documents):
            results.append(documents[i])

    return results