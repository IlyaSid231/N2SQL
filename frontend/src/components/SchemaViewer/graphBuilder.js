import { MarkerType } from 'reactflow';

export const buildGraphElements = (fullSchema) => {
  const nodes = [];
  const edges = [];
  let nodeId = 0;
  const tableNameToId = {};

  // Узлы (таблицы)
  Object.entries(fullSchema).forEach(([tableKey, tableInfo]) => {
    const id = `node-${nodeId++}`;
    tableNameToId[tableKey] = id;

    const columnsWithFK = (tableInfo.columns || []).map(col => {
      const fk = (tableInfo.foreign_keys || []).find(fk => fk.column === col.column);
      return {
        ...col,
        foreign_key: fk ? { table: fk.references_table, column: fk.references_column } : null,
      };
    });

    nodes.push({
      id,
      type: 'tableNode',
      position: { x: 0, y: 0 },
      data: {
        tableName: tableInfo.table_name || tableKey,
        columns: columnsWithFK,
      },
    });
  });

  // Рёбра (связи)
  let edgeCounter = 0;
  Object.entries(fullSchema).forEach(([tableKey, tableInfo]) => {
    const sourceId = tableNameToId[tableKey];
    if (!sourceId) return;

    (tableInfo.relationships || []).forEach(rel => {
      const targetId = tableNameToId[rel.target_table];
      if (!targetId) return;

      if (!rel.inverse) {
        let labelText = rel.type;
        if (rel.type === '1:1') labelText = '1 : 1';
        else if (rel.type === '1:N') labelText = '1 : N';
        else if (rel.type === 'N:1') labelText = 'N : 1';
        else if (rel.type === 'N:N') labelText = 'N : N';

        const edgeId = `${sourceId}->${targetId}-${edgeCounter++}`;
        edges.push({
          id: edgeId,
          source: sourceId,
          target: targetId,
          label: labelText,
          type: 'smoothstep',
          style: { stroke: '#888', strokeWidth: 2 },
          labelStyle: { fill: '#333', fontWeight: 'bold', fontSize: 12 },
          labelBgStyle: { fill: 'white', fillOpacity: 0.9 },
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: '#888',
            width: 15,
            height: 15,
          },
        });
      }
    });
  });

  return { nodes, edges };
};