import OpenAI from "openai"

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

interface EvaluationResult {
  approved: boolean
  reason: string
  confidence: number
}

export async function evaluateSubmission(
  campaignTitle: string,
  guidelines: string,
  videoOutline: string | null,
  transcription: string
): Promise<EvaluationResult> {
  const prompt = `You are an AI evaluating video submissions for brand campaigns. Please analyze if this video submission aligns with the campaign requirements.

Campaign Details:
Title: ${campaignTitle}
Guidelines: ${guidelines}
${videoOutline ? `Video Outline: ${videoOutline}` : ""}

Video Transcription:
${transcription}

Please evaluate if the video content (based on transcription) aligns with the campaign requirements. Consider:
1. Does it follow the campaign guidelines?
2. Does it match the requested video outline (if provided)?
3. Is the content relevant to the campaign topic?

Respond in the following JSON format:
{
  "approved": boolean (true if content aligns well, false if it doesn't),
  "reason": string (brief explanation of decision),
  "confidence": number (0-1, how confident are you in this decision)
}
`

  const response = await openai.chat.completions.create({
    model: "gpt-4-turbo-preview",
    messages: [
      {
        role: "system",
        content:
          "You are an AI evaluating video submissions for brand campaigns. Be thorough but fair in your evaluation.",
      },
      {
        role: "user",
        content: prompt,
      },
    ],
    response_format: { type: "json_object" },
  })

  try {
    const content = response.choices[0].message.content
    if (!content) {
      throw new Error("No content in OpenAI response")
    }
    const result = JSON.parse(content) as EvaluationResult
    return result
  } catch (error) {
    console.error("Error parsing OpenAI response:", error)
    throw new Error("Failed to evaluate submission")
  }
} 