// server.js - Bun proxy server and static file server
// Run with: bun server.js or bun run start

const PORT = 3000;
import path from 'path'; // Using ES module import for path
import { existsSync } from 'fs'; // To check if file exists before serving

const server = Bun.serve({
  port: PORT,
  async fetch(req) {
    const url = new URL(req.url);
    const pathname = url.pathname;

    // Serve index.html for the root path
    if (pathname === "/") {
      const filePath = path.join(import.meta.dir, "index.html");
      if (existsSync(filePath)) {
        const file = Bun.file(filePath);
        return new Response(file, {
          headers: { "Content-Type": "text/html" },
        });
      } else {
        return new Response("index.html not found", { status: 404 });
      }
    }

    // Serve static assets (js, css)
    if (pathname.startsWith("/js/") || pathname.startsWith("/styles/")) {
      let relativePath = pathname.substring(1); // Remove leading '/'
      // Security: Basic check to prevent directory traversal.
      if (relativePath.includes("..")) {
        return new Response("Forbidden - Directory Traversal Attempt", { status: 403 });
      }
      const filePath = path.join(import.meta.dir, relativePath);
      
      if (existsSync(filePath)) {
        const file = Bun.file(filePath);
        let contentType = "text/plain"; // Default
        if (pathname.endsWith(".js")) contentType = "application/javascript; charset=utf-8";
        else if (pathname.endsWith(".css")) contentType = "text/css; charset=utf-8";
        else if (pathname.endsWith(".png")) contentType = "image/png";
        else if (pathname.endsWith(".jpg") || pathname.endsWith(".jpeg")) contentType = "image/jpeg";
        // Add more MIME types as needed
        
        return new Response(file, {
          headers: { "Content-Type": contentType },
        });
      } else {
        return new Response(`Static file not found: ${pathname}`, { status: 404 });
      }
    }

    // Route for fetching AI face image
    if (pathname === "/api/face") {
      // Handle CORS preflight requests
      if (req.method === "OPTIONS") {
        return new Response(null, {
          headers: {
            "Access-Control-Allow-Origin": "*", // Be more specific in production
            "Access-Control-Allow-Methods": "GET, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type",
            "Access-Control-Max-Age": "86400", // 24 hours
          }
        });
      }
      // Handle GET requests for the image
      if (req.method === "GET") {
        try {
          const extResponse = await fetch("https://thispersondoesnotexist.com/", {
            cache: "no-store"
          });
          
          if (!extResponse.ok) {
            console.error(`Failed to fetch AI face from external source: ${extResponse.status} ${extResponse.statusText}`);
            return new Response(`Failed to fetch AI face: ${extResponse.status} ${extResponse.statusText}`, {
              status: extResponse.status,
              headers: { "Access-Control-Allow-Origin": "*" } 
            });
          }
          
          const imageData = await extResponse.arrayBuffer();
          
          return new Response(imageData, {
            headers: {
              "Content-Type": extResponse.headers.get("Content-Type") || "image/jpeg",
              "Access-Control-Allow-Origin": "*",
              "Cache-Control": "no-cache, no-store, must-revalidate"
            }
          });
        } catch (error) {
          console.error("Error in /api/face GET route:", error);
          return new Response(`Error fetching AI face: ${error.message}`, {
            status: 500,
            headers: {
              "Access-Control-Allow-Origin": "*",
              "Content-Type": "text/plain"
            }
          });
        }
      }
      // If it's /api/face but not GET or OPTIONS (e.g., POST, PUT), return method not allowed
      // Also add CORS headers to this response for consistency if client tries other methods.
      return new Response("Method Not Allowed for /api/face", { 
        status: 405, 
        headers: { 
          "Access-Control-Allow-Origin": "*", 
          "Allow": "GET, OPTIONS" // Inform client which methods are allowed
        } 
      });
    }

    // If no specific route matched above, return a 404
    return new Response(`Not Found: ${pathname}`, {
      status: 404,
      headers: { "Content-Type": "text/plain" },
    });
  },
});

console.log(`Server running at http://localhost:${PORT}`);
console.log(`Get AI faces at http://localhost:${PORT}/api/face`);