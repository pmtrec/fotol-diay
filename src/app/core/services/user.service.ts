import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  // TODO: Implement user management logic
  getCurrentUser(): any {
    return null;
  }

  updateUser(user: any): Promise<any> {
    return Promise.resolve(user);
  }
}