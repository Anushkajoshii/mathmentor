import pytesseract
import numpy as np
import cv2
from PIL import Image

def extract_text(image):
    """
    Extract text from an image using Tesseract OCR.
    Returns extracted text and confidence score.
    """

    # Convert PIL image to numpy array
    if isinstance(image, Image.Image):
        image = np.array(image)

    # Convert to grayscale
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)

    # -------- ADD PREPROCESSING HERE --------
    blur = cv2.GaussianBlur(gray, (5,5), 0)

    thresh = cv2.adaptiveThreshold(
        blur,
        255,
        cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
        cv2.THRESH_BINARY,
        11,
        2
    )
    # ---------------------------------------

    # Run OCR
    data = pytesseract.image_to_data(
        thresh,
        output_type=pytesseract.Output.DICT,
        config="--oem 3 --psm 6"
    )

    texts = []
    confidences = []

    n_boxes = len(data["text"])

    for i in range(n_boxes):
        text = data["text"][i].strip()
        conf = int(data["conf"][i])

        if text != "" and conf > 0:
            texts.append(text)
            confidences.append(conf)

    extracted_text = " ".join(texts)

    avg_confidence = np.mean(confidences) / 100 if confidences else 0

    return extracted_text, avg_confidence