import React, { useMemo, useCallback } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  ReactFlowProvider,
  useNodesState,
  useEdgesState,
  addEdge,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Box, Typography } from '@mui/material';
import TableNode from './TableNode';
import { getLayoutedElements } from './layout';
import { buildGraphElements } from './graphBuilder';

const nodeTypes = { tableNode: TableNode };

function SchemaViewer({ fullSchema }) {
  const { nodes: layoutedNodes, edges: layoutedEdges } = useMemo(() => {
    if (!fullSchema || Object.keys(fullSchema).length === 0) {
      return { nodes: [], edges: [] };
    } 
    const { nodes, edges } = buildGraphElements(fullSchema);
    
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