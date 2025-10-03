/**
 * Dashboard Component
 * Main dashboard component for the application
 */

import { Component, OnInit, OnDestroy, ViewChild, ElementRef, ChangeDetectorRef } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router, ActivatedRoute } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Observable, Subject, Subscription, of, from, interval, timer } from 'rxjs';
import { map, filter, tap, catchError, takeUntil, debounceTime, distinctUntilChanged } from 'rxjs/operators';
import * as Chart from 'chart.js';
import * as moment from 'moment';

// ISSUE: No interfaces defined
@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit, OnDestroy {
  // ISSUE: Any types
  public dashboardData: any;
  public chartData: any;
  public tableData: any[] = [];
  public selectedFilter: string = 'week';
  public loading: boolean = true;
  public error: string = '';
  
  // ISSUE: Any types for ViewChild
  @ViewChild('chartCanvas') chartCanvas: any;
  @ViewChild('dataTable') dataTable: any;
  
  // ISSUE: Not initialized
  private destroy$: Subject<void>;
  
  // ISSUE: Unused imports
  constructor(
    private http: HttpClient,
    private router: Router,
    private route: ActivatedRoute,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private cdr: ChangeDetectorRef
  ) {}
  
  // ISSUE: Not initializing destroy$ subject
  ngOnInit() {
    this.loadDashboardData();
    
    // ISSUE: Not unsubscribing
    interval(60000).subscribe(() => {
      this.refreshData();
    });
  }
  
  // ISSUE: Not properly cleaning up
  ngOnDestroy() {
    // ISSUE: destroy$ not initialized
    this.destroy$.next();
    this.destroy$.complete();
  }
  
  // ISSUE: Any return type
  loadDashboardData(): any {
    this.loading = true;
    
    // ISSUE: Hardcoded URL
    this.http.get('https://api.example.com/dashboard')
      .pipe(
        // ISSUE: Not handling errors properly
        catchError(error => {
          console.error('Error loading dashboard data', error);
          this.error = 'Failed to load dashboard data';
          this.loading = false;
          return of(null);
        })
      )
      .subscribe(data => {
        if (data) {
          // ISSUE: Any type
          this.dashboardData = data;
          this.processChartData();
          this.processTableData();
        }
        this.loading = false;
      });
  }
  
  // ISSUE: No return type
  processChartData() {
    // ISSUE: Not checking if dashboardData exists
    const chartData = {
      labels: this.dashboardData.timeLabels,
      datasets: [
        {
          label: 'Users',
          data: this.dashboardData.userData,
          backgroundColor: 'rgba(75, 192, 192, 0.2)',
          borderColor: 'rgba(75, 192, 192, 1)',
          borderWidth: 1
        },
        {
          label: 'Revenue',
          data: this.dashboardData.revenueData,
          backgroundColor: 'rgba(153, 102, 255, 0.2)',
          borderColor: 'rgba(153, 102, 255, 1)',
          borderWidth: 1
        }
      ]
    };
    
    this.chartData = chartData;
    
    // ISSUE: Not checking if chartCanvas exists
    setTimeout(() => {
      this.renderChart();
    });
  }
  
  // ISSUE: No return type
  processTableData() {
    // ISSUE: Not checking if dashboardData exists
    this.tableData = this.dashboardData.tableData.map(item => {
      return {
        ...item,
        date: moment(item.date).format('MMM DD, YYYY'),
        amount: `$${item.amount.toFixed(2)}`
      };
    });
  }
  
  // ISSUE: No return type
  renderChart() {
    // ISSUE: Not checking if chartCanvas exists
    const ctx = this.chartCanvas.nativeElement.getContext('2d');
    
    // ISSUE: Not destroying existing chart
    new Chart(ctx, {
      type: 'bar',
      data: this.chartData,
      options: {
        responsive: true,
        scales: {
          y: {
            beginAtZero: true
          }
        }
      }
    });
  }
  
  // ISSUE: Any parameter type
  onFilterChange(filter: any) {
    this.selectedFilter = filter;
    this.loadDashboardData();
  }
  
  // ISSUE: No return type
  refreshData() {
    this.loadDashboardData();
  }
  
  // ISSUE: Any parameter type
  navigateToDetail(item: any) {
    // ISSUE: Not checking if item exists
    this.router.navigate(['/detail', item.id]);
  }
  
  // ISSUE: Any parameter type
  exportData(format: any) {
    // ISSUE: Not validating format
    this.http.get(`https://api.example.com/export?format=${format}`, { responseType: 'blob' })
      .subscribe(blob => {
        // ISSUE: Not handling errors
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `dashboard-export-${new Date().getTime()}.${format}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      });
  }
  
  // ISSUE: Large nested loops
  processNestedData(categories) {
    const results = [];
    
    for (let i = 0; i < categories.length; i++) {
      const category = categories[i];
      
      for (let j = 0; j < category.items.length; j++) {
        const item = category.items[j];
        
        for (let k = 0; k < item.subItems.length; k++) {
          const subItem = item.subItems[k];
          
          results.push({
            categoryId: category.id,
            categoryName: category.name,
            itemId: item.id,
            itemName: item.name,
            subItemId: subItem.id,
            subItemName: subItem.name,
            value: subItem.value
          });
        }
      }
    }
    
    return results;
  }
  
  // ISSUE: Complex method with multiple responsibilities
  calculateAndDisplayMetrics() {
    // ISSUE: Not checking if dashboardData exists
    const metrics = {
      totalUsers: this.dashboardData.userData.reduce((sum, val) => sum + val, 0),
      totalRevenue: this.dashboardData.revenueData.reduce((sum, val) => sum + val, 0),
      averageRevenue: 0,
      growthRate: 0
    };
    
    metrics.averageRevenue = metrics.totalRevenue / this.dashboardData.revenueData.length;
    
    // ISSUE: Complex calculation
    const firstValue = this.dashboardData.revenueData[0];
    const lastValue = this.dashboardData.revenueData[this.dashboardData.revenueData.length - 1];
    metrics.growthRate = ((lastValue - firstValue) / firstValue) * 100;
    
    // ISSUE: Direct DOM manipulation
    document.getElementById('totalUsers').textContent = metrics.totalUsers.toString();
    document.getElementById('totalRevenue').textContent = `$${metrics.totalRevenue.toFixed(2)}`;
    document.getElementById('averageRevenue').textContent = `$${metrics.averageRevenue.toFixed(2)}`;
    document.getElementById('growthRate').textContent = `${metrics.growthRate.toFixed(2)}%`;
    
    // ISSUE: Not using Angular change detection
    this.cdr.detectChanges();
  }
}
