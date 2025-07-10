export interface Invoice {
  invoiceId: number;
  transactionDate: Date;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  discount: number;
  totalAmount: number;
  balanceAmount: number;
  createdAt: Date;
  items: InvoiceItem[];
}

export interface InvoiceItem {
  invoiceItemId: number;
  productName: string;
  productDescription: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface InvoiceCreateRequest {
  transactionDate: Date;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  discount: number;
  items: InvoiceItemCreateRequest[];
}

export interface InvoiceItemCreateRequest {
  productName: string;
  productDescription: string;
  quantity: number;
  unitPrice: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: string[];
}