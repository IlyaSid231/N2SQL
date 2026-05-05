import React, { useMemo, useCallback } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  ReactFlowProvider,
  useNodesState,
  useEdgesState,
  addEdge,
  MarkerType,
  Handle,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Box, Typography, Paper, Chip } from '@mui/material';
import dagre from 'dagre';

// ---------------------- Кастомный узел с Handle ----------------------
const TableNode = ({ data }) => {
  return (
    <Paper
      elevation={3}
      sx={{
        minWidth: 200,
        backgroundColor: '#fff',
        borderRadius: 2,
        overflow: 'hidden',
        border: '1px solid #ccc',
        position: 'relative',
      }}
    >
      <Handle type="target" position="left" style={{ background: '#888', width: 8, height: 8 }} />
      <Box sx={{ bgcolor: 'primary.main', color: 'white', p: 1, textAlign: 'center' }}>
        <Typography variant="subtitle1" fontWeight="bold">
          {data.tableName}
        </Typography>
      </Box>
      <Box sx={{ p: 1 }}>
        {data.columns?.map((col, idx) => (
          <Box key={idx} sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 0.5, mb: 0.5 }}>
            <Box component="span" sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>{col.column}</Box>
            {col.is_primary && <Chip label="PK" size="small" color="primary" sx={{ height: 18, fontSize: '0.6rem' }} />}
            {col.foreign_key && (
              <Chip
                label={`FK → ${col.foreign_key.table}.${col.foreign_key.column}`}
                size="small"
                color="secondary"
                sx={{ height: 18, fontSize: '0.6rem' }}
              />
            )}
            <Box component="span" color="textSecondary" sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>
              ({col.type})
            </Box>
          </Box>
        ))}
      </Box>
      <Handle type="source" position="right" style={{ background: '#888', width: 8, height: 8 }} />
    </Paper>
  );
};

const nodeTypes = { tableNode: TableNode };

// ---------------------- Лейаут (dagre) ----------------------
const getLayoutedElements = (nodes, edges, direction = 'LR') => {
  if (!nodes.length) return { nodes, edges };
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));
  dagreGraph.setGraph({ rankdir: direction, nodesep: 50, ranksep: 70 });

  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { width: 220, height: 100 });
  });
  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });
  dagre.layout(dagreGraph);

  const layoutedNodes = nodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    return {
      ...node,
      position: {
        x: nodeWithPosition.x - 110,
        y: nodeWithPosition.y - 50,
      },
    };
  });
  return { nodes: layoutedNodes, edges };
};

// ---------------------- Преобразование fullSchema ----------------------
const buildGraphElements = (fullSchema) => {
  const nodes = [];
  const edges = [];
  let nodeId = 0;
  const tableNameToId = {};

  // Узлы
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

  // Рёбра с уникальными ключами
  let edgeCounter = 0;
  Object.entries(fullSchema).forEach(([tableKey, tableInfo]) => {
    const sourceId = tableNameToId[tableKey];
    if (!sourceId) return;

    (tableInfo.relationships || []).forEach(rel => {
      const targetId = tableNameToId[rel.target_table];
      if (!targetId) return;

      // Пропускаем обратные связи (inverse)
      if (!rel.inverse) {
        let labelText = rel.type;
        if (rel.type === '1:1') labelText = '1 : 1';
        else if (rel.type === '1:N') labelText = '1 : N';
        else if (rel.type === 'N:1') labelText = 'N : 1';

        // Уникальный id: source->target + счетчик + (опционально via_column)
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

// ---------------------- Основной компонент ----------------------
function SchemaViewer({ fullSchema }) {
  const { nodes: layoutedNodes, edges: layoutedEdges } = useMemo(() => {
    if (!fullSchema || Object.keys(fullSchema).length === 0) return { nodes: [], edges: [] };
    const { nodes, edges } = buildGraphElements(fullSchema);
    console.log('🏗️ Узлов:', nodes.length, 'Рёбер:', edges.length);
    if (edges.length) console.log('Пример ребра:', edges[0]);
    return getLayoutedElements(nodes, edges, 'LR');
  }, [fullSchema]);

  const [nodes, setNodes, onNodesChange] = useNodesState(layoutedNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(layoutedEdges);

  React.useEffect(() => {
    setNodes(layoutedNodes);
    setEdges(layoutedEdges);
  }, [layoutedNodes, layoutedEdges]);

  const onConnect = useCallback((params) => setEdges((eds) => addEdge(params, eds)), [setEdges]);

  if (!fullSchema || Object.keys(fullSchema).length === 0) {
    return <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>Нет данных о схеме.</Typography>;
  }

  const hasRelationships = Object.values(fullSchema).some(t => t.relationships?.length > 0);
  if (!hasRelationships) {
    return (
      <Box sx={{ mt: 2 }}>
        <Typography variant="body2" color="warning.main" sx={{ mb: 2 }}>
          В базе данных не найдены внешние ключи (связи). Отображаются только таблицы.
        </Typography>
        <Box sx={{ height: '50vh', border: '1px solid #ddd', borderRadius: 2 }}>
          <ReactFlowProvider>
            <ReactFlow
              key={nodes.length}
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              nodeTypes={nodeTypes}
              fitView
            >
              <Background />
              <Controls />
              <MiniMap />
            </ReactFlow>
          </ReactFlowProvider>
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ mt: 2, mb: 4, height: '70vh', border: '1px solid #ddd', borderRadius: 2 }}>
      <Typography variant="subtitle1" gutterBottom>
        Визуальная схема базы данных (перетаскивайте, масштабируйте)
      </Typography>
      <ReactFlowProvider>
        <ReactFlow
          key={nodes.length}
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          nodeTypes={nodeTypes}
          fitView
          attributionPosition="bottom-right"
        >
          <Background />
          <Controls />
          <MiniMap />
        </ReactFlow>
      </ReactFlowProvider>
    </Box>
  );
}

export default SchemaViewer;