declare module "midtrans-client" {
  export interface TransactionDetails {
    order_id: string;
    gross_amount: number;
  }

  export interface CustomerDetails {
    first_name?: string;
    last_name?: string;
    email?: string;
    phone?: string;
  }

  export interface ItemDetails {
    id: string;
    price: number;
    quantity: number;
    name: string;
  }

  export interface CreateTransactionRequest {
    transaction_details: TransactionDetails;
    customer_details?: CustomerDetails;
    item_details?: ItemDetails[];
    payment_type?: string;
    custom_expiry?: {
      expiry_duration: number;
      unit: string;
    };
  }

  export interface SnapResponse {
    token: string;
    redirect_url: string;
  }

  export interface TransactionStatusResponse {
    status_code: string;
    status_message: string;
    transaction_id: string;
    order_id: string;
    gross_amount: string;
    payment_type: string;
    transaction_time: string;
    transaction_status: string;
    fraud_status?: string;
  }

  export interface SnapResult {
    status_code: string;
    status_message: string;
    transaction_id: string;
    order_id: string;
    gross_amount: string;
    payment_type: string;
    transaction_time: string;
    transaction_status: string;
  }

  export interface SnapCallbacks {
    onSuccess?: (result: SnapResult) => void;
    onPending?: (result: SnapResult) => void;
    onError?: (result: SnapResult) => void;
    onClose?: () => void;
  }

  export interface WindowWithSnap extends Window {
    snap?: {
      pay: (token: string, callbacks: SnapCallbacks) => void;
    };
  }

  export class Snap {
    constructor(options: {
      isProduction: boolean;
      serverKey: string;
      clientKey?: string;
    });

    createTransaction(
      parameter: CreateTransactionRequest
    ): Promise<SnapResponse>;
    transaction: {
      status(orderId: string): Promise<TransactionStatusResponse>;
    };
  }

  export class CoreApi {
    constructor(options: {
      isProduction: boolean;
      serverKey: string;
      clientKey?: string;
    });

    transaction: {
      status(orderId: string): Promise<TransactionStatusResponse>;
    };
  }
}
