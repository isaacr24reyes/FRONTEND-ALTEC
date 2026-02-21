export interface SaleDto {
  invoiceNumber: string;
  employeeID: number | null;
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
