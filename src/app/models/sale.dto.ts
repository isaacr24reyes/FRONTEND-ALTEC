export interface SaleDto {
  invoiceNumber: string;
  employeeID: string | null;
  productID: string;
  saleDate: string; // ISO string
  profit: number;
  quantity: number;
  unitPrice: number;
  taxAmount: number;
  totalAmount: number;
  paymentMethod: string;
  status: string;
}
