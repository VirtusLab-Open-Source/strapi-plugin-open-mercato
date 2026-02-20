import { CustomFieldInputProps, Field } from '@sensinum/strapi-utils';
import { Combobox, ComboboxOption, Flex, Typography } from '@strapi/design-system';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { debounce } from 'lodash';
import { FC, useCallback, useState } from 'react';
import { useIntl } from 'react-intl';
import { z } from 'zod';
import { useIsPluginConfigured } from '../hooks/isConfigured.hook';
import { useReadShopProducts } from '../hooks/readProducts.hook';
import { getTrad } from '../translations';
import { Avatar } from '@strapi/design-system';

interface Props extends CustomFieldInputProps {
  label?: string;
}

const validState = z.object({
  id: z.union([z.string(), z.number()]).optional(),
  title: z.string().optional(),
  default_media_url: z.string().nullable().optional(),
});

const queryClient = new QueryClient();

const autocomplete = { type: 'list', filter: 'contains' } as const;

const getParsedValue = (value: any): Required<z.infer<typeof validState>> => {
  const parsedValue = validState.safeParse(value);
  if (parsedValue.success) {
    return {
      id: parsedValue.data.id ?? '',
      title: parsedValue.data.title ?? '',
      default_media_url: parsedValue.data.default_media_url ?? null,
    };
  }
  return {
    id: '',
    title: '',
    default_media_url: null,
  };
};

export const ProductInput: FC<Props> = ({
  disabled,
  name,
  label,
  description,
  error,
  onChange,
  value,
  required
}) => {
  const { formatMessage } = useIntl();
  const parsedValue = getParsedValue(value);
  const { data: isConfigured, isLoading: isConfigLoading } = useIsPluginConfigured();

  const [query, setQuery] = useState('');

  const isDisabled = disabled || !isConfigured;

  const { data: products, isLoading: productLoading } = useReadShopProducts({
    query,
    enabled: !!isConfigured,
  });
  const onChangeBuilder = (field: 'id' | 'title' | 'default_media_url') => (nextId: string | undefined) => {
    onChange?.({
      target: {
        name,
        value: {
          ...parsedValue,
          id: parsedValue.id,
          [field]: nextId,
          title: products?.find(({ id }) => id === nextId)?.title ?? parsedValue.title,
          default_media_url: products?.find(({ id }) => id === nextId)?.default_media_url ?? parsedValue.default_media_url,
        },
      },
    });
  };
  const onProductChange = onChangeBuilder('id');
  const onProductClear = () => onProductChange(undefined);

  const data = [
    parsedValue,
    ...(products ?? []).filter(({ id }) => id !== parsedValue.id),
  ].filter((_) => _ && _.id && _.title);

  const noOptionsMessage = useCallback((value: string) => value.length > 2 ? formatMessage(getTrad('customField.product.noOptions')) : formatMessage(getTrad('customField.product.minCharacters')), [formatMessage]);

  return (
    <Field name={name} hint={description} label={label || name} error={error}>
      <Flex direction="column" gap={5} width="100%" alignItems="stretch">
        {!isConfigLoading && !isConfigured && (
          <Typography variant="omega" textColor="warning600">
            {formatMessage(getTrad('customField.product.notConfigured'))}
          </Typography>
        )}
        <Combobox
          name={`${name}.product`}
          autocomplete={autocomplete}
          onChange={onProductChange}
          value={parsedValue.id}
          disabled={isDisabled}
          width="100%"
          onTextValueChange={debounce(setQuery, 300)}
          required={required}
          placeholder={formatMessage(getTrad('customField.product.placeholder'))}
          loading={isConfigLoading || productLoading}
          onClear={onProductClear}
          noOptionsMessage={noOptionsMessage}
        >
          {data.map(({ id, title, default_media_url }) => (
            <ComboboxOption key={id} value={id}>
              <Flex gap={3}>
                {default_media_url && <Avatar.Item src={default_media_url} alt={title} size="S"/>}
                <span>{title}</span>
              </Flex>
            </ComboboxOption>
          ))}
        </Combobox>
      </Flex>
    </Field>
  );
};

export default function ProductInputWrapper(props: Props) {
  return (
    <QueryClientProvider client={queryClient}>
      <ProductInput {...props} />
    </QueryClientProvider>
  );
}
