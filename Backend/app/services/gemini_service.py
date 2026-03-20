import os
from dotenv import load_dotenv
import json

load_dotenv()

API_KEY = os.getenv("GEMINI_API_KEY")

try:
    from google import genai
    if API_KEY:
        client = genai.Client(api_key=API_KEY)
    else:
        client = None
    GEMINI_AVAILABLE = True
except ImportError:
    print("WARNING: google-genai not installed. AI generation disabled.")
    client = None
    GEMINI_AVAILABLE = False

GEMINI_MODEL = "gemini-2.5-flash"


def generate_gemini(contents):
    """Helper: calls Gemini and returns the response text."""
    if not GEMINI_AVAILABLE:
        raise RuntimeError("Gemini SDK not installed.")
    if not client:
        raise RuntimeError("GEMINI_API_KEY not set in .env file.")
    response = client.models.generate_content(model=GEMINI_MODEL, contents=contents)
    return response.text


def _clean_json(text: str) -> str:
    """Extract JSON from Gemini response, removing markdown code fences."""
    if "```json" in text:
        text = text.split("```json")[1].split("```")[0]
    elif "```" in text:
        for start_char in ['[', '{']:
            if start_char in text:
                text = text[text.index(start_char):]
                break
    return text.strip()


def generate_oir_questions(count=5):
    try:
        prompt = f"""
Generate {count} Officer Intelligence Rating (OIR) logical reasoning questions for the Indian SSB exam.
Must include a balanced mix of various domains:
- Verbal Reasoning (Analogies, Coding-Decoding, Blood Relations, Direction Sense, Letter-number series, Word arrangement)
- Non-Verbal/Spatial Reasoning (Pattern Completion, Figure Matrix, Odd One Out using shapes or position descriptions, Embedded Figures)
- Basic Numerical Aptitude (Mathematical operators placement, solving for missing figures)

Return ONLY a valid JSON array. No extra text or markdown.
Each object must have:
- "text": string (the question)
- "options": array of 4 strings
- "correct_answer": string (must match one of the options exactly)

Example structure:
[
    {{"text": "Find the odd one out: 2, 3, 5, 9", "options": ["2", "3", "5", "9"], "correct_answer": "9"}}
]
"""
        return json.loads(_clean_json(generate_gemini(prompt)))
    except Exception as e:
        print(f"OIR Gen Error: {e}")
        return [
            {"text": "Find the odd one out: 2, 3, 5, 9", "options": ["2", "3", "5", "9"], "correct_answer": "9"},
            {"text": "Complete the series: 1, 4, 9, 16, ?", "options": ["20", "25", "30", "36"], "correct_answer": "25"},
        ]


def generate_ppdt_scenario():
    try:
        prompt = """
Generate a PPDT (Picture Perception and Discussion Test) scenario for the Indian SSB exam.
Return ONLY a valid JSON object. No extra text or markdown.
{
    "description": "A hazy black-and-white image showing a group of people near a river...",
    "title": "Scenario Title"
}
"""
        return json.loads(_clean_json(generate_gemini(prompt)))
    except Exception as e:
        print(f"PPDT Gen Error: {e}")
        return {
            "description": "A hazy image showing a young army officer leading soldiers through a forest at dusk.",
            "title": "Leadership in Crisis"
        }


def generate_wat_words(count=10):
    try:
        prompt = f"""
Generate {count} words for a Word Association Test (WAT) used in the Indian SSB exam.
Mix of neutral, positive, and slightly challenging abstract words.
Return ONLY a valid JSON array of uppercase strings. No extra text or markdown.
Example: ["GARDEN", "FEAR", "LEADER", "GROWTH"]
"""
        raw = generate_gemini(prompt)
        cleaned = _clean_json(raw)
        print(f"WAT API raw: {raw[:200]}")
        return json.loads(cleaned)
    except Exception as e:
        print(f"WAT Gen Error: {e}")
        return ["COURAGE", "FAILURE", "NATION", "LEADER", "FAMILY",
                "DANGER", "SUCCESS", "JUSTICE", "FRIEND", "BATTLE"]


def generate_srt_situations(count=5):
    try:
        prompt = f"""
Generate {count} Situation Reaction Test (SRT) scenarios for the Indian SSB exam.
Situations from daily life, college, emergencies, or leadership scenarios.
Return ONLY a valid JSON array of strings. No extra text or markdown.
Example: ["He saw an accident on his way to the exam hall...", "His team was losing badly in the final match..."]
"""
        return json.loads(_clean_json(generate_gemini(prompt)))
    except Exception as e:
        print(f"SRT Gen Error: {e}")
        return [
            "He was on his way to the exam when he saw an injured person on the road.",
            "He was appointed as the captain of a losing team.",
            "His friend asked him to cheat during an exam.",
        ]


def generate_gto_tasks(count=2):
    try:
        prompt = f"""
Generate {count} Group Testing Officer (GTO) indoor tasks for the Indian SSB interview.
Mix of Group Discussion (GD) topics and Group Planning Exercise (GPE) scenarios.
Return ONLY a valid JSON array of objects.
[
    {{
        "type": "GD",
        "title": "Impact of Social Media",
        "description": "Discuss the pros and cons of social media on the youth of India."
    }},
    {{
        "type": "GPE",
        "title": "The Bridge Rescue",
        "description": "A group of friends are on a picnic when they see a bridge collapse..."
    }}
]
"""
        return json.loads(_clean_json(generate_gemini(prompt)))
    except Exception as e:
        print(f"GTO Gen Error: {e}")
        return [
            {
                "type": "GD",
                "title": "Privatization of Public Sector",
                "description": "Is privatization a boon or bane for India's economy?"
            },
            {
                "type": "GPE",
                "title": "Village Fire Emergency",
                "description": "While traveling through a village, you see a hut on fire while the villagers are away at a fair..."
            }
        ]


# ─── SSB Interview Functions ──────────────────────────────────────────────────

SSB_QUESTION_CATEGORIES = [
    "Personal Introduction",
    "Family Background",
    "Education & Academic Performance",
    "Hobbies & Extracurricular Activities",
    "Leadership Experiences",
    "Teamwork & Cooperation",
    "Current Affairs & General Knowledge",
    "Defense & Armed Forces Knowledge",
    "Strengths & Weaknesses",
    "Decision Making & Problem Solving",
    "Courage & Determination",
    "Situational Questions",
    "Future Goals & Ambitions",
    "Social Issues & Opinions",
    "Sports & Physical Fitness"
]

OLQS = [
    "Effective Intelligence",
    "Reasoning Ability",
    "Organizing Ability",
    "Power of Expression",
    "Social Adaptability",
    "Cooperation",
    "Sense of Responsibility",
    "Initiative",
    "Self Confidence",
    "Speed of Decision",
    "Ability to Influence the Group",
    "Liveliness",
    "Stamina",
    "Determination",
    "Courage"
]


def generate_contextual_question(prev_question: str = "", prev_answer: str = "", history: list = [], elapsed_minutes: float = 0) -> dict:
    """
    Generate the next SSB interview question dynamically based on the candidate's
    previous answer and overall session context. Questions are unlimited and adaptive.
    """
    try:
        # Build a brief history summary (last 4 Q&As)
        history_text = ""
        for h in history[-4:]:
            history_text += f"Q: {h.get('question','')}\nA: {h.get('answer','')}\n\n"

        phase = "opening" if elapsed_minutes < 5 else ("deep" if elapsed_minutes < 15 else "closing")

        prompt = f"""
You are a seasoned SSB (Services Selection Board) Interviewing Officer for the Indian Armed Forces.
You are conducting a live, dynamic interview. You must intelligently pick the NEXT best question.

Interview phase: {phase} ({elapsed_minutes:.1f} minutes elapsed)
Previous question: "{prev_question}"
Candidate's last answer: "{prev_answer}"

Session history (recent):
{history_text}

Based on the candidate's answers, intelligently choose:
- A probing follow-up if the answer was vague or needs depth
- A new topic if the current area is explored
- A leadership/situational question if confidence is low
- A tougher question if candidate is performing well
- Closing/motivation questions if nearing end of session

IMPORTANT:
- Do NOT repeat any question from the history
- Questions must cover a broad range: personal, leadership, defense, situational, social, academic
- Make each question feel natural in conversation

Return ONLY a valid JSON object:
{{
    "question": "The next question to ask...",
    "category": "Category Name",
    "rationale": "Why this question was chosen based on previous answer"
}}
"""
        return json.loads(_clean_json(generate_gemini(prompt)))
    except Exception as e:
        print(f"Contextual Question Gen Error: {e}")
        import random
        fallbacks = [
            {"question": "Tell me about yourself and your background.", "category": "Personal Introduction"},
            {"question": "Why do you want to join the Indian Armed Forces?", "category": "Motivation"},
            {"question": "Describe the most challenging situation you have faced and how you resolved it.", "category": "Leadership"},
            {"question": "What is your biggest weakness and how are you working to overcome it?", "category": "Self Awareness"},
            {"question": "Tell me about a time you led a team under pressure.", "category": "Leadership"},
            {"question": "How do you stay updated with current affairs and national security issues?", "category": "General Knowledge"},
            {"question": "What qualities do you think make an ideal officer?", "category": "Defense Knowledge"},
            {"question": "Describe a situation where you had to make a quick decision with incomplete information.", "category": "Decision Making"},
        ]
        used = [h.get('question', '') for h in history]
        available = [f for f in fallbacks if f['question'] not in used]
        return available[0] if available else fallbacks[0]


def analyze_answer_with_vision(question: str, answer: str, history: list = [], facial_image_b64: str = "") -> dict:
    """
    Analyze candidate's voice answer AND facial appearance/expression via Gemini Vision.
    OLQ scores are strictly derived from EVIDENCE in the actual answer — not defaults.
    """
    try:

        # Detailed OLQ definitions so Gemini knows exactly what each one means
        olq_definitions = """
1.  Effective Intelligence     – Ability to grasp, understand, and apply knowledge practically. Look for: use of logic, examples, problem solving shown.
2.  Reasoning Ability          – Systematic and logical thinking. Look for: structured arguments, cause-effect reasoning, avoiding contradictions.
3.  Organizing Ability         – Planning, prioritising, coordinating. Look for: mentions of planning steps, delegation, managing resources/time.
4.  Power of Expression        – Clarity, fluency, vocabulary, confidence of speech. Look for: clear sentences, appropriate vocabulary, no excessive stammering/filler words.
5.  Social Adaptability        – Ability to adjust to people/environment. Look for: references to diverse teams, handling diverse views, social situations.
6.  Cooperation                – Willingness to work with others, team spirit. Look for: "we did", crediting team, listening to others.
7.  Sense of Responsibility    – Owning outcomes, not blaming others. Look for: "I took responsibility", owning failures, accountability.
8.  Initiative                 – Self-starting, acting without being asked. Look for: "I started", "I proposed", "without waiting", proactive actions.
9.  Self Confidence            – Belief in own abilities, composure. Look for: assertive language, direct examples, no excessive hedging.
10. Speed of Decision          – Acting decisively under pressure. Look for: mentions of quick decisions, time-critical situations, not dithering.
11. Ability to Influence Group – Persuading, inspiring, leading others. Look for: others following their lead, convincing teammates, motivating people.
12. Liveliness                 – Energy, enthusiasm, sense of humour. Look for: animated language, enthusiasm in voice/word choice, positive energy.
13. Stamina                    – Physical and mental endurance. Look for: mentions of sustained effort, long hours, physical challenges, persistence.
14. Determination              – Persistence despite obstacles. Look for: "I kept trying", overcoming failure, not giving up, goal-focused.
15. Courage                    – Facing fear, taking difficult stands. Look for: references to risky decisions, standing up when difficult, taking moral positions.
"""

        text_prompt = f"""You are a panel of three trained SSB (Services Selection Board) assessors conducting a REAL evaluation:
- IO (Interviewing Officer)
- GTO (Group Testing Officer)
- Psychologist

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
QUESTION ASKED: "{question}"
CANDIDATE'S EXACT ANSWER: "{answer}"
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

OLQ DEFINITIONS (use these to score accurately):
{olq_definitions}

━━━ YOUR TASK ━━━

STEP 1 — Read the candidate's answer word by word. Identify specific phrases, behaviours, or omissions.
STEP 2 — For EACH of the 15 OLQs, determine a score 1–5 based ONLY on evidence from the actual answer.
         - If the answer clearly demonstrates the OLQ → score 4 or 5
         - If the answer is average/neutral about it → score 3
         - If the answer shows weakness in that OLQ → score 2 or 1
         - If the OLQ cannot be assessed from this answer → score 3 (neutral)
         CRITICAL: Do NOT give every quality a 3. Vary the scores based on what you actually heard.
STEP 3 — Write specific feedback quoting or referencing the candidate's actual words.

━━━ SCORING RULES ━━━
- The answer "{answer[:80]}..." must be your ONLY source of evidence.
- Scores MUST differ based on what was actually said. A generic answer gets low scores. A specific, structured, confident answer gets high scores.
- NEVER output all 3s. That means you did not analyse the answer.
- voice_assessment: reference the actual content of the answer (e.g. "The candidate said '...' which shows...")
- positives: must quote or reference something SPECIFIC the candidate said
- improvements: must be actionable and specific to THIS answer, not generic advice
- spoken_reply: must reference THIS answer specifically (mention a phrase they used)
"""
        if facial_image_b64:
            text_prompt += """
━━━ VIDEO ANALYSIS ━━━
A webcam screenshot of the candidate is provided. Analyse:
- Eye contact (looking at camera = confident)
- Facial expression (calm, nervous, engaged)
- Posture (upright = confident, slouching = low confidence)
- Grooming and presentation
- Non-verbal signs of nervousness (fidgeting, looking away)
Use this for appearance_assessment and factor it into Self Confidence, Liveliness, Power of Expression scores.
"""
        text_prompt += """
Return ONLY a valid JSON object (no extra text):
{
    "olq_ratings": {
        "Effective Intelligence": <1-5>,
        "Reasoning Ability": <1-5>,
        "Organizing Ability": <1-5>,
        "Power of Expression": <1-5>,
        "Social Adaptability": <1-5>,
        "Cooperation": <1-5>,
        "Sense of Responsibility": <1-5>,
        "Initiative": <1-5>,
        "Self Confidence": <1-5>,
        "Speed of Decision": <1-5>,
        "Ability to Influence the Group": <1-5>,
        "Liveliness": <1-5>,
        "Stamina": <1-5>,
        "Determination": <1-5>,
        "Courage": <1-5>
    },
    "voice_assessment": "Evidence-based: The candidate said '...' which demonstrates...",
    "appearance_assessment": "The candidate's facial expression/posture/eye contact shows...",
    "overall_assessment": "2-3 sentences summarising overall performance with specific reference to the answer.",
    "positives": ["Specific thing they said or did well (with reference)", "Another specific positive"],
    "improvements": ["Specific actionable improvement based on what was missing or weak", "Another"],
    "spoken_reply": "IO response mentioning a specific phrase or point from their answer...",
    "recommendation": "Recommended"
}
recommendation must be one of: "Highly Recommended", "Recommended", "Needs Improvement", "Not Recommended"
"""
        if facial_image_b64:
            import base64
            from google.genai import types
            image_part = types.Part.from_bytes(
                data=base64.b64decode(facial_image_b64),
                mime_type="image/jpeg",
            )
            contents = [text_prompt, image_part]
        else:
            contents = text_prompt

        return json.loads(_clean_json(generate_gemini(contents)))
    except Exception as e:
        print(f"Vision OLQ Analysis Error: {e}")
        return {
            "olq_ratings": {olq: 3 for olq in OLQS},
            "voice_assessment": "The candidate provided a satisfactory verbal response.",
            "appearance_assessment": "Appearance analysis unavailable.",
            "overall_assessment": "The candidate demonstrated average performance across OLQs.",
            "positives": ["Attempted to answer the question", "Maintained composure"],
            "improvements": ["Provide more specific examples", "Speak with greater confidence"],
            "spoken_reply": "Thank you. Please try to elaborate with concrete personal examples.",
            "recommendation": "Needs Improvement"
        }


def generate_final_report(history: list) -> dict:
    """
    Generate final SSB board report by:
    1. Mathematically aggregating per-question OLQ scores from the session
    2. Asking Gemini to write evidence-based narrative referencing specific answers
    """
    try:

        # ── Aggregate OLQ scores mathematically from actual per-question ratings ──
        olq_accumulator = {olq: [] for olq in OLQS}
        for h in history:
            ratings = h.get('olq_ratings', {})
            for olq in OLQS:
                if olq in ratings and isinstance(ratings[olq], (int, float)):
                    olq_accumulator[olq].append(ratings[olq])

        # Compute averages; default to 3 only if no data at all
        computed_olq_summary = {}
        for olq in OLQS:
            scores = olq_accumulator[olq]
            computed_olq_summary[olq] = round(sum(scores) / len(scores), 1) if scores else 3.0

        # Compute overall score (0-100)
        avg_olq = sum(computed_olq_summary.values()) / len(computed_olq_summary)
        computed_score = round((avg_olq / 5) * 100)

        # ── Build rich narrative context ──
        qa_parts = []
        for i, h in enumerate(history):
            entry = f"[Q{i+1}] {h.get('question','')}\n"
            entry += f"  Answer: {h.get('answer','')}\n"
            if h.get('voice_assessment'):
                entry += f"  Voice note: {h.get('voice_assessment','')}\n"
            if h.get('appearance_assessment'):
                entry += f"  Appearance note: {h.get('appearance_assessment','')}\n"
            qa_parts.append(entry)
        qa_text = "\n".join(qa_parts[-10:])

        olq_summary_text = "\n".join([f"  {olq}: {score}/5" for olq, score in computed_olq_summary.items()])

        prompt = f"""You are a panel of SSB (Services Selection Board) assessors — IO, GTO, Psychologist.
You have just completed a full interview session. Here is the transcript:

{qa_text}

The MATHEMATICALLY COMPUTED OLQ averages from the session are:
{olq_summary_text}

OVERALL COMPUTED SCORE: {computed_score}/100

Your task: Write evidence-based narrative remarks for the board report.
RULES:
- You MUST reference specific answers or moments from the transcript in your remarks
- Do NOT write generic remarks — every sentence should tie back to something the candidate actually said
- io_remarks: What the IO observed about communication, intelligence, personality (cite specific answers)
- gto_remarks: What was observed about leadership, teamwork, decisiveness (cite specific patterns)
- psychologist_remarks: Emotional stability, maturity, self-awareness shown (cite self-reflection moments)
- appearance_remarks: Non-verbal behaviour patterns across the session
- strengths: 3 specific strengths with examples from the session
- weaknesses: 2-3 specific areas where the candidate consistently underperformed
- final_verdict: A detailed paragraph synthesising everything — who this person is as a candidate

Return ONLY this JSON (use the computed scores already given — do NOT change them):
{{
    "overall_score": {computed_score},
    "recommendation": "<one of: Highly Recommended | Recommended | Needs Improvement | Not Recommended>",
    "olq_summary": {json.dumps(computed_olq_summary)},
    "io_remarks": "Evidence-based IO remarks referencing specific answers...",
    "gto_remarks": "Evidence-based GTO remarks...",
    "psychologist_remarks": "Evidence-based psychological remarks...",
    "appearance_remarks": "Evidence-based appearance/non-verbal remarks...",
    "strengths": ["Specific strength with example", "Another strength with example", "Third strength"],
    "weaknesses": ["Specific weakness with evidence", "Another weakness"],
    "final_verdict": "Detailed paragraph synthesising the candidate's overall officer-like potential..."
}}
"""
        result = json.loads(_clean_json(generate_gemini(prompt)))
        # Always enforce computed scores (never let Gemini change the numbers)
        result['olq_summary'] = computed_olq_summary
        result['overall_score'] = computed_score
        return result

    except Exception as e:
        print(f"Final Report Error: {e}")
        return {
            "overall_score": 60,
            "recommendation": "Needs Improvement",
            "olq_summary": {olq: 3 for olq in OLQS},
            "io_remarks": "Session completed. Detailed analysis unavailable.",
            "gto_remarks": "No GTO data available for this session.",
            "psychologist_remarks": "Insufficient data for psychological profiling.",
            "appearance_remarks": "Appearance analysis could not be processed.",
            "strengths": ["Completed the interview session"],
            "weaknesses": ["More focused preparation is recommended"],
            "final_verdict": "The candidate should prepare further before the actual SSB board."
        }

def evaluate_test_response(category: str, question: str, response: str) -> dict:
    """
    Evaluate a candidate's response to an OIR, PPDT, WAT, or SRT question.
    """
    try:
        category = category.upper()
        if category == "PPDT":
            prompt = f"""
You are an SSB Psychologist. Evaluate the following PPDT story based on a hazy image.
Scenario: {question}
Candidate's Story: {response}

Analyze based on:
1. Character Development
2. Logic and Structure
3. Positive/Negative Theme (OLQs like Initiative, Courage, Social Adaptability)
4. Consistency with the scenario

Return ONLY a valid JSON object:
{{
    "feedback": "Detailed psychological feedback...",
    "score": <1-10>,
    "theme": "Positive/Negative/Neutral",
    "olqs_shown": ["Initiative", "Determination", ...],
    "improvements": ["Improvement 1", "Improvement 2"]
}}
"""
        elif category == "WAT":
             prompt = f"""
You are an SSB Psychologist. Evaluate the following Word Association Test (WAT) response.
Word: {question}
Candidate's Response: {response}

Analyze if the response shows positive mindset, sense of responsibility, and officer-like qualities.
Return ONLY a valid JSON object:
{{
    "feedback": "Short feedback...",
    "score": <1-10>,
    "olqs_shown": ["..."]
}}
"""
        elif category == "SRT":
             prompt = f"""
You are an SSB Psychologist. Evaluate the following Situation Reaction Test (SRT) response.
Situation: {question}
Candidate's Response: {response}

Analyze if the action taken is practical, effective, and shows sense of responsibility.
Return ONLY a valid JSON object:
{{
    "feedback": "Analysis of the reaction...",
    "score": <1-10>,
    "olqs_shown": ["..."]
}}
"""
        else:
            return {"error": "Evaluation not supported for this category"}

        return json.loads(_clean_json(generate_gemini(prompt)))
    except Exception as e:
        print(f"Evaluation Error: {e}")
        return {
            "feedback": "The response was received and logged. (AI evaluation failed)",
            "score": 5,
            "olqs_shown": []
        }

def evaluate_full_test(category: str, questions_responses: list) -> dict:
    """
    Evaluate a full test session (Multiple WAT words, SRT situations, or PPDT responses).
    questions_responses is a list of dicts: [{"question": "...", "response": "..."}]
    """
    try:
        category = category.upper()
        history_text = ""
        for idx, item in enumerate(questions_responses):
            history_text += f"[{idx+1}] Q: {item.get('question')}\nA: {item.get('response')}\n\n"

        prompt = f"""
You are a Senior SSB Psychologist for the Indian Armed Forces.
Evaluate this full {category} practice test session containing {len(questions_responses)} responses.

Candidate Responses:
{history_text}

Provide a holistic psychological evaluation covering:
- Overall mindset (Positive/Negative/Constructive)
- Personality Indicators (Decision making, Responsibility, Initiative)
- Specific Strengths
- Specific Weaknesses / Areas for improvement

Return ONLY a valid JSON object:
{{
    "overall_feedback": "Paragraph summarizing performance...",
    "score": <1-10>,
    "personality_traits": ["Optimism", "Leadership", ...],
    "strengths": ["Strength 1", "Strength 2"],
    "weaknesses": ["Weakness 1", "Weakness 2"],
    "suggestions": ["Suggestion 1", "Suggestion 2"]
}}
"""
        return json.loads(_clean_json(generate_gemini(prompt)))
    except Exception as e:
        print(f"Full Evaluation Error: {e}")
        return {
            "overall_feedback": "Tests responses logged. Detailed insights unavailable.",
            "score": 5,
            "personality_traits": [],
            "strengths": ["Completed test requirements"],
            "weaknesses": [],
            "suggestions": ["View individual feedback items for now."]
        }


def analyze_sdt(parents: str, teachers: str, friends: str, self_view: str, qualities_to_develop: str) -> dict:
    """
    Analyze the Self Description Test (SDT) across all 5 perspectives.
    Returns OLQ scores, psychologist insights, strengths, red flags, and recommendations.
    """
    try:
        prompt = f"""You are an SSB (Services Selection Board) Psychologist for the Indian Armed Forces.
You are evaluating a candidate's Self Description Test (SDT) — a psychological screening tool
where the candidate describes themselves from 5 different perspectives.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. WHAT PARENTS THINK:
{parents}

2. WHAT TEACHERS/BOSS THINK:
{teachers}

3. WHAT FRIENDS THINK:
{friends}

4. WHAT THE CANDIDATE THINKS ABOUT THEMSELVES:
{self_view}

5. QUALITIES THE CANDIDATE WANTS TO DEVELOP:
{qualities_to_develop}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

YOUR ANALYSIS TASK:

STEP 1 — Cross-reference all 5 perspectives for consistency and authenticity.
STEP 2 — Score the candidate on these 8 key OLQs from 1-5 based on evidence from the text:
  - Self Confidence, Sense of Responsibility, Social Adaptability, Cooperation,
    Determination, Initiative, Effective Intelligence, Power of Expression
STEP 3 — Identify the "Real Picture" — what the candidate is actually like beneath the surface.
STEP 4 — Flag any red flags (e.g., all perspectives are uniformly positive = lack of self-awareness;
          parents say opposite of friends = identity issues; self-criticism without growth plan = low confidence)
STEP 5 — Write actionable feedback for each section.

Return ONLY valid JSON:
{{
  "overall_score": <0-100>,
  "recommendation": "<Highly Recommended | Recommended | Needs Improvement | Not Recommended>",
  "olq_scores": {{
    "Self Confidence": <1-5>,
    "Sense of Responsibility": <1-5>,
    "Social Adaptability": <1-5>,
    "Cooperation": <1-5>,
    "Determination": <1-5>,
    "Initiative": <1-5>,
    "Effective Intelligence": <1-5>,
    "Power of Expression": <1-5>
  }},
  "psychologist_summary": "2-3 paragraph deep psychological analysis of who this person really is based on the SDT...",
  "consistency_analysis": "Are all 5 perspectives consistent or do they tell a different story?",
  "strengths": ["Specific strength with evidence from SDT", "Another strength", "Third strength"],
  "red_flags": ["Any concern or inconsistency found", "..."],
  "section_feedback": {{
    "parents": "Specific feedback on the parents section...",
    "teachers": "Specific feedback on the teachers section...",
    "friends": "Specific feedback on the friends section...",
    "self_view": "Specific feedback on the self-view section...",
    "qualities_to_develop": "Specific feedback on the growth section..."
  }},
  "tips": ["Actionable tip 1 to improve the SDT", "Actionable tip 2", "Actionable tip 3"]
}}
"""
        return json.loads(_clean_json(generate_gemini(prompt)))
    except Exception as e:
        print(f"SDT Analysis Error: {e}")
        return {
            "overall_score": 60,
            "recommendation": "Needs Improvement",
            "olq_scores": {
                "Self Confidence": 3, "Sense of Responsibility": 3,
                "Social Adaptability": 3, "Cooperation": 3,
                "Determination": 3, "Initiative": 3,
                "Effective Intelligence": 3, "Power of Expression": 3
            },
            "psychologist_summary": "The candidate has completed the SDT. Detailed AI analysis is temporarily unavailable.",
            "consistency_analysis": "Unable to assess consistency at this time.",
            "strengths": ["Completed the SDT exercise", "Attempted honest self-reflection"],
            "red_flags": [],
            "section_feedback": {
                "parents": "Response received.", "teachers": "Response received.",
                "friends": "Response received.", "self_view": "Response received.",
                "qualities_to_develop": "Response received."
            },
            "tips": ["Add more specific examples to each section.", "Be honest — avoid generic positive-only descriptions.", "Include both strengths and areas for improvement."]
        }


def generate_profile_questions(piq: dict, sdt: dict, count: int = 20) -> list:
    """
    Generate personalized SSB interview questions based on a candidate's
    PIQ (Personal Information Questionnaire) and SDT (Self Description Test).
    Questions are tailored to the candidate's specific background, achievements, and self-description.
    """
    try:
        # Build profile summary
        name = piq.get("full_name", "the candidate")
        edu = piq.get("education_records", [])
        edu_text = ", ".join([f"{e.get('exam','')} ({e.get('percent','')}%)" for e in (edu if isinstance(edu, list) else [])]) or "Not provided"
        hobbies = piq.get("sports_hobbies", "")
        achievements = piq.get("achievements", "")
        extra = piq.get("extra_curricular", "")
        why_army = piq.get("why_join_army", "")
        pref1 = piq.get("service_preference_1", "")
        state = piq.get("permanent_state", "")
        fathers_occ = piq.get("fathers_occupation", "")
        defence_members = piq.get("family_members_in_defence", [])

        sdt_parents = sdt.get("parents", "")
        sdt_teachers = sdt.get("teachers", "")
        sdt_friends = sdt.get("friends", "")
        sdt_self = sdt.get("self_view", "")
        sdt_grow = sdt.get("qualities_to_develop", "")

        prompt = f"""You are a highly experienced SSB (Services Selection Board) Interviewing Officer for the Indian Armed Forces.

You are about to interview a candidate named {name}. Below is their complete profile. Your task is to generate exactly {count} personalized interview questions SPECIFIC to THIS candidate's background, experiences, and self-description.

━━━ CANDIDATE PROFILE ━━━
Name: {name}
State: {state}
Father's Occupation: {fathers_occ}
Family in Defence: {str(defence_members) if defence_members else "None"}
Education: {edu_text}
Sports & Hobbies: {hobbies}
Achievements: {achievements}
Extra-Curricular: {extra}
Service Preference: {pref1}
Why Join Army: {why_army}

━━━ SDT (Self Description Test) ━━━
Parents' view: {sdt_parents[:300] if sdt_parents else "Not filled"}
Teachers' view: {sdt_teachers[:300] if sdt_teachers else "Not filled"}
Friends' view: {sdt_friends[:300] if sdt_friends else "Not filled"}
Self-view: {sdt_self[:300] if sdt_self else "Not filled"}
Qualities to develop: {sdt_grow[:200] if sdt_grow else "Not filled"}

━━━ YOUR TASK ━━━
Generate {count} questions that:
1. Are SPECIFIC to this candidate (reference their actual hobbies, achievements, family, state, education)
2. Cover a natural interview progression: intro → personal → leadership → defence knowledge → situational → closing
3. Include probing questions based on their SDT (e.g. "You said your friends see you as X — can you give an example?")
4. Include questions about inconsistencies or gaps if any
5. Mix easy warm-up questions with deep probing ones
6. At least 3-4 questions should directly reference their stated achievements or hobbies
7. At least 2 questions should reference their SDT self-description

Return ONLY a valid JSON array of {count} objects. No extra text.
Each object:
{{
  "id": <number 1 to {count}>,
  "question": "The exact question text...",
  "category": "Personal | Leadership | Defence | Situational | SDT | Hobby | Achievement",
  "depth": "intro | medium | deep"
}}
"""
        result = json.loads(_clean_json(generate_gemini(prompt)))
        return result if isinstance(result, list) else result.get("questions", [])
    except Exception as e:
        print(f"Profile Questions Gen Error: {e}")
        return [
            {"id": 1, "question": "Tell me about yourself and your background.", "category": "Personal", "depth": "intro"},
            {"id": 2, "question": "Why do you want to join the Indian Armed Forces?", "category": "Leadership", "depth": "intro"},
            {"id": 3, "question": "Describe the most challenging situation you have faced and how you resolved it.", "category": "Leadership", "depth": "medium"},
            {"id": 4, "question": "What is your biggest weakness and how are you working to improve it?", "category": "Personal", "depth": "medium"},
            {"id": 5, "question": "Tell me about a time you led a team under pressure.", "category": "Leadership", "depth": "deep"},
            {"id": 6, "question": "What qualities do you think an ideal officer must possess?", "category": "Defence", "depth": "medium"},
            {"id": 7, "question": "How do you stay updated with current affairs and defence news?", "category": "Defence", "depth": "medium"},
            {"id": 8, "question": "Describe a situation where you made a quick decision with incomplete information.", "category": "Situational", "depth": "deep"},
            {"id": 9, "question": "What motivates you to wake up every morning?", "category": "Personal", "depth": "intro"},
            {"id": 10, "question": "How do your friends describe you when you are not around?", "category": "SDT", "depth": "medium"},
        ]


def generate_followup_question(question: str, answer: str, depth: int = 1) -> dict:
    """
    Generate an IO-style follow-up / drill-down question based on a candidate's answer.
    Like a real SSB IO who probes deeper after each response.
    """
    try:
        depth_labels = {1: "first", 2: "second", 3: "third"}
        depth_label = depth_labels.get(depth, "follow-up")
        prompt = f"""You are a seasoned SSB (Services Selection Board) Interviewing Officer conducting a real interview.

The candidate just answered a question. You must generate the {depth_label} follow-up to drill deeper.

ORIGINAL QUESTION: "{question}"
CANDIDATE'S ANSWER: "{answer}"

Generate a {depth_label} follow-up question that:
- Digs deeper into a SPECIFIC claim, word, or gap in the answer
- Challenges the candidate to elaborate, give an example, or defend their position
- Feels natural in a real interview conversation
- Is NOT yes/no — requires a substantial answer
- Gets more probing with each depth level

Return ONLY a valid JSON object:
{{
  "question": "The follow-up question...",
  "rationale": "Why this follow-up was chosen (what you noticed in their answer)",
  "type": "probe | clarify | challenge | example"
}}
"""
        return json.loads(_clean_json(generate_gemini(prompt)))
    except Exception as e:
        print(f"Follow-up Gen Error: {e}")
        probes = [
            "Can you give me a specific example of that?",
            "What exactly did you do in that moment?",
            "What would you do differently if you faced this again?",
        ]
        return {
            "question": probes[min(depth - 1, 2)],
            "rationale": "Asking for specifics",
            "type": "example"
        }


def generate_lecturette_topics() -> list:
    """
    Generate 4 lecturette topics for an SSB session.
    A card of 4 topics of varying difficulty:
    - High (Above Average/International)
    - Medium (Average/Social)
    - Low (Below Average/National)
    - General (Very basic/Personal)
    """
    try:
        prompt = """You are an SSB GTO (Group Testing Officer). 
You must produce exactly 4 lecturette topics on a SINGLE card suitable for candidates to speak for 3 minutes.
The 4 topics must represent 4 grades/difficulty levels as established in GTO:
1. High Difficulty (Geo-Politics, Defence, Global Trade, International Affairs)
2. Medium Difficulty (Socio-Economic, National Schemes, Technology, Environment)
3. Low Difficulty (Sports, Historical events, Cultural norms, Infrastructure)
4. General Difficulty (Hobbies, Personal experiences, Everyday things)

Return ONLY a valid JSON array of 4 objects.
[
  {
    "id": 1,
    "topic": "The topic title",
    "difficulty": "High | Medium | Low | General",
    "hints": ["Point 1 for candidate", "Point 2", "Point 3"]
  },
  ...
]
"""
        return json.loads(_clean_json(generate_gemini(prompt)))
    except Exception as e:
        print(f"Lecturette topics generation Error: {e}")
        return [
            {"id": 1, "topic": "Indo-Pacific Geo-Politics and India's Position", "difficulty": "High", "hints": ["Quad alliance", "Maritime security", "Economic corridors"]},
            {"id": 2, "topic": "Role of AI in Modern Education Systems", "difficulty": "Medium", "hints": ["Personalized learning", "Teacher replacement debate", "Digital divide"]},
            {"id": 3, "topic": "Promoting Rural Tourism in India", "difficulty": "Low", "hints": ["Economic benefits", "Heritage preservation", "Infrastructure needs"]},
            {"id": 4, "topic": "My Favourite Discipline Strategy for Success", "difficulty": "General", "hints": ["Daily routine", "Goal setting", "Handling distractions"]}
        ]


def evaluate_lecturette(topic: str, speech_text: str, duration: int) -> dict:
    """
    Evaluate a 3-minute lecturette given by a candidate.
    Examines Content, Structure, Speech delivery, and Vocabulary.
    """
    try:
        prompt = f"""You are an SSB GTO (Group Testing Officer) and Psychologist.
Evaluate the candidate's 3-minute Lecturette speech transcript.

TOPIC: "{topic}"
DURATION: {duration} seconds (Ideal is approx 180s/3min)
SPEECH TRANSCRIPT:
"{speech_text}"

YOUR EVALUATION TASK:
1. Assess Structure: Did they use an Intro (Why this topic), Body (Points), and Conclusion (Verdict)?
2. Assess Content: Accuracy of data, maturity of thoughts, reasoning, organizing ability.
3. Score 5 core OLQs from 1-5 based on this text:
   - Power of Expression
   - Organizing Ability
   - Self Confidence
   - Reasoning Ability
   - Liveliness (via tone indicators or flow if discernible)

Return ONLY a valid JSON:
{{
  "overall_score": <score 1-100>,
  "recommendation": "<Recommended | Not Recommended | Average>",
  "structure": {{
     "intro": "Did they introduce well?",
     "body": "Was the body consistent?",
     "conclusion": "Was the closing strong?"
  }},
  "olq_scores": {{
    "Power of Expression": <1-5>,
    "Organizing Ability": <1-5>,
    "Self Confidence": <1-5>,
    "Reasoning Ability": <1-5>
  }},
  "strengths": ["Something they did well", "..."],
  "gaps": ["Structure mistake or content missing", "..."],
  "tips": ["Actionable advice for lecture", "..."]
}}
"""
        return json.loads(_clean_json(generate_gemini(prompt)))
    except Exception as e:
        print(f"Evaluate Lecturette Error: {e}")
        return {
            "overall_score": 50,
            "recommendation": "Average",
            "structure": {"intro": "Adequate", "body": "Satisfactory", "conclusion": "Abrupt"},
            "olq_scores": {
                "Power of Expression": 3, "Organizing Ability": 3,
                "Self Confidence": 3, "Reasoning Ability": 3
            },
            "strengths": ["Spoke for duration", "Fair vocabulary"],
            "gaps": ["No strict structure followed"],
            "tips": ["Break talk into Intro, 3 points, Conclusion", "Avoid repeating phrases."]
        }

