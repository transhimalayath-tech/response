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
        - Adopt a tone typical of a UK professional.
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

  // Determine if this is a reply or a new email
  const isReply = emailContent && emailContent.trim().length > 0;

  const systemInstruction = `
    You are an expert customer support and sales representative for an affiliate marketing company. 
    Your name is Alex. You are a native ${nationality} English speaker.
    
    Your Goal:
    ${isReply ? "1. Reply to the customer's email efficiently and helpfully." : "1. Draft a new email to the customer based on the user's prompt."}
    2. Maintain the requested tone perfectly.
    3. Seamlessly weave in the provided affiliate link/product info if relevant.
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

  let prompt = "";

  if (isReply) {
    prompt = `
    Here is the email from the customer named ${context.customerName || 'Customer'}:
    """
    ${emailContent}
    """

    Specific Custom Instructions or Ideas for this response:
    """
    ${context.customInstructions || "No specific custom instructions provided. Follow standard best practices."}
    """

    Please draft a reply in a ${tone} tone.
    `;
  } else {
    prompt = `
    Draft a NEW email to a customer named ${context.customerName || 'Customer'}.
    
    The email is NOT a reply to a previous message, but a new conversation starter or update.

    Specific Instructions / Topic for this email:
    """
    ${context.customInstructions}
    """

    Please draft this new email in a ${tone} tone.
    `;
  }

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
              description: "The HTML body of the email. Use <br/> for line breaks.",
            },
          },
          required: ["subject", "body"],
        },
      },
    });

    const text = response.text;
    if (text) {
      const cleanText = text.replace(/```json\n?|\n?```/g, '').trim();
      return JSON.parse(cleanText) as GenerationResponse;
    }
    
    throw new Error("No response text generated");

  } catch (error) {
    console.error("Error generating email:", error);
    throw error;
  }
};