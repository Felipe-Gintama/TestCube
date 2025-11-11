export interface TestCaseItem {
  id: number;
  title: string;
  status: string;
}

export interface TestGroupNode {
  id: number;
  name: string;
  description?: string;
  parent_id: number | null;
  cases: TestCaseItem[];
  children: TestGroupNode[];
}