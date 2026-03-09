
import whisper
model = whisper.load_model("base", device="cpu")
def transcribe(audio_path):

    result = model.transcribe(audio_path)

    return result["text"]