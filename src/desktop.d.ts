export {};

declare global {
  interface Window {
    desktop?: {
      saveStore: (data: any) => void;
      loadStore: () => Promise<any>;
    };
  }
}
