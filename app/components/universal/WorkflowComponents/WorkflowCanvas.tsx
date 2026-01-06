import React, { useState, useRef, useEffect } from 'react';
import { ZoomIn, ZoomOut, Move, Trash2, Maximize2, Eye, X } from 'lucide-react';
import { WorkflowNode as WorkflowNodeType, WorkflowEdge, Employee } from './types';
import WorkflowNode from './WorkflowNode';
import { useTheme } from '@/app/context/ThemeContext';

interface Props {
  nodes: WorkflowNodeType[];
  edges: WorkflowEdge[];
  employees: Employee[];
  zoom: number;
  pan: { x: number; y: number };
  selectedNode: string | null;
  onNodesChange: (nodes: WorkflowNodeType[]) => void;
  onEdgesChange: (edges: WorkflowEdge[]) => void;
  onZoomChange: (zoom: number) => void;
  onPanChange: (pan: { x: number; y: number }) => void;
  onNodeSelect: (nodeId: string | null) => void;
}

const GRID_SIZE = 40;
const AUTO_PAN_EDGE_THRESHOLD = 50;
const AUTO_PAN_SPEED = 8;

export default function WorkflowCanvas({
  nodes,
  edges,
  employees,
  zoom,
  pan,
  selectedNode,
  onNodesChange,
  onEdgesChange,
  onZoomChange,
  onPanChange,
  onNodeSelect
}: Props) {
  const { theme, colors, cardCharacters } = useTheme();
  const canvasRef = useRef<HTMLDivElement>(null);
  const [connecting, setConnecting] = useState<{ from: string; startX: number; startY: number } | null>(null);
  const [tempLine, setTempLine] = useState<{ x1: number; y1: number; x2: number; y2: number } | null>(null);
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [hoveredEdge, setHoveredEdge] = useState<string | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [showMinimap, setShowMinimap] = useState(false);
  const [showQuickGuide, setShowQuickGuide] = useState(true);
  const [isGuideHovered, setIsGuideHovered] = useState(false);
  const autoPanRef = useRef<number | null>(null);
  const hasAutoFitted = useRef<boolean>(false);

  const canvasColors = {
    background: theme === 'dark' ? '#0a0a1a' : '#f5f7fa',
    gridDot: theme === 'dark' ? 'rgba(100, 181, 246, 0.08)' : 'rgba(33, 150, 243, 0.06)',
    connectionLine: theme === 'dark' ? '#64B5F6' : '#2196F3',
    connectionLineHover: theme === 'dark' ? '#90CAF9' : '#1976D2',
    trashButton: theme === 'dark' ? '#EF5350' : '#F44336',
    trashButtonBg: theme === 'dark' ? '#1E293B' : '#ffffff',
    trashButtonBorder: theme === 'dark' ? 'rgba(239, 83, 80, 0.4)' : 'rgba(244, 67, 54, 0.4)',
    controlBg: theme === 'dark' ? 'rgba(30, 41, 59, 0.9)' : 'rgba(255, 255, 255, 0.95)',
    controlBorder: theme === 'dark' ? 'rgba(100, 181, 246, 0.2)' : 'rgba(33, 150, 243, 0.2)',
    controlIcon: theme === 'dark' ? '#64B5F6' : '#2196F3',
    instructionsBg: theme === 'dark' ? 'rgba(30, 41, 59, 0.95)' : 'rgba(255, 255, 255, 0.95)',
    instructionsBorder: theme === 'dark' ? 'rgba(100, 181, 246, 0.3)' : 'rgba(33, 150, 243, 0.3)',
    instructionsText: theme === 'dark' ? '#E2E8F0' : '#2C3E50',
    minimapBg: theme === 'dark' ? 'rgba(30, 41, 59, 0.95)' : 'rgba(255, 255, 255, 0.95)',
    minimapBorder: theme === 'dark' ? 'rgba(100, 181, 246, 0.3)' : 'rgba(33, 150, 243, 0.3)',
    minimapNode: theme === 'dark' ? '#64B5F6' : '#2196F3',
    minimapViewport: theme === 'dark' ? 'rgba(100, 181, 246, 0.3)' : 'rgba(33, 150, 243, 0.25)',
  };

  // Auto-fit to view on initial load
  useEffect(() => {
    if (nodes.length >= 2 && !hasAutoFitted.current) {
      // Small delay to ensure canvas is properly rendered
      const timer = setTimeout(() => {
        fitToView();
        hasAutoFitted.current = true;
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [nodes.length]);

  useEffect(() => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const shouldAutoPan = connecting !== null || isPanning;
    if (!shouldAutoPan) {
      if (autoPanRef.current) {
        cancelAnimationFrame(autoPanRef.current);
        autoPanRef.current = null;
      }
      return;
    }

    const autoPan = () => {
      let deltaX = 0;
      let deltaY = 0;

      if (mousePos.x < AUTO_PAN_EDGE_THRESHOLD) {
        deltaX = AUTO_PAN_SPEED;
      } else if (mousePos.x > rect.width - AUTO_PAN_EDGE_THRESHOLD) {
        deltaX = -AUTO_PAN_SPEED;
      }

      if (mousePos.y < AUTO_PAN_EDGE_THRESHOLD) {
        deltaY = AUTO_PAN_SPEED;
      } else if (mousePos.y > rect.height - AUTO_PAN_EDGE_THRESHOLD) {
        deltaY = -AUTO_PAN_SPEED;
      }

      if (deltaX !== 0 || deltaY !== 0) {
        onPanChange({
          x: pan.x + deltaX,
          y: pan.y + deltaY
        });
      }

      autoPanRef.current = requestAnimationFrame(autoPan);
    };

    autoPanRef.current = requestAnimationFrame(autoPan);

    return () => {
      if (autoPanRef.current) {
        cancelAnimationFrame(autoPanRef.current);
      }
    };
  }, [mousePos, connecting, isPanning, pan, onPanChange]);

  const snapToGrid = (x: number, y: number) => {
    return {
      x: Math.round(x / GRID_SIZE) * GRID_SIZE,
      y: Math.round(y / GRID_SIZE) * GRID_SIZE
    };
  };

  const getNodeDimensions = (node: WorkflowNodeType) => {
    if (node.type === 'start' || node.type === 'end') {
      return { width: 120, height: 120 };
    }
    if (node.data.nodeType === 'parallel') {
      return { width: 240, height: 140 };
    }
    return { width: 220, height: 80 };
  };

  const getConnectionPoint = (node: WorkflowNodeType, side: 'left' | 'right') => {
    const dims = getNodeDimensions(node);
    const x = side === 'left' ? node.position.x : node.position.x + dims.width;
    const y = node.position.y + dims.height / 2;
    return { x, y };
  };

  const fitToView = () => {
    if (nodes.length === 0) return;

    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

    nodes.forEach(node => {
      const dims = getNodeDimensions(node);
      minX = Math.min(minX, node.position.x);
      minY = Math.min(minY, node.position.y);
      maxX = Math.max(maxX, node.position.x + dims.width);
      maxY = Math.max(maxY, node.position.y + dims.height);
    });

    const contentWidth = maxX - minX;
    const contentHeight = maxY - minY;

    const padding = 100;
    const targetWidth = contentWidth + padding * 2;
    const targetHeight = contentHeight + padding * 2;

    const zoomX = rect.width / targetWidth;
    const zoomY = rect.height / targetHeight;
    const newZoom = Math.min(Math.max(Math.min(zoomX, zoomY), 0.5), 2);

    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;
    
    const newPan = {
      x: rect.width / 2 - centerX * newZoom,
      y: rect.height / 2 - centerY * newZoom
    };

    onZoomChange(newZoom);
    onPanChange(newPan);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    
    const jsonData = e.dataTransfer.getData('application/json');
    if (!jsonData) return;

    try {
      const data = JSON.parse(jsonData);
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;

      const rawX = (e.clientX - rect.left - pan.x) / zoom;
      const rawY = (e.clientY - rect.top - pan.y) / zoom;
      const snapped = snapToGrid(rawX, rawY);

      if (data.isGroup) {
        const newNode: WorkflowNodeType = {
          id: `node-${Date.now()}`,
          type: 'employee',
          position: snapped,
          data: {
            label: 'Parallel Group',
            nodeType: 'parallel',
            groupLead: data.groupLead,
            groupMembers: data.groupMembers,
            employeeId: data.groupLead,
          }
        };
        onNodesChange([...nodes, newNode]);
      } else {
        const newNode: WorkflowNodeType = {
          id: `node-${Date.now()}`,
          type: 'employee',
          position: snapped,
          data: {
            label: data.basicDetails.name,
            employeeId: data._id,
            employeeName: data.basicDetails.name,
            employeeTitle: data.title,
            employeeAvatar: data.basicDetails.profileImage,
            nodeType: 'sequential',
          }
        };
        onNodesChange([...nodes, newNode]);
      }
    } catch (error) {
      console.error('Error dropping node:', error);
    }
  };

  const handleNodeDrag = (nodeId: string, newX: number, newY: number) => {
    const snapped = snapToGrid(newX, newY);
    onNodesChange(nodes.map((n: WorkflowNodeType) =>
      n.id === nodeId ? { ...n, position: snapped } : n
    ));
  };

  const handleConnectionStart = (nodeId: string, clientX: number, clientY: number) => {
    setConnecting({ from: nodeId, startX: clientX, startY: clientY });
    setTempLine({ x1: clientX, y1: clientY, x2: clientX, y2: clientY });
  };

  const handleConnectionMove = (e: React.MouseEvent) => {
    if (connecting && tempLine) {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;
      
      setTempLine({
        ...tempLine,
        x2: e.clientX - rect.left,
        y2: e.clientY - rect.top
      });
    }
  };

  const handleConnectionEnd = (targetNodeId: string) => {
    if (connecting && connecting.from !== targetNodeId) {
      const connectionExists = edges.some(
        e => e.source === connecting.from && e.target === targetNodeId
      );
      
      if (!connectionExists) {
        const newEdge: WorkflowEdge = {
          id: `edge-${Date.now()}`,
          source: connecting.from,
          target: targetNodeId
        };
        onEdgesChange([...edges, newEdge]);
      }
    }
    setConnecting(null);
    setTempLine(null);
  };

  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    if (e.target === canvasRef.current || (e.target as HTMLElement).classList.contains('canvas-background')) {
      setIsPanning(true);
      setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
      onNodeSelect(null);
    }
  };

  const handleCanvasMouseMove = (e: React.MouseEvent) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (rect) {
      setMousePos({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      });
    }

    if (isPanning) {
      onPanChange({
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y
      });
    }
    handleConnectionMove(e);
  };

  const handleCanvasMouseUp = () => {
    setIsPanning(false);
    if (connecting) {
      setConnecting(null);
      setTempLine(null);
    }
  };

  const handleNodeDelete = (nodeId: string) => {
    onNodesChange(nodes.filter(n => n.id !== nodeId));
    onEdgesChange(edges.filter(e => e.source !== nodeId && e.target !== nodeId));
    onNodeSelect(null);
  };

  return (
    <div
      ref={canvasRef}
      className="w-full h-full relative overflow-hidden"
      style={{ background: canvasColors.background }}
      onDrop={handleDrop}
      onDragOver={(e) => e.preventDefault()}
      onMouseDown={handleCanvasMouseDown}
      onMouseMove={handleCanvasMouseMove}
      onMouseUp={handleCanvasMouseUp}
      onMouseLeave={handleCanvasMouseUp}
    >
      {/* Grid Background */}
      <div 
        className="absolute inset-0 pointer-events-none canvas-background" 
        style={{
          backgroundImage: `radial-gradient(circle, ${canvasColors.gridDot} 2px, transparent 2px)`,
          backgroundSize: '30px 30px',
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          transformOrigin: '0 0'
        }}
      />

      {/* Edges SVG Layer */}
      <svg 
        className="absolute inset-0 pointer-events-none" 
        style={{ zIndex: 1, width: '100%', height: '100%' }}
      >
        <defs>
          <marker
            id="arrowhead"
            markerWidth="12"
            markerHeight="12"
            refX="10"
            refY="4"
            orient="auto"
          >
            <polygon 
              points="0 0, 12 4, 0 8" 
              fill={canvasColors.connectionLine}
              style={{ filter: `drop-shadow(0 0 3px ${canvasColors.connectionLine})` }}
            />
          </marker>
          <marker
            id="arrowhead-hover"
            markerWidth="12"
            markerHeight="12"
            refX="10"
            refY="4"
            orient="auto"
          >
            <polygon 
              points="0 0, 12 4, 0 8" 
              fill={canvasColors.connectionLineHover}
              style={{ filter: `drop-shadow(0 0 5px ${canvasColors.connectionLineHover})` }}
            />
          </marker>
        </defs>

        {edges.map((edge: WorkflowEdge) => {
          const sourceNode = nodes.find((n: WorkflowNodeType) => n.id === edge.source);
          const targetNode = nodes.find((n: WorkflowNodeType) => n.id === edge.target);
          
          if (!sourceNode || !targetNode) return null;

          const sourcePoint = getConnectionPoint(sourceNode, 'right');
          const targetPoint = getConnectionPoint(targetNode, 'left');

          const x1 = sourcePoint.x * zoom + pan.x;
          const y1 = sourcePoint.y * zoom + pan.y;
          const x2 = targetPoint.x * zoom + pan.x;
          const y2 = targetPoint.y * zoom + pan.y;

          const dx = x2 - x1;
          const controlPoint1X = x1 + Math.abs(dx) * 0.5;
          const controlPoint2X = x2 - Math.abs(dx) * 0.5;

          const pathD = `M ${x1} ${y1} C ${controlPoint1X} ${y1}, ${controlPoint2X} ${y2}, ${x2} ${y2}`;

          const isHovered = hoveredEdge === edge.id;

          return (
            <g key={edge.id}>
              {/* Main connection line with enhanced visibility */}
              <path
                d={pathD}
                stroke={isHovered ? canvasColors.connectionLineHover : canvasColors.connectionLine}
                strokeWidth={isHovered ? 4 : 3}
                fill="none"
                markerEnd={`url(#${isHovered ? 'arrowhead-hover' : 'arrowhead'})`}
                style={{
                  filter: isHovered 
                    ? `drop-shadow(0 0 10px ${canvasColors.connectionLineHover})` 
                    : `drop-shadow(0 0 4px ${canvasColors.connectionLine})`,
                  transition: 'all 0.2s ease'
                }}
              />
              {/* Animated dashed overlay for better visibility */}
              <path
                d={pathD}
                stroke={isHovered ? canvasColors.connectionLineHover : canvasColors.connectionLine}
                strokeWidth="2"
                fill="none"
                strokeDasharray="10,10"
                opacity="0.4"
              >
                <animate
                  attributeName="stroke-dashoffset"
                  from="0"
                  to="-100"
                  dur="15s"
                  repeatCount="indefinite"
                />
              </path>
            </g>
          );
        })}
        
        {tempLine && (
          <g>
            <line
              x1={tempLine.x1}
              y1={tempLine.y1}
              x2={tempLine.x2}
              y2={tempLine.y2}
              stroke={canvasColors.connectionLine}
              strokeWidth="4"
              strokeDasharray="10,10"
              opacity="0.8"
              style={{ filter: `drop-shadow(0 0 6px ${canvasColors.connectionLine})` }}
            />
            <circle
              cx={tempLine.x2}
              cy={tempLine.y2}
              r="10"
              fill={canvasColors.connectionLine}
              opacity="0.6"
              style={{ filter: `drop-shadow(0 0 8px ${canvasColors.connectionLine})` }}
            />
          </g>
        )}
      </svg>

      {/* Delete Buttons Layer */}
      <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 5 }}>
        {edges.map((edge: WorkflowEdge) => {
          const sourceNode = nodes.find((n: WorkflowNodeType) => n.id === edge.source);
          const targetNode = nodes.find((n: WorkflowNodeType) => n.id === edge.target);
          
          if (!sourceNode || !targetNode) return null;

          const sourcePoint = getConnectionPoint(sourceNode, 'right');
          const targetPoint = getConnectionPoint(targetNode, 'left');

          const x1 = sourcePoint.x * zoom + pan.x;
          const y1 = sourcePoint.y * zoom + pan.y;
          const x2 = targetPoint.x * zoom + pan.x;
          const y2 = targetPoint.y * zoom + pan.y;

          const midX = (x1 + x2) / 2;
          const midY = (y1 + y2) / 2;

          const isHovered = hoveredEdge === edge.id;

          return (
            <div
              key={`delete-${edge.id}`}
              className="absolute pointer-events-auto"
              style={{
                left: `${midX}px`,
                top: `${midY}px`,
                transform: 'translate(-50%, -50%)',
                zIndex: 10
              }}
            >
              <button
                className="w-11 h-11 rounded-full flex items-center justify-center transition-all duration-200 shadow-xl border-2"
                style={{
                  background: isHovered ? canvasColors.trashButton : canvasColors.trashButtonBg,
                  borderColor: canvasColors.trashButtonBorder,
                  transform: isHovered ? 'scale(1.2)' : 'scale(1)',
                  boxShadow: isHovered 
                    ? `0 0 20px ${canvasColors.trashButton}80` 
                    : `0 4px 12px rgba(0,0,0,0.2)`
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  onEdgesChange(edges.filter(e => e.id !== edge.id));
                }}
                onMouseEnter={() => setHoveredEdge(edge.id)}
                onMouseLeave={() => setHoveredEdge(null)}
                title="Delete connection"
              >
                <Trash2 
                  className="w-5 h-5"
                  style={{ 
                    color: isHovered ? '#ffffff' : canvasColors.trashButton,
                    transition: 'color 0.2s ease'
                  }}
                />
              </button>
            </div>
          );
        })}
      </div>

      {/* Nodes Layer */}
      <div className="absolute inset-0" style={{ zIndex: 2 }}>
        {nodes.map((node: WorkflowNodeType) => (
          <WorkflowNode
            key={node.id}
            node={node}
            zoom={zoom}
            pan={pan}
            selected={selectedNode === node.id}
            isConnecting={connecting !== null}
            onClick={() => onNodeSelect(node.id)}
            onDrag={handleNodeDrag}
            onConnectionStart={handleConnectionStart}
            onConnectionEnd={handleConnectionEnd}
            onDelete={handleNodeDelete}
            employees={employees}
          />
        ))}
      </div>

      {/* Minimap */}
      {showMinimap && nodes.length > 0 && (
        <div 
          className="absolute top-4 right-4 w-48 h-36 rounded-xl p-2 z-10 border-2"
          style={{
            background: canvasColors.minimapBg,
            borderColor: canvasColors.minimapBorder,
            backdropFilter: 'blur(15px)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.2)'
          }}
        >
          <div className="relative w-full h-full">
            {nodes.map(node => {
              const dims = getNodeDimensions(node);
              return (
                <div
                  key={node.id}
                  className="absolute rounded-sm"
                  style={{
                    left: `${(node.position.x / 20)}px`,
                    top: `${(node.position.y / 20)}px`,
                    width: `${dims.width / 20}px`,
                    height: `${dims.height / 20}px`,
                    background: canvasColors.minimapNode,
                    opacity: 0.6
                  }}
                />
              );
            })}
            <div
              className="absolute border-2 rounded"
              style={{
                left: `${-pan.x / (20 * zoom)}px`,
                top: `${-pan.y / (20 * zoom)}px`,
                width: `${(canvasRef.current?.offsetWidth || 0) / (20 * zoom)}px`,
                height: `${(canvasRef.current?.offsetHeight || 0) / (20 * zoom)}px`,
                borderColor: canvasColors.connectionLine,
                pointerEvents: 'none'
              }}
            />
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="absolute bottom-4 right-4 flex flex-col gap-2 z-10">
        <button
          onClick={fitToView}
          className="w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300 border-2 shadow-lg hover:scale-110"
          style={{ 
            background: canvasColors.controlBg,
            borderColor: canvasColors.controlBorder,
            backdropFilter: 'blur(15px)'
          }}
          title="Fit all nodes to view"
        >
          <Maximize2 className="w-5 h-5" style={{ color: canvasColors.controlIcon }} />
        </button>
        <button
          onClick={() => setShowMinimap(!showMinimap)}
          className="w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300 border-2 shadow-lg hover:scale-110"
          style={{ 
            background: showMinimap ? canvasColors.connectionLine : canvasColors.controlBg,
            borderColor: canvasColors.controlBorder,
            backdropFilter: 'blur(15px)'
          }}
          title="Toggle minimap"
        >
          <Eye className="w-5 h-5" style={{ color: showMinimap ? '#ffffff' : canvasColors.controlIcon }} />
        </button>
        <button
          onClick={() => onZoomChange(Math.min(zoom + 0.1, 2))}
          className="w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300 border-2 shadow-lg hover:scale-110"
          style={{ 
            background: canvasColors.controlBg,
            borderColor: canvasColors.controlBorder,
            backdropFilter: 'blur(15px)'
          }}
        >
          <ZoomIn className="w-5 h-5" style={{ color: canvasColors.controlIcon }} />
        </button>
        <button
          onClick={() => onZoomChange(Math.max(zoom - 0.1, 0.5))}
          className="w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300 border-2 shadow-lg hover:scale-110"
          style={{ 
            background: canvasColors.controlBg,
            borderColor: canvasColors.controlBorder,
            backdropFilter: 'blur(15px)'
          }}
        >
          <ZoomOut className="w-5 h-5" style={{ color: canvasColors.controlIcon }} />
        </button>
        <button
          onClick={() => {
            onPanChange({ x: 0, y: 0 });
            onZoomChange(1);
          }}
          className="w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300 border-2 shadow-lg hover:scale-110"
          style={{ 
            background: canvasColors.controlBg,
            borderColor: canvasColors.controlBorder,
            backdropFilter: 'blur(15px)'
          }}
        >
          <Move className="w-5 h-5" style={{ color: canvasColors.controlIcon }} />
        </button>
      </div>

      {/* Quick Guide - IMPROVED WITH FADE ON HOVER AND CLOSE BUTTON */}
      {showQuickGuide && (
        <div 
          className="absolute top-4 left-4 rounded-xl p-4 text-xs z-10 border-2 transition-opacity duration-300"
          style={{
            background: canvasColors.instructionsBg,
            borderColor: canvasColors.instructionsBorder,
            backdropFilter: 'blur(15px)',
            maxWidth: '260px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
            opacity: isGuideHovered ? 0.3 : 1
          }}
          onMouseEnter={() => setIsGuideHovered(true)}
          onMouseLeave={() => setIsGuideHovered(false)}
        >
          <div className="flex items-start justify-between mb-2">
            <p className={`font-black text-sm`} style={{ color: canvasColors.instructionsText }}>
              💡 Quick Guide
            </p>
            <button
              onClick={() => setShowQuickGuide(false)}
              className="p-0.5 rounded hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
              title="Close guide"
            >
              <X className="w-3.5 h-3.5" style={{ color: canvasColors.instructionsText }} />
            </button>
          </div>
          <ul className={`space-y-1 text-xs`} style={{ color: canvasColors.instructionsText, opacity: 0.85 }}>
            <li>• Drag employees/groups to canvas</li>
            <li>• Click blue dot to connect nodes</li>
            <li>• Move cursor to edge to auto-pan</li>
            <li>• Click <Maximize2 className="w-3 h-3 inline" /> to see all nodes</li>
            <li>• Click 🗑️ to delete connection</li>
          </ul>
        </div>
      )}

      {connecting && (
        <div 
          className="absolute top-4 right-4 rounded-xl px-4 py-2.5 text-xs font-bold z-10 border-2 shadow-lg"
          style={{
            background: theme === 'dark' ? 'rgba(100, 181, 246, 0.2)' : 'rgba(33, 150, 243, 0.2)',
            borderColor: canvasColors.connectionLine,
            color: canvasColors.connectionLine,
            backdropFilter: 'blur(15px)'
          }}
        >
          🔗 Connecting... (move cursor to edge to pan)
        </div>
      )}
    </div>
  );
}