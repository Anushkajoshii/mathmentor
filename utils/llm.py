import os
from groq import Groq
from dotenv import load_dotenv

load_dotenv()

GROQ_API_KEY = os.getenv("GROQ_API_KEY")

def call_llm(prompt):

    if GROQ_API_KEY:

        client = Groq(api_key=GROQ_API_KEY)

        completion = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[{"role":"user","content":prompt}]
        )

        return completion.choices[0].message.content

    else:

        return fallback_response(prompt)


def fallback_response(prompt):

    return """
Groq API not available.
Using symbolic solver only.
"""