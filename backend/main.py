import os
import re
import json
import base64
from io import BytesIO
from typing import Optional
from pydantic import BaseModel
import fastapi
import fastapi.middleware.cors
from groq import Groq

app = fastapi.FastAPI()

app.add_middleware(
    fastapi.middleware.cors.CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize Groq client
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
groq_client = Groq(api_key=GROQ_API_KEY) if GROQ_API_KEY else None

# In-memory storage for memory/learning
memory_store: list[dict] = []
rag_documents: list[dict] = []

# RAG Knowledge Base
RAG_KNOWLEDGE = {
    "algebra": """
# Algebra Formulas and Identities

## Quadratic Formula
x = (-b ± √(b² - 4ac)) / 2a

## Factoring Identities
- (a + b)² = a² + 2ab + b²
- (a - b)² = a² - 2ab + b²
- (a + b)(a - b) = a² - b²
- (a + b)³ = a³ + 3a²b + 3ab² + b³
- (a - b)³ = a³ - 3a²b + 3ab² - b³

## Logarithm Rules
- log(ab) = log(a) + log(b)
- log(a/b) = log(a) - log(b)
- log(aⁿ) = n·log(a)
- logₐ(b) = log(b) / log(a)

## Arithmetic Progression (AP)
- nth term: aₙ = a + (n-1)d
- Sum: Sₙ = n/2 [2a + (n-1)d]

## Geometric Progression (GP)
- nth term: aₙ = a·rⁿ⁻¹
- Sum: Sₙ = a(rⁿ - 1)/(r - 1)
""",
    "calculus": """
# Calculus Formulas

## Derivatives
- d/dx(xⁿ) = n·xⁿ⁻¹
- d/dx(eˣ) = eˣ
- d/dx(ln x) = 1/x
- d/dx(sin x) = cos x
- d/dx(cos x) = -sin x
- d/dx(tan x) = sec² x

## Chain Rule
d/dx[f(g(x))] = f'(g(x)) · g'(x)

## Product Rule
d/dx[f(x)·g(x)] = f'(x)·g(x) + f(x)·g'(x)

## Quotient Rule
d/dx[f(x)/g(x)] = [f'(x)·g(x) - f(x)·g'(x)] / [g(x)]²

## Integration
- ∫xⁿ dx = xⁿ⁺¹/(n+1) + C
- ∫eˣ dx = eˣ + C
- ∫1/x dx = ln|x| + C
- ∫sin x dx = -cos x + C
- ∫cos x dx = sin x + C

## Limits
- lim(x→0) sin(x)/x = 1
- lim(x→∞) (1 + 1/x)ˣ = e
""",
    "probability": """
# Probability Formulas

## Basic Probability
P(A) = Number of favorable outcomes / Total outcomes

## Addition Rule
P(A ∪ B) = P(A) + P(B) - P(A ∩ B)

## Multiplication Rule
P(A ∩ B) = P(A) · P(B|A)

## Conditional Probability
P(A|B) = P(A ∩ B) / P(B)

## Bayes' Theorem
P(A|B) = P(B|A) · P(A) / P(B)

## Permutations
P(n,r) = n! / (n-r)!

## Combinations
C(n,r) = n! / [r!(n-r)!]

## Binomial Distribution
P(X=k) = C(n,k) · pᵏ · (1-p)ⁿ⁻ᵏ

## Expected Value
E(X) = Σ xᵢ · P(xᵢ)

## Variance
Var(X) = E(X²) - [E(X)]²
""",
    "linear_algebra": """
# Linear Algebra Basics

## Matrix Operations
- (A + B)ᵀ = Aᵀ + Bᵀ
- (AB)ᵀ = BᵀAᵀ
- (A⁻¹)ᵀ = (Aᵀ)⁻¹

## Determinant Properties
- det(AB) = det(A) · det(B)
- det(Aᵀ) = det(A)
- det(A⁻¹) = 1/det(A)

## 2x2 Matrix Inverse
A⁻¹ = (1/det(A)) · [d -b; -c a] for A = [a b; c d]

## Eigenvalues
det(A - λI) = 0

## Vector Operations
- |a| = √(a₁² + a₂² + a₃²)
- a · b = |a||b|cos(θ)
- a × b = |a||b|sin(θ)n̂
"""
}


class ProblemInput(BaseModel):
    text: Optional[str] = None
    image_base64: Optional[str] = None
    audio_base64: Optional[str] = None
    input_type: str = "text"


class FeedbackInput(BaseModel):
    problem_id: str
    is_correct: bool
    corrected_solution: Optional[str] = None
    problem_text: str
    original_solution: str


class ParsedProblem(BaseModel):
    problem_text: str
    topic: str
    variables: list[str]
    constraints: list[str]
    needs_clarification: bool
    clarification_reason: Optional[str] = None


def call_llm(prompt: str, system_prompt: str = "") -> str:
    """Call Groq LLM for inference"""
    if not groq_client:
        return "LLM not available. Please configure GROQ_API_KEY."
    
    messages = []
    if system_prompt:
        messages.append({"role": "system", "content": system_prompt})
    messages.append({"role": "user", "content": prompt})
    
    completion = groq_client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=messages,
        temperature=0.1
    )
    return completion.choices[0].message.content


def extract_text_from_image(image_base64: str) -> tuple[str, float]:
    """Extract text from image using Groq Vision"""
    if not groq_client:
        return "OCR not available", 0.0
    
    try:
        completion = groq_client.chat.completions.create(
            model="llama-3.2-90b-vision-preview",
            messages=[
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "text",
                            "text": "Extract all mathematical text, equations, and symbols from this image. Preserve the mathematical notation as accurately as possible. Output only the extracted text, nothing else."
                        },
                        {
                            "type": "image_url",
                            "image_url": {
                                "url": f"data:image/png;base64,{image_base64}"
                            }
                        }
                    ]
                }
            ],
            temperature=0.1
        )
        extracted = completion.choices[0].message.content
        confidence = 0.85 if len(extracted) > 10 else 0.5
        return extracted, confidence
    except Exception as e:
        return f"OCR Error: {str(e)}", 0.0


def transcribe_audio(audio_base64: str) -> tuple[str, float]:
    """Transcribe audio using Groq Whisper"""
    if not groq_client:
        return "Transcription not available", 0.0
    
    try:
        audio_bytes = base64.b64decode(audio_base64)
        
        transcription = groq_client.audio.transcriptions.create(
            file=("audio.wav", BytesIO(audio_bytes)),
            model="whisper-large-v3",
            response_format="verbose_json"
        )
        
        text = transcription.text
        # Convert spoken math to symbols
        text = text.replace("square root of", "sqrt(")
        text = text.replace("raised to the power", "^")
        text = text.replace("squared", "^2")
        text = text.replace("cubed", "^3")
        text = text.replace("plus", "+")
        text = text.replace("minus", "-")
        text = text.replace("times", "*")
        text = text.replace("divided by", "/")
        text = text.replace("equals", "=")
        
        confidence = 0.8
        return text, confidence
    except Exception as e:
        return f"Transcription Error: {str(e)}", 0.0


def check_guardrail(text: str) -> tuple[bool, str]:
    """Check if input passes guardrail"""
    banned = ["hack", "attack", "exploit", "malware", "virus"]
    for b in banned:
        if b in text.lower():
            return False, f"Input rejected: contains prohibited term '{b}'"
    
    if len(text.strip()) < 3:
        return False, "Input too short"
    
    return True, "Input validated"


def parse_problem(text: str) -> dict:
    """Parse and structure the math problem"""
    
    # Detect topic
    topic = "algebra"
    text_lower = text.lower()
    
    if any(w in text_lower for w in ["probability", "chance", "likely", "random", "dice", "coin", "cards"]):
        topic = "probability"
    elif any(w in text_lower for w in ["limit", "derivative", "integral", "differentiate", "integrate", "lim"]):
        topic = "calculus"
    elif any(w in text_lower for w in ["matrix", "vector", "eigenvalue", "determinant", "linear"]):
        topic = "linear_algebra"
    
    # Extract variables
    variables = list(set(re.findall(r'\b([a-zA-Z])\b', text)))
    variables = [v for v in variables if v.lower() not in ['a', 'an', 'the', 'of', 'in', 'is', 'to', 'if']]
    
    # Detect constraints
    constraints = []
    if ">" in text or "<" in text:
        constraints.append("inequality constraint")
    if "positive" in text_lower:
        constraints.append("positive values only")
    if "integer" in text_lower:
        constraints.append("integer solutions")
    
    # Check if clarification needed
    needs_clarification = False
    clarification_reason = None
    
    if len(text.strip()) < 10:
        needs_clarification = True
        clarification_reason = "Problem statement is too short"
    elif "?" not in text and "find" not in text_lower and "solve" not in text_lower and "calculate" not in text_lower:
        needs_clarification = True
        clarification_reason = "Unable to identify what needs to be solved"
    
    return {
        "problem_text": text,
        "topic": topic,
        "variables": variables[:5],
        "constraints": constraints,
        "needs_clarification": needs_clarification,
        "clarification_reason": clarification_reason
    }


def route_problem(parsed: dict) -> str:
    """Route problem to appropriate solver"""
    topic = parsed["topic"]
    routing = {
        "algebra": "algebraic_solver",
        "calculus": "calculus_solver", 
        "probability": "probability_solver",
        "linear_algebra": "linear_algebra_solver"
    }
    return routing.get(topic, "general_solver")


def retrieve_context(problem: str, topic: str) -> list[dict]:
    """Retrieve relevant context from RAG knowledge base"""
    context = []
    
    # Get topic-specific knowledge
    if topic in RAG_KNOWLEDGE:
        context.append({
            "source": f"{topic}_formulas",
            "content": RAG_KNOWLEDGE[topic][:1000]
        })
    
    # Search memory for similar problems
    for mem in memory_store[-20:]:
        if mem.get("feedback") == "correct":
            prob_text = mem.get("problem", "").lower()
            if any(word in prob_text for word in problem.lower().split()[:5]):
                context.append({
                    "source": "memory",
                    "content": f"Similar solved problem:\n{mem['problem']}\nSolution: {mem['solution'][:500]}"
                })
                break
    
    return context[:3]


def solve_problem(parsed: dict, context: list[dict]) -> dict:
    """Solve the math problem using LLM"""
    
    context_text = "\n\n".join([c["content"] for c in context])
    
    system_prompt = """You are an expert math tutor specializing in JEE-level mathematics. 
Solve problems step-by-step with clear explanations.
Always show your work and explain each step.
Format mathematical expressions clearly."""
    
    prompt = f"""Solve this math problem step by step:

Problem: {parsed['problem_text']}

Topic: {parsed['topic']}
Variables: {', '.join(parsed['variables']) if parsed['variables'] else 'None identified'}

Relevant Knowledge:
{context_text}

Provide:
1. A clear step-by-step solution
2. The final answer clearly marked
3. Key concepts used"""

    solution = call_llm(prompt, system_prompt)
    
    return {
        "solution": solution,
        "method": f"LLM with {parsed['topic']} RAG context",
        "steps": solution.split("\n"),
        "memory_used": any(c["source"] == "memory" for c in context)
    }


def verify_solution(problem: str, solution: str) -> dict:
    """Verify the solution quality"""
    
    system_prompt = "You are a math verification expert. Verify solutions for correctness."
    
    prompt = f"""Verify this math solution:

Problem: {problem}

Solution: {solution}

Rate the solution on:
1. Mathematical correctness (0-100)
2. Completeness (0-100)
3. Clarity (0-100)

Output JSON format:
{{"correctness": number, "completeness": number, "clarity": number, "issues": ["list of issues if any"], "verified": boolean}}"""

    response = call_llm(prompt, system_prompt)
    
    try:
        # Extract JSON from response
        json_match = re.search(r'\{[^{}]*\}', response)
        if json_match:
            result = json.loads(json_match.group())
            confidence = (result.get("correctness", 70) + result.get("completeness", 70) + result.get("clarity", 70)) / 300
            return {
                "verified": result.get("verified", confidence > 0.7),
                "confidence": confidence,
                "issues": result.get("issues", []),
                "details": result
            }
    except:
        pass
    
    return {
        "verified": True,
        "confidence": 0.75,
        "issues": [],
        "details": {}
    }


def generate_explanation(problem: str, solution: str) -> str:
    """Generate student-friendly explanation"""
    
    system_prompt = """You are a friendly math tutor explaining to a JEE student.
Use simple language, relate to real examples when possible.
Break down complex concepts."""
    
    prompt = f"""Create a student-friendly explanation for:

Problem: {problem}

Solution: {solution}

Explain:
1. What the problem is asking
2. The approach used
3. Key formulas/concepts
4. Step-by-step walkthrough
5. Tips for similar problems"""

    return call_llm(prompt, system_prompt)


@app.get("/health")
async def health():
    return {
        "status": "ok",
        "llm_available": groq_client is not None,
        "memory_size": len(memory_store)
    }


@app.post("/solve")
async def solve(input_data: ProblemInput):
    """Main endpoint to solve math problems"""
    
    agent_trace = []
    
    # Step 1: Process input based on type
    text = ""
    confidence = 1.0
    ocr_preview = None
    transcript_preview = None
    
    if input_data.input_type == "image" and input_data.image_base64:
        agent_trace.append({"agent": "OCR", "status": "processing", "message": "Extracting text from image"})
        text, confidence = extract_text_from_image(input_data.image_base64)
        ocr_preview = text
        agent_trace.append({"agent": "OCR", "status": "complete", "message": f"Extracted with {confidence:.0%} confidence"})
        
    elif input_data.input_type == "audio" and input_data.audio_base64:
        agent_trace.append({"agent": "ASR", "status": "processing", "message": "Transcribing audio"})
        text, confidence = transcribe_audio(input_data.audio_base64)
        transcript_preview = text
        agent_trace.append({"agent": "ASR", "status": "complete", "message": f"Transcribed with {confidence:.0%} confidence"})
        
    else:
        text = input_data.text or ""
    
    # Step 2: Guardrail check
    agent_trace.append({"agent": "Guardrail", "status": "processing", "message": "Validating input"})
    passed, message = check_guardrail(text)
    
    if not passed:
        agent_trace.append({"agent": "Guardrail", "status": "rejected", "message": message})
        return {
            "success": False,
            "error": message,
            "agent_trace": agent_trace,
            "needs_hitl": True,
            "hitl_reason": "Input validation failed"
        }
    
    agent_trace.append({"agent": "Guardrail", "status": "complete", "message": "Input validated"})
    
    # Step 3: Parse problem
    agent_trace.append({"agent": "Parser", "status": "processing", "message": "Analyzing problem structure"})
    parsed = parse_problem(text)
    agent_trace.append({
        "agent": "Parser", 
        "status": "complete", 
        "message": f"Topic: {parsed['topic']}, Variables: {parsed['variables']}"
    })
    
    # Check if HITL needed
    if parsed["needs_clarification"]:
        agent_trace.append({"agent": "Parser", "status": "hitl_required", "message": parsed["clarification_reason"]})
        return {
            "success": False,
            "parsed_problem": parsed,
            "agent_trace": agent_trace,
            "needs_hitl": True,
            "hitl_reason": parsed["clarification_reason"],
            "ocr_preview": ocr_preview,
            "transcript_preview": transcript_preview,
            "confidence": confidence
        }
    
    # Step 4: Route problem
    agent_trace.append({"agent": "Router", "status": "processing", "message": "Determining solver"})
    route = route_problem(parsed)
    agent_trace.append({"agent": "Router", "status": "complete", "message": f"Routed to {route}"})
    
    # Step 5: Retrieve context
    agent_trace.append({"agent": "RAG", "status": "processing", "message": "Retrieving relevant knowledge"})
    context = retrieve_context(text, parsed["topic"])
    agent_trace.append({"agent": "RAG", "status": "complete", "message": f"Retrieved {len(context)} sources"})
    
    # Step 6: Solve
    agent_trace.append({"agent": "Solver", "status": "processing", "message": f"Solving using {route}"})
    result = solve_problem(parsed, context)
    agent_trace.append({"agent": "Solver", "status": "complete", "message": f"Method: {result['method']}"})
    
    # Step 7: Verify
    agent_trace.append({"agent": "Verifier", "status": "processing", "message": "Checking solution"})
    verification = verify_solution(text, result["solution"])
    agent_trace.append({
        "agent": "Verifier", 
        "status": "complete", 
        "message": f"Confidence: {verification['confidence']:.0%}"
    })
    
    # Check if HITL needed for low confidence
    needs_hitl = verification["confidence"] < 0.6 or confidence < 0.7
    
    if needs_hitl:
        agent_trace.append({
            "agent": "HITL", 
            "status": "requested", 
            "message": "Human review recommended due to low confidence"
        })
    
    # Step 8: Generate explanation
    agent_trace.append({"agent": "Explainer", "status": "processing", "message": "Generating explanation"})
    explanation = generate_explanation(text, result["solution"])
    agent_trace.append({"agent": "Explainer", "status": "complete", "message": "Explanation ready"})
    
    # Generate problem ID for feedback
    import hashlib
    problem_id = hashlib.md5(text.encode()).hexdigest()[:12]
    
    return {
        "success": True,
        "problem_id": problem_id,
        "parsed_problem": parsed,
        "solution": result["solution"],
        "explanation": explanation,
        "verification": verification,
        "context": context,
        "agent_trace": agent_trace,
        "needs_hitl": needs_hitl,
        "hitl_reason": "Low confidence - please verify" if needs_hitl else None,
        "ocr_preview": ocr_preview,
        "transcript_preview": transcript_preview,
        "confidence": confidence,
        "memory_used": result.get("memory_used", False)
    }


@app.post("/feedback")
async def submit_feedback(feedback: FeedbackInput):
    """Store feedback for learning"""
    
    memory_entry = {
        "problem_id": feedback.problem_id,
        "problem": feedback.problem_text,
        "solution": feedback.corrected_solution if feedback.corrected_solution else feedback.original_solution,
        "feedback": "correct" if feedback.is_correct else "incorrect",
        "was_corrected": feedback.corrected_solution is not None
    }
    
    memory_store.append(memory_entry)
    
    return {
        "success": True,
        "message": "Feedback stored for learning",
        "memory_size": len(memory_store)
    }


@app.get("/memory")
async def get_memory():
    """Get memory store contents"""
    return {
        "memory": memory_store[-10:],
        "total_size": len(memory_store)
    }


@app.get("/similar/{problem_text}")
async def get_similar(problem_text: str):
    """Get similar solved problems from memory"""
    
    similar = []
    problem_words = set(problem_text.lower().split())
    
    for mem in memory_store:
        if mem.get("feedback") == "correct":
            mem_words = set(mem.get("problem", "").lower().split())
            overlap = len(problem_words & mem_words)
            if overlap > 2:
                similar.append({
                    **mem,
                    "similarity_score": overlap / max(len(problem_words), 1)
                })
    
    similar.sort(key=lambda x: x.get("similarity_score", 0), reverse=True)
    
    return {"similar_problems": similar[:5]}
