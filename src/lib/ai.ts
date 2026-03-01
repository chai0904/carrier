// Gemini AI Service — uses Gemini 2.0 Flash (free tier)
// API key from env: VITE_GEMINI_API_KEY

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

function getApiKey(): string {
    const key = import.meta.env.VITE_GEMINI_API_KEY;
    if (!key) {
        console.warn('VITE_GEMINI_API_KEY not set — AI features will use fallback responses');
        return '';
    }
    return key;
}

interface GeminiResponse {
    candidates?: {
        content?: {
            parts?: { text?: string }[];
        };
    }[];
}

async function callGemini(prompt: string, systemInstruction?: string): Promise<string> {
    const apiKey = getApiKey();
    if (!apiKey) {
        return getFallbackResponse(prompt);
    }

    try {
        const body: any = {
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
                temperature: 0.7,
                maxOutputTokens: 2048,
            },
        };

        if (systemInstruction) {
            body.systemInstruction = { parts: [{ text: systemInstruction }] };
        }

        const res = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        });

        if (!res.ok) {
            const errText = await res.text();
            console.error('Gemini API error:', res.status, errText);
            return getFallbackResponse(prompt);
        }

        const data: GeminiResponse = await res.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        return text || 'I could not generate a response. Please try again.';
    } catch (err) {
        console.error('Gemini API call failed:', err);
        return getFallbackResponse(prompt);
    }
}

function getFallbackResponse(prompt: string): string {
    const lower = prompt.toLowerCase();
    if (lower.includes('resume') || lower.includes('tailor')) {
        return 'Your resume shows strong technical skills. Focus on quantifying your achievements with specific metrics and numbers. Add keywords from the job description to improve ATS compatibility.';
    }
    if (lower.includes('interview') || lower.includes('question')) {
        return 'For your interview, prepare examples using the STAR method (Situation, Task, Action, Result). Focus on demonstrating problem-solving skills and clear communication.';
    }
    if (lower.includes('reject') || lower.includes('gap')) {
        return 'Rejection is a normal part of the job search. Focus on building the specific skills mentioned in the requirements, and consider reaching out to the recruiter for feedback.';
    }
    return 'I can help you with resume tailoring, interview prep, application tracking, and career guidance. What would you like to work on?';
}

// ── Copilot Chat ─────────────────────────────────────────────

export async function chatWithCopilot(
    userMessage: string,
    conversationHistory: { role: string; content: string }[],
    context?: { applications?: any[]; candidateName?: string; skills?: string[] }
): Promise<string> {
    const systemPrompt = `You are CandidateOS AI Copilot — a helpful, encouraging career assistant embedded in a job application tracking platform. 

You help candidates with:
- Interview preparation and mock questions
- Resume optimization and tailoring
- Understanding application statuses and next steps
- Career advice and skill development
- Salary negotiation tips

Be concise, specific, and actionable. Use a warm, professional tone. When relevant, reference the candidate's specific applications and skills.

${context?.candidateName ? `The candidate's name is ${context.candidateName}.` : ''}
${context?.skills?.length ? `Their skills include: ${context.skills.join(', ')}.` : ''}
${context?.applications?.length ? `They have ${context.applications.length} active applications.` : ''}`;

    const historyText = conversationHistory
        .slice(-10) // last 10 messages for context
        .map((m) => `${m.role === 'user' ? 'Candidate' : 'Assistant'}: ${m.content}`)
        .join('\n');

    const fullPrompt = historyText
        ? `${historyText}\nCandidate: ${userMessage}\nAssistant:`
        : userMessage;

    return callGemini(fullPrompt, systemPrompt);
}

// ── Resume Tailoring ─────────────────────────────────────────

export interface ResumeTailorResult {
    matchScore: number;
    matchSummary: string;
    suggestions: { section: string; current: string; improved: string; reason: string }[];
    keywordsToAdd: string[];
    strengthsToHighlight: string[];
}

export async function tailorResume(
    resumeText: string,
    jobTitle: string,
    jobDescription: string
): Promise<ResumeTailorResult> {
    const systemPrompt = `You are a resume optimization expert. Analyze the resume against the job description and return a JSON object with this exact structure:
{
  "matchScore": <number 0-100>,
  "matchSummary": "<2-3 sentence analysis>",
  "suggestions": [
    {"section": "<section name>", "current": "<current text>", "improved": "<improved text>", "reason": "<why this change helps>"}
  ],
  "keywordsToAdd": ["<keyword1>", "<keyword2>"],
  "strengthsToHighlight": ["<strength1>", "<strength2>"]
}
Return ONLY valid JSON, no markdown formatting or code blocks.`;

    const prompt = `Analyze this resume for the role of "${jobTitle}":

RESUME:
${resumeText || 'No resume text provided — analyze based on job requirements alone.'}

JOB DESCRIPTION:
${jobDescription || 'No specific job description provided.'}

Provide actionable suggestions to tailor this resume for the role.`;

    const response = await callGemini(prompt, systemPrompt);

    try {
        // Try to extract JSON from the response
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            return JSON.parse(jsonMatch[0]);
        }
    } catch (e) {
        console.error('Failed to parse resume tailor response:', e);
    }

    // Fallback
    return {
        matchScore: 72,
        matchSummary: response.slice(0, 200),
        suggestions: [
            {
                section: 'Overall',
                current: 'Current resume',
                improved: response.slice(0, 300),
                reason: 'AI-generated suggestion',
            },
        ],
        keywordsToAdd: ['relevant skills', 'job-specific terms'],
        strengthsToHighlight: ['Technical expertise', 'Project experience'],
    };
}

// ── Interview Question Generation ────────────────────────────

export interface InterviewQuestion {
    id: number;
    category: string;
    difficulty: string;
    question: string;
    coachingTip: string;
    exampleAnswer: string;
}

export async function generateInterviewQuestions(
    jobTitle: string,
    jobDescription: string,
    candidateSkills: string[]
): Promise<InterviewQuestion[]> {
    const systemPrompt = `You are an interview preparation coach. Generate interview questions and return a JSON array with this exact structure:
[
  {
    "id": <number>,
    "category": "<Technical|Behavioral|Situational|Culture-Fit>",
    "difficulty": "<Easy|Medium|Hard>",
    "question": "<the question>",
    "coachingTip": "<advice on answering>",
    "exampleAnswer": "<sample answer outline>"
  }
]
Generate 6 questions with a good mix of categories and difficulties. Return ONLY valid JSON, no markdown formatting or code blocks.`;

    const prompt = `Generate interview questions for: ${jobTitle}

Job Description: ${jobDescription}

Candidate Skills: ${candidateSkills.join(', ')}`;

    const response = await callGemini(prompt, systemPrompt);

    try {
        const jsonMatch = response.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
            return JSON.parse(jsonMatch[0]);
        }
    } catch (e) {
        console.error('Failed to parse interview questions:', e);
    }

    // Fallback questions
    return [
        { id: 1, category: 'Technical', difficulty: 'Medium', question: `Describe your experience with the core technologies required for ${jobTitle}.`, coachingTip: 'Be specific about projects and outcomes.', exampleAnswer: 'In my previous role...' },
        { id: 2, category: 'Behavioral', difficulty: 'Medium', question: 'Tell me about a challenging project you completed recently.', coachingTip: 'Use the STAR method.', exampleAnswer: 'At my previous company...' },
        { id: 3, category: 'Situational', difficulty: 'Hard', question: 'How would you handle a disagreement with a team member about a technical approach?', coachingTip: 'Show collaboration and empathy.', exampleAnswer: 'I would first listen to understand their perspective...' },
    ];
}

// ── Answer Evaluation ────────────────────────────────────────

export interface AnswerEvaluation {
    score: number;
    grade: string;
    feedback: string;
}

export async function evaluateAnswer(
    question: string,
    answer: string
): Promise<AnswerEvaluation> {
    const systemPrompt = `You are an interview coach evaluating a candidate's answer. Return a JSON object:
{
  "score": <number 1-10>,
  "grade": "<Excellent|Good|Average|Needs Improvement>",
  "feedback": "<2-3 sentences of specific, constructive feedback>"
}
Return ONLY valid JSON, no markdown formatting or code blocks.`;

    const prompt = `Evaluate this interview answer:

QUESTION: ${question}
ANSWER: ${answer}`;

    const response = await callGemini(prompt, systemPrompt);

    try {
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            return JSON.parse(jsonMatch[0]);
        }
    } catch (e) {
        console.error('Failed to parse evaluation:', e);
    }

    return {
        score: 6,
        grade: 'Good',
        feedback: 'Solid answer. Consider being more specific with examples and quantifying your impact.',
    };
}

// ── Skill Gap Analysis ───────────────────────────────────────

export interface SkillGapResult {
    summary: string;
    skillGaps: {
        skill: string;
        currentLevel: string;
        requiredLevel: string;
        resources: string[];
        time: string;
    }[];
    nextSteps: string[];
    alternativeRoles: string[];
    motivationalNote: string;
}

export async function analyzeSkillGap(
    jobTitle: string,
    jobDescription: string,
    candidateSkills: string[],
    rejectionNote?: string
): Promise<SkillGapResult> {
    const systemPrompt = `You are a career development advisor. Analyze the skill gap between a candidate and a role they were rejected from. Return a JSON object:
{
  "summary": "<2-3 sentence analysis>",
  "skillGaps": [
    {"skill": "<skill name>", "currentLevel": "<Beginner|Intermediate|Advanced>", "requiredLevel": "<Intermediate|Advanced|Expert>", "resources": ["<resource1>", "<resource2>"], "time": "<estimated learning time>"}
  ],
  "nextSteps": ["<actionable step1>", "<step2>", "<step3>"],
  "alternativeRoles": ["<role1>", "<role2>"],
  "motivationalNote": "<encouraging message>"
}
Return ONLY valid JSON, no markdown formatting or code blocks.`;

    const prompt = `Analyze skill gap for: ${jobTitle}

Job Description: ${jobDescription}
Candidate Skills: ${candidateSkills.join(', ')}
${rejectionNote ? `Rejection reason: ${rejectionNote}` : ''}`;

    const response = await callGemini(prompt, systemPrompt);

    try {
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            return JSON.parse(jsonMatch[0]);
        }
    } catch (e) {
        console.error('Failed to parse skill gap:', e);
    }

    return {
        summary: 'Based on the role requirements, there are areas where you can grow to become a stronger candidate.',
        skillGaps: [
            { skill: 'Core Technology', currentLevel: 'Intermediate', requiredLevel: 'Advanced', resources: ['Online courses', 'Open source projects'], time: '3-6 months' },
        ],
        nextSteps: ['Focus on deepening your expertise', 'Build portfolio projects', 'Network with professionals in the field'],
        alternativeRoles: ['Similar role at a smaller company', 'Junior version of this role'],
        motivationalNote: 'Every rejection is a redirect. Keep building, keep learning — you\'re closer than you think! 💪',
    };
}
