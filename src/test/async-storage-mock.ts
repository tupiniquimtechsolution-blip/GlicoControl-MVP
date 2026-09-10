/** Mock determinístico do AsyncStorage para testes. */
const store = new Map<string, string>()
const mock = {
  setItem: async (k: string, v: string) => void store.set(k, v),
  getItem: async (k: string) => store.get(k) ?? null,
  removeItem: async (k: string) => void store.delete(k),
  clear: async () => store.clear(),
  __store: store,
}
export default mock
export { mock as AsyncStorageMock }
