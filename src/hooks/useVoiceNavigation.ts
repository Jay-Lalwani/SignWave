import { useCallback, useState, useEffect, useRef } from 'react';
import { Node } from 'reactflow';
import { SUPPORTED_FONTS, FontFamily } from '../constants/fonts';

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

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onstart: (event: Event) => void;
  onerror: (event: SpeechRecognitionErrorEvent) => void;
  onresult: (event: SpeechRecognitionEvent) => void;
  onend: (event: Event) => void;
  onaudiostart: (event: Event) => void;
  onaudioend: (event: Event) => void;
  onsoundstart: (event: Event) => void;
  onsoundend: (event: Event) => void;
  onspeechstart: (event: Event) => void;
  onspeechend: (event: Event) => void;
  start(): void;
  stop(): void;
}

interface UseVoiceNavigationProps {
  nodes: Node[];
  currentNodeId: string;
  setCurrentNodeId: (id: string) => void;
  setFontFamily: (font: FontFamily) => void;
}

type UseVoiceNavigationReturn = {
  isListening: boolean;
  startListening: () => void;
  stopListening: () => void;
  isSupported: boolean;
  error: string | null;
  handleNextSlide: () => void;
  handlePreviousSlide: () => void;
  handleFirstSlide: () => void;
  handleNavigateToTitle: (title: string) => void;
  slides: { title: string; id: string }[];
};

// Update the global declarations at the top of the file
declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognition;
    webkitSpeechRecognition: {
      new (): SpeechRecognition;
    };
  }
}

export const useVoiceNavigation = ({ 
  nodes, 
  currentNodeId, 
  setCurrentNodeId,
  setFontFamily
}: UseVoiceNavigationProps): UseVoiceNavigationReturn => {
  const [recognition, setRecognition] = useState<SpeechRecognition | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const titleNavigationTimeout = useRef<NodeJS.Timeout | null>(null);
  const currentIndex = useRef(nodes.findIndex(node => node.id === currentNodeId));
  const currentNodeRef = useRef(currentNodeId);
  const lastCommandRef = useRef<{ command: string; timestamp: number } | null>(null);
  const errorTimeoutRef = useRef<NodeJS.Timeout>();

  // Add check for browser support
  const isSupported = 'webkitSpeechRecognition' in window;

  const handleNextSlide = useCallback(() => {
    const currentIndex = nodes.findIndex(node => node.id === currentNodeId);
    console.log('Current index:', currentIndex, 'Total nodes:', nodes.length);
    
    if (currentIndex < nodes.length - 1) {
      const nextId = nodes[currentIndex + 1].id;
      console.log('Moving to next node:', nextId, 'from current:', currentNodeId);
      setCurrentNodeId(nextId);
      // Force update the current node reference
      currentNodeRef.current = nextId;
    } else {
      console.log('Already at last slide');
    }
  }, [nodes, currentNodeId, setCurrentNodeId]);

  const handlePreviousSlide = useCallback(() => {
    const currentIndex = nodes.findIndex(node => node.id === currentNodeId);
    if (currentIndex > 0) {
      const prevId = nodes[currentIndex - 1].id;
      console.log('Moving to previous node:', prevId);
      setCurrentNodeId(prevId);
    }
  }, [nodes, currentNodeId, setCurrentNodeId]);

  const handleNavigateToTitle = useCallback((title: string) => {
    console.log('Looking for node with title:', title);
    console.log('Available nodes:', nodes);
    const node = nodes.find(node => 
      node.data?.label?.toLowerCase() === title.toLowerCase()
    );
    if (node) {
      console.log('Found node, setting ID to:', node.id);
      setCurrentNodeId(node.id);
    } else {
      console.log('No node found with title:', title);
    }
  }, [nodes, setCurrentNodeId]);

  const setTemporaryError = useCallback((errorMessage: string) => {
    setError(errorMessage);
    if (errorTimeoutRef.current) {
      clearTimeout(errorTimeoutRef.current);
    }
    errorTimeoutRef.current = setTimeout(() => {
      setError(null);
    }, 3000);
  }, []);

  const navigateToFirstSlide = useCallback(() => {
    if (nodes.length === 0) {
      setTemporaryError('No slides available');
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

      if (currentPos.x < leftmostPos.x) {
        return current;
      }
      
      if (Math.abs(currentPos.x - leftmostPos.x) <= 50 && currentPos.y < leftmostPos.y) {
        return current;
      }
      
      return leftmost;
    }, candidateNodes[0]);

    console.log('Moving to leftmost-top node:', firstNode.id);
    currentIndex.current = 0;
    currentNodeRef.current = firstNode.id;
    setCurrentNodeId(firstNode.id);
  }, [nodes, setTemporaryError, setCurrentNodeId]);

  const handleFirstSlide = useCallback(() => {
    navigateToFirstSlide();
  }, [navigateToFirstSlide]);

  const processCommand = useCallback((command: string) => {
    const now = Date.now();
    
    // More strict debouncing - ignore commands within 1.5 seconds
    if (lastCommandRef.current && 
        now - lastCommandRef.current.timestamp < 1500) {
      console.log('Debouncing command:', command);
      return;
    }
    
    lastCommandRef.current = { command, timestamp: now };
    console.log('Processing command:', command);

    // Wait for a small delay to ensure state updates have propagated
    setTimeout(() => {
      if (command.includes('next')) {
        console.log('Executing next command');
        handleNextSlide();
      } else if (command.includes('previous') || command.includes('back')) {
        handlePreviousSlide();
      } else if (command.includes('restart')) {
        handleFirstSlide();
      } else if (command.includes('go to')) {
        const targetTitle = command.replace('go to', '').trim();
        console.log('Navigating to slide:', targetTitle);
        handleNavigateToTitle(targetTitle);
      } else if (command.startsWith('change font to ')) {
        const font = command.replace('change font to ', '').trim();
        const requestedFont = Object.entries(SUPPORTED_FONTS)
          .find(([key]) => font.includes(key.toLowerCase()));
        if (requestedFont) {
          setFontFamily(requestedFont[1] as FontFamily);
        }
      }
    }, 100);
  }, [handleNextSlide, handlePreviousSlide, handleFirstSlide, handleNavigateToTitle, setFontFamily]);

  useEffect(() => {
    if (isSupported) {
      if (!recognitionRef.current) {
        recognitionRef.current = new window.webkitSpeechRecognition();
        const recognition = recognitionRef.current;
        
        recognition.continuous = true;
        recognition.interimResults = false; // Changed to false to reduce duplicate results
        recognition.lang = 'en-US';

        recognition.onresult = (event: SpeechRecognitionEvent) => {
          const results = event.results;
          const lastResult = results[results.length - 1];
          if (lastResult) {
            const command = lastResult[0].transcript.toLowerCase().trim();
            console.log('Raw command:', command);
            // processCommand(command);
          }
        };

        recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
          console.log('Recognition error:', event.error);
          if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
            setTemporaryError(`Speech recognition error: ${event.error}`);
            setIsListening(false);
            if (recognitionRef.current) {
              recognitionRef.current.stop();
            }
          }
        };

        recognition.onstart = () => {
          console.log('Recognition started');
          setIsListening(true);
        };

        recognition.onend = () => {
          console.log('Recognition ended');
          setIsListening(false);
        };
      }
    }
  }, [isSupported, processCommand]);

  // Separate useEffect for index tracking
  useEffect(() => {
    currentIndex.current = nodes.findIndex(node => node.id === currentNodeId);
    currentNodeRef.current = currentNodeId;
    console.log('Current index updated to:', currentIndex.current, 'for node:', currentNodeId);
  }, [currentNodeId, nodes]);

  const slides = nodes.map(node => ({
    title: node.data?.label || '',
    id: node.id
  }));

  const handleVoiceCommand = (command: string) => {
    if (command.includes('restart')) {
      handleFirstSlide();
    } else if (command.includes('next')) {
      handleNextSlide();
    } else if (command.includes('previous') || command.includes('back')) {
      handlePreviousSlide();
    } else if (command.includes('go to')) {
      const match = command.match(/go to (.*)/i);
      if (match) {
        const targetTitle = match[1].toLowerCase();
        setTimeout(() => {
          handleNavigateToTitle(targetTitle);
        }, 1000);
      }
    } else if (command.startsWith('change font to ') || command.startsWith('set font to ')) {
      const fontMatch = command.match(/(?:change|set) font to (.*)/i);
      if (fontMatch && fontMatch[1]) {
        const font = fontMatch[1].trim();
        const requestedFont = Object.entries(SUPPORTED_FONTS)
          .find(([key]) => font.includes(key.toLowerCase()));

        if (requestedFont) {
          console.log('Changing font to:', requestedFont[1]);
          setFontFamily(requestedFont[1] as FontFamily);
          // Apply font to buttons
          document.querySelectorAll('button').forEach(button => {
            button.style.fontFamily = requestedFont[1];
          });
        }
      }
    }
  };

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.log('Speech recognition not supported');
      return;
    }

    const recognitionInstance = new SpeechRecognition();
    recognitionInstance.continuous = false;
    recognitionInstance.interimResults = false;

    recognitionInstance.onresult = (event: SpeechRecognitionEvent) => {
      const transcript = event.results[0][0].transcript.toLowerCase();
      console.log('Command:', transcript);
      // handleVoiceCommand(transcript);
    };

    setRecognition(recognitionInstance);
  }, []);

  const startListening = useCallback(() => {
    if (!('webkitSpeechRecognition' in window)) {
      console.log('Speech recognition not supported');
      return;
    }

    // Prevent starting if already listening
    if (isListening) {
      console.log('Already listening, ignoring start request');
      return;
    }

    try {
      // Always create a new instance when starting
      console.log('Creating new recognition instance');
      const SpeechRecognition = window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognitionRef.current = recognition;

      recognition.continuous = true;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        console.log('Recognition started');
        setIsListening(true);
      };

      recognition.onend = () => {
        console.log('Recognition ended');
        // Only restart if we're still supposed to be listening
        if (isListening && recognitionRef.current === recognition) {
          console.log('Scheduling restart...');
          setTimeout(() => {
            if (isListening && recognitionRef.current === recognition) {
              console.log('Restarting recognition...');
              try {
                recognition.start();
              } catch (error) {
                console.error('Failed to restart recognition:', error);
                setIsListening(false);
                recognitionRef.current = null;
              }
            }
          }, 100);
        }
      };

      recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        console.log('Recognition error:', event.error);
        if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
          setTemporaryError(`Speech recognition error: ${event.error}`);
          setIsListening(false);
          recognitionRef.current = null;
        }
      };

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        const results = event.results;
        const lastResult = results[results.length - 1];
        if (lastResult) {
          const command = lastResult[0].transcript.toLowerCase().trim();
          console.log('Raw command:', command);
          // processCommand(command);
        }
      };

      console.log('Starting recognition');
      recognition.start();
    } catch (err) {
      console.error('Error starting recognition:', err);
      setIsListening(false);
      recognitionRef.current = null;
    }
  }, [isListening, processCommand]);

  const stopListening = useCallback(() => {
    if (!isListening) {
      console.log('Already stopped, ignoring stop request');
      return;
    }

    console.log('Stopping recognition manually');
    setIsListening(false);
    
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
  }, [isListening]);

  // Add keyboard shortcuts effect
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      // Space to toggle
      if (event.code === 'Space' && !event.altKey && !event.ctrlKey && !event.metaKey) {
        event.preventDefault(); // Prevent page scrolling
        console.log(`${isListening ? 'Stopping' : 'Starting'} recognition via spacebar`);
        if (isListening) {
          stopListening();
        } else {
          startListening();
        }
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => {
      window.removeEventListener('keydown', handleKeyPress);
    };
  }, [isListening, startListening, stopListening]);

  return {
    isListening,
    startListening,
    stopListening,
    isSupported,
    error,
    handleNextSlide,
    handlePreviousSlide,
    handleFirstSlide,
    handleNavigateToTitle,
    slides
  };
};