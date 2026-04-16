import { useEffect } from 'react';

interface MicrosoftClarityProps {
  projectId?: string;
}

export function MicrosoftClarity({ projectId }: MicrosoftClarityProps) {
  useEffect(() => {
    // Only load if project ID is provided
    if (!projectId || projectId === '') {
      return;
    }

    // Initialize Microsoft Clarity
    (function(c: any, l: any, a: string, r: string, i: string, t?: any, y?: any) {
      c[a] = c[a] || function() { (c[a].q = c[a].q || []).push(arguments); };
      t = l.createElement(r);
      t.async = 1;
      t.src = "https://www.clarity.ms/tag/" + i;
      y = l.getElementsByTagName(r)[0];
      y.parentNode.insertBefore(t, y);
    })(window, document, "clarity", "script", projectId);
  }, [projectId]);

  return null;
}