export const runtimeConfig = {
  // Toggle this flag anytime to switch between real services and local mock data.
  useMockData: true,

  mock: {
    solBalance: 1.245,
    usdcBalance: 250.75,
    sendDelayMs: 400,
  },
} as const;
