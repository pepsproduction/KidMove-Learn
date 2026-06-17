import { defineConfig } from 'vite';

export default defineConfig({
  // Set the root to the 'src' directory so development runs there
  root: 'src',
  base: './',
  
  // Set the public folder path relative to the root 'src' directory
  publicDir: '../public',
  
  build: {
    // Match the GitHub Pages workflow, which deploys the dist directory.
    outDir: '../dist',
    emptyOutDir: true,
  },
  server: {
    port: 3000,
    open: true
  }
});
