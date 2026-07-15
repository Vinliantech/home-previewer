// Static bank details displayed to investors for off-platform deposits.
// Update these values once the operations team confirms the live account.
export const investmentBankAccount = {
  bankName: "Kay-Steph Group Holdings",
  accountName: "Kay-Steph Investment Trust",
  accountNumber: "0000000000",
  sortCode: "000000",
  swift: "KSGRPNGLA",
  reference: "Use your registered email as the payment reference",
} as const;

export type InvestmentBankAccount = typeof investmentBankAccount;
