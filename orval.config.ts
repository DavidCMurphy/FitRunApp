import { defineConfig } from 'orval';

export default defineConfig({
  fitRunBackend: {
    input: {
      target: '../FitRunAppBackend/openapi.yaml'
    },
    output: {
      client: 'react-query',
      clean: true,
      httpClient: 'axios',
      mode: 'single',
      prettier: true,
      schemas: './src/api/generated/model',
      target: './src/api/generated/fitRunBackend.ts',
      override: {
        mutator: {
          path: './src/api/mutator/fitRunAxios.ts',
          name: 'fitRunAxios'
        },
        query: {
          shouldSplitQueryKey: true
        }
      }
    }
  }
});
