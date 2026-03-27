import { supabase } from './supabaseClient';
import { PaymentMethod } from '../types';

const mapFromDb = (data: any): PaymentMethod => ({
    id: data.id,
    name: data.name,
    discountPercent: data.discount_percent,
    active: data.active,
});

const mapToDb = (method: Omit<PaymentMethod, 'id'>) => ({
    name: method.name,
    discount_percent: method.discountPercent,
    active: method.active ?? true,
});

export const getAllPaymentMethods = async (): Promise<PaymentMethod[]> => {
    const { data, error } = await supabase
        .from('payment_methods')
        .select('*')
        .eq('active', true)
        .order('name');

    if (error) {
        console.error('Error fetching payment methods:', error);
        return [];
    }
    return data.map(mapFromDb);
};

export const createPaymentMethod = async (method: Omit<PaymentMethod, 'id'>): Promise<PaymentMethod | null> => {
    const { data, error } = await supabase
        .from('payment_methods')
        .insert(mapToDb(method))
        .select()
        .single();

    if (error) {
        console.error('Error creating payment method:', error);
        return null;
    }
    return mapFromDb(data);
};

export const deletePaymentMethod = async (id: string): Promise<boolean> => {
    const { error } = await supabase
        .from('payment_methods')
        .delete()
        .eq('id', id);

    if (error) {
        console.error('Error deleting payment method:', error);
        return false;
    }
    return true;
};
