import { GoogleGenAI, Type } from "@google/genai";
import { GenerationRequest, GenerationResponse, Nationality } from "../types";

export const generateEmailResponse = async (request: GenerationRequest, apiKey: string): Promise<GenerationResponse> => {
  if (!apiKey) {
    throw new Error("API Key is missing. Please enter your API key in the configuration section.");
  }

  const ai = new GoogleGenAI({ apiKey });

  const { emailContent, tone, nationality, context } = request;

  let nationalityDirectives = "";
  
  switch (nationality) {
    case Nationality.BRITISH:
      nationalityDirectives = `
        - Use British spelling (Colour, Centre, Organise).
        - Use British date formats (DD/MM/YYYY).
        - Use natural British idioms where appropriate (e.g., "Cheers", "Lovely", "Brilliant").
        - Adopt a tone typical of a UK professional (polite, perhaps slightly more reserved or dry depending on the specific tone selected).
      `;
      break;
    case Nationality.AUSTRALIAN:
      nationalityDirectives = `
        - Use British/Australian spelling (Colour, Centre, Organise).
        - Use Australian date formats (DD/MM/YYYY).
        - Use natural Australian idioms where appropriate (e.g., "No worries", "G'day" if casual, "Cheers").
        - Adopt a friendly, down-to-earth Australian tone.
      `;
      break;
    case Nationality.AMERICAN:
    default:
      nationalityDirectives = `
        - Use American spelling (Color, Center, Organize).
        - Use American date formats (MM/DD/YYYY).
        - Use natural American idioms where appropriate.
        - Adopt a standard American professional tone.
      `;
      break;
  }

  const systemInstruction = `
    You are an expert customer support and sales representative for an affiliate marketing company. 
    Your name is Alex. You are a native ${nationality} English speaker.
    
    Your Goal:
    1. Reply to the customer's email efficiently and helpfully.
    2. Maintain the requested tone perfectly.
    3. Seamlessly weave in the provided affiliate link/product info if relevant, but prioritize solving the customer's problem first.
    4. Adhere strictly to the following linguistic rules for your nationality:
    ${nationalityDirectives}
    
    Tone Guidelines:
    - Professional: Courteous, concise, respectful.
    - Casual: Friendly, using contractions, approachable.
    - Sales: High energy, emphasizing benefits, clear Call to Action (CTA).
    - Empathetic: Apologetic if needed, understanding, reassuring.

    Data to use:
    - Product: ${context.productName}
    - Affiliate Link: ${context.affiliateLink}
    - Key Points to hit: ${context.keyPoints}
  `;

  const prompt = `
    Here is the email from the customer named ${context.customerName || 'Customer'}:
    """
    ${emailContent}
    """

    Please draft a reply in a ${tone} tone.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            subject: {
              type: Type.STRING,
              description: "The subject line of the email",
            },
            body: {
              type: Type.STRING,
              description: "The HTML body of the email response. Use <br/> for line breaks.",
            },
          },
          required: ["subject", "body"],
        },
      },
    });

    const text = response.text;
    if (text) {
      // Robustly parse JSON: remove markdown code blocks if present (e.g. ```json ... ```)
      const cleanText = text.replace(/```json\n?|\n?```/g, '').trim();
      return JSON.parse(cleanText) as GenerationResponse;
    }
    
    throw new Error("No response text generated");

  } catch (error) {
    console.error("Error generating email:", error);
    throw error;
  }
};