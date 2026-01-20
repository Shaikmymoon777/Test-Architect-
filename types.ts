
export interface ProjectMetadata {
  projectName: string;
  version: string;
  date: string;
  preparedBy: string;
  approvedBy: string;
}

export type InputSource = 'url' | 'file';

export interface TestPlanData {
  metadata: ProjectMetadata;
  sourceType: InputSource;
  sourceValue: string; // URL or list of files/content snippet
  content?: string;
}

export interface HistoryItem {
  id: string;
  metadata: ProjectMetadata;
  result: string;
  updatedAt: string;
  sourceType: InputSource;
}

export enum AppState {
  METADATA = 'METADATA',
  SOURCE = 'SOURCE',
  ANALYZING = 'ANALYZING',
  RESULT = 'RESULT',
  HISTORY = 'HISTORY'
}
