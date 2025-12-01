export interface TestCaseItem {
  id: number;
  title: string;
  status?: string;
  group_id?: number;
}

export interface TestGroupNode {
  id: number;
  name: string;
  description?: string;
  parent_id: number | null;
  cases: TestCaseItem[];
  children: TestGroupNode[];
}