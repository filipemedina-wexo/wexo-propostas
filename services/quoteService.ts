import { supabase } from './supabaseClient';
import { Quote } from '../types';

export const generateShortId = (): string => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

// Mapper: DB -> App
const mapFromDb = (data: any): Quote => ({
  id: data.id,
  clientName: data.client_name,
  clientEmail: data.client_email,
  serviceDescription: data.service_description,
  layoutType: data.layout_type || 'PREMIUM', // Default to PREMIUM for existing quotes
  content: data.content_data || {},
  createdAt: data.created_at,
  updatedAt: data.updated_at,
  validUntil: data.valid_until,
  productionDays: data.production_days,
  items: data.items,
  paymentMethodId: data.payment_method_id,
  installments: data.installments,
  hasDownPayment: data.has_down_payment,
  paymentOptions: data.payment_options,
  selectedPaymentOptionId: data.selected_payment_option_id,
  status: data.status,
  userEmail: data.user_email,
});

// Mapper: App -> DB
const mapToDb = (quote: Quote) => ({
  id: quote.id,
  client_name: quote.clientName,
  client_email: quote.clientEmail,
  service_description: quote.serviceDescription,
  layout_type: quote.layoutType,
  content_data: quote.content,
  created_at: quote.createdAt,
  updated_at: new Date().toISOString(), // Always update this on save
  valid_until: quote.validUntil,
  production_days: quote.productionDays,
  items: quote.items,
  payment_method_id: quote.paymentMethodId,
  installments: quote.installments,
  has_down_payment: quote.hasDownPayment,
  payment_options: quote.paymentOptions,
  selected_payment_option_id: quote.selectedPaymentOptionId,
  status: quote.status,
  user_email: quote.userEmail,
});

export const saveQuote = async (quote: Quote): Promise<void> => {
  const { error } = await supabase
    .from('quotes')
    .upsert(mapToDb(quote)); // Using upsert to handle both insert and update

  if (error) {
    console.error('Error saving quote:', error);
    throw error;
  }
};

export const updateQuoteStatus = async (id: string, status: Quote['status'], selectedPaymentOptionId?: string): Promise<Quote | null> => {
  const { data, error } = await supabase
    .from('quotes')
    .update({ status, selected_payment_option_id: selectedPaymentOptionId })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating quote status:', error);
    return null;
  }
  return mapFromDb(data);
};

export const getQuote = async (id: string): Promise<Quote | null> => {
  const { data, error } = await supabase
    .from('quotes')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !data) return null;
  return mapFromDb(data);
};

export const getAllQuotes = async (): Promise<Quote[]> => {
  const { data, error } = await supabase
    .from('quotes')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching quotes:', error);
    return [];
  }
  return data.map(mapFromDb);
};
