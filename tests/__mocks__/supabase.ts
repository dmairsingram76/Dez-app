export const createClient = () => ({
  auth: {
    getUser: async () => ({ data: { user: { id: 'test-user' } } }),
  },
  from: () => ({
    select: async () => ({ data: [], error: null }),
    insert: async () => ({ error: null }),
  }),
});
