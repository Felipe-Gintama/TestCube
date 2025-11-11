export function buildTestTree(rows: any[]) {
  const groups: any = {};
  const tree: any[] = [];

  rows.forEach(row => {
    if (!groups[row.group_id]) {
      groups[row.group_id] = {
        id: row.group_id,
        name: row.group_name,
        parent_id: row.parent_group_id,
        cases: [],
        children: []
      };
    }

    if (row.case_id) {
      groups[row.group_id].cases.push({
        id: row.case_id,
        title: row.case_title,
        status: row.status
      });
    }
  });

  Object.values(groups).forEach((group: any) => {
    if (group.parent_id === null) {
      tree.push(group);
    } else {
      groups[group.parent_id].children.push(group);
    }
  });

  return tree;
}