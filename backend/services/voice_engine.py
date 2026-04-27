import os


model = None


def get_model():
    global model

    if model is None:
        try:
            import whisper
        except ImportError as exc:
            raise RuntimeError(
                "Audio transcription requires the openai-whisper package. "
                "Install it with `pip install openai-whisper`."
            ) from exc

        model_name = os.getenv("WHISPER_MODEL", "base")
        model = whisper.load_model(model_name)

    return model


def transcribe_audio(file_path: str) -> str:
    result = get_model().transcribe(file_path)
    return result["text"]
