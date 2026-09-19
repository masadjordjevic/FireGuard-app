// Reusable Prisma `select` for any User relation/list returned from an API
// route or passed into a Client Component. Always use this instead of
// `include: { ... : true }` for a User relation — a bare `true` pulls the
// hashed password column along with everything else, which either leaks
// into a JSON response or gets serialized to the browser via the React
// Server Components payload.
export const publicUserSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  reputation: true,
  walletAddress: true,
  didIdentifier: true,
  createdAt: true,
} as const;
