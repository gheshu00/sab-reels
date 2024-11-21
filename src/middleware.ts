import { NextRequest, NextResponse } from "next/server";

// Define the list of allowed origins and methods
const allowedOrigins = [
  "http://127.0.0.1:5500",
  "https://sab-sigma.vercel.app/",
];
const allowedMethods = ["GET", "POST", "PUT", "DELETE", "OPTIONS"];

const publicRoutes = ["/api/sign-up", "/sign-up", "/sign-in"];

export async function middleware(request: NextRequest) {
  const origin = request.headers.get("origin") || "";

  // Handle preflight requests (OPTIONS method)
  if (request.method === "OPTIONS") {
    return new NextResponse(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": allowedOrigins.includes(origin)
          ? origin
          : "",
        "Access-Control-Allow-Methods": allowedMethods.join(", "),
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
    });
  }

  // Set CORS headers for all other requests
  const response = NextResponse.next();
  response.headers.set(
    "Access-Control-Allow-Origin",
    allowedOrigins.includes(origin) ? origin : ""
  );
  response.headers.set(
    "Access-Control-Allow-Methods",
    allowedMethods.join(", ")
  );
  response.headers.set(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization"
  );
  return response;
}

export const config = {
  matcher: "/api/:path*", // Match all API routes
};
