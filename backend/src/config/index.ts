export const config = {
  jwtSecret: process.env.JWT_SECRET || "supersecret",
  port: process.env.PORT || 4000,
  domain: process.env.DOMAIN || "http://localhost:4000",
}; 