type InvestmentBankAccount = {
  bankName: string;
  accountName: string;
  accountNumber: string;
};

const bankName = import.meta.env.VITE_INVESTMENT_BANK_NAME?.trim();
const accountName = import.meta.env.VITE_INVESTMENT_ACCOUNT_NAME?.trim();
const accountNumber = import.meta.env.VITE_INVESTMENT_ACCOUNT_NUMBER?.trim();

export const investmentBankAccount: InvestmentBankAccount | null =
  bankName && accountName && accountNumber ? { bankName, accountName, accountNumber } : null;
