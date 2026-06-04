export const formatCurrency = (value: number | null | undefined, currencyCode: string = 'USD'): string => {
  if (value === null || value === undefined) return '—';
  
  // Standardize currency code to uppercase
  const safeCurrency = currencyCode.toUpperCase();
  
  try {
    return new Intl.NumberFormat('en-US', { 
      style: 'currency', 
      currency: safeCurrency, 
      minimumFractionDigits: 0 
    }).format(value);
  } catch (e) {
    // Fallback if an invalid currency code is somehow passed
    return `${safeCurrency} ${value.toLocaleString('en-US', { minimumFractionDigits: 0 })}`;
  }
};

export const SUPPORTED_CURRENCIES = [
  { code: 'USD', label: 'US Dollar ($)' },
  { code: 'PKR', label: 'Pakistani Rupee (Rs)' },
  { code: 'EUR', label: 'Euro (€)' },
  { code: 'GBP', label: 'British Pound (£)' },
  { code: 'INR', label: 'Indian Rupee (₹)' },
  { code: 'AED', label: 'UAE Dirham (د.إ)' },
  { code: 'AUD', label: 'Australian Dollar (A$)' },
  { code: 'CAD', label: 'Canadian Dollar (C$)' },
];
