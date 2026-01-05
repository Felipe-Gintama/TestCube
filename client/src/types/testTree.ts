export interface TestCaseItem {
  id: number;
  title: string;
  status?: string;
  group_id?: number;
  group_name?: string;
  assigned_to?: number;
  assigned_to_name?: string;
}

export interface TestGroupNode {
  id: number;
  name: string;
  description?: string;
  parent_id: number | null;
  cases: TestCaseItem[];
  children: TestGroupNode[];
}
