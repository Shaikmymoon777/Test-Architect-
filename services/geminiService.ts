
import { GoogleGenAI } from "@google/genai";
import { TestPlanData, ProjectMetadata } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const generateTestPlan = async (data: TestPlanData): Promise<{ text: string; sources?: any[] }> => {
  const { metadata, sourceType, sourceValue } = data;

  const prompt = `
    Generate an EXTREMELY DETAILED, professional, IEEE 829 / ISTQB aligned Test Plan Documentation for the following project:
    
    PROJECT IDENTIFIER:
    - Project Name: ${metadata.projectName}
    - Version: ${metadata.version}
    - Date: ${metadata.date}
    - Prepared By: ${metadata.preparedBy}
    - Approved By: ${metadata.approvedBy}

    SOURCE ANALYSIS:
    - Source Type: ${sourceType}
    - Source Data/Context: ${sourceValue}

    DOCUMENT REQUIREMENTS:
    1. PROMPT DEPTH: For every section, do not provide generic descriptions. Analyze the source provided and list specific components, actual routes, real features, and likely technical stack details (React hooks, API types, state libraries).
    2. ORDER: Follow the standard IEEE 829 sequence exactly.
    3. TABLE OF CONTENTS: Must be provided at the very top. Use Markdown list format with bracketed links like [1. Introduction](#1-introduction).
    4. TEST CASES: Provide at least 15+ comprehensive test cases covering positive, negative, boundary, security, and UI scenarios.
    
    SECTION DETAILS:
    # 0. Table of Contents
    # 1. Test Plan Identifier
    # 2. Introduction
    # 3. Test Items (Hierarchical tree view of components)
    # 4. Features to Be Tested
    # 5. Features NOT to Be Tested
    # 6. Test Approach / Strategy
    # 7. Test Environment
    # 8. Test Data Requirements
    # 9. Entry & Exit Criteria
    # 10. Deliverables
    # 11. Roles & Responsibilities
    # 12. Risks & Mitigation
    # 13. Detailed Test Cases (Table format)

    Use professional, formal testing terminology.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt,
      config: {
        thinkingConfig: { thinkingBudget: 16000 }
      }
    });
    
    return {
      text: response.text || "Failed to generate content.",
      sources: response.candidates?.[0]?.groundingMetadata?.groundingChunks
    };
  } catch (error) {
    console.error("Error generating test plan:", error);
    throw error;
  }
};

export const updateTestPlan = async (
  currentContent: string, 
  instruction: string, 
  metadata: ProjectMetadata
): Promise<string> => {
  const prompt = `
    You are an expert QA Architect. I have an existing IEEE 829 Test Plan for the project "${metadata.projectName}".
    
    CURRENT DOCUMENT CONTENT:
    """
    ${currentContent}
    """

    USER INSTRUCTION FOR MODIFICATION:
    "${instruction}"

    TASK:
    Rewrite or modify the document according to the user instruction. 
    - Maintain the professional tone.
    - Keep the existing IEEE 829 structure unless asked to change it.
    - If asked to add something, integrate it seamlessly into the relevant section.
    - Return the ENTIRE updated document.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt,
      config: {
        thinkingConfig: { thinkingBudget: 8000 }
      }
    });
    
    return response.text || currentContent;
  } catch (error) {
    console.error("Error updating test plan:", error);
    throw error;
  }
};
