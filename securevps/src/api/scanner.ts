interface ScanResponse {
  target: string;
  cms?: string;
  open_ports?: number[];
}

export const runCmsScan = async (target: string): Promise<ScanResponse> => {
  const response = await fetch('/scan/cms', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ target }),
  });
  return response.json();
};