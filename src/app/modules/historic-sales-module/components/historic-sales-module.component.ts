import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { SalesService } from '../../../services/sales.service';
import Notiflix from 'notiflix';

interface HistoricSaleRow {
    invoiceNumber: string;
    totalAmount: number;
    totalProfit: number;
    date: string;
    dateStr: string;
    itemCount: number;
    sales: any[];
}

@Component({
    selector: 'app-historic-sales-module',
    standalone: true,
    imports: [CommonModule, FormsModule, ReactiveFormsModule],
    templateUrl: './historic-sales-module.component.html',
    styleUrls: ['./historic-sales-module.component.scss'],
})
export class HistoricSalesModuleComponent implements OnInit {
    historicSales: HistoricSaleRow[] = [];
    filteredSales: HistoricSaleRow[] = [];

    // Chart
    monthlyData: { month: string; amount: number; profit: number; height: number; }[] = [];

    // Pagination
    currentPage: number = 1;
    pageSize: number = 100;

    // Search
    startDate: string = '';
    endDate: string = '';
    searchQuery: string = '';

    isLoading: boolean = false;

    constructor(private salesService: SalesService) { }

    ngOnInit(): void {
        this.loadHistoricSales();
    }

    loadHistoricSales(): void {
        this.isLoading = true;
        Notiflix.Loading.standard('Cargando historial...');

        this.salesService.getHistoricSales(this.currentPage, this.pageSize).subscribe({
            next: (data: any) => {
                Notiflix.Loading.remove();
                this.isLoading = false;

                const results = Array.isArray(data) ? data : data.items || [data];
                this.processSales(results);
            },
            error: (err) => {
                Notiflix.Loading.remove();
                this.isLoading = false;
                console.error(err);
                Notiflix.Notify.failure('Error cargando el historial.');
            },
        });
    }

    processSales(data: any[]): void {
        this.historicSales = [];
        data.forEach(invoiceData => {
            const invoice = invoiceData.invoiceNumber || 'N/A';
            const salesArr = Array.isArray(invoiceData.sales) ? invoiceData.sales : invoiceData;

            // Calculate totals for invoice
            let totalAmount = 0;
            let totalProfit = 0;
            let saleDate = '';

            if (Array.isArray(salesArr)) {
                salesArr.forEach((s: any) => {
                    totalAmount += (s.totalAmount || 0);
                    totalProfit += (s.profit || 0);
                    if (!saleDate && s.saleDate) {
                        saleDate = s.saleDate;
                    }
                });

                this.historicSales.push({
                    invoiceNumber: invoice,
                    totalAmount: totalAmount,
                    totalProfit: totalProfit,
                    itemCount: salesArr.length,
                    date: saleDate,
                    dateStr: saleDate ? new Date(saleDate).toLocaleDateString() : 'N/A',
                    sales: salesArr
                });
            }
        });

        // Default Sorting descend
        this.historicSales.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        this.filterSales();
    }

    filterSales(): void {
        let temp = [...this.historicSales];

        if (this.startDate) {
            const sDate = new Date(this.startDate).getTime();
            temp = temp.filter(s => new Date(s.date).getTime() >= sDate);
        }
        if (this.endDate) {
            const eDate = new Date(this.endDate).getTime();
            temp = temp.filter(s => new Date(s.date).getTime() <= eDate);
        }
        if (this.searchQuery) {
            const query = this.searchQuery.toLowerCase();
            temp = temp.filter(s => s.invoiceNumber.toLowerCase().includes(query));
        }

        this.filteredSales = temp;
        this.generateChartData();
    }

    generateChartData(): void {
        const monthMap = new Map<string, { amount: number; profit: number }>();
        this.filteredSales.forEach(s => {
            if (!s.date) return;
            const d = new Date(s.date);
            const mKey = `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}`;
            const curr = monthMap.get(mKey) || { amount: 0, profit: 0 };
            curr.amount += s.totalAmount;
            curr.profit += s.totalProfit;
            monthMap.set(mKey, curr);
        });

        const entries = Array.from(monthMap.entries()).sort((a, b) => a[0].localeCompare(b[0]));
        let maxAmount = 1;

        entries.forEach(e => {
            if (e[1].amount > maxAmount) maxAmount = e[1].amount;
        });

        this.monthlyData = entries.map(e => ({
            month: e[0],
            amount: e[1].amount,
            profit: e[1].profit,
            height: (e[1].amount / maxAmount) * 100
        }));
    }

    clearFilters(): void {
        this.startDate = '';
        this.endDate = '';
        this.searchQuery = '';
        this.filterSales();
    }
}
