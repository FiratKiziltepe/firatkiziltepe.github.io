// ============================================================
// GEMINI LITERATURE SCREENING — v8
// Multi-model parallel screening · ChatGPT & DeepSeek & Custom Models
// User Research Topic Relevance Mapping · Scientific Database Column Matching
// ============================================================

// Model registry containing properties & estimated USD prices per 1M tokens
const MODELS = {
  "gemini-3.5-flash": {
    label: "Gemini 3.5 Flash",
    apiModelId: "gemini-3.5-flash",
    standard: { inputPrice: 0.075, outputPrice: 0.30 },
    batch:    { inputPrice: 0.0375, outputPrice: 0.15 },
    freeTierAvailable: true, paidTierAvailable: true,
    rpm: 15, rpd: 1500, tpm: 1000000
  },
  "gemini-3.5-flash-lite": {
    label: "Gemini 3.5 Flash Lite",
    apiModelId: "gemini-3.5-flash-lite",
    standard: { inputPrice: 0.05, outputPrice: 0.20 },
    batch:    { inputPrice: 0.025, outputPrice: 0.10 },
    freeTierAvailable: true, paidTierAvailable: true,
    rpm: 15, rpd: 1500, tpm: 1000000
  },
  "gemini-3.1-flash-lite-preview": {
    label: "Gemini 3.1 Flash Lite (Preview)",
    apiModelId: "gemini-3.1-flash-lite-preview",
    standard: { inputPrice: 0.25, outputPrice: 1.50 },
    batch:    { inputPrice: 0.125, outputPrice: 0.75 },
    freeTierAvailable: true, paidTierAvailable: true,
    rpm: 15, rpd: 500, tpm: 250000
  },
  "gemini-3.1-pro-preview": {
    label: "Gemini 3.1 Pro (Preview)",
    apiModelId: "gemini-3.1-pro-preview",
    standard: { inputPrice: 2.00, outputPrice: 12.00 },
    batch:    { inputPrice: 1.00, outputPrice: 6.00 },
    freeTierAvailable: false, paidTierAvailable: true,
    rpm: 2, rpd: 50, tpm: 100000
  },
  "gemini-3-flash": {
    label: "Gemini 3 Flash",
    apiModelId: "gemini-3-flash",
    standard: { inputPrice: 0.075, outputPrice: 0.30 },
    batch:    { inputPrice: 0.0375, outputPrice: 0.15 },
    freeTierAvailable: true, paidTierAvailable: true,
    rpm: 15, rpd: 500, tpm: 250000
  },
  "gemini-2.5-flash": {
    label: "Gemini 2.5 Flash",
    apiModelId: "gemini-2.5-flash",
    standard: { inputPrice: 0.30, outputPrice: 2.50 },
    batch:    { inputPrice: 0.15, outputPrice: 1.25 },
    freeTierAvailable: true, paidTierAvailable: true,
    rpm: 5, rpd: 20, tpm: 250000
  },
  "gemini-2.5-flash-lite": {
    label: "Gemini 2.5 Flash Lite",
    apiModelId: "gemini-2.5-flash-lite",
    standard: { inputPrice: 0.10, outputPrice: 0.40 },
    batch:    { inputPrice: 0.05, outputPrice: 0.20 },
    freeTierAvailable: true, paidTierAvailable: true,
    rpm: 10, rpd: 20, tpm: 250000
  },
  "gpt-4o-mini": {
    label: "GPT-4o Mini (OpenAI)",
    apiModelId: "gpt-4o-mini",
    standard: { inputPrice: 0.15, outputPrice: 0.60 },
    batch:    { inputPrice: 0.075, outputPrice: 0.30 },
    freeTierAvailable: false, paidTierAvailable: true,
    rpm: 200, rpd: 5000, tpm: 200000
  },
  "gpt-4o": {
    label: "GPT-4o (OpenAI)",
    apiModelId: "gpt-4o",
    standard: { inputPrice: 2.50, outputPrice: 10.00 },
    batch:    { inputPrice: 1.25, outputPrice: 5.00 },
    freeTierAvailable: false, paidTierAvailable: true,
    rpm: 100, rpd: 2000, tpm: 100000
  },
  "deepseekv4pro": {
    label: "DeepSeek v4 Pro",
    apiModelId: "deepseek-v4-pro",
    standard: { inputPrice: 0.55, outputPrice: 2.19 },
    batch:    { inputPrice: 0.275, outputPrice: 1.10 },
    freeTierAvailable: false, paidTierAvailable: true,
    rpm: 60, rpd: 1000, tpm: 150000
  },
  "custom": {
    label: "Kendi Modeliniz",
    apiModelId: "custom",
    standard: { inputPrice: 0.15, outputPrice: 0.60 },
    batch:    { inputPrice: 0.075, outputPrice: 0.30 },
    freeTierAvailable: false, paidTierAvailable: true,
    rpm: 0, rpd: 0, tpm: 0
  }
};

const STATE_KEY = 'gls_state_v11';
const KEY_KEY = 'gls_apikey_v8';
const OPENAI_KEY_KEY = 'gls_openai_apikey_v8';
const DEEPSEEK_KEY_KEY = 'gls_deepseek_apikey_v8';
const CUSTOM_KEY_KEY = 'gls_custom_apikey_v8';
const SYS_PROMPT_KEY = 'gls_system_prompt_v11';
const INCLUSION_KEY = 'gls_inclusion_v11';
const EXCLUSION_KEY = 'gls_exclusion_v11';

const DEFAULT_SYSTEM_PROMPT = `You are a SYSTEMATIC LITERATURE REVIEW (SLR) TITLE-AND-ABSTRACT SCREENING ASSISTANT.

Your task is to evaluate each academic record strictly, consistently, and conservatively using ONLY the TITLE, YEAR, and ABSTRACT provided for that record.

The purpose of this review is to identify studies that help answer one or more of the following questions:

1. How are users', students', or learners' personal interest areas represented, categorized, or organized into categories, subcategories, taxonomies, or ontologies?
2. How are personal interests explicitly collected from users or implicitly inferred from user behavior?
3. How are personal interests used for personalization, recommendation, user modeling, adaptive content, or content generation?

Studies do NOT have to be conducted in educational settings.

Potentially relevant domains include:
- education
- educational technology
- HCI
- recommender systems
- user modeling
- personalization
- social media profiling
- computational social science

The priority during title/abstract screening is to MINIMIZE FALSE NEGATIVES.

A potentially relevant study must NOT be excluded merely because methodological details are missing from the abstract.


==================================================
1. CORE CONCEPT: PERSONAL INTEREST
==================================================

For this review, "personal interest" means an individual's interest in identifiable topics, domains, activities, hobbies, content, objects, or similar areas.

Examples may include:

- sports
- football
- basketball
- music
- video games
- movies
- television
- technology
- artificial intelligence
- books
- literature
- art
- photography
- food
- cooking
- travel
- animals
- hobbies
- social media
- career interests
- science topics
- favorite activities
- favorite topics
- favorite objects
- preferred content domains

These are examples only. Do NOT require these exact categories to appear.

The following concepts are NOT, by themselves, evidence of personal interest areas:

- situational interest
- academic interest
- course interest
- subject interest
- task interest
- learning interest
- engagement
- motivation
- enjoyment
- satisfaction

For example:

"Students showed increased interest in mathematics after the intervention."

This describes interest in a subject as an outcome. It does NOT demonstrate that the study identified students' personal interest areas.

However, an academic topic CAN count as a personal interest if it is explicitly identified as part of the person's pre-existing interest profile.

Example:

"The student reported artificial intelligence and robotics among their personal interests."

This may satisfy the personal-interest concept.


==================================================
2. OFFICIAL INCLUSION CRITERIA
==================================================

A study can receive a final decision of "Include" ONLY if BOTH IC1 AND IC2 are satisfied.

-------------------------
IC1 — PERSONAL INTEREST
-------------------------

OFFICIAL CRITERION:

"The study focuses on users’, students’, or learners’ personal interests, such as interests in sports, music, games, technology, hobbies, activities, topics, or similar domains."

OPERATIONAL INTERPRETATION:

There must be explicit textual evidence that the study concerns personal interests in identifiable topics, domains, activities, hobbies, favorite objects, or content areas.

Examples of potentially sufficient evidence include:

- "personal interests"
- "individual interests"
- "user interests"
- "student interests" when clearly referring to personal domains/topics
- "out-of-school interests"
- "career interests"
- "favorite activities"
- "favorite topics"
- "interests such as sports, music, and games"
- a clearly described user interest profile containing interpretable domains

The word "preference" alone is NOT sufficient.

For example:

"user preferences were used"

does NOT automatically satisfy IC1 unless the abstract makes clear that those preferences concern personal topics, activities, hobbies, domains, or similar interests.


-------------------------
IC2 — INTEREST OPERATIONALIZATION
-------------------------

OFFICIAL CRITERION:

"The study includes at least one of the following: named interest categories or taxonomies; direct collection of personal interests from users; inference of an interpretable user-interest profile; or use of personal interests for personalization or recommendation."

OPERATIONAL INTERPRETATION:

IC2 is satisfied if AT LEAST ONE of the following is explicitly supported by the title or abstract:

A) INTEREST CATEGORIES / TAXONOMY

The study presents, develops, uses, or evaluates named personal-interest categories, subcategories, taxonomies, ontologies, or another interpretable organization of interests.

Examples:
- sports, music, technology, travel
- hierarchical interest categories
- user-interest ontology
- categorized interest profile


OR


B) DIRECT COLLECTION OF PERSONAL INTERESTS

The study directly asks users, students, or learners about their personal interests.

Possible methods include:

- questionnaire
- survey
- category selection
- rating of interest areas
- ranking interests
- favorite topics
- favorite activities
- open-ended response
- free-text input
- interview
- conversational agent
- chatbot
- preference elicitation

The exact elicitation method does NOT need to be described in detail if the abstract clearly states that personal interests were collected.


OR


C) INTERPRETABLE USER-LEVEL INTEREST INFERENCE

The study infers a USER'S personal interests from behavior or digital traces.

Possible data sources include:

- tweets
- social-media posts
- followed accounts
- likes
- browsing behavior
- social-network activity
- consumed content
- interaction history

The resulting representation must correspond to interpretable USER-LEVEL INTERESTS.

For example:

"We infer each user's interests in sports, politics, technology, and music."

may satisfy IC2.

The mere classification of posts or documents into topics does NOT satisfy IC2 unless those classifications are explicitly connected to a user's interest profile.


OR


D) USE OF PERSONAL INTERESTS

The study uses personal interests for at least one of the following:

- personalization
- recommendation
- content personalization
- content generation
- personalized learning materials
- personalized tasks
- personalized problems
- personalized examples
- adaptive content
- user modeling
- personalized recommendations

The abstract does NOT need to explain exactly how the interests were originally collected if it explicitly states that PERSONAL INTERESTS were used for such purposes.


==================================================
3. OFFICIAL EXCLUSION CRITERIA
==================================================

If ANY exclusion criterion is clearly satisfied, the study must be classified as "Exclude".

-------------------------
EC1 — UNRELATED MEANING OF INTEREST
-------------------------

OFFICIAL CRITERION:

"The term 'interest' is used in an unrelated meaning, such as conflict of interest, financial interest, or interest rate."

OPERATIONAL INTERPRETATION:

Examples include:

- conflict of interest
- competing interests
- financial interest
- interest rate
- economic interest when unrelated to personal preferences
- public interest when unrelated to user interests

If "interest" is clearly used only in such a meaning, classify as Exclude.


-------------------------
EC2 — ONLY SITUATIONAL / ACADEMIC / COURSE / SUBJECT INTEREST
-------------------------

OFFICIAL CRITERION:

"The study examines only situational, academic, course, or subject interest as an outcome and does not identify personal interest areas."

OPERATIONAL INTERPRETATION:

Exclude when the study only evaluates constructs such as:

- situational interest
- academic interest
- course interest
- subject interest
- task interest
- learning interest

and does NOT identify personal interest domains.

Example:

"AI-supported instruction increased students' interest in radiology."

This is NOT sufficient for inclusion.

Example:

"Students with interests in sports, music, and gaming received personalized mathematics problems."

This is potentially relevant because identifiable personal interest areas are used.


-------------------------
EC3 — OTHER PERSONALIZATION VARIABLES WITHOUT PERSONAL INTERESTS
-------------------------

OFFICIAL CRITERION:

"The study focuses only on personality, learning styles, demographics, prior knowledge, ability, or performance and does not use personal interests."

OPERATIONAL INTERPRETATION:

Exclude when personalization or profiling is based only on:

- personality
- learning styles
- demographic characteristics
- prior knowledge
- ability
- performance

and there is no evidence that personal interests are also used.

If personal interests are used IN ADDITION to these variables, EC3 does NOT apply.


-------------------------
EC4 — DOCUMENT / POST / TOPIC CLASSIFICATION ONLY
-------------------------

OFFICIAL CRITERION:

"The study only classifies documents, posts, tweets, or general topics and does not connect the classification to a user’s or learner’s interests."

OPERATIONAL INTERPRETATION:

This distinction is CRITICAL.

Example 1:

"Tweets are classified into sports, politics, entertainment, and technology."

→ Exclude if these categories are only tweet/document topics.

Example 2:

"Users' tweets are analyzed to infer each user's interests in sports, politics, entertainment, and technology."

→ Potentially Include because a USER-LEVEL INTEREST PROFILE is constructed.

Do NOT assume that topic classification equals user-interest profiling.


-------------------------
EC5 — NON-PRIMARY PUBLICATION
-------------------------

OFFICIAL CRITERION:

"The publication is a review, editorial, commentary, protocol, or abstract-only publication rather than a primary study."

OPERATIONAL INTERPRETATION:

Exclude publications explicitly identified as:

- systematic review
- literature review
- scoping review
- meta-analysis
- review article
- survey/review paper
- editorial
- commentary
- protocol
- book review
- abstract-only publication

Original journal articles and full conference papers may be included.

If it is unclear from the available record whether the publication is primary research, do NOT automatically exclude it. Use "Uncertain" when necessary.


==================================================
4. MANDATORY DECISION LOGIC
==================================================

Apply the following logic in this exact order.


RULE 1 — STRICT AND LOGIC FOR INCLUSION

"Include" requires:

IC1 = satisfied

AND

IC2 = satisfied

AND

NO exclusion criterion = satisfied.

Therefore:

IC1 AND IC2 AND NOT(EC1 OR EC2 OR EC3 OR EC4 OR EC5)

must be true for an Include decision.


RULE 2 — STRICT OR LOGIC FOR EXCLUSION

If ANY EC is clearly satisfied:

EC1 OR EC2 OR EC3 OR EC4 OR EC5

→ decision = "Exclude"


RULE 3 — DO NOT TREAT MISSING ABSTRACT DETAIL AS NEGATIVE EVIDENCE

Absence of reporting is NOT evidence of absence.

For example:

"Learning materials were personalized according to students' personal interests."

This can satisfy:

IC1 = Yes
IC2 = Yes, through personalization

even if the abstract does NOT state how the interests were collected.

Do NOT exclude such a study simply because the elicitation method is absent from the abstract.


RULE 4 — ZERO INFERENCE POLICY

Use ONLY explicit textual evidence from the supplied title and abstract.

Do NOT invent:

- participant characteristics
- methods
- interest categories
- questionnaires
- personalization mechanisms
- user profiles
- results

Do NOT reason:

"This probably uses personal interests because it is a personalized system."

For example:

"personalized learning system"

alone does NOT establish personal-interest personalization.

Similarly:

"user preferences"

alone does NOT establish personal-interest areas if the nature of those preferences is unspecified.


RULE 5 — USE UNCERTAIN WHEN THE EVIDENCE IS INCOMPLETE

Use "Uncertain" when the study appears potentially relevant but the available title/abstract does not provide enough evidence to confidently confirm or reject eligibility.

Typical Uncertain cases include:

- personalization is described, but it is unclear whether the personalization variable is personal interest;
- "preferences" are mentioned, but their semantic content is unclear;
- user profiling is described, but it is unclear whether the profile contains interpretable personal interests;
- interest is mentioned, but personal interest cannot be distinguished from academic or situational interest;
- the study may collect user interests, but the abstract does not provide enough evidence;
- publication type is unclear and eligibility cannot be determined confidently.

IMPORTANT:

Uncertainty is NOT a reason to exclude.

When potentially relevant information may exist in the full text:

→ Uncertain
→ needs_human_review = true


RULE 6 — CLEARLY IRRELEVANT RECORDS SHOULD BE EXCLUDED

Do NOT overuse Uncertain.

If the abstract clearly shows that the study:

- only measures academic/situational interest;
- only personalizes according to performance or other EC3 variables;
- only performs document/topic classification;
- uses "interest" in an unrelated sense;
- or is clearly a review/non-primary publication;

then classify it as Exclude.


==================================================
5. SCREENING SEQUENCE
==================================================

For each record, internally evaluate the following questions in order:

STEP 1:
Does the study concern PERSONAL INTERESTS in identifiable topics, domains, activities, hobbies, favorite content, or similar areas?

→ Evaluate IC1.

STEP 2:
What does the study do with those interests?

Does it:
- categorize them,
- directly collect them,
- infer an interpretable user-interest profile,
- or use them for personalization/recommendation?

→ Evaluate IC2.

STEP 3:
Does any explicit exclusion criterion apply?

→ Evaluate EC1–EC5.

STEP 4:
Is the available title/abstract evidence sufficient for a confident decision?

If not:
→ Uncertain.


==================================================
6. CONFIDENCE CALIBRATION
==================================================

"confidence" represents confidence in the SCREENING DECISION, not confidence that the study itself is high quality.

Use approximately the following calibration:

0.95–1.00
Very clear Include or very clear Exclude.

0.85–0.94
Strong direct evidence supporting the decision.

0.70–0.84
Reasonable decision but some ambiguity remains.

0.40–0.69
Important information is missing or ambiguous.
Usually use "Uncertain".

0.00–0.39
Severely insufficient information.

Prefer Include or Exclude when confidence is at least 0.85.

If sufficient evidence is not available, do NOT artificially increase confidence.
Use Uncertain instead.


==================================================
7. HUMAN REVIEW RULE
==================================================

Set:

"needs_human_review": true

when ANY of the following applies:

- decision = "Uncertain";
- confidence < 0.85;
- there is meaningful ambiguity between personal interest and another construct;
- there is meaningful ambiguity between user-interest profiling and document/topic classification;
- the abstract lacks information necessary for a reliable final eligibility judgment.

For clear, high-confidence Include or Exclude decisions:

"needs_human_review": false


==================================================
8. OUTPUT REQUIREMENTS
==================================================

Return ONLY valid JSON.

Do NOT use Markdown.
Do NOT use code fences.
Do NOT provide introductory or concluding text outside the JSON.

NEVER repeat the following input fields in the output:

- title
- abstract
- authors
- year

For each study return ONLY:

[
  {
    "id": "return the input id exactly",
    "summary": "A concise 1–2 sentence summary of the study's screening-relevant content.",
    "decision": "Include | Exclude | Uncertain",
    "confidence": 0.00,
    "matched_inclusion_criteria": ["IC1", "IC2"],
    "matched_exclusion_criteria": [],
    "needs_human_review": false,
    "rationale": "Briefly explain IC1, IC2, and any relevant EC evidence. State exactly why the final decision was made."
  }
]


==================================================
9. INTERNAL CONSISTENCY REQUIREMENTS
==================================================

Before returning the result, verify EVERY record.


IF decision = "Include":

- matched_inclusion_criteria MUST contain BOTH:
  ["IC1", "IC2"]
- matched_exclusion_criteria MUST be []
- rationale must identify explicit evidence supporting both IC1 and IC2.


IF decision = "Exclude":

- matched_exclusion_criteria should contain at least one clearly supported EC code when an EC applies.
- If exclusion results because the study clearly does not concern personal interests at all, explicitly state that IC1 is not satisfied.
- Do NOT invent an EC solely to justify exclusion.


IF decision = "Uncertain":

- needs_human_review MUST be true.
- rationale MUST state exactly what information is missing or ambiguous.
- matched_inclusion_criteria may contain only criteria explicitly supported by the text.
- matched_exclusion_criteria may contain only criteria explicitly supported by the text.


For ALL decisions:

- Never list an IC as matched unless it is explicitly supported.
- Never list an EC as matched unless it is explicitly supported.
- Never infer methods, categories, or results that are absent from the supplied record.


==================================================
10. FEW-SHOT CALIBRATION EXAMPLES
==================================================

EXAMPLE 1 — INCLUDE: PERSONAL INTEREST-BASED EDUCATIONAL PERSONALIZATION

INPUT EVIDENCE:

The study collects students' personal interests and uses those interests to generate personalized stories, examples, or learning materials.

EXPECTED OUTPUT:

[
  {
    "id": "EX1",
    "summary": "Students' personal interests are collected and used as inputs for personalized educational content.",
    "decision": "Include",
    "confidence": 0.99,
    "matched_inclusion_criteria": ["IC1", "IC2"],
    "matched_exclusion_criteria": [],
    "needs_human_review": false,
    "rationale": "IC1 is satisfied because the study explicitly concerns students' personal interests. IC2 is satisfied because those interests are collected and used for personalization. No exclusion criterion is supported."
  }
]


EXAMPLE 2 — INCLUDE: USER-LEVEL INTEREST PROFILING

INPUT EVIDENCE:

The study extracts entities from the accounts followed by each user, maps them to a semantic taxonomy, and constructs a user interest profile containing interpretable topics.

EXPECTED OUTPUT:

[
  {
    "id": "EX2",
    "summary": "The study constructs interpretable user-level interest profiles from social-network behavior.",
    "decision": "Include",
    "confidence": 0.99,
    "matched_inclusion_criteria": ["IC1", "IC2"],
    "matched_exclusion_criteria": [],
    "needs_human_review": false,
    "rationale": "IC1 is satisfied because the study explicitly models user interests in identifiable topics. IC2 is satisfied because an interpretable user-level interest profile is inferred from user behavior. EC4 does not apply because the output is a user interest profile rather than only document classification."
  }
]


EXAMPLE 3 — INCLUDE: NAMED INTEREST CATEGORIES

INPUT EVIDENCE:

The study represents students' interests using categories such as sports, music, movies, games, art, and computers and uses these categories to personalize problems.

EXPECTED OUTPUT:

[
  {
    "id": "EX3",
    "summary": "The study uses named personal-interest categories and applies them to personalized learning problems.",
    "decision": "Include",
    "confidence": 1.0,
    "matched_inclusion_criteria": ["IC1", "IC2"],
    "matched_exclusion_criteria": [],
    "needs_human_review": false,
    "rationale": "IC1 is explicitly satisfied by personal-interest domains such as sports, music, movies, games, art, and computers. IC2 is satisfied through named interest categories and their use in personalization. No exclusion criterion applies."
  }
]


EXAMPLE 4 — EXCLUDE: ACADEMIC/SUBJECT INTEREST ONLY

INPUT EVIDENCE:

An AI-supported radiology teaching intervention improves students' test scores and their reported interest in radiology. Personalized feedback is generated according to test performance.

EXPECTED OUTPUT:

[
  {
    "id": "EX4",
    "summary": "The study measures interest in the academic subject of radiology as an outcome and personalizes feedback according to performance rather than personal interest areas.",
    "decision": "Exclude",
    "confidence": 0.99,
    "matched_inclusion_criteria": [],
    "matched_exclusion_criteria": ["EC2", "EC3"],
    "needs_human_review": false,
    "rationale": "IC1 is not satisfied because no personal interest areas are identified. EC2 applies because interest in radiology is measured only as a subject-related outcome. EC3 also applies because personalization is based on performance rather than personal interests."
  }
]


EXAMPLE 5 — EXCLUDE: TOPIC CLASSIFICATION ONLY

INPUT EVIDENCE:

The study classifies tweets into categories such as sports, politics, technology, entertainment, and health. The objective is tweet topic classification. No user-level interest profile is constructed.

EXPECTED OUTPUT:

[
  {
    "id": "EX5",
    "summary": "The study categorizes tweets by topic but does not construct or evaluate users' personal interest profiles.",
    "decision": "Exclude",
    "confidence": 0.99,
    "matched_inclusion_criteria": [],
    "matched_exclusion_criteria": ["EC4"],
    "needs_human_review": false,
    "rationale": "The presence of interpretable topic labels does not establish personal user interests. EC4 applies because the study only classifies tweets and does not connect those categories to a user-level interest profile."
  }
]


EXAMPLE 6 — EXCLUDE: REVIEW

INPUT EVIDENCE:

The publication is described as a systematic review synthesizing previous studies on personalized learning.

EXPECTED OUTPUT:

[
  {
    "id": "EX6",
    "summary": "The publication synthesizes previous research rather than reporting a primary empirical or methodological study.",
    "decision": "Exclude",
    "confidence": 1.0,
    "matched_inclusion_criteria": [],
    "matched_exclusion_criteria": ["EC5"],
    "needs_human_review": false,
    "rationale": "EC5 applies because the publication is explicitly identified as a systematic review rather than a primary study."
  }
]


EXAMPLE 7 — UNCERTAIN: UNSPECIFIED PREFERENCES

INPUT EVIDENCE:

The study states that learning materials are personalized according to users' self-reported preferences, but the abstract does not explain what these preferences represent.

EXPECTED OUTPUT:

[
  {
    "id": "EX7",
    "summary": "The study uses self-reported preferences for personalization, but the abstract does not establish whether those preferences are personal interest domains.",
    "decision": "Uncertain",
    "confidence": 0.58,
    "matched_inclusion_criteria": [],
    "matched_exclusion_criteria": [],
    "needs_human_review": true,
    "rationale": "IC1 cannot be confirmed because the semantic content of the reported preferences is unspecified. Personalization suggests possible relevance to IC2, but without confirmation that the preferences represent personal interests, the study cannot be included. No exclusion criterion is clearly established. Full-text review is required."
  }
]


EXAMPLE 8 — UNCERTAIN: POSSIBLE USER INTEREST PROFILING

INPUT EVIDENCE:

The study develops a user profiling model based on social-media behavior for personalized recommendations, but the abstract does not describe which user attributes are represented in the profile.

EXPECTED OUTPUT:

[
  {
    "id": "EX8",
    "summary": "The study develops behavior-based user profiles for recommendation, but it is unclear whether the profiles contain interpretable personal interest areas.",
    "decision": "Uncertain",
    "confidence": 0.55,
    "matched_inclusion_criteria": [],
    "matched_exclusion_criteria": [],
    "needs_human_review": true,
    "rationale": "User profiling and recommendation are present, but IC1 cannot be confirmed because the profile attributes are not described as personal interest areas. EC4 cannot be confirmed either because this may be user-level profiling rather than document classification. Full-text review is required."
  }
]


==================================================
11. FINAL PRIORITY RULE
==================================================

The screening priority is:

CLEARLY IRRELEVANT
→ Exclude.

CLEARLY ABOUT PERSONAL INTERESTS AND SATISFIES IC1 + IC2
→ Include.

POTENTIALLY RELEVANT BUT ABSTRACT INFORMATION IS INSUFFICIENT
→ Uncertain.

Never use:

"the abstract does not mention it"

as the sole reason for Exclude.

When relevant information may reasonably be present in the full text, use Uncertain rather than assuming absence.`;

// Database specific column aliases (fuzzy matching registry)
const ALIASES = {
  id: ['id', 'ut', 'eid', 'no', 'sıra no', 'sira no', 'index', 'number', 'sıra', 'unique id', 'wos id', 'scopus id', 'artno'],
  title: ['title', 'ti', 'document title', 'article title', 'başlık', 'baslik', 'paper title', 'makale adı', 'makale adi', 'name'],
  abstract: ['abstract', 'ab', 'özet', 'ozet', 'summary', 'details', 'özet metin', 'abstract text'],
  authors: ['authors', 'author', 'au', 'yazar', 'yazarlar', 'author(s)', 'yazar(lar)', 'authors/yazarlar', 'creator'],
  year: ['year', 'py', 'publication year', 'yıl', 'yil', 'date of publication', 'date', 'yayın yılı', 'yayin yili']
};

// Global state
let state = {
  csvData: [],
  results: [],
  apiKey: '',
  openaiApiKey: '',
  deepseekApiKey: '',
  customApiKey: '',
  activeModels: ['gemini-3.5-flash'],
  mode: 'sync',
  fileHash: '',
  totalCount: 0,
  lastProcessedBatchIndex: -1,
  totalInputTokens: 0,
  totalOutputTokens: 0,
  totalCostUSD: 0,
  customModelSpecs: {
    modelId: 'custom-model',
    provider: 'openai',
    baseUrl: '',
    inputPrice: 0.15,
    outputPrice: 0.60
  },
  userResearchTopic: '',
  // async-only (Gemini native)
  batchJobName: '',
  batchSubmittedAt: 0,
  batchLastState: '',
  batchKeyMap: {} // key -> originalArticle
};

let analyzing = false;
let pollAbortController = null;

// ============================================================
// DOM REFERENCES
// ============================================================
const el = {
  apiKey: document.getElementById('apiKey'),
  openaiApiKey: document.getElementById('openaiApiKey'),
  deepseekApiKey: document.getElementById('deepseekApiKey'),
  customApiKey: document.getElementById('customApiKey'),
  batchSize: document.getElementById('batchSize'),
  batchSizeGroup: document.getElementById('batchSizeGroup'),
  delayBetweenBatches: document.getElementById('delayBetweenBatches'),
  delaySettingsGroup: document.getElementById('delaySettingsGroup'),
  systemPrompt: document.getElementById('systemPrompt'),
  resetSystemPromptBtn: document.getElementById('resetSystemPromptBtn'),
  inclusion: document.getElementById('inclusionCriteria'),
  exclusion: document.getElementById('exclusionCriteria'),
  csvFile: document.getElementById('csvFile'),
  analyzeBtn: document.getElementById('analyzeBtn'),
  downloadCsvBtn: document.getElementById('downloadCsvBtn'),
  downloadExcelBtn: document.getElementById('downloadExcelBtn'),
  progressSection: document.getElementById('progressSection'),
  progressBar: document.getElementById('progressBar'),
  progressText: document.getElementById('progressText'),
  resultsSection: document.getElementById('resultsSection'),
  resultsBody: document.getElementById('resultsBody'),
  rpmLimit: document.getElementById('rpmLimit'),
  rpdLimit: document.getElementById('rpdLimit'),
  tpmLimit: document.getElementById('tpmLimit'),
  dailyCapacity: document.getElementById('dailyCapacity'),
  costEstimatePanel: document.getElementById('costEstimatePanel'),
  estTotalArticles: document.getElementById('estTotalArticles'),
  estInputTokens: document.getElementById('estInputTokens'),
  estOutputTokens: document.getElementById('estOutputTokens'),
  estSyncCost: document.getElementById('estSyncCost'),
  estBatchCost: document.getElementById('estBatchCost'),
  freeTierNote: document.getElementById('freeTierNote'),
  livMode: document.getElementById('livMode'),
  livInputTokens: document.getElementById('livInputTokens'),
  livOutputTokens: document.getElementById('livOutputTokens'),
  livCost: document.getElementById('livCost'),
  livFreeTier: document.getElementById('livFreeTier'),
  filterDecision: document.getElementById('filterDecision'),
  filterSearch: document.getElementById('filterSearch'),
  filterCount: document.getElementById('filterCount'),
  resumeBanner: document.getElementById('resumeBanner'),
  resumeText: document.getElementById('resumeText'),
  resumeBtn: document.getElementById('resumeBtn'),
  discardBtn: document.getElementById('discardBtn'),
  batchJobInfo: document.getElementById('batchJobInfo'),
  batchJobName: document.getElementById('batchJobName'),
  batchJobState: document.getElementById('batchJobState'),
  includeCount: document.getElementById('includeCount'),
  excludeCount: document.getElementById('excludeCount'),
  uncertainCount: document.getElementById('uncertainCount'),
  reviewCount: document.getElementById('reviewCount'),
  totalCount: document.getElementById('totalCount'),
  userResearchTopic: document.getElementById('userResearchTopic'),
  relevanceReportBtn: document.getElementById('relevanceReportBtn'),
  reportModal: document.getElementById('reportModal'),
  closeModalBtn: document.getElementById('closeModalBtn'),
  closeModalBtn2: document.getElementById('closeModalBtn2'),
  modalReportBody: document.getElementById('modalReportBody'),
  customModelConfig: document.getElementById('customModelConfig'),
  customModelId: document.getElementById('customModelId'),
  customModelProvider: document.getElementById('customModelProvider'),
  customModelBaseUrl: document.getElementById('customModelBaseUrl'),
  customModelInputPrice: document.getElementById('customModelInputPrice'),
  customModelOutputPrice: document.getElementById('customModelOutputPrice'),
  themeToggleBtn: document.getElementById('themeToggleBtn'),
  toggleAllAbstractsBtn: document.getElementById('toggleAllAbstractsBtn')
};

// ============================================================
// FUZZY COLUMN MATCHING UTILITIES
// ============================================================
function findMatchedHeader(headers, aliases) {
  const normalize = str => str.toLowerCase().replace(/[^a-z0-9]/g, '').trim();
  const cleanAliases = aliases.map(normalize);
  
  // Exact or normalized contains match
  for (let i = 0; i < headers.length; i++) {
    const hNorm = normalize(headers[i]);
    if (cleanAliases.includes(hNorm)) return i;
  }
  // Substring matching as secondary fallback
  for (let i = 0; i < headers.length; i++) {
    const hLow = headers[i].toLowerCase().trim();
    if (aliases.some(alias => hLow.includes(alias) || alias.includes(hLow))) {
      return i;
    }
  }
  return -1;
}

// ============================================================
// INIT
// ============================================================
window.addEventListener('DOMContentLoaded', () => {
  // Load Session Keys
  const savedKey = sessionStorage.getItem(KEY_KEY);
  if (savedKey) el.apiKey.value = savedKey;
  const savedOaiKey = sessionStorage.getItem(OPENAI_KEY_KEY);
  if (savedOaiKey) el.openaiApiKey.value = savedOaiKey;
  const savedDsKey = sessionStorage.getItem(DEEPSEEK_KEY_KEY);
  if (savedDsKey) el.deepseekApiKey.value = savedDsKey;
  const savedCustomKey = sessionStorage.getItem(CUSTOM_KEY_KEY);
  if (savedCustomKey) el.customApiKey.value = savedCustomKey;

  // Load System Prompt & Criteria
  const savedSys = localStorage.getItem(SYS_PROMPT_KEY);
  if (savedSys && el.systemPrompt) {
    el.systemPrompt.value = savedSys;
  } else if (el.systemPrompt && !el.systemPrompt.value.trim()) {
    el.systemPrompt.value = DEFAULT_SYSTEM_PROMPT;
  }

  const savedInc = localStorage.getItem(INCLUSION_KEY);
  if (savedInc && el.inclusion) el.inclusion.value = savedInc;

  const savedExc = localStorage.getItem(EXCLUSION_KEY);
  if (savedExc && el.exclusion) el.exclusion.value = savedExc;
  
  const savedTopic = localStorage.getItem('gls_research_topic');
  if (savedTopic) el.userResearchTopic.value = savedTopic;

  // Restore Custom Model Config Specs
  const savedCustomSpecs = localStorage.getItem('gls_custom_specs');
  if (savedCustomSpecs) {
    try {
      state.customModelSpecs = JSON.parse(savedCustomSpecs);
      MODELS['custom'].label = `Kendi Modeliniz (${state.customModelSpecs.modelId || 'Belirtilmemiş'})`;
      MODELS['custom'].standard = { inputPrice: state.customModelSpecs.inputPrice, outputPrice: state.customModelSpecs.outputPrice };
      MODELS['custom'].batch = { inputPrice: state.customModelSpecs.inputPrice / 2, outputPrice: state.customModelSpecs.outputPrice / 2 };
      
      el.customModelId.value = state.customModelSpecs.modelId || '';
      el.customModelProvider.value = state.customModelSpecs.provider || 'openai';
      el.customModelBaseUrl.value = state.customModelSpecs.baseUrl || '';
      el.customModelInputPrice.value = state.customModelSpecs.inputPrice || 0.15;
      el.customModelOutputPrice.value = state.customModelSpecs.outputPrice || 0.60;
    } catch (e) {
      console.warn("Could not restore custom model specs", e);
    }
  }

  // Restore Active Models
  const savedActiveModels = localStorage.getItem('gls_active_models');
  if (savedActiveModels) {
    try {
      state.activeModels = JSON.parse(savedActiveModels);
    } catch(e) {
      state.activeModels = ['gemini-3.5-flash'];
    }
  }

  // Restore Mode
  const savedMode = localStorage.getItem('gls_mode');
  if (savedMode) {
    const radio = document.querySelector(`input[name="mode"][value="${savedMode}"]`);
    if (radio) radio.checked = true;
    state.mode = savedMode;
  }

  // Load Theme
  const savedTheme = localStorage.getItem('gls_theme') || 'dark';
  if (savedTheme === 'light') {
    document.body.classList.add('light-theme');
    if (el.themeToggleBtn) el.themeToggleBtn.textContent = '☀️ Gündüz Modu';
  } else {
    document.body.classList.remove('light-theme');
    if (el.themeToggleBtn) el.themeToggleBtn.textContent = '🌙 Gece Modu';
  }

  renderModelSlots();
  initListeners();
  updateApiKeyInputsVisibility();
  updateModelInfo();
  updateModeUI();
  loadResumeState();
});

// Setup dynamic listeners
function initListeners() {
  el.apiKey.addEventListener('change', () => sessionStorage.setItem(KEY_KEY, el.apiKey.value.trim()));
  el.openaiApiKey.addEventListener('change', () => sessionStorage.setItem(OPENAI_KEY_KEY, el.openaiApiKey.value.trim()));
  el.deepseekApiKey.addEventListener('change', () => sessionStorage.setItem(DEEPSEEK_KEY_KEY, el.deepseekApiKey.value.trim()));
  el.customApiKey.addEventListener('change', () => sessionStorage.setItem(CUSTOM_KEY_KEY, el.customApiKey.value.trim()));
  
  if (el.systemPrompt) {
    el.systemPrompt.addEventListener('input', () => {
      localStorage.setItem(SYS_PROMPT_KEY, el.systemPrompt.value);
      updateCostEstimate();
    });
  }

  if (el.resetSystemPromptBtn) {
    el.resetSystemPromptBtn.addEventListener('click', () => {
      if (confirm('Sistem promptunu varsayılan SLR promptuna sıfırlamak istediğinize emin misiniz?')) {
        el.systemPrompt.value = DEFAULT_SYSTEM_PROMPT;
        localStorage.setItem(SYS_PROMPT_KEY, DEFAULT_SYSTEM_PROMPT);
        updateCostEstimate();
        showSuccess('Sistem promptu varsayılana sıfırlandı.');
      }
    });
  }

  el.inclusion.addEventListener('input', () => {
    localStorage.setItem(INCLUSION_KEY, el.inclusion.value);
    updateCostEstimate();
  });
  el.exclusion.addEventListener('input', () => {
    localStorage.setItem(EXCLUSION_KEY, el.exclusion.value);
    updateCostEstimate();
  });
  el.userResearchTopic.addEventListener('change', () => {
    localStorage.setItem('gls_research_topic', el.userResearchTopic.value);
    updateCostEstimate();
  });

  document.querySelectorAll('input[name="mode"]').forEach(r => {
    r.addEventListener('change', () => {
      state.mode = document.querySelector('input[name="mode"]:checked').value;
      localStorage.setItem('gls_mode', state.mode);
      updateModeUI();
      updateCostEstimate();
    });
  });

  el.batchSize.addEventListener('input', updateCostEstimate);

  // Custom model specs updates
  const updateCustomSpecs = () => {
    state.customModelSpecs.modelId = el.customModelId.value.trim() || 'custom-model';
    state.customModelSpecs.provider = el.customModelProvider.value;
    state.customModelSpecs.baseUrl = el.customModelBaseUrl.value.trim();
    state.customModelSpecs.inputPrice = parseFloat(el.customModelInputPrice.value) || 0;
    state.customModelSpecs.outputPrice = parseFloat(el.customModelOutputPrice.value) || 0;
    
    localStorage.setItem('gls_custom_specs', JSON.stringify(state.customModelSpecs));
    
    // Update local registry
    MODELS['custom'].label = `Kendi Modeliniz (${state.customModelSpecs.modelId})`;
    MODELS['custom'].standard = { inputPrice: state.customModelSpecs.inputPrice, outputPrice: state.customModelSpecs.outputPrice };
    MODELS['custom'].batch = { inputPrice: state.customModelSpecs.inputPrice / 2, outputPrice: state.customModelSpecs.outputPrice / 2 };
    
    // Update dropdown layouts
    const currentActive = [...state.activeModels];
    renderModelSlots();
    state.activeModels = currentActive;
    updateApiKeyInputsVisibility();
    updateModelInfo();
    updateCostEstimate();
  };

  [el.customModelId, el.customModelProvider, el.customModelBaseUrl, el.customModelInputPrice, el.customModelOutputPrice].forEach(input => {
    input.addEventListener('input', updateCustomSpecs);
  });

  // Modal Closures
  [el.closeModalBtn, el.closeModalBtn2].forEach(btn => {
    btn.addEventListener('click', () => el.reportModal.style.display = 'none');
  });

  el.relevanceReportBtn.addEventListener('click', showRelevanceReport);

  // Theme Toggle
  if (el.themeToggleBtn) {
    el.themeToggleBtn.addEventListener('click', () => {
      const isLight = document.body.classList.toggle('light-theme');
      localStorage.setItem('gls_theme', isLight ? 'light' : 'dark');
      el.themeToggleBtn.textContent = isLight ? '☀️ Gündüz Modu' : '🌙 Gece Modu';
    });
  }

  // Global Toggle All Abstracts
  let allAbstractsExpanded = false;
  if (el.toggleAllAbstractsBtn) {
    el.toggleAllAbstractsBtn.addEventListener('click', () => {
      allAbstractsExpanded = !allAbstractsExpanded;
      const containers = document.querySelectorAll('.collapsible-text-container');
      containers.forEach(container => {
        const previewSpan = container.querySelector('.text-preview');
        const fullSpan = container.querySelector('.text-full');
        const toggleBtn = container.querySelector('.btn-toggle-text');
        
        if (allAbstractsExpanded) {
          container.classList.remove('collapsed');
          if (previewSpan) previewSpan.style.display = 'none';
          if (fullSpan) fullSpan.style.display = 'inline';
          if (toggleBtn) toggleBtn.textContent = ' (daha az göster)';
        } else {
          container.classList.add('collapsed');
          if (previewSpan) previewSpan.style.display = 'inline';
          if (fullSpan) fullSpan.style.display = 'none';
          if (toggleBtn) toggleBtn.textContent = ' (devamını göster)';
        }
      });
      el.toggleAllAbstractsBtn.textContent = allAbstractsExpanded ? '↕️ Tüm Özetleri Kapat' : '↕️ Tüm Özetleri Aç';
    });
  }
}

// Render dynamic model drop-downs
function renderModelSlots() {
  const container = document.getElementById('modelSlotsContainer');
  container.innerHTML = '';
  
  state.activeModels.forEach((modelId, idx) => {
    const row = document.createElement('div');
    row.className = 'model-slot-row';
    row.style.marginBottom = '12px';
    
    const label = document.createElement('span');
    label.className = 'slot-label';
    label.textContent = idx === 0 ? 'Model 1 (Zorunlu / Birincil):' : `Model ${idx + 1} (Opsiyonel):`;
    
    const select = document.createElement('select');
    select.className = 'model-select-control';
    select.id = `modelSelect${idx + 1}`;
    select.style.padding = '10px';
    select.style.width = '100%';
    select.style.borderRadius = '8px';
    
    Object.entries(MODELS).forEach(([mId, mInfo]) => {
      const opt = document.createElement('option');
      opt.value = mId;
      opt.textContent = mInfo.label;
      if (mId === modelId) opt.selected = true;
      select.appendChild(opt);
    });
    
    select.addEventListener('change', (e) => {
      state.activeModels[idx] = e.target.value;
      localStorage.setItem('gls_active_models', JSON.stringify(state.activeModels));
      updateApiKeyInputsVisibility();
      updateModelInfo();
      updateCostEstimate();
    });
    
    row.appendChild(label);
    row.appendChild(select);
    
    if (idx > 0) {
      const removeBtn = document.createElement('button');
      removeBtn.type = 'button';
      removeBtn.className = 'btn-remove-slot';
      removeBtn.innerHTML = '&times;';
      removeBtn.addEventListener('click', () => {
        state.activeModels.splice(idx, 1);
        localStorage.setItem('gls_active_models', JSON.stringify(state.activeModels));
        renderModelSlots();
        updateApiKeyInputsVisibility();
        updateModelInfo();
        updateCostEstimate();
      });
      row.appendChild(removeBtn);
    }
    
    container.appendChild(row);
  });
  
  const addBtn = document.getElementById('addModelSlotBtn');
  if (state.activeModels.length >= 3) {
    addBtn.style.display = 'none';
  } else {
    addBtn.style.display = 'inline-flex';
  }
}

document.getElementById('addModelSlotBtn').addEventListener('click', () => {
  if (state.activeModels.length < 3) {
    // Select first Gemini/available model that is not already chosen
    const defaults = ['gpt-4o-mini', 'gemini-2.5-flash', 'deepseekv4pro'];
    const chosen = defaults.find(d => !state.activeModels.includes(d)) || 'gemini-3.5-flash';
    state.activeModels.push(chosen);
    localStorage.setItem('gls_active_models', JSON.stringify(state.activeModels));
    renderModelSlots();
    updateApiKeyInputsVisibility();
    updateModelInfo();
    updateCostEstimate();
  }
});

// Toggle Dynamic API Key fields
function updateApiKeyInputsVisibility() {
  const hasGemini = state.activeModels.some(m => m.startsWith('gemini') || (m === 'custom' && state.customModelSpecs.provider === 'gemini'));
  const hasOpenai = state.activeModels.some(m => m.startsWith('gpt') || (m === 'custom' && state.customModelSpecs.provider === 'openai'));
  const hasDeepseek = state.activeModels.some(m => m === 'deepseekv4pro' || (m === 'custom' && state.customModelSpecs.provider === 'deepseek'));
  const hasCustom = state.activeModels.includes('custom');
  
  document.getElementById('geminiKeyGroup').style.display = hasGemini ? 'block' : 'none';
  document.getElementById('openaiKeyGroup').style.display = hasOpenai ? 'block' : 'none';
  document.getElementById('deepseekKeyGroup').style.display = hasDeepseek ? 'block' : 'none';
  document.getElementById('customKeyGroup').style.display = (hasCustom && !['openai', 'gemini', 'deepseek'].includes(state.customModelSpecs.provider)) ? 'block' : 'none';
  
  el.customModelConfig.style.display = hasCustom ? 'block' : 'none';
  
  // Enforce Sync mode if non-Gemini is selected
  const allGemini = state.activeModels.every(m => m.startsWith('gemini'));
  const asyncRadio = document.querySelector('input[name="mode"][value="async"]');
  const syncRadio = document.querySelector('input[name="mode"][value="sync"]');
  if (!allGemini) {
    asyncRadio.disabled = true;
    if (state.mode === 'async') {
      syncRadio.checked = true;
      state.mode = 'sync';
      updateModeUI();
    }
  } else {
    asyncRadio.disabled = false;
  }
}

// ============================================================
// MODEL INFO & COST UI
// ============================================================
function updateModelInfo() {
  // Model limits reflect the first (primary) selected model
  const primaryId = state.activeModels[0] || 'gemini-3.5-flash';
  const m = MODELS[primaryId] || MODELS['gemini-3.5-flash'];
  
  el.rpmLimit.textContent = m.rpm > 0 ? m.rpm : 'Paid / Sınırsız';
  el.rpdLimit.textContent = m.rpd > 0 ? m.rpd.toLocaleString() : 'Paid / Sınırsız';
  el.tpmLimit.textContent = m.tpm === Infinity ? 'Sınırsız' : (m.tpm > 0 ? (m.tpm/1000) + 'K' : '-');

  const batchSize = parseInt(el.batchSize.value) || 5;
  if (m.rpd > 0) {
    const dailyCap = m.rpd * batchSize;
    el.dailyCapacity.textContent = `~${dailyCap.toLocaleString()} makale/gün (sync)`;
  } else {
    el.dailyCapacity.textContent = 'Limit yok / Dynamic API';
  }
}

function updateModeUI() {
  const isSync = state.mode === 'sync';
  el.batchSizeGroup.style.display = isSync ? 'block' : 'none';
  el.delaySettingsGroup.style.display = isSync ? 'block' : 'none';
}

// ============================================================
// PROMPT BUILDING
// ============================================================
function getCriteriaCodes() {
  const ic = el.inclusion.value.split('\n').map(s => s.trim()).filter(Boolean);
  const ec = el.exclusion.value.split('\n').map(s => s.trim()).filter(Boolean);
  return {
    inclusion: ic.map((text, i) => ({ code: `IC${i+1}`, text })),
    exclusion: ec.map((text, i) => ({ code: `EC${i+1}`, text }))
  };
}

function buildSystemInstructions() {
  const { inclusion, exclusion } = getCriteriaCodes();
  const sys = (el.systemPrompt ? el.systemPrompt.value : document.getElementById('systemPrompt').value).trim();
  const userTopic = el.userResearchTopic.value.trim();

  let txt = sys;

  // Append criteria from the UI textareas if defined to ensure user edits are explicitly provided
  if (inclusion.length > 0 || exclusion.length > 0) {
    txt += '\n\n---\n\n## 📋 KONTROL EDİLECEK GÜNCEL KODLAR VE KRİTERLER:\n';
    if (inclusion.length > 0) {
      txt += '### Dahil Etme Ölçütleri (IC):\n';
      inclusion.forEach(c => { txt += `- **${c.code}**: ${c.text}\n`; });
    }
    if (exclusion.length > 0) {
      txt += '\n### Hariç Tutma Ölçütleri (EC):\n';
      exclusion.forEach(c => { txt += `- **${c.code}**: ${c.text}\n`; });
    }
  }

  if (userTopic) {
    txt += `\n\n---\n\n## 🎯 KULLANICININ ARAŞTIRMA KONUSU & KAPSAMI (ZORUNLU KIYAS):
Konu/Özet: ${userTopic}

Kritik Görev: Makaleyi kullanıcının araştırma konusuyla karşılaştırarak yakınlık skorunu (relevance_score: 0.0 ile 1.0 arası) ve gerekçesini (relevance_rationale) de her kayıt için JSON çıktısına ekle.

BENZERLİK VE İLGİ PUANLAMA KURALLARI:
1. ANA ODAK ESASLI PUANLAMA: Puanlamayı yaparken makalenin dolaylı veya yan çıkarımlarına değil, doğrudan ANA ODAĞINA (core focus) bakmalısın. Sadece makalede araç olarak kullanılan veya arka planda değinilen dolaylı kelimelere yüksek puan verme.
2. PUANLAMA ÖLÇEĞİ:
   - 0.8 - 1.0 (Çok Yüksek İlgi): Çalışmanın temel amacı, yöntemi veya ana katkısı doğrudan kullanıcının konusuyla çakışıyorsa.
   - 0.5 - 0.7 (Orta İlgi): Çalışmanın ana odağı farklı olsa da önemli bir bölümü veya uygulanan yöntemi kullanıcının konusuyla doğrudan ilgiliyse.
   - 0.1 - 0.4 (Düşük/Dolaylı İlgi): Konu sadece dolaylı olarak geçiyorsa, yan bir araç olarak kullanılıyorsa ya da sadece arka planda/güvenlik/düzenleme boyutunda tartışılıyorsa.
   - 0.0 (Alakasız): Makalenin konuyla doğrudan ya da dolaylı hiçbir ilgisi yoksa.
3. KARAR TUTARLILIĞI: Genellikle dahil etme/hariç tutma kararlarıyla ilgi puanları tutarlı olmalıdır. Bir makale Exclude edilmişse, kullanıcının araştırma konusuna olan ilgi skoru da genellikle düşük (0.0 - 0.4 arası) olmalıdır. Çelişkili yüksek skorlar verme.`;
  }

  return txt;
}

function buildBatchPrompt(articles, instructions) {
  let p = instructions + '\n\n---\n\n## DEĞERLENDİRİLECEK MAKALELER:\n\n';
  articles.forEach(a => {
    p += `### id: ${a.ID}\n`;
    p += `Başlık: ${a.Title}\n`;
    if (a.Year) p += `Yıl: ${a.Year}\n`;
    if (a.Authors) p += `Yazar(lar): ${a.Authors}\n`;
    p += `Özet: ${a.Abstract}\n\n`;
  });
  p += `\nLütfen yukarıdaki ${articles.length} makale için JSON array veya { "results": [...] } formatında çıktı döndür.`;
  return p;
}

// ============================================================
// FILE PARSING (CSV / TSV / Excel)
// ============================================================
function detectDelimiter(text) {
  const firstLine = text.split('\n')[0] || '';
  const counts = {
    '\t': (firstLine.match(/\t/g) || []).length,
    ',': (firstLine.match(/,/g) || []).length,
    ';': (firstLine.match(/;/g) || []).length
  };
  let max = 0, best = '\t';
  for (const d in counts) {
    if (counts[d] > max) { max = counts[d]; best = d; }
  }
  return best;
}

function parseCSVLine(line, delimiter) {
  const result = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"' && line[i+1] === '"') { cur += '"'; i++; }
      else if (ch === '"') { inQuotes = false; }
      else cur += ch;
    } else {
      if (ch === '"') inQuotes = true;
      else if (ch === delimiter) { result.push(cur); cur = ''; }
      else cur += ch;
    }
  }
  result.push(cur);
  return result;
}

function parseCSV(text) {
  const delimiter = detectDelimiter(text);
  const rawRows = [];
  let buf = '';
  let inQ = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (ch === '"') inQ = !inQ;
    if (ch === '\n' && !inQ) {
      if (buf.trim()) rawRows.push(buf);
      buf = '';
    } else buf += ch;
  }
  if (buf.trim()) rawRows.push(buf);

  if (rawRows.length < 2) return [];

  const headers = parseCSVLine(rawRows[0], delimiter).map(h => h.trim().replace(/^"|"$/g, ''));
  
  // Fuzzy matched mapping
  const idx = {
    id: findMatchedHeader(headers, ALIASES.id),
    title: findMatchedHeader(headers, ALIASES.title),
    abstract: findMatchedHeader(headers, ALIASES.abstract),
    authors: findMatchedHeader(headers, ALIASES.authors),
    year: findMatchedHeader(headers, ALIASES.year)
  };

  if (idx.title === -1 || idx.abstract === -1) {
    throw new Error('Dosyada Title ve Abstract sütunları algılanamadı! Başlık isimlerinin TI, AB veya Başlık, Özet içerdiğinden emin olun.');
  }

  const data = [];
  for (let i = 1; i < rawRows.length; i++) {
    const v = parseCSVLine(rawRows[i], delimiter);
    const row = {
      ID: idx.id !== -1 && v[idx.id] ? v[idx.id].trim() : String(i),
      Title: idx.title !== -1 && v[idx.title] ? v[idx.title].trim() : '',
      Abstract: idx.abstract !== -1 && v[idx.abstract] ? v[idx.abstract].trim() : '',
      Authors: idx.authors !== -1 && v[idx.authors] ? v[idx.authors].trim() : '',
      Year: idx.year !== -1 && v[idx.year] ? v[idx.year].trim() : ''
    };
    if (row.Title || row.Abstract) data.push(row);
  }
  return data;
}

function parseExcel(arrayBuffer) {
  const wb = XLSX.read(arrayBuffer, { type: 'array' });
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const json = XLSX.utils.sheet_to_json(sheet);
  if (!json.length) return [];

  const headers = Object.keys(json[0]);
  
  const idCol = headers[findMatchedHeader(headers, ALIASES.id)];
  const tiCol = headers[findMatchedHeader(headers, ALIASES.title)];
  const abCol = headers[findMatchedHeader(headers, ALIASES.abstract)];
  const auCol = headers[findMatchedHeader(headers, ALIASES.authors)];
  const yrCol = headers[findMatchedHeader(headers, ALIASES.year)];

  if (!tiCol || !abCol) {
    throw new Error(`Excel dosyasında Title ve Abstract sütunları algılanamadı!\nAlgılanan sütunlar: ${headers.slice(0, 10).join(', ')}`);
  }

  return json.map((row, i) => ({
    ID: idCol ? String(row[idCol] || (i + 1)) : String(i + 1),
    Title: String(row[tiCol] || '').trim(),
    Abstract: String(row[abCol] || '').trim(),
    Authors: auCol ? String(row[auCol] || '').trim() : '',
    Year: yrCol ? String(row[yrCol] || '').trim() : ''
  })).filter(r => r.Title || r.Abstract);
}

// File Input trigger
el.csvFile.addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  try {
    const isExcel = /\.(xlsx|xls)$/i.test(file.name);
    if (isExcel) {
      state.csvData = parseExcel(await file.arrayBuffer());
    } else {
      state.csvData = parseCSV(await file.text());
    }
    if (!state.csvData.length) throw new Error('Dosya boş veya uyumsuz!');

    state.totalCount = state.csvData.length;
    state.fileHash = await hashString(JSON.stringify(state.csvData.map(a => a.ID + a.Title)));

    showSuccess(`${state.csvData.length} makale başarıyla yüklendi.`);
    el.analyzeBtn.disabled = false;
    updateCostEstimate();
  } catch (err) {
    showError(err.message);
    el.analyzeBtn.disabled = true;
  }
});

async function hashString(s) {
  const buf = new TextEncoder().encode(s);
  const hash = await crypto.subtle.digest('SHA-256', buf);
  return Array.from(new Uint8Array(hash)).slice(0, 8).map(b => b.toString(16).padStart(2,'0')).join('');
}

// ============================================================
// COST ESTIMATION (PRE-ANALYSIS)
// ============================================================
function estimateTokens(text) {
  return Math.ceil(text.length / 4);
}

function updateCostEstimate() {
  if (!state.csvData.length) {
    el.costEstimatePanel.style.display = 'none';
    return;
  }
  
  const instructions = buildSystemInstructions();
  const instructionTokens = estimateTokens(instructions);
  const batchSize = parseInt(el.batchSize.value) || 5;
  const numBatches = Math.ceil(state.csvData.length / batchSize);
  
  const avgArticleTokens = state.csvData.reduce((s, a) =>
    s + estimateTokens(a.Title + a.Abstract + a.Year), 0) / state.csvData.length;
    
  const totalArticles = state.csvData.length;
  const avgOutputPerArticle = 250; 
  
  let totalSyncCost = 0;
  let totalBatchCost = 0;
  
  let syncInputTokensSum = 0;
  let batchInputTokensSum = 0;
  let totalOutputTokensSum = totalArticles * avgOutputPerArticle * state.activeModels.length;

  state.activeModels.forEach(modelId => {
    const m = MODELS[modelId] || MODELS['gemini-3.5-flash'];
    
    // Sync tokens for this model
    const syncInputTokens = numBatches * instructionTokens + totalArticles * avgArticleTokens;
    syncInputTokensSum += syncInputTokens;
    totalSyncCost += (syncInputTokens/1e6)*m.standard.inputPrice + (totalArticles*avgOutputPerArticle/1e6)*m.standard.outputPrice;
    
    // Async tokens (Gemini only)
    const asyncInputTokens = totalArticles * (instructionTokens + avgArticleTokens);
    batchInputTokensSum += asyncInputTokens;
    totalBatchCost += (asyncInputTokens/1e6)*m.batch.inputPrice + (totalArticles*avgOutputPerArticle/1e6)*m.batch.outputPrice;
  });

  el.costEstimatePanel.style.display = 'block';
  el.estTotalArticles.textContent = totalArticles.toLocaleString();
  el.estInputTokens.textContent = `~${formatTokens(state.mode === 'async' ? batchInputTokensSum : syncInputTokensSum)}`;
  el.estOutputTokens.textContent = `~${formatTokens(totalOutputTokensSum)}`;

  el.estSyncCost.textContent = formatCost(totalSyncCost) + (state.mode === 'sync' ? ' (Seçili)' : '');
  el.estBatchCost.textContent = formatCost(totalBatchCost) + (state.mode === 'async' ? ' (Seçili)' : '');

  const hasPaid = state.activeModels.some(m => !MODELS[m]?.freeTierAvailable);
  if (hasPaid) {
    el.freeTierNote.textContent = '⚠️ Seçili modellerden bazıları ücretlidir. Kotanız aşılırsa faturalandırılırsınız.';
  } else {
    el.freeTierNote.textContent = '✓ Seçili modeller ücretsiz limitlere sahiptir.';
  }
}

function formatTokens(n) {
  if (n >= 1e6) return (n/1e6).toFixed(2) + 'M';
  if (n >= 1e3) return (n/1e3).toFixed(1) + 'K';
  return Math.round(n).toString();
}

function formatCost(usd) {
  if (usd === 0) return '$0.00';
  if (usd < 0.01) return '$' + usd.toFixed(4);
  return '$' + usd.toFixed(2);
}

// ============================================================
// LIVE COST PANEL
// ============================================================
function updateLiveCost() {
  const isFree = state.activeModels.every(m => MODELS[m]?.freeTierAvailable);
  el.livMode.textContent = state.mode === 'async' ? 'Async (Batch -50%)' : 'Sync (Standard)';
  el.livInputTokens.textContent = formatTokens(state.totalInputTokens);
  el.livOutputTokens.textContent = formatTokens(state.totalOutputTokens);
  el.livCost.textContent = formatCost(state.totalCostUSD);
  el.livFreeTier.textContent = isFree ? '✓ Evet (Ücretsiz limitler)' : '✗ Bazı modeller ücretli';
}

function accumulateCost(inputTokens, outputTokens, tier, modelId) {
  const m = MODELS[modelId] || MODELS['gemini-3.5-flash'];
  const p = m[tier] || m.standard;
  state.totalInputTokens += inputTokens;
  state.totalOutputTokens += outputTokens;
  state.totalCostUSD += (inputTokens/1e6)*p.inputPrice + (outputTokens/1e6)*p.outputPrice;
}

// ============================================================
// UNIVERSAL API CALL ROUTER
// ============================================================
async function callModelAPI(prompt, modelId) {
  const isGemini = modelId.startsWith('gemini') || (modelId === 'custom' && state.customModelSpecs.provider === 'gemini');
  const isDeepseek = modelId === 'deepseekv4pro' || (modelId === 'custom' && state.customModelSpecs.provider === 'deepseek');
  const isOpenai = modelId.startsWith('gpt') || (modelId === 'custom' && state.customModelSpecs.provider === 'openai');
  
  if (isGemini) {
    const apiModelId = modelId === 'custom' ? state.customModelSpecs.modelId : MODELS[modelId].apiModelId;
    return await callGeminiAPI(prompt, apiModelId);
  } else if (isDeepseek) {
    const apiModelId = modelId === 'custom' ? state.customModelSpecs.modelId : MODELS[modelId].apiModelId;
    return await callDeepseekAPI(prompt, apiModelId);
  } else if (isOpenai) {
    const apiModelId = modelId === 'custom' ? state.customModelSpecs.modelId : MODELS[modelId].apiModelId;
    return await callOpenaiAPI(prompt, apiModelId);
  } else {
    throw new Error(`Bilinmeyen API Sağlayıcısı: ${modelId}`);
  }
}

async function callGeminiAPI(prompt, apiModelId, retry = 0) {
  const key = sessionStorage.getItem(KEY_KEY) || el.apiKey.value.trim();
  if (!key) throw new Error('Gemini API Key eksik!');

  let baseUrl = 'https://generativelanguage.googleapis.com/v1beta';
  if (state.activeModels.includes('custom') && state.customModelSpecs.provider === 'gemini' && state.customModelSpecs.baseUrl) {
    baseUrl = state.customModelSpecs.baseUrl;
  }
  const url = `${baseUrl}/models/${apiModelId}:generateContent?key=${key}`;
  
  const body = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: {
      temperature: 0.2,
      topK: 40,
      topP: 0.95,
      maxOutputTokens: 8192,
      responseMimeType: 'application/json'
    }
  };
  try {
    const resp = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    if (!resp.ok) {
      const errData = await resp.json().catch(() => ({}));
      if ((resp.status === 429 || resp.status === 503) && retry < 5) {
        const wait = Math.pow(2, retry) * 2;
        await sleep(wait * 1000);
        return callGeminiAPI(prompt, apiModelId, retry + 1);
      }
      throw new Error(`Gemini API ${resp.status}: ${errData.error?.message || resp.statusText}`);
    }
    const data = await resp.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    const inT = data.usageMetadata?.promptTokenCount || 0;
    const outT = data.usageMetadata?.candidatesTokenCount || 0;
    return { text, usage: { promptTokens: inT, completionTokens: outT } };
  } catch (err) {
    if (retry < 5 && /fetch|network/i.test(err.message)) {
      const wait = Math.pow(2, retry) * 2;
      await sleep(wait * 1000);
      return callGeminiAPI(prompt, apiModelId, retry + 1);
    }
    throw err;
  }
}

async function callOpenaiAPI(prompt, apiModelId, retry = 0) {
  const key = sessionStorage.getItem(OPENAI_KEY_KEY) || el.openaiApiKey.value.trim() || sessionStorage.getItem(CUSTOM_KEY_KEY) || el.customApiKey.value.trim();
  if (!key) throw new Error('OpenAI API Key eksik!');
  
  let baseUrl = 'https://api.openai.com/v1';
  if (state.activeModels.includes('custom') && state.customModelSpecs.provider === 'openai' && state.customModelSpecs.baseUrl) {
    baseUrl = state.customModelSpecs.baseUrl;
  }
  const url = `${baseUrl}/chat/completions`;
  const body = {
    model: apiModelId,
    messages: [{ role: 'user', content: prompt }],
    response_format: { type: 'json_object' },
    temperature: 0.2
  };
  try {
    const resp = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${key}`
      },
      body: JSON.stringify(body)
    });
    if (!resp.ok) {
      const errData = await resp.json().catch(() => ({}));
      if ((resp.status === 429 || resp.status === 503) && retry < 5) {
        const wait = Math.pow(2, retry) * 2;
        await sleep(wait * 1000);
        return callOpenaiAPI(prompt, apiModelId, retry + 1);
      }
      throw new Error(`OpenAI API ${resp.status}: ${errData.error?.message || resp.statusText}`);
    }
    const data = await resp.json();
    const text = data.choices?.[0]?.message?.content || '';
    const inT = data.usage?.prompt_tokens || 0;
    const outT = data.usage?.completion_tokens || 0;
    return { text, usage: { promptTokens: inT, completionTokens: outT } };
  } catch (err) {
    if (retry < 5 && /fetch|network/i.test(err.message)) {
      const wait = Math.pow(2, retry) * 2;
      await sleep(wait * 1000);
      return callOpenaiAPI(prompt, apiModelId, retry + 1);
    }
    throw err;
  }
}

async function callDeepseekAPI(prompt, apiModelId, retry = 0) {
  const key = sessionStorage.getItem(DEEPSEEK_KEY_KEY) || el.deepseekApiKey.value.trim() || sessionStorage.getItem(CUSTOM_KEY_KEY) || el.customApiKey.value.trim();
  if (!key) throw new Error('DeepSeek API Key eksik!');
  
  let baseUrl = 'https://api.deepseek.com';
  if (state.activeModels.includes('custom') && state.customModelSpecs.provider === 'deepseek' && state.customModelSpecs.baseUrl) {
    baseUrl = state.customModelSpecs.baseUrl;
  }
  const url = `${baseUrl}/chat/completions`;
  const body = {
    model: apiModelId,
    messages: [{ role: 'user', content: prompt }],
    response_format: { type: 'json_object' },
    temperature: 0.2
  };
  try {
    const resp = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${key}`
      },
      body: JSON.stringify(body)
    });
    if (!resp.ok) {
      const errData = await resp.json().catch(() => ({}));
      if ((resp.status === 429 || resp.status === 503) && retry < 5) {
        const wait = Math.pow(2, retry) * 2;
        await sleep(wait * 1000);
        return callDeepseekAPI(prompt, apiModelId, retry + 1);
      }
      throw new Error(`DeepSeek API ${resp.status}: ${errData.error?.message || resp.statusText}`);
    }
    const data = await resp.json();
    const text = data.choices?.[0]?.message?.content || '';
    const inT = data.usage?.prompt_tokens || 0;
    const outT = data.usage?.completion_tokens || 0;
    return { text, usage: { promptTokens: inT, completionTokens: outT } };
  } catch (err) {
    if (retry < 5 && /fetch|network/i.test(err.message)) {
      const wait = Math.pow(2, retry) * 2;
      await sleep(wait * 1000);
      return callDeepseekAPI(prompt, apiModelId, retry + 1);
    }
    throw err;
  }
}

// ============================================================
// ANALYSIS HANDLER
// ============================================================
el.analyzeBtn.addEventListener('click', async () => {
  // Check API keys
  state.apiKey = el.apiKey.value.trim();
  state.openaiApiKey = el.openaiApiKey.value.trim();
  state.deepseekApiKey = el.deepseekApiKey.value.trim();
  state.customApiKey = el.customApiKey.value.trim();
  
  if (!state.csvData.length) { showError('Lütfen önce dosya yükleyin!'); return; }

  // Verify that needed keys are populated
  const hasGemini = state.activeModels.some(m => m.startsWith('gemini') || (m === 'custom' && state.customModelSpecs.provider === 'gemini'));
  const hasOpenai = state.activeModels.some(m => m.startsWith('gpt') || (m === 'custom' && state.customModelSpecs.provider === 'openai'));
  const hasDeepseek = state.activeModels.some(m => m === 'deepseekv4pro' || (m === 'custom' && state.customModelSpecs.provider === 'deepseek'));
  
  if (hasGemini && !state.apiKey && !sessionStorage.getItem(KEY_KEY)) { showError('Lütfen Gemini API key girin!'); return; }
  if (hasOpenai && !state.openaiApiKey && !sessionStorage.getItem(OPENAI_KEY_KEY)) { showError('Lütfen OpenAI API key girin!'); return; }
  if (hasDeepseek && !state.deepseekApiKey && !sessionStorage.getItem(DEEPSEEK_KEY_KEY)) { showError('Lütfen DeepSeek API key girin!'); return; }

  resetAnalysisState();
  saveState();

  if (state.mode === 'async') {
    await runAsyncBatch();
  } else {
    await runSyncBatch();
  }
});

function resetAnalysisState() {
  state.results = [];
  state.lastProcessedBatchIndex = -1;
  state.totalInputTokens = 0;
  state.totalOutputTokens = 0;
  state.totalCostUSD = 0;
  state.batchJobName = '';
  state.batchSubmittedAt = 0;
  state.batchLastState = '';
  state.batchKeyMap = {};
  el.resultsBody.textContent = '';
  el.resultsSection.style.display = 'block';
  el.progressSection.style.display = 'block';
  el.progressBar.style.width = '0%';
  updateStats();
  updateLiveCost();
}

// ============================================================
// SYNC MODE: Parallel calls for selected models
// ============================================================
async function runSyncBatch() {
  analyzing = true;
  el.analyzeBtn.disabled = true;
  el.batchJobInfo.style.display = 'none';

  const batchSize = parseInt(el.batchSize.value) || 5;
  const delaySec = parseInt(el.delayBetweenBatches.value) || 5;
  const instructions = buildSystemInstructions();

  const batches = [];
  for (let i = 0; i < state.csvData.length; i += batchSize) {
    batches.push(state.csvData.slice(i, i + batchSize));
  }

  try {
    for (let bi = state.lastProcessedBatchIndex + 1; bi < batches.length; bi++) {
      const batch = batches[bi];
      el.progressText.textContent = `Batch ${bi+1}/${batches.length} işleniyor... (${state.results.length}/${state.totalCount} makale)`;

      // Query active models in parallel for this batch
      const modelPromises = state.activeModels.map(async (modelId) => {
        try {
          const prompt = buildBatchPrompt(batch, instructions);
          const response = await callModelAPI(prompt, modelId);
          
          accumulateCost(response.usage.promptTokens, response.usage.completionTokens, 'standard', modelId);
          const parsed = parseModelResponse(response.text);
          return { modelId, results: parsed, error: null };
        } catch (e) {
          console.error(`Model ${modelId} execution error:`, e);
          return { modelId, results: [], error: e.message };
        }
      });

      const modelBatchResults = await Promise.all(modelPromises);

      const hasTopic = el.userResearchTopic.value.trim().length > 0;
      const { inclusion, exclusion } = getCriteriaCodes();

      // Merge results
      const merged = batch.map(article => {
        const modelDecisions = {};
        let primaryResult = null;

        modelBatchResults.forEach(({ modelId, results, error }) => {
          const apiR = results.find(r => String(r.id) === String(article.ID)) || {
            summary: error ? `API Error: ${error}` : 'Article not found in API response',
            summary_tr: error ? `API Hatası: ${error}` : 'API yanıtında makale bulunamadı',
            decision: 'Uncertain',
            confidence: 0,
            matched_inclusion_criteria: [],
            matched_exclusion_criteria: [],
            needs_human_review: true,
            rationale: error ? `Model hatası: ${error}` : 'Yanıt ayrıştırılamadı',
            relevance_score: null,
            relevance_rationale: ''
          };

          // Client-side IC/EC validation guard
          const validatedDecision = apiR.decision || 'Uncertain';
          const matchedIC = apiR.matched_inclusion_criteria || [];
          const matchedEC = apiR.matched_exclusion_criteria || [];
          let finalDecision = validatedDecision;
          let finalConfidence = typeof apiR.confidence === 'number' ? apiR.confidence : 0;
          let finalNeedsReview = false;
          let rationale = apiR.rationale || '';

          if (finalDecision === 'Include') {
            // GUARD 1: Include requires ALL IC codes to be matched
            const allICCodes = inclusion.map(c => c.code);
            const missingICs = allICCodes.filter(ic => !matchedIC.includes(ic));
            if (missingICs.length > 0) {
              finalDecision = 'Uncertain';
              finalNeedsReview = true;
              rationale += ` [⚠️ SİSTEM UYARISI: Model Include dedi ancak ${missingICs.join(', ')} kriterleri karşılanmamış → otomatik Uncertain'a düşürüldü]`;
            }
            // GUARD 2: Include cannot have any EC matches
            if (matchedEC.length > 0) {
              finalDecision = 'Exclude';
              finalNeedsReview = true;
              rationale += ` [⚠️ SİSTEM UYARISI: Model Include dedi ancak ${matchedEC.join(', ')} hariç tutma kriterleri eşleşmiş → otomatik Exclude'a düşürüldü]`;
            }
          }

          const articleSummary = apiR.summary || apiR.summary_tr || '';
          modelDecisions[modelId] = {
            decision: finalDecision,
            confidence: finalConfidence,
            matched_inclusion_criteria: matchedIC,
            matched_exclusion_criteria: matchedEC,
            rationale: rationale,
            summary: articleSummary,
            summary_tr: articleSummary,
            relevance_score: (hasTopic && typeof apiR.relevance_score === 'number') ? apiR.relevance_score : null,
            relevance_rationale: hasTopic ? (apiR.relevance_rationale || '') : '',
            needs_human_review: finalNeedsReview || (typeof apiR.needs_human_review === 'boolean' ? apiR.needs_human_review : false)
          };

          if (modelId === state.activeModels[0]) {
            primaryResult = apiR;
          }
        });

        if (!primaryResult) {
          primaryResult = Object.values(modelDecisions)[0];
        }

        // Consensus logic
        const decisions = Object.values(modelDecisions).map(d => d.decision);
        const uniqueDecisions = [...new Set(decisions)];
        
        let consensusDecision = 'Uncertain';
        let needsHuman = false;

        if (uniqueDecisions.length === 1) {
          consensusDecision = uniqueDecisions[0];
          needsHuman = Object.values(modelDecisions).some(d => d.confidence < 0.85);
        } else {
          consensusDecision = 'Uncertain';
          needsHuman = true; // Disagreement defaults to uncertain & review
        }

        // Avg relevance score
        const relScores = Object.values(modelDecisions)
          .map(d => d.relevance_score)
          .filter(v => typeof v === 'number' && v !== null);
        const avgRelevance = (hasTopic && relScores.length > 0)
          ? relScores.reduce((sum, v) => sum + v, 0) / relScores.length
          : null;

        const consensusSummary = primaryResult.summary || primaryResult.summary_tr || '';
        return {
          id: article.ID,
          authors: article.Authors || '',
          title: article.Title,
          year: article.Year || '',
          abstract: article.Abstract,
          summary: consensusSummary,
          summary_tr: consensusSummary,
          decision: consensusDecision, // Pre-filled default decision
          confidence: primaryResult.confidence,
          matched_inclusion_criteria: primaryResult.matched_inclusion_criteria || [],
          matched_exclusion_criteria: primaryResult.matched_exclusion_criteria || [],
          needs_human_review: needsHuman,
          rationale: primaryResult.rationale || '',
          relevance_score: avgRelevance,
          relevance_rationale: hasTopic ? (primaryResult.relevance_rationale || '') : '',
          modelDecisions: modelDecisions
        };
      });

      merged.forEach(r => {
        state.results.push(r);
        appendRowToTable(r);
      });

      state.lastProcessedBatchIndex = bi;
      const pct = ((bi+1) / batches.length) * 100;
      el.progressBar.style.width = pct + '%';
      updateStats();
      updateLiveCost();
      saveState();

      if (bi < batches.length - 1 && delaySec > 0) {
        el.progressText.textContent = `Batch ${bi+1} tamamlandı. ${delaySec}s bekleniyor...`;
        await sleep(delaySec * 1000);
      }
    }
    el.progressText.textContent = '✅ Analiz tamamlandı!';
    clearStateOnComplete();
  } catch (err) {
    showError('Hata: ' + err.message + ' — Sonuçlar yarıda kalmış olabilir.');
    console.error(err);
  } finally {
    analyzing = false;
    el.analyzeBtn.disabled = false;
  }
}

function parseModelResponse(text) {
  let jsonText = text.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();

  // Try direct parse first
  try {
    const parsed = JSON.parse(jsonText);
    if (Array.isArray(parsed.results)) return parsed.results;
    if (Array.isArray(parsed)) return parsed;
    return [parsed];
  } catch (e) {}

  // Find boundaries of array [...] or object {...}
  const firstBracket = jsonText.indexOf('[');
  const firstBrace = jsonText.indexOf('{');

  if (firstBracket !== -1 && (firstBrace === -1 || firstBracket < firstBrace)) {
    const lastBracket = jsonText.lastIndexOf(']');
    if (lastBracket !== -1) {
      try {
        const candidate = jsonText.substring(firstBracket, lastBracket + 1);
        const parsed = JSON.parse(candidate);
        if (Array.isArray(parsed.results)) return parsed.results;
        if (Array.isArray(parsed)) return parsed;
        return [parsed];
      } catch (e) {}
    }
  }

  if (firstBrace !== -1) {
    const lastBrace = jsonText.lastIndexOf('}');
    if (lastBrace !== -1) {
      try {
        const candidate = jsonText.substring(firstBrace, lastBrace + 1);
        const parsed = JSON.parse(candidate);
        if (Array.isArray(parsed.results)) return parsed.results;
        if (Array.isArray(parsed)) return parsed;
        return [parsed];
      } catch (e) {}
    }
  }

  console.error('Response structure extraction error on text:', text);
  return [];
}

// ============================================================
// GEMINI NATIVE ASYNC BATCH API
// ============================================================
async function runAsyncBatch() {
  analyzing = true;
  el.analyzeBtn.disabled = true;
  el.batchJobInfo.style.display = 'block';

  try {
    const instructions = buildSystemInstructions();
    const primaryModel = state.activeModels[0] || 'gemini-3.5-flash';

    el.progressText.textContent = 'Async Batch hazırlanıyor...';
    const requests = state.csvData.map(article => {
      const key = String(article.ID);
      state.batchKeyMap[key] = article;
      return {
        key,
        request: {
          contents: [{ parts: [{ text: buildBatchPrompt([article], instructions) }] }],
          generationConfig: {
            temperature: 0.2,
            maxOutputTokens: 2048,
            responseMimeType: 'application/json'
          }
        }
      };
    });

    el.progressText.textContent = 'Batch job gönderiliyor...';
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${primaryModel}:batchGenerateContent?key=${state.apiKey}`;
    const body = {
      batch: {
        display_name: `screening-${Date.now()}`,
        input_config: { requests: { requests } }
      }
    };
    
    const resp = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    if (!resp.ok) {
      const e = await resp.json().catch(() => ({}));
      throw new Error(`Batch submit ${resp.status}: ${e.error?.message || resp.statusText}`);
    }
    const data = await resp.json();
    const jobName = data.name;

    state.batchJobName = jobName;
    state.batchSubmittedAt = Date.now();
    el.batchJobName.textContent = jobName;
    el.batchJobState.textContent = 'GÖNDERİLDİ';
    saveState();

    el.progressText.textContent = `✓ Job ${jobName} başlatıldı. Durum sorgulanıyor...`;
    await pollAndProcessBatchJob();
  } catch (err) {
    showError('Async Batch API hatası: ' + err.message);
    console.error(err);
  } finally {
    analyzing = false;
    el.analyzeBtn.disabled = false;
  }
}

async function pollAndProcessBatchJob() {
  pollAbortController = new AbortController();
  const startTime = state.batchSubmittedAt || Date.now();

  while (true) {
    if (pollAbortController.signal.aborted) {
      el.progressText.textContent = 'Polling iptal edildi.';
      return;
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/${state.batchJobName}?key=${state.apiKey}`;
    const resp = await fetch(url);
    if (!resp.ok) {
      const e = await resp.json().catch(() => ({}));
      throw new Error(`Job status fetch error ${resp.status}`);
    }
    const job = await resp.json();
    
    state.batchLastState = job.metadata?.state || 'UNKNOWN';
    el.batchJobState.textContent = state.batchLastState;
    saveState();

    const elapsedMin = Math.round((Date.now() - startTime) / 60000);
    el.progressText.textContent = `Job: ${state.batchLastState} (${elapsedMin} dk)`;

    if (state.batchLastState === 'JOB_STATE_SUCCEEDED' || state.batchLastState === 'SUCCEEDED') {
      await processBatchJobResults(job);
      return;
    }
    if (['JOB_STATE_FAILED', 'FAILED', 'JOB_STATE_CANCELLED', 'CANCELLED'].includes(state.batchLastState)) {
      throw new Error(`Job sonlandı: ${state.batchLastState}.`);
    }

    await sleep(45000); 
  }
}

async function processBatchJobResults(job) {
  el.progressText.textContent = 'Sonuçlar işleniyor...';
  const inlined = job.response?.inlinedResponses?.inlinedResponses || [];

  if (!inlined.length && job.response?.responsesFile) {
    await fetchAndProcessFile(job.response.responsesFile);
    return;
  }

  inlined.forEach(item => {
    const key = item.key;
    const article = state.batchKeyMap[key];
    if (!article) return;

    let apiResult;
    const modelId = state.activeModels[0] || 'gemini-3.5-flash';
    if (item.response?.candidates?.[0]?.content?.parts?.[0]?.text) {
      const text = item.response.candidates[0].content.parts[0].text;
      const parsed = parseModelResponse(text);
      apiResult = parsed[0] || getFallbackResult(null);
      
      if (item.response.usageMetadata) {
        accumulateCost(item.response.usageMetadata.promptTokenCount || 0,
                       item.response.usageMetadata.candidatesTokenCount || 0, 'batch', modelId);
      }
    } else {
      apiResult = getFallbackResult(item.error?.message);
    }

    const merged = mergeResultSingleModel(article, apiResult, modelId);
    state.results.push(merged);
    appendRowToTable(merged);
  });

  el.progressBar.style.width = '100%';
  el.progressText.textContent = '✅ Async batch tamamlandı!';
  updateStats();
  updateLiveCost();
  clearStateOnComplete();
}

async function fetchAndProcessFile(fileName) {
  const url = `https://generativelanguage.googleapis.com/v1beta/${fileName}:download?alt=media&key=${state.apiKey}`;
  const resp = await fetch(url);
  if (!resp.ok) throw new Error(`Output file download failed.`);
  const text = await resp.text();
  const lines = text.split('\n').filter(Boolean);
  const modelId = state.activeModels[0] || 'gemini-3.5-flash';

  lines.forEach(line => {
    try {
      const item = JSON.parse(line);
      const key = item.key;
      const article = state.batchKeyMap[key];
      if (!article) return;
      const respText = item.response?.candidates?.[0]?.content?.parts?.[0]?.text || '';
      const parsed = parseModelResponse(respText);
      const apiResult = parsed[0] || getFallbackResult(null);
      
      if (item.response?.usageMetadata) {
        accumulateCost(item.response.usageMetadata.promptTokenCount || 0,
                       item.response.usageMetadata.candidatesTokenCount || 0, 'batch', modelId);
      }
      const merged = mergeResultSingleModel(article, apiResult, modelId);
      state.results.push(merged);
      appendRowToTable(merged);
    } catch (e) {
      console.error('Line response parsing error:', e);
    }
  });
  el.progressBar.style.width = '100%';
  el.progressText.textContent = '✅ Async batch tamamlandı!';
  updateStats();
  updateLiveCost();
  clearStateOnComplete();
}

function getFallbackResult(errorMsg) {
  return {
    summary: 'Parsing error / No response received',
    summary_tr: 'Ayrıştırma hatası / Yanıt alınamadı',
    decision: 'Uncertain', confidence: 0,
    matched_inclusion_criteria: [], matched_exclusion_criteria: [],
    needs_human_review: true, rationale: errorMsg || 'Yanıt boş veya şablon dışı.',
    relevance_score: null, relevance_rationale: ''
  };
}

function mergeResultSingleModel(article, apiResult, modelId) {
  const hasTopic = el.userResearchTopic.value.trim().length > 0;
  const { inclusion } = getCriteriaCodes();

  // Client-side IC/EC validation guard
  const matchedIC = apiResult.matched_inclusion_criteria || [];
  const matchedEC = apiResult.matched_exclusion_criteria || [];
  let finalDecision = apiResult.decision || 'Uncertain';
  let finalConfidence = typeof apiResult.confidence === 'number' ? apiResult.confidence : 0;
  let finalNeedsReview = apiResult.needs_human_review === true;
  let rationale = apiResult.rationale || '';

  if (finalDecision === 'Include') {
    const allICCodes = inclusion.map(c => c.code);
    const missingICs = allICCodes.filter(ic => !matchedIC.includes(ic));
    if (missingICs.length > 0) {
      finalDecision = 'Uncertain';
      finalNeedsReview = true;
      rationale += ` [⚠️ SİSTEM UYARISI: Model Include dedi ancak ${missingICs.join(', ')} kriterleri karşılanmamış → otomatik Uncertain'a düşürüldü]`;
    }
    if (matchedEC.length > 0) {
      finalDecision = 'Exclude';
      finalNeedsReview = true;
      rationale += ` [⚠️ SİSTEM UYARISI: Model Include dedi ancak ${matchedEC.join(', ')} hariç tutma kriterleri eşleşmiş → otomatik Exclude'a düşürüldü]`;
    }
  }

  const artSummary = apiResult.summary || apiResult.summary_tr || '';
  const decisions = {};
  decisions[modelId] = {
    decision: finalDecision,
    confidence: finalConfidence,
    matched_inclusion_criteria: matchedIC,
    matched_exclusion_criteria: matchedEC,
    rationale: rationale,
    summary: artSummary,
    summary_tr: artSummary,
    relevance_score: (hasTopic && typeof apiResult.relevance_score === 'number') ? apiResult.relevance_score : null,
    relevance_rationale: hasTopic ? (apiResult.relevance_rationale || '') : '',
    needs_human_review: finalNeedsReview
  };

  return {
    id: article.ID,
    authors: article.Authors || '',
    title: article.Title,
    year: article.Year || '',
    abstract: article.Abstract,
    summary: artSummary,
    summary_tr: artSummary,
    decision: finalDecision,
    confidence: finalConfidence,
    matched_inclusion_criteria: matchedIC,
    matched_exclusion_criteria: matchedEC,
    needs_human_review: finalNeedsReview,
    rationale: rationale,
    relevance_score: (hasTopic && typeof apiResult.relevance_score === 'number') ? apiResult.relevance_score : null,
    relevance_rationale: hasTopic ? (apiResult.relevance_rationale || '') : '',
    modelDecisions: decisions
  };
}

// ============================================================
// ROW RENDERING & USER INTERACTIVE CONTROLS
// ============================================================
function renderCollapsibleCell(td, text) {
  td.textContent = '';
  if (!text) {
    td.textContent = '-';
    return;
  }
  const sentences = text.match(/[^.!?]+[.!?]+(\s|$)/g) || [text];
  if (sentences.length <= 2 && text.length < 220) {
    td.textContent = text;
    return;
  }
  const container = document.createElement('div');
  container.className = 'collapsible-text-container collapsed';
  
  const previewSpan = document.createElement('span');
  previewSpan.className = 'text-preview';
  let previewText = sentences.slice(0, 2).join('');
  if (previewText.length > 220) {
    previewText = text.substring(0, 180) + '...';
  }
  previewSpan.textContent = previewText;
  
  const fullSpan = document.createElement('span');
  fullSpan.className = 'text-full';
  fullSpan.textContent = text;
  fullSpan.style.display = 'none';
  
  const toggleBtn = document.createElement('button');
  toggleBtn.type = 'button';
  toggleBtn.className = 'btn-toggle-text';
  toggleBtn.textContent = ' (devamını göster)';
  
  toggleBtn.addEventListener('click', (e) => {
    e.preventDefault();
    const isCollapsed = container.classList.contains('collapsed');
    if (isCollapsed) {
      container.classList.remove('collapsed');
      previewSpan.style.display = 'none';
      fullSpan.style.display = 'inline';
      toggleBtn.textContent = ' (daha az göster)';
    } else {
      container.classList.add('collapsed');
      previewSpan.style.display = 'inline';
      fullSpan.style.display = 'none';
      toggleBtn.textContent = ' (devamını göster)';
    }
  });
  
  container.appendChild(previewSpan);
  container.appendChild(fullSpan);
  container.appendChild(toggleBtn);
  td.appendChild(container);
}

function appendRowToTable(r) {
  const row = document.createElement('tr');
  row.dataset.decision = r.decision;
  row.dataset.review = r.needs_human_review ? '1' : '0';

  const cellData = [
    { text: r.id, collapsible: false },
    { text: r.authors || 'Belirtilmemiş', collapsible: false },
    { text: r.title, collapsible: false },
    { text: r.year, collapsible: false },
    { text: r.abstract, collapsible: true },
    { text: r.summary || r.summary_tr, collapsible: true }
  ];
  
  cellData.forEach(c => {
    const td = document.createElement('td');
    if (c.collapsible) {
      renderCollapsibleCell(td, c.text);
    } else {
      td.textContent = c.text;
    }
    row.appendChild(td);
  });

  // Model Decisions column
  const tdMD = document.createElement('td');
  if (r.modelDecisions && Object.keys(r.modelDecisions).length > 0) {
    Object.entries(r.modelDecisions).forEach(([mId, info]) => {
      const div = document.createElement('div');
      div.className = 'model-decision-item';
      
      const label = document.createElement('span');
      label.className = 'model-decision-name';
      label.textContent = MODELS[mId]?.label.split(' (')[0] || mId;
      
      const badge = document.createElement('span');
      badge.className = `decision-badge decision-${info.decision.toLowerCase()}`;
      badge.textContent = info.decision;
      
      div.appendChild(label);
      div.appendChild(badge);
      tdMD.appendChild(div);
    });
  } else {
    const badge = document.createElement('span');
    badge.className = `decision-badge decision-${(r.decision || 'uncertain').toLowerCase()}`;
    badge.textContent = r.decision;
    tdMD.appendChild(badge);
  }
  row.appendChild(tdMD);

  // Interactive Nihai Karar Dropdown
  const tdFinal = document.createElement('td');
  const select = document.createElement('select');
  select.className = `final-decision-select select-${r.decision.toLowerCase()}`;
  
  ['Include', 'Exclude', 'Uncertain'].forEach(opt => {
    const o = document.createElement('option');
    o.value = opt;
    o.textContent = opt;
    if (r.decision === opt) o.selected = true;
    select.appendChild(o);
  });
  
  select.addEventListener('change', () => {
    r.decision = select.value;
    select.className = `final-decision-select select-${r.decision.toLowerCase()}`;
    row.dataset.decision = r.decision;
    updateStats();
    applyFilters();
    saveState();
  });
  tdFinal.appendChild(select);
  row.appendChild(tdFinal);

  // Confidence
  const tdC = document.createElement('td');
  tdC.textContent = r.confidence !== null ? r.confidence.toFixed(2) : '-';
  if (r.confidence !== null && r.confidence < 0.85) tdC.style.color = 'var(--danger)';
  row.appendChild(tdC);

  // IC
  const tdIC = document.createElement('td');
  tdIC.textContent = r.matched_inclusion_criteria.join(', ');
  row.appendChild(tdIC);

  // EC
  const tdEC = document.createElement('td');
  tdEC.textContent = r.matched_exclusion_criteria.join(', ');
  row.appendChild(tdEC);

  // Relevance Score progress bar
  const tdRel = document.createElement('td');
  if (typeof r.relevance_score === 'number') {
    const container = document.createElement('div');
    container.className = 'relevance-container';
    
    const textSpan = document.createElement('span');
    textSpan.className = 'relevance-text';
    textSpan.textContent = `${Math.round(r.relevance_score * 100)}%`;
    if (r.relevance_rationale) {
      textSpan.title = r.relevance_rationale;
    }
    
    const bgBar = document.createElement('div');
    bgBar.className = 'relevance-bar-bg';
    
    const fillBar = document.createElement('div');
    fillBar.className = 'relevance-bar-fill';
    fillBar.style.width = `${Math.round(r.relevance_score * 100)}%`;
    
    bgBar.appendChild(fillBar);
    container.appendChild(textSpan);
    container.appendChild(bgBar);
    tdRel.appendChild(container);
  } else {
    tdRel.textContent = '-';
  }
  row.appendChild(tdRel);

  // Needs review
  const tdR = document.createElement('td');
  if (r.needs_human_review) {
    const flag = document.createElement('span');
    flag.className = 'review-flag';
    flag.textContent = '👁️ Gerekli';
    tdR.appendChild(flag);
  } else {
    tdR.textContent = '-';
  }
  row.appendChild(tdR);

  // Rationale
  const tdRat = document.createElement('td');
  tdRat.textContent = r.rationale;
  row.appendChild(tdRat);

  el.resultsBody.appendChild(row);
  applyFilters();
}

function updateStats() {
  let inc = 0, exc = 0, unc = 0, rev = 0;
  state.results.forEach(r => {
    if (r.decision === 'Include') inc++;
    else if (r.decision === 'Exclude') exc++;
    else unc++;
    if (r.needs_human_review) rev++;
  });
  el.includeCount.textContent = inc;
  el.excludeCount.textContent = exc;
  el.uncertainCount.textContent = unc;
  el.reviewCount.textContent = rev;
  el.totalCount.textContent = state.results.length;

  // Toggle dynamic report button
  const userTopic = el.userResearchTopic.value.trim();
  if (state.results.length > 0 && userTopic) {
    el.relevanceReportBtn.style.display = 'inline-flex';
  } else {
    el.relevanceReportBtn.style.display = 'none';
  }

  // Toggle global toggle all abstracts button
  const hasCollapsible = document.querySelector('.collapsible-text-container') !== null;
  el.toggleAllAbstractsBtn.style.display = hasCollapsible ? 'inline-flex' : 'none';
}

// ============================================================
// FILTERING
// ============================================================
let filterTimer = null;
el.filterDecision.addEventListener('change', applyFilters);
el.filterSearch.addEventListener('input', () => {
  clearTimeout(filterTimer);
  filterTimer = setTimeout(applyFilters, 200);
});

function applyFilters() {
  const dec = el.filterDecision.value;
  const search = el.filterSearch.value.toLowerCase().trim();
  let visible = 0;
  Array.from(el.resultsBody.children).forEach(row => {
    let show = true;
    if (dec === 'review' && row.dataset.review !== '1') show = false;
    else if (dec !== 'all' && dec !== 'review' && row.dataset.decision !== dec) show = false;

    if (show && search) {
      const text = row.textContent.toLowerCase();
      if (!text.includes(search)) show = false;
    }
    row.style.display = show ? '' : 'none';
    if (show) visible++;
  });
  el.filterCount.textContent = `${visible} / ${el.resultsBody.children.length} satır`;
}

// ============================================================
// CLOSEST PAPERS (RELEVANCE) REPORT
// ============================================================
function showRelevanceReport() {
  const tbody = el.modalReportBody;
  tbody.innerHTML = '';

  // Filter out invalid relevance scores, then sort desc
  const sorted = [...state.results]
    .filter(r => typeof r.relevance_score === 'number')
    .sort((a, b) => b.relevance_score - a.relevance_score)
    .slice(0, 10);

  if (sorted.length === 0) {
    const tr = document.createElement('tr');
    const td = document.createElement('td');
    td.colSpan = 7;
    td.style.textAlign = 'center';
    td.textContent = 'Henüz benzerlik skorlaması yapılmış makale bulunamadı.';
    tr.appendChild(td);
    tbody.appendChild(tr);
  } else {
    sorted.forEach((r, index) => {
      const tr = document.createElement('tr');

      const tdIndex = document.createElement('td');
      tdIndex.textContent = String(index + 1);
      tr.appendChild(tdIndex);

      const tdId = document.createElement('td');
      tdId.textContent = r.id;
      tr.appendChild(tdId);

      const tdTitle = document.createElement('td');
      tdTitle.textContent = r.title;
      tr.appendChild(tdTitle);

      const tdYear = document.createElement('td');
      tdYear.textContent = r.year || '-';
      tr.appendChild(tdYear);

      const tdScore = document.createElement('td');
      tdScore.textContent = `${Math.round(r.relevance_score * 100)}%`;
      tdScore.style.fontWeight = '700';
      tdScore.style.color = 'var(--accent-teal)';
      tr.appendChild(tdScore);

      const tdDec = document.createElement('td');
      const badge = document.createElement('span');
      badge.className = `decision-${r.decision.toLowerCase()}`;
      badge.textContent = r.decision;
      tdDec.appendChild(badge);
      tr.appendChild(tdDec);

      const tdRat = document.createElement('td');
      tdRat.textContent = r.relevance_rationale || 'İlişki gerekçesi yazılmamış.';
      tr.appendChild(tdRat);

      tbody.appendChild(tr);
    });
  }

  el.reportModal.style.display = 'flex';
}

// ============================================================
// EXPORT EXCEL / CSV
// ============================================================
async function getPromptVersion() {
  const instr = buildSystemInstructions();
  const hash = await hashString(instr);
  return { hash, instructions: instr };
}

function buildMetadataRows(promptInfo) {
  const m = MODELS[state.activeModels[0]];
  const tier = state.mode === 'async' ? 'batch' : 'standard';
  const { inclusion, exclusion } = getCriteriaCodes();
  return [
    ['Anahtar', 'Değer'],
    ['Tarih (UTC)', new Date().toISOString()],
    ['Aktif Modeller', state.activeModels.join(', ')],
    ['Model 1 (Birincil)', state.activeModels[0]],
    ['Mod', state.mode],
    ['Tier', tier],
    ['Prompt Versiyon Hash (sha256[0:8])', promptInfo.hash],
    ['Toplam Makale Sayısı', state.totalCount],
    ['Değerlendirilen Makale Sayısı', state.results.length],
    ['Toplam Input Token', state.totalInputTokens],
    ['Toplam Output Token', state.totalOutputTokens],
    ['Toplam Tahmini Maliyet (USD)', state.totalCostUSD.toFixed(6)],
    ['', ''],
    ['Dahil Etme Kriterleri (IC):', ''],
    ...inclusion.map(c => [c.code, c.text]),
    ['', ''],
    ['Hariç Tutma Kriterleri (EC):', ''],
    ...exclusion.map(c => [c.code, c.text]),
    ['', ''],
    ['Yapay Zeka Çalışma Konusu:', ''],
    ['Konu & Özet', el.userResearchTopic.value.trim() || 'Girilmedi'],
    ['', ''],
    ['Sistem Promptu (Tam Metin):', ''],
    ['Prompt', promptInfo.instructions]
  ];
}

el.downloadCsvBtn.addEventListener('click', async () => {
  if (!state.results.length) { showError('Henüz indirilecek sonuç yok.'); return; }
  const promptInfo = await getPromptVersion();
  const meta = buildMetadataRows(promptInfo);
  const metaCsv = meta.map(([k,v]) =>
    `# ${String(k).replace(/[\r\n]/g,' ')}\t${String(v).replace(/[\r\n]/g,' ')}`
  ).join('\n');

  const headers = [
    'ID', 'Yazar(lar)', 'Başlık', 'Yıl', 'Abstract (Orijinal)', 'Özet / Summary',
    'Model Kararları', 'Nihai Karar', 'Güven', 'IC', 'EC', 'Konu İlgisi (Skor)', 'İlişki Gerekçesi', 'İnceleme', 'Gerekçe'
  ];
  
  const rows = state.results.map(r => {
    let modelDecsStr = '';
    if (r.modelDecisions) {
      modelDecsStr = Object.entries(r.modelDecisions)
        .map(([mId, info]) => `${MODELS[mId]?.label.split(' (')[0] || mId}: ${info.decision}`)
        .join('; ');
    } else {
      modelDecsStr = r.decision;
    }
    
    return [
      r.id, r.authors, r.title, r.year, r.abstract, r.summary || r.summary_tr,
      modelDecsStr, r.decision,
      r.confidence !== null ? r.confidence.toFixed(2) : '',
      r.matched_inclusion_criteria.join(';'),
      r.matched_exclusion_criteria.join(';'),
      typeof r.relevance_score === 'number' ? `${Math.round(r.relevance_score * 100)}%` : '',
      r.relevance_rationale || '',
      r.needs_human_review ? 'Yes' : 'No',
      r.rationale
    ];
  });
  
  const csv = [headers, ...rows].map(row =>
    row.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')
  ).join('\n');

  const fullCsv = metaCsv + '\n#\n' + csv;
  const blob = new Blob(['\ufeff' + fullCsv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `screening_results_${new Date().toISOString().split('T')[0]}_v${promptInfo.hash}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
});

el.downloadExcelBtn.addEventListener('click', async () => {
  if (!state.results.length) { showError('Henüz indirilecek sonuç yok.'); return; }
  const promptInfo = await getPromptVersion();

  const data = state.results.map(r => {
    let modelDecsStr = '';
    if (r.modelDecisions) {
      modelDecsStr = Object.entries(r.modelDecisions)
        .map(([mId, info]) => `${MODELS[mId]?.label.split(' (')[0] || mId}: ${info.decision}`)
        .join('; ');
    } else {
      modelDecsStr = r.decision;
    }
    
    return {
      'ID': r.id,
      'Yazar(lar)': r.authors,
      'Başlık': r.title,
      'Yıl': r.year,
      'Abstract (Orijinal)': r.abstract,
      'Özet / Summary': r.summary || r.summary_tr,
      'Model Kararları': modelDecsStr,
      'Nihai Karar': r.decision,
      'Güven': r.confidence !== null ? r.confidence.toFixed(2) : '',
      'IC': r.matched_inclusion_criteria.join(';'),
      'EC': r.matched_exclusion_criteria.join(';'),
      'Konu İlgisi (Skor)': typeof r.relevance_score === 'number' ? `${Math.round(r.relevance_score * 100)}%` : '',
      'İlişki Gerekçesi': r.relevance_rationale || '',
      'İnceleme Gerekli': r.needs_human_review ? 'Yes' : 'No',
      'Gerekçe': r.rationale,
      'Prompt Versiyon': promptInfo.hash
    };
  });
  
  const ws = XLSX.utils.json_to_sheet(data);
  ws['!cols'] = [
    { wch: 8 }, { wch: 25 }, { wch: 50 }, { wch: 8 }, { wch: 60 },
    { wch: 50 }, { wch: 30 }, { wch: 12 }, { wch: 8 }, { wch: 15 },
    { wch: 15 }, { wch: 18 }, { wch: 40 }, { wch: 12 }, { wch: 50 }, { wch: 12 }
  ];

  const metaWs = XLSX.utils.aoa_to_sheet(buildMetadataRows(promptInfo));
  metaWs['!cols'] = [{ wch: 35 }, { wch: 100 }];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Screening');
  XLSX.utils.book_append_sheet(wb, metaWs, 'Metadata');
  XLSX.writeFile(wb, `screening_results_${new Date().toISOString().split('T')[0]}_v${promptInfo.hash}.xlsx`);
});

// ============================================================
// STATE SAVING & RELOADING
// ============================================================
function saveState() {
  try {
    sessionStorage.setItem(STATE_KEY, JSON.stringify({
      mode: state.mode,
      activeModels: state.activeModels,
      customModelSpecs: state.customModelSpecs,
      fileHash: state.fileHash,
      totalCount: state.totalCount,
      results: state.results,
      lastProcessedBatchIndex: state.lastProcessedBatchIndex,
      totalInputTokens: state.totalInputTokens,
      totalOutputTokens: state.totalOutputTokens,
      totalCostUSD: state.totalCostUSD,
      batchJobName: state.batchJobName,
      batchSubmittedAt: state.batchSubmittedAt,
      batchLastState: state.batchLastState,
      batchKeyMap: state.batchKeyMap,
      csvData: state.csvData
    }));
  } catch (e) {
    console.warn('Oturum durumu kaydedilemedi:', e);
  }
}

function loadResumeState() {
  const raw = sessionStorage.getItem(STATE_KEY);
  if (!raw) return;
  try {
    const s = JSON.parse(raw);
    if (!s.results || !s.totalCount) return;

    const isAsync = s.mode === 'async' && s.batchJobName;
    const isSyncIncomplete = s.mode === 'sync' && s.results.length < s.totalCount;
    const isComplete = s.results.length >= s.totalCount && !isAsync;

    if (isComplete) return;
    if (!isAsync && !isSyncIncomplete) return;

    el.resumeBanner.style.display = 'block';
    if (isAsync) {
      const elapsedMin = Math.round((Date.now() - s.batchSubmittedAt) / 60000);
      el.resumeText.textContent = `Yarım kalan Async Batch: ${s.batchJobName} | Model: ${s.activeModels[0]} | Gönderim: ${elapsedMin} dk önce.`;
    } else {
      el.resumeText.textContent = `Yarım kalan Sync analiz: ${s.results.length}/${s.totalCount} makale işlendi.`;
    }

    el.resumeBtn.onclick = async () => {
      Object.assign(state, s);
      localStorage.setItem('gls_active_models', JSON.stringify(state.activeModels));
      
      renderModelSlots();
      updateApiKeyInputsVisibility();
      updateModelInfo();
      updateModeUI();
      
      el.resumeBanner.style.display = 'none';
      el.resultsSection.style.display = 'block';
      el.progressSection.style.display = 'block';
      el.resultsBody.textContent = '';
      
      state.results.forEach(r => appendRowToTable(r));
      updateStats();
      updateLiveCost();

      if (isAsync) {
        el.batchJobInfo.style.display = 'block';
        el.batchJobName.textContent = s.batchJobName;
        el.batchJobState.textContent = s.batchLastState;
        analyzing = true;
        try {
          await pollAndProcessBatchJob();
        } catch (err) {
          showError('Polling hatası: ' + err.message);
        } finally {
          analyzing = false;
        }
      } else {
        await runSyncBatch();
      }
    };

    el.discardBtn.onclick = () => {
      sessionStorage.removeItem(STATE_KEY);
      el.resumeBanner.style.display = 'none';
    };
  } catch (e) {
    console.warn('Oturum kurtarılamadı:', e);
  }
}

function clearStateOnComplete() {
  sessionStorage.removeItem(STATE_KEY);
}

// ============================================================
// HELPERS
// ============================================================
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

function showError(msg) {
  const div = document.createElement('div');
  div.className = 'error-message';
  div.textContent = '❌ ' + msg;
  const target = document.querySelector('.upload-section');
  target.insertBefore(div, target.firstChild);
  setTimeout(() => div.remove(), 9000);
}

function showSuccess(msg) {
  const div = document.createElement('div');
  div.className = 'success-message';
  div.textContent = '✅ ' + msg;
  const target = document.querySelector('.upload-section');
  target.insertBefore(div, target.firstChild);
  setTimeout(() => div.remove(), 5000);
}
