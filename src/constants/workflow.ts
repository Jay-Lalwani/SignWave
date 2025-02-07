import { Node } from 'reactflow';
import { SlideNodeData } from '../types/workflow';

export const NODE_TYPES = [
  { id: 'textNode', label: 'Text Slide', color: '#777' },
  { id: 'imageNode', label: 'Image Slide', color: '#4CAF50' },
  { id: 'videoNode', label: 'Video Slide', color: '#9C27B0' },
  { id: 'apiNode', label: 'API Action', color: '#2196F3' },
] as const;

export const initialNodes: Node<SlideNodeData>[] = [
  {
    id: '1',
    type: 'textNode',
    data: { label: 'Start', content: '', type: 'text' },
    position: { x: 250, y: 25 },
  },
]; 