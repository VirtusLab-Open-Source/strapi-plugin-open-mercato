const en = {
  customField: {
    label: 'Open Mercato product',
    description: 'Add an Open Mercato product to your entry',
    product: {
      placeholder: 'Select a product',
      minCharacters: 'Please provide minimum 3 characters',
      noOptions: 'No options available',
      notConfigured: 'Open Mercato plugin is not configured. Go to Settings to set up API credentials.',
    },
  },

  plugin: {
    section: {
      name: 'Open Mercato plugin',
      item: 'Settings',
    },
  },

  header: {
    settings: {
      tabTitle: 'Open Mercato',
      title: 'Open Mercato',
    },
  },

  form: {
    settings: {
      save: 'Save',
      success: {
        save: 'Settings saved successfully',
      },
      error: {
        validationMessage: 'Please check the form for errors',
      },
      apiUrl: {
        label: 'API URL',
        placeholder: 'Enter your Open Mercato instance URL (e.g. https://my-instance.openmercato.com)',
      },
      accessToken: {
        label: 'Access Token',
        placeholder: 'Enter your Open Mercato access token',
      },
    },
    errors: {
      required: 'This field is required',
    }
  },
};

export default en;

export type EN = typeof en;
