import React, { useEffect, useState } from 'react';
import { SlideNodeData } from '../../types/workflow';

type Props = {
  data: SlideNodeData;
};

export const ApiSlide: React.FC<Props> = ({ data }) => {
  const [apiResponse, setApiResponse] = useState<any>(null);
  const [apiError, setApiError] = useState<string | null>(null);

  useEffect(() => {
    const executeApiCall = async () => {
      try {
        setApiError(null);
        setApiResponse(null);
        
        // Add CORS proxy
        const corsProxy = 'https://cors-anywhere.herokuapp.com/';
        const apiUrl = data.apiEndpoint!;
        const fullUrl = apiUrl.startsWith('http') ? corsProxy + apiUrl : apiUrl;

        const response = await fetch(fullUrl, {
          method: data.apiMethod || 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Origin': window.location.origin,
          },
          body: data.apiPayload ? JSON.parse(data.apiPayload) : undefined,
        });

        if (!response.ok) {
          throw new Error(`API call failed: ${response.statusText}`);
        }

        const responseData = await response.json();
        setApiResponse(responseData);
      } catch (error) {
        setApiError(error instanceof Error ? error.message : 'Failed to execute API call');
        console.error('API call error:', error);
      }
    };

    executeApiCall();
  }, [data]);

  return (
    <>
      {apiError && (
        <div style={{
          color: '#ff0072',
          padding: '10px',
          background: '#fff0f4',
          borderRadius: '4px',
          marginTop: '10px',
          maxWidth: '800px',
          width: '100%'
        }}>
          <strong>Error:</strong> {apiError}
        </div>
      )}
      {apiResponse && (
        <div style={{
          marginTop: '20px',
          maxWidth: '800px',
          width: '100%'
        }}>
          <div style={{ fontWeight: 'bold', marginBottom: '10px' }}>API Response:</div>
          <pre style={{
            background: '#f8f8f8',
            padding: '15px',
            borderRadius: '8px',
            overflow: 'auto',
            maxHeight: '300px'
          }}>
            {JSON.stringify(apiResponse, null, 2)}
          </pre>
        </div>
      )}
    </>
  );
}; 