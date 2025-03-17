/**
 * Custom logger middleware for Express
 */

export const logger = (req, res, next) => {
  const start = Date.now();
  
  // Log request details
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  
  // Log request body if it exists and isn't too large
  if (req.body && Object.keys(req.body).length > 0) {
    const bodySize = JSON.stringify(req.body).length;
    if (bodySize < 1000) {
      console.log(`Request body: ${JSON.stringify(req.body)}`);
    } else {
      console.log(`Request body: [${bodySize} bytes]`);
    }
  }
  
  // Capture the original end method
  const originalEnd = res.end;
  
  // Override the end method to log response details
  res.end = function(chunk, encoding) {
    const duration = Date.now() - start;
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url} ${res.statusCode} - ${duration}ms`);
    
    // Call the original end method
    return originalEnd.call(this, chunk, encoding);
  };
  
  next();
};

export default logger;