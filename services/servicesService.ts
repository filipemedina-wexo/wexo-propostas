import { supabase } from './supabaseClient';
import { Service } from '../types';

const mapFromDb = (data: any): Service => ({
    id: data.id,
    description: data.description,
    amount: data.amount,
    type: data.type,
    userEmail: data.user_email,
});

const mapToDb = (service: Omit<Service, 'id'>) => ({
    description: service.description,
    amount: service.amount,
    type: service.type,
    user_email: service.userEmail,
});

export const getAllServices = async (): Promise<Service[]> => {
    const { data, error } = await supabase
        .from('services')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching services:', error);
        return [];
    }
    return data.map(mapFromDb);
};

export const createService = async (service: Omit<Service, 'id'>): Promise<Service | null> => {
    const { data, error } = await supabase
        .from('services')
        .insert(mapToDb(service))
        .select()
        .single();

    if (error) {
        console.error('Error creating service:', error);
        return null;
    }
    return mapFromDb(data);
};

export const deleteService = async (id: string): Promise<boolean> => {
    const { error } = await supabase
        .from('services')
        .delete()
        .eq('id', id);

    if (error) {
        console.error('Error deleting service:', error);
        return false;
    }
    return true;
};
