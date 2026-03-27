export enum ItemType {
  ONE_TIME = 'ONE_TIME',
  RECURRING = 'RECURRING'
}

export interface QuoteItem {
  id: string;
  description: string;
  amount: number;
  type: ItemType;
  durationMonths?: number;
}

export interface PaymentMethod {
  id: string;
  name: string;
  discountPercent: number;
  active?: boolean;
}

export interface PaymentOption {
  id: string;
  paymentMethodId: string;
  installments: number;
  hasDownPayment: boolean;
  discountPercent: number;
  paymentTerms?: string; // Custom text for when payment is due
}

export interface Service {
  id: string;
  description: string;
  amount: number;
  type: ItemType;
  userEmail?: string;
}

export interface Quote {
  id: string;
  clientName: string;
  clientEmail?: string;
  serviceDescription?: string;
  createdAt: string; // ISO date string
  updatedAt?: string; // ISO date string
  validUntil: string; // ISO date string
  productionDays: number;
  contractMonths?: number;
  items: QuoteItem[];
  paymentMethodId: string;
  installments?: number;
  hasDownPayment?: boolean;
  paymentOptions?: PaymentOption[];
  selectedPaymentOptionId?: string;
  status: 'DRAFT' | 'SENT' | 'APPROVED' | 'EXPIRED';
  userEmail?: string;
  layoutType?: LayoutType;
  content?: QuoteContent;
}

export interface QuoteContent {
  briefing?: {
    title: string;
    text: string;
  };
  highlights?: {
    id: string;
    title: string;
    description: string;
  }[];
  features?: {
    id: string;
    title: string;
    description: string;
  }[];
  timeline?: {
    id: string;
    step: number;
    title: string;
    description: string;
    duration?: string;
  }[];
  maintenance?: {
    id: string;
    title: string;
    price: number;
    description: string;
  }[];
  optionalFeatures?: {
    id: string;
    title: string;
    price: number;
    description: string;
    features: string[];
  }[];
}

export type LayoutType = 'SIMPLE' | 'PREMIUM';
