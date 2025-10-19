import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { Category } from '../models/category.model';

@Injectable({
  providedIn: 'root'
})
export class DataService {
  constructor(private supabaseService: SupabaseService) {}

  // Méthodes génériques pour les opérations CRUD avec Supabase
  async getAll(tableName: string, options?: {
    where?: any;
    orderBy?: any;
    take?: number;
    skip?: number;
  }) {
    try {
      let query = this.supabaseService.client.from(tableName).select('*');

      if (options?.where) {
        query = query.match(options.where);
      }

      if (options?.orderBy) {
        query = query.order(options.orderBy.column, { ascending: options.orderBy.ascending ?? true });
      }

      if (options?.take) {
        query = query.limit(options.take);
      }

      if (options?.skip) {
        query = query.range(options.skip, (options.skip + (options.take || 10)) - 1);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    } catch (error) {
      console.error(`Erreur lors de la récupération des données de ${tableName}:`, error);
      throw error;
    }
  }

  async getById(tableName: string, id: string) {
    try {
      const { data, error } = await this.supabaseService.client
        .from(tableName)
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error(`Erreur lors de la récupération de l'élément ${id} de ${tableName}:`, error);
      throw error;
    }
  }

  async create(tableName: string, data: any) {
    try {
      const { data: result, error } = await this.supabaseService.client
        .from(tableName)
        .insert(data)
        .select()
        .single();

      if (error) throw error;
      return result;
    } catch (error) {
      console.error(`Erreur lors de la création dans ${tableName}:`, error);
      throw error;
    }
  }

  async update(tableName: string, id: string, data: any) {
    try {
      const { data: result, error } = await this.supabaseService.client
        .from(tableName)
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return result;
    } catch (error) {
      console.error(`Erreur lors de la mise à jour de ${id} dans ${tableName}:`, error);
      throw error;
    }
  }

  async delete(tableName: string, id: string) {
    try {
      const { error } = await this.supabaseService.client
        .from(tableName)
        .delete()
        .eq('id', id);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error(`Erreur lors de la suppression de ${id} de ${tableName}:`, error);
      throw error;
    }
  }

  // Méthodes spécifiques pour les entités principales
  async getUsers(options?: any) {
    return this.getAll('user', options);
  }

  async getProducts(options?: any) {
    return this.getAll('product', options);
  }

  async getCategories(options?: any) {
    return this.getAll('category', options);
  }

  async getUploads(options?: any) {
    return this.getAll('upload', options);
  }

  // Méthodes pour les produits avec filtres
  async getProductsByCategory(categoryName: string) {
    return this.getAll('product', {
      where: { category: categoryName }
    });
  }

  async getProductsBySeller(sellerId: string) {
    return this.getAll('product', {
      where: { sellerId }
    });
  }

  async getApprovedProducts() {
    return this.getAll('product', {
      where: { status: 'APPROVED' }
    });
  }

  // Méthodes pour les statistiques
  async getProductStats() {
    try {
      // Get total products count
      const { count: totalProducts, error: totalError } = await this.supabaseService.client
        .from('product')
        .select('*', { count: 'exact', head: true });

      if (totalError) throw totalError;

      // Get approved products count
      const { count: approvedProducts, error: approvedError } = await this.supabaseService.client
        .from('product')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'APPROVED');

      if (approvedError) throw approvedError;

      // Get pending products count
      const { count: pendingProducts, error: pendingError } = await this.supabaseService.client
        .from('product')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'PENDING');

      if (pendingError) throw pendingError;

      return {
        total: totalProducts || 0,
        approved: approvedProducts || 0,
        pending: pendingProducts || 0,
        rejected: (totalProducts || 0) - (approvedProducts || 0) - (pendingProducts || 0)
      };
    } catch (error) {
      console.error('Erreur lors de la récupération des statistiques:', error);
      throw error;
    }
  }

  // Méthode pour ajouter une catégorie
  async addCategory(category: Category) {
    return this.create('category', category);
  }
}
