import dagre from 'dagre';

export const getLayoutedElements = (nodes, edges, direction = 'LR') => {
  if (!nodes.length) { 
    return { nodes, edges };
  }

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