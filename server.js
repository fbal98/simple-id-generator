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

    // Handle CORS preflight requests for the API endpoint
    if (req.method === "OPTIONS" && pathname === "/api/face") {
      return new Response(null, {
        headers: {
          "Access-Control-Allow-Origin": "*", // Be more specific in production
          "Access-Control-Allow-Methods": "GET, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
          "Access-Control-Max-Age": "86400", // 24 hours
        }
      });
    }

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

    // Serve static assets (js, css, and potentially other types like images if you add them)
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

    // Route for fetching AI face image (existing logic)
    if (pathname === "/api/face") {
      return new Response(null, {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
          "Access-Control-Max-Age": "86400", // 24 hours
        }
      });
    }

    // Route for fetching AI face image
    if (pathname === "/api/face") {
      try {
        // Fetch image from thispersondoesnotexist.com
        const response = await fetch("https://thispersondoesnotexist.com/", {
          cache: "no-store"
        });
        
        if (!response.ok) {
          return new Response(`Failed to fetch AI face: ${response.status} ${response.statusText}`, {
            status: response.status
          });
        }
        
        // Get image data as a buffer
        const imageData = await response.arrayBuffer();
        
        // Return image with appropriate CORS headers
        return new Response(imageData, {
          headers: {
            "Content-Type": response.headers.get("Content-Type") || "image/jpeg",
            "Access-Control-Allow-Origin": "*",
            "Cache-Control": "no-cache, no-store, must-revalidate"
          }
        });
      } catch (error) {
        console.error("Error fetching AI face:", error);
        return new Response(`Error fetching AI face: ${error.message}`, {
          status: 500,
          headers: {
            "Access-Control-Allow-Origin": "*",
            "Content-Type": "text/plain"
          }
        });
      }
    }

    // Serve static files
    let filePath = `.${pathname}`;
    if (pathname === '/') {
      filePath = './index.html';
    }

    // Ensure path is safe and within the project directory
    const absolutePath = path.join(process.cwd(), filePath);

    // Check if the file exists and serve it
    try {
      const file = Bun.file(absolutePath);
      if (await file.exists()) {
        return new Response(file, {
          headers: {
            "Content-Type": file.type,
            "Access-Control-Allow-Origin": "*", // Allow CORS for static files too
          }
        });
      }
    } catch (error) {
      console.error(`Error serving file ${absolutePath}:`, error);
      // Fall through to 404
    }

    // If no route matched or file not found
    return new Response(`Not found: ${pathname}`, {
      status: 404,
      headers: {
        "Content-Type": "text/plain"
      }
    });
  },
});

console.log(`Server running at http://localhost:${PORT}`);
console.log(`Get AI faces at http://localhost:${PORT}/api/face`);