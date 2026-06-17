import { defineConfig } from 'vite';

export default defineConfig({
  // Set the root to the 'src' directory so development runs there
  root: 'src',
  base: './',
  
  // Set the public folder path relative to the root 'src' directory
  publicDir: '../public',
  
  build: {
    // Output built files directly to the repository root directory
    outDir: '../',
    // Critical: Do NOT clear the root directory, otherwise it will delete source files!
    emptyOutDir: false,
  },
  server: {
    port: 3000,
    open: true
  }
});
