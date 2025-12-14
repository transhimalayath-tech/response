export enum Tone {
  PROFESSIONAL = 'Professional & Polished',
  CASUAL = 'Casual & Friendly',
  SALES = 'Persuasive & High Energy',
  EMPATHETIC = 'Empathetic & Support-Focused'
}

export enum Nationality {
  AMERICAN = 'American',
  BRITISH = 'British',
  AUSTRALIAN = 'Australian'
}

export interface EmailContext {
  customerName: string;
  productName: string;
  affiliateLink: string;
  keyPoints: string;
}

export interface GenerationRequest {
  emailContent: string;
  tone: Tone;
  nationality: Nationality;
  context: EmailContext;
}

export interface GenerationResponse {
  subject: string;
  body: string;
}
