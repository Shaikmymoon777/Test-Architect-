
import { GoogleGenAI } from "@google/genai";
import { TestPlanData } from "../types";

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
    4. TEST CASES: Provide at least 15+ comprehensive test cases covering:
       - Positive paths (Happy path)
       - Negative paths (Edge cases, invalid inputs)
       - Boundary value analysis
       - Security/Auth scenarios
       - UI/UX responsiveness
       Present these in a Markdown TABLE with columns: ID, Component/Feature, Test Scenario, Test Steps, Expected Result, Severity (Critical/High/Medium/Low).

    SECTION DETAILS:
    # 0. Table of Contents
    # 1. Test Plan Identifier (Detailed table with metadata)
    # 2. Introduction (Deep dive into Purpose, Scope, and technical References)
    # 3. Test Items (MANDATORY: Provide a hierarchical, tree-like view of every module, component, and page identified. Use nested Markdown lists to show Parent > Child relationships and the application architecture.)
    # 4. Features to Be Tested (Grouped into Functional, Non-functional, and Security)
    # 5. Features NOT to Be Tested (Specific exclusions with reasoning)
    # 6. Test Approach / Strategy (Detailed methodology for Unit, Integration, System, Regression, and UAT)
    # 7. Test Environment (Comprehensive table for HW, SW, Network, and Tools)
    # 8. Test Data Requirements (Detailed sets: valid, invalid, large payloads, null values)
    # 9. Entry & Exit Criteria (Specific metrics like "100% of P1 bugs resolved")
    # 10. Deliverables (Complete list of artifacts)
    # 11. Roles & Responsibilities (Detailed matrix table)
    # 12. Risks & Mitigation (Analyze technical risks like API latency, race conditions, browser compatibility)
    # 13. Detailed Test Cases (15+ items in table format)

    Use professional, formal testing terminology. Ensure headers use # and ## strictly for anchor compatibility.
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
