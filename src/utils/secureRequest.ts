// XMLHttpRequest ile CORS bypass utility
export const makeSecureRequest = async (url: string, options: RequestInit = {}): Promise<Response> => {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    
    xhr.open(options.method || 'GET', url, true);
    
    // Headers ekle
    if (options.headers) {
      Object.entries(options.headers as Record<string, string>).forEach(([key, value]) => {
        xhr.setRequestHeader(key, value);
      });
    }
    
    xhr.onreadystatechange = function() {
      if (xhr.readyState === 4) {
        const response = {
          ok: xhr.status >= 200 && xhr.status < 300,
          status: xhr.status,
          statusText: xhr.statusText,
          json: async () => JSON.parse(xhr.responseText),
          text: async () => xhr.responseText
        } as Response;
        
        if (response.ok) {
          resolve(response);
        } else {
          reject(new Error(`HTTP ${xhr.status}: ${xhr.statusText}`));
        }
      }
    };
    
    xhr.onerror = function() {
      reject(new Error('Network error'));
    };
    
    if (options.body) {
      xhr.send(options.body as string);
    } else {
      xhr.send();
    }
  });
};
