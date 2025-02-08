import { useCallback, useState, useEffect, useRef } from 'react';
import { Node } from 'reactflow';

interface SpeechRecognitionEvent {
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionErrorEvent {
  error: string;
}

interface SpeechRecognitionResultList {
  readonly length: number;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  readonly length: number;
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionAlternative {
  transcript: string;
}

interface SpeechRecognition {
  continuous: boolean;
  interimResults: boolean;
  start(): void;
  stop(): void;
  onresult: (event: SpeechRecognitionEvent) => void;
  onerror: (event: SpeechRecognitionErrorEvent) => void;
}

type UseVoiceNavigationProps = {
  nodes: Node[];
  currentNodeId: string;
  setCurrentNodeId: (id: string) => void;
};

type UseVoiceNavigationReturn = {
  isListening: boolean;
  startListening: () => void;
  stopListening: () => void;
  isSupported: boolean;
  error: string | null;
  handleNextSlide: () => void;
  handlePreviousSlide: () => void;
  handleNavigateToTitle: (title: string) => void;
  slides: { title: string; id: string }[];
};

// Update the global declarations at the top of the file
declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognition;
    webkitSpeechRecognition: new () => SpeechRecognition;
  }
}

export const useVoiceNavigation = ({ nodes, currentNodeId, setCurrentNodeId }: UseVoiceNavigationProps): UseVoiceNavigationReturn => {
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const titleNavigationTimeout = useRef<NodeJS.Timeout | null>(null);
  const currentIndex = useRef(nodes.findIndex(node => node.id === currentNodeId));
  const currentNodeRef = useRef(currentNodeId);
  const lastCommandRef = useRef<{ command: string; timestamp: number } | null>(null);

  useEffect(() => {
    currentIndex.current = nodes.findIndex(node => node.id === currentNodeId);
    currentNodeRef.current = currentNodeId;
    console.log('Current index updated to:', currentIndex.current, 'for node:', currentNodeId);
  }, [currentNodeId, nodes]);

  const isSupported = 'SpeechRecognition' in window || 'webkitSpeechRecognition' in window;

  const handleNextSlide = useCallback(() => {
    console.log('Next Slide - Current Index:', currentIndex.current, 'Current ID:', currentNodeRef.current);
    
    // Sort nodes by their vertical position, then horizontal position
    const sortedNodes = [...nodes].sort((a, b) => {
      const aPosition = a.position || { x: 0, y: 0 };
      const bPosition = b.position || { x: 0, y: 0 };
      
      // First sort by y position (with some tolerance for same-row nodes)
      const yDiff = aPosition.y - bPosition.y;
      if (Math.abs(yDiff) > 50) { // 50px tolerance for same row
        return yDiff;
      }
      // If in same row, sort by x position
      return aPosition.x - bPosition.x;
    });

    const currentSortedIndex = sortedNodes.findIndex(node => node.id === currentNodeRef.current);
    console.log('Current sorted index:', currentSortedIndex, 'Total nodes:', sortedNodes.length);
    
    const nextNode = sortedNodes[currentSortedIndex + 1];
    if (nextNode) {
      console.log('Moving to next node:', nextNode.id, 'from current node:', currentNodeRef.current);
      if (nextNode.id !== currentNodeRef.current) { // Only update if it's actually a different node
        currentNodeRef.current = nextNode.id;
        setCurrentNodeId(nextNode.id);
      } else {
        console.log('Next node is the same as current node, skipping update');
        setError('No next slide available');
        setTimeout(() => setError(null), 2000);
      }
    } else {
      console.log('No next node available');
      setError('Already at the last slide');
      setTimeout(() => setError(null), 2000);
    }
  }, [nodes, setCurrentNodeId]);

  const handlePreviousSlide = useCallback(() => {
    console.log('Previous Slide - Current Index:', currentIndex.current, 'Current ID:', currentNodeRef.current);
    
    // Sort nodes by their vertical position, then horizontal position
    const sortedNodes = [...nodes].sort((a, b) => {
      const aPosition = a.position || { x: 0, y: 0 };
      const bPosition = b.position || { x: 0, y: 0 };
      
      // First sort by y position (with some tolerance for same-row nodes)
      const yDiff = aPosition.y - bPosition.y;
      if (Math.abs(yDiff) > 50) { // 50px tolerance for same row
        return yDiff;
      }
      // If in same row, sort by x position
      return aPosition.x - bPosition.x;
    });

    const currentSortedIndex = sortedNodes.findIndex(node => node.id === currentNodeRef.current);
    console.log('Current sorted index:', currentSortedIndex, 'Total nodes:', sortedNodes.length);
    
    const previousNode = sortedNodes[currentSortedIndex - 1];
    if (previousNode) {
      console.log('Moving to previous node:', previousNode.id, 'from current node:', currentNodeRef.current);
      if (previousNode.id !== currentNodeRef.current) {
        currentNodeRef.current = previousNode.id;
        setCurrentNodeId(previousNode.id);
      } else {
        console.log('Previous node is the same as current node, skipping update');
        setError('No previous slide available');
        setTimeout(() => setError(null), 2000);
      }
    } else {
      console.log('No previous node available');
      setError('Already at the first slide');
      setTimeout(() => setError(null), 2000);
    }
  }, [nodes, setCurrentNodeId]);

  const handleNavigateToTitle = useCallback((title: string) => {
    const targetNode = nodes.find(node => node.data?.label === title);
    if (targetNode) {
      setCurrentNodeId(targetNode.id);
    }
  }, [nodes, setCurrentNodeId]);

  const slides = nodes.map(node => ({
    title: node.data?.label || '',
    id: node.id
  }));

  useEffect(() => {
    if (isSupported) {
      const SpeechRecognitionAPI = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const recognitionInstance = new SpeechRecognitionAPI();
      recognitionInstance.continuous = true;
      recognitionInstance.interimResults = false;

      recognitionInstance.onstart = () => {
        console.log('Recognition started');
      };

      const isFirstSlideCommand = (cmd: string) => {
        const firstSlidePatterns = [
          'first slide',
          'beginning',
          'go to the beginning',
          'return to the start',
          'go to first slide',
          'return to first slide',
          'turn to the first slide',
          'return to the first slide',
          'go back to first slide',
          'go back to the first slide'
        ];
        
        // Check for exact matches
        if (firstSlidePatterns.includes(cmd)) {
          return true;
        }
        
        // Check for partial matches that contain key phrases
        return firstSlidePatterns.some(pattern => 
          cmd.includes(pattern) || 
          cmd.includes('first slide') || 
          cmd.includes('beginning') || 
          cmd.includes('start')
        );
      };

      recognitionInstance.onresult = (event: SpeechRecognitionEvent) => {
        const results = event.results;
        const lastResult = results[results.length - 1];
        const command = lastResult[0].transcript.toLowerCase().trim();
        
        const now = Date.now();
        if (lastCommandRef.current) {
          // Check for exact match or similar commands
          if ((lastCommandRef.current.command === command || 
              (isFirstSlideCommand(lastCommandRef.current.command) && isFirstSlideCommand(command))) && 
              now - lastCommandRef.current.timestamp < 2000) {
            console.log('Command debounced:', command);
            return;
          }
        }
        
        lastCommandRef.current = { command, timestamp: now };
        console.log('Processing command:', command);

        if (titleNavigationTimeout.current) {
          clearTimeout(titleNavigationTimeout.current);
        }
        
        if (isFirstSlideCommand(command)) {
          console.log('Executing go to first slide command');
          navigateToFirstSlide();
        } else if (command === 'previous' || command === 'go back' || command === 'back') {
          console.log('Executing previous slide command');
          handlePreviousSlide();
        } else if (command === 'next' || command === 'next slide' || command === 'go to next' || command === 'go to next slide') {
          console.log('Executing next slide command');
          handleNextSlide();
        } else if (command.startsWith('go to ')) {
          // For title navigation, wait for a pause
          titleNavigationTimeout.current = setTimeout(() => {
            const searchPhrase = command.slice(6); // Remove "go to " from the start
            
            // Don't process if it's a navigation command
            if (searchPhrase === 'next' || 
                searchPhrase === 'next slide' || 
                searchPhrase === 'previous' || 
                searchPhrase === 'previous slide' ||
                searchPhrase === 'back') {
              return;
            }

            const words: string[] = searchPhrase.split(' ');
            const matchedTitle = slides.find(slide => {
              const titleWords: string[] = slide.title.toLowerCase().split(' ');
              // Only match if all words of the title appear in sequence
              for (let i = 0; i < titleWords.length; i++) {
                const position = words.indexOf(titleWords[i]);
                if (position === -1) return false;
                
                // Check if the subsequent words match
                for (let j = 1; j < titleWords.length - i; j++) {
                  if (words[position + j] !== titleWords[i + j]) {
                    return false;
                  }
                }
                return true;
              }
              return false;
            });

            if (matchedTitle) {
              console.log('Navigating to:', matchedTitle.title);
              handleNavigateToTitle(matchedTitle.title);
            }
          }, 1000); // Wait 1 second for more context
        }
      };

      recognitionInstance.onerror = (event: SpeechRecognitionErrorEvent) => {
        console.log('Recognition error:', event.error);
        setError(`Speech recognition error: ${event.error}`);
        setIsListening(false);
      };

      recognitionInstance.onend = () => {
        console.log('Recognition ended, isListening:', isListening);
        if (isListening) {
          try {
            recognitionInstance.start();
            console.log('Recognition restarted');
          } catch (err) {
            console.error('Failed to restart recognition:', err);
            setError('Failed to restart voice recognition');
            setIsListening(false);
          }
        }
      };

      recognitionRef.current = recognitionInstance;

      return () => {
        if (titleNavigationTimeout.current) {
          clearTimeout(titleNavigationTimeout.current);
        }
        recognitionInstance.stop();
      };
    }
  }, [isSupported]);

  const startListening = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.start();
        setIsListening(true);
        setError(null);
      } catch (err) {
        setError('Failed to start voice recognition');
        setIsListening(false);
      }
    }
  }, []);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  }, []);

  const navigateToFirstSlide = useCallback(() => {
    if (nodes.length === 0) {
      console.log('No nodes available');
      setError('No slides available');
      setTimeout(() => setError(null), 2000);
      return;
    }

    // First try to find nodes with no incoming edges
    const nodesWithNoIncoming = nodes.filter(node => 
      !nodes.some(otherNode => 
        otherNode.data?.edges?.some((edge: any) => edge.target === node.id)
      )
    );

    const candidateNodes = nodesWithNoIncoming.length > 0 ? nodesWithNoIncoming : nodes;
    console.log('Candidate nodes for first slide:', candidateNodes.length);

    // Among the candidates, find the leftmost-top node
    const firstNode = candidateNodes.reduce((leftmost, current) => {
      const leftmostPos = leftmost.position || { x: Infinity, y: Infinity };
      const currentPos = current.position || { x: Infinity, y: Infinity };

      // If current node is more left, it should be the new leftmost
      if (currentPos.x < leftmostPos.x) {
        return current;
      }
      
      // If they're in the same column (within tolerance) and current is higher, it should be the new leftmost
      if (Math.abs(currentPos.x - leftmostPos.x) <= 50 && currentPos.y < leftmostPos.y) {
        return current;
      }
      
      return leftmost;
    }, candidateNodes[0]);

    console.log('Moving to leftmost-top node:', firstNode.id, 'Has no incoming edges:', nodesWithNoIncoming.includes(firstNode));
    currentIndex.current = 0;
    currentNodeRef.current = firstNode.id;
    setCurrentNodeId(firstNode.id);
  }, [nodes, setCurrentNodeId]);

  return {
    isListening,
    startListening,
    stopListening,
    isSupported,
    error,
    handleNextSlide,
    handlePreviousSlide,
    handleNavigateToTitle,
    slides
  };
};