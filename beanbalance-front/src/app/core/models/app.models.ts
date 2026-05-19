export type AccountType = 'CHECKING' | 'SAVINGS' | 'CREDIT_CARD' | 'INVESTMENT' | 'CASH';
export type TransactionType = 'INCOME' | 'EXPENSE';
export type CategoryType = 'SYSTEM' | 'CUSTOM';

export interface Account {
  id: string;
  name: string;
  type: AccountType;
  balance: number;
  createdAt: string;
}

export interface Transaction {
  id: string;
  amount: number;
  type: TransactionType;
  date: string;
  description: string;
  categoryId: string;
  categoryName: string;
  accountId: string;
  accountName: string;
  createdAt: string;
}

export interface Category {
  id: string;
  name: string;
  description: string;
  type: CategoryType;
  createdAt: string;
}

export interface Budget {
  id: string;
  categoryId: string;
  categoryName: string;
  limit: number;
  spent: number;
  month: string;
  createdAt: string;
}

export interface Toast {
  id: string;
  type: 'success' | 'error';
  message: string;
}
