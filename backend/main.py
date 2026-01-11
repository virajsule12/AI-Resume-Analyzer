from fastapi import FastAPI
from pydantic import BaseModel
from openai import OpenAI
from fastapi.middleware.cors import CORSMiddleware
import os
from dotenv import load_dotenv
import pathlib
import json
from fastapi import File, UploadFile, Form

dotenv_path = pathlib.Path(__file__).parent / ".env"
load_dotenv(dotenv_path=dotenv_path)  # Reads .env file

app = FastAPI(
    title="AI Text Analyzer",
    description="Your API description",
    version="1.0",
    root_path="/ai-text-analyzer"   # <-- important
)
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))


app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ResumeRequest(BaseModel):
    resume: str
    job_description: str

PROMPT_TEMPLATE = """
You are an experienced technical recruiter and ATS expert.

Analyze the resume against the job description.

You MUST respond with ONLY valid JSON.
Do NOT include markdown, code fences, or explanations.

The JSON must contain exactly these fields:
- match_score (number from 0 to 100)
- strengths (array of strings)
- missing_skills (array of strings)
- suggestions (array of strings)

Resume:
{resume}

Job Description:
{job_description}
"""

@app.post("/analyze-pdf")
async def analyze_pdf(file: UploadFile = File(...), job_description: str =Form(...)):
    if file.content_type != "application/pdf":
        return {"error": "Only PDF files are supported."}

    import fitz
    import json

    pdf_bytes = await file.read()
    doc = fitz.open(stream=pdf_bytes, filetype="pdf")
    resume_text = "".join(page.get_text() for page in doc)

    prompt = PROMPT_TEMPLATE.format(
        resume=resume_text,
        job_description=job_description
    )


    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[{"role": "user", "content": prompt}],
        temperature=0.2
    )

    raw_content = response.choices[0].message.content.strip()

    try:
        parsed = json.loads(raw_content)
        return parsed
    except json.JSONDecodeError:
        raise HTTPException(
            status_code=500,
            detail="AI response was not valid JSON"
        )


@app.get("/health")
def health_check():
    return {"status": "ok"}
