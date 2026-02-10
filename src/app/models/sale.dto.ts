export interface SaleDto {
  invoiceNumber: string;
  customerID: number;
  employeeID: number;
  productID: number;
  saleDate: string; // ISO string
  quantity: number;
  unitPrice: number;
  taxAmount: number;
  totalAmount: number;
  paymentMethod: string;
  status: string;
}
