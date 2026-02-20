import { useEffect, useRef } from 'react';
import { PLUGIN_ID } from '../pluginId';

export const Initializer = ({ setPlugin }: { setPlugin: (id: string) => void }) => {
  const ref = useRef(setPlugin);

  useEffect(() => {
    ref.current(PLUGIN_ID);
  }, []);

  return null;
};
