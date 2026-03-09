import streamlit as st
from PIL import Image

# Agents
from agents.guardrail_agent import check_input
from agents.parser_agent import parse_problem
from agents.router_agent import route
from agents.solver_agent import solve
from agents.verifier_agent import verify

# RAG
from rag.retriever import build_index, retrieve

# Memory
from memory.memory_store import store_memory
from memory.similarity_search import retrieve_similar

# Input processing
from input_processing.ocr import extract_text
from input_processing.speech_to_text import transcribe

# Audio recorder
from streamlit_mic_recorder import mic_recorder


# --------------------------------------------------
# PAGE CONFIG
# --------------------------------------------------

st.set_page_config(
    page_title="AI Math Mentor",
    page_icon="🧠",
    layout="wide"
)

# --------------------------------------------------
# SESSION STATE
# --------------------------------------------------

if "messages" not in st.session_state:
    st.session_state.messages = []

if "history" not in st.session_state:
    st.session_state.history = []

# --------------------------------------------------
# BUILD RAG INDEX
# --------------------------------------------------

build_index()

# --------------------------------------------------
# SIDEBAR
# --------------------------------------------------

st.sidebar.title("🧠 Math Mentor")

st.sidebar.subheader("Session")

if st.sidebar.button("Clear Conversation"):
    st.session_state.messages = []
    st.rerun()

st.sidebar.divider()

st.sidebar.subheader("System Status")

st.sidebar.write("Agents: Active")
st.sidebar.write("RAG: Connected")
st.sidebar.write("Memory: Enabled")

st.sidebar.divider()

st.sidebar.subheader("Conversation History")

for h in st.session_state.history[-5:]:
    st.sidebar.caption(h[:60])

# --------------------------------------------------
# HEADER
# --------------------------------------------------

st.title("🧠 Multimodal AI Math Mentor")
st.caption("Solve JEE-style math problems using AI agents + RAG + memory")

# --------------------------------------------------
# CHAT HISTORY
# --------------------------------------------------

for msg in st.session_state.messages:

    with st.chat_message(msg["role"]):
        st.markdown(msg["content"])

# --------------------------------------------------
# INPUT MODE
# --------------------------------------------------

mode = st.selectbox(
    "Input Method",
    ["Text", "Image", "Audio"]
)

question = ""

# --------------------------------------------------
# TEXT INPUT
# --------------------------------------------------

if mode == "Text":

    question = st.text_area(
        "Enter Math Problem",
        height=120
    )

# --------------------------------------------------
# IMAGE INPUT (TESSERACT)
# --------------------------------------------------

elif mode == "Image":

    uploaded_file = st.file_uploader(
        "Upload math problem image",
        type=["png", "jpg", "jpeg"]
    )

    if uploaded_file:

        image = Image.open(uploaded_file)

        st.image(image)

        text, confidence = extract_text(image)

        st.subheader("OCR Preview")

        question = st.text_area(
            "Edit extracted text",
            value=text,
            height=120
        )

        st.write("OCR Confidence:", round(confidence, 2))

        if confidence < 0.7:
            st.warning("⚠️ OCR confidence low. Please verify text.")

# --------------------------------------------------
# AUDIO INPUT
# --------------------------------------------------

elif mode == "Audio":

    audio_mode = st.radio(
        "Audio Input Type",
        ["Record Audio", "Upload Audio"]
    )

    if audio_mode == "Record Audio":

        audio = mic_recorder(
            start_prompt="Start Recording",
            stop_prompt="Stop Recording",
            key="recorder"
        )

        if audio:

            with open("recorded.wav", "wb") as f:
                f.write(audio["bytes"])

            st.audio("recorded.wav")

            transcript = transcribe("recorded.wav")

            st.subheader("Transcript")

            question = st.text_area(
                "Edit transcript",
                transcript,
                height=120
            )

    else:

        audio_file = st.file_uploader(
            "Upload Audio",
            type=["wav", "mp3", "m4a"]
        )

        if audio_file:

            with open("uploaded.wav", "wb") as f:
                f.write(audio_file.read())

            st.audio("uploaded.wav")

            transcript = transcribe("uploaded.wav")

            st.subheader("Transcript")

            question = st.text_area(
                "Edit transcript",
                transcript,
                height=120
            )

# --------------------------------------------------
# SOLVE BUTTON
# --------------------------------------------------

if st.button("Solve Problem"):

    if question.strip() == "":
        st.warning("Please enter a problem")
        st.stop()

    st.session_state.history.append(question)

    st.session_state.messages.append({
        "role": "user",
        "content": question
    })

    with st.chat_message("assistant"):

        with st.spinner("Thinking..."):

            # ---------------- GUARDRAIL ----------------

            if not check_input(question):
                st.error("Input rejected by guardrail")
                st.stop()

            # ---------------- PARSER ----------------

            parsed_problem = parse_problem(question)

            if parsed_problem["needs_clarification"]:
                st.warning("Problem unclear. Please clarify.")
                st.stop()

            # ---------------- ROUTER ----------------

            route_type = route(parsed_problem)

            # ---------------- RAG ----------------

            context = retrieve(question)

            # ---------------- SOLVER ----------------

            result = solve(parsed_problem, context)

            solution = result["answer"]

            # ---------------- VERIFIER ----------------

            verification = verify(solution)

            # ---------------- ANSWER ----------------

            st.subheader("✅ Final Answer")
            st.success(solution)

            st.metric("Confidence", round(verification["confidence"], 2))

            # ---------------- EXPLANATION ----------------

            st.subheader("📘 Explanation")
            st.write(solution)

            # ---------------- AGENT PIPELINE ----------------

            with st.expander("🧠 Agent Pipeline"):

                st.write("Guardrail → Input validated")
                st.write("Parser → Structured problem")
                st.write("Router →", route_type)
                st.write("Solver →", result["method"])
                st.write("Verifier →", verification["verified"])

            # ---------------- RAG KNOWLEDGE ----------------

            with st.expander("📚 Retrieved Knowledge"):

                if context:

                    cols = st.columns(min(3, len(context)))

                    for i, c in enumerate(context[:3]):
                        with cols[i]:
                            st.info(c[:250])

                else:
                    st.write("No relevant knowledge retrieved.")

            # ---------------- MEMORY ----------------

            similar = retrieve_similar(question)

            with st.expander("🧠 Similar Problems"):

                if similar:

                    for s in similar[:3]:

                        st.markdown("**Problem**")
                        st.code(s["problem"])

                        st.markdown("**Solution Summary**")
                        st.write(s["solution"][:200])

                        st.divider()

                else:
                    st.write("No similar problems found.")

            # ---------------- HITL ----------------

            st.divider()

            st.subheader("👨‍🏫 Human Feedback")

            feedback = st.radio(
                "Was the solution correct?",
                ["correct", "incorrect"]
            )

            if feedback == "incorrect":

                corrected_solution = st.text_area(
                    "Provide the correct solution"
                )

                if st.button("Submit Correction"):

                    store_memory(
                        question,
                        parsed_problem,
                        context,
                        corrected_solution,
                        feedback
                    )

                    st.success("Correction stored in memory")

            elif feedback == "correct":

                store_memory(
                    question,
                    parsed_problem,
                    context,
                    solution,
                    feedback
                )

                st.success("Solution stored in memory")

    st.session_state.messages.append({
        "role": "assistant",
        "content": solution
    })