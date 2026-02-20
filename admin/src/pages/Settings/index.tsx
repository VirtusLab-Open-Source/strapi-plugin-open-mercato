import { usePluginTheme } from '@sensinum/strapi-utils';
import { DesignSystemProvider } from '@strapi/design-system';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Settings } from './Settings';

const queryClient = new QueryClient();
export const SettingsPage = () => {
  const theme = usePluginTheme();
  return (
    <QueryClientProvider client={queryClient}>
      <DesignSystemProvider theme={theme}>
        <Settings />
      </DesignSystemProvider>
    </QueryClientProvider>
  );
};

