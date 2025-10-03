/**
 * User Service
 * Handles user management operations
 */

import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { catchError, map, tap, mergeMap, switchMap, filter } from 'rxjs/operators';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Store } from '@ngrx/store';
import * as moment from 'moment';
import * as _ from 'lodash';

// ISSUE: Missing interface definitions
@Injectable({
  providedIn: 'root'
})
export class UserService {
  // ISSUE: Any type
  private currentUser: any = null;
  
  // ISSUE: Hardcoded URL
  private apiUrl = 'https://api.example.com/users';
  
  // ISSUE: Any type
  private userCache: any = {};
  
  constructor(
    // ISSUE: Unused dependencies
    private http: HttpClient,
    private router: Router,
    private snackBar: MatSnackBar,
    private store: Store<any>
  ) {}
  
  // ISSUE: Any return type
  getCurrentUser(): any {
    return this.currentUser;
  }
  
  // ISSUE: Any parameter type
  setCurrentUser(user: any): void {
    this.currentUser = user;
    // ISSUE: Using localStorage directly
    localStorage.setItem('currentUser', JSON.stringify(user));
  }
  
  // ISSUE: Any return type
  getUsers(): Observable<any> {
    return this.http.get<any[]>(this.apiUrl).pipe(
      // ISSUE: No error handling
      map(users => {
        // ISSUE: Unnecessary mapping
        return users.map(user => {
          return {
            ...user,
            fullName: `${user.firstName} ${user.lastName}`
          };
        });
      })
    );
  }
  
  // ISSUE: Any parameter and return type
  getUserById(id: string): Observable<any> {
    // ISSUE: Not using cache properly
    if (this.userCache[id]) {
      return of(this.userCache[id]);
    }
    
    return this.http.get<any>(`${this.apiUrl}/${id}`).pipe(
      tap(user => {
        this.userCache[id] = user;
      }),
      catchError(error => {
        console.error('Error fetching user', error);
        return throwError(error);
      })
    );
  }
  
  // ISSUE: Any parameter and return type
  createUser(userData: any): Observable<any> {
    return this.http.post<any>(this.apiUrl, userData).pipe(
      catchError(error => {
        console.error('Error creating user', error);
        return throwError(error);
      })
    );
  }
  
  // ISSUE: Any parameter and return type
  updateUser(id: string, userData: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${id}`, userData).pipe(
      tap(user => {
        // ISSUE: Updating cache without checking if it exists
        this.userCache[id] = user;
      }),
      catchError(error => {
        console.error('Error updating user', error);
        return throwError(error);
      })
    );
  }
  
  // ISSUE: Any return type
  deleteUser(id: string): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${id}`).pipe(
      tap(() => {
        // ISSUE: Deleting from cache without checking if it exists
        delete this.userCache[id];
      }),
      catchError(error => {
        console.error('Error deleting user', error);
        return throwError(error);
      })
    );
  }
  
  // ISSUE: Any parameter and return type
  searchUsers(query: string): Observable<any[]> {
    // ISSUE: Not using HttpParams properly
    return this.http.get<any[]>(`${this.apiUrl}?q=${query}`).pipe(
      catchError(error => {
        console.error('Error searching users', error);
        return of([]);
      })
    );
  }
  
  // ISSUE: Any parameter and return type
  getUserRoles(userId: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/${userId}/roles`).pipe(
      catchError(error => {
        console.error('Error fetching user roles', error);
        return of([]);
      })
    );
  }
  
  // ISSUE: Any parameter and return type
  assignRole(userId: string, roleId: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/${userId}/roles`, { roleId }).pipe(
      catchError(error => {
        console.error('Error assigning role', error);
        return throwError(error);
      })
    );
  }
  
  // ISSUE: Any parameter and return type
  removeRole(userId: string, roleId: string): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${userId}/roles/${roleId}`).pipe(
      catchError(error => {
        console.error('Error removing role', error);
        return throwError(error);
      })
    );
  }
  
  // ISSUE: Large nested loops
  processUserData(departments) {
    const results = [];
    
    for (let i = 0; i < departments.length; i++) {
      const department = departments[i];
      
      for (let j = 0; j < department.teams.length; j++) {
        const team = department.teams[j];
        
        for (let k = 0; k < team.users.length; k++) {
          const user = team.users[k];
          
          // ISSUE: Complex nested processing
          for (let l = 0; l < user.roles.length; l++) {
            const role = user.roles[l];
            
            results.push({
              departmentId: department.id,
              departmentName: department.name,
              teamId: team.id,
              teamName: team.name,
              userId: user.id,
              userName: user.name,
              roleId: role.id,
              roleName: role.name
            });
          }
        }
      }
    }
    
    return results;
  }
  
  // ISSUE: Complex method with multiple responsibilities
  validateAndProcessUser(userData) {
    // Validation
    if (!userData.email) {
      throw new Error('Email is required');
    }
    
    if (!userData.firstName || !userData.lastName) {
      throw new Error('First name and last name are required');
    }
    
    // Processing
    const user = {
      ...userData,
      fullName: `${userData.firstName} ${userData.lastName}`,
      initials: `${userData.firstName[0]}${userData.lastName[0]}`,
      created: new Date(),
      lastLogin: null,
      status: 'active'
    };
    
    // Save to database
    return this.http.post<any>(this.apiUrl, user).pipe(
      tap(savedUser => {
        // Update cache
        this.userCache[savedUser.id] = savedUser;
        
        // Show notification
        this.snackBar.open('User created successfully', 'Close', {
          duration: 3000
        });
        
        // Navigate to user detail
        this.router.navigate(['/users', savedUser.id]);
      }),
      catchError(error => {
        console.error('Error creating user', error);
        
        // Show error notification
        this.snackBar.open('Error creating user', 'Close', {
          duration: 3000
        });
        
        return throwError(error);
      })
    );
  }
}
