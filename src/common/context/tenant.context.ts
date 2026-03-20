import { AsyncLocalStorage } from 'async_hooks';

/**
 * Global AsyncLocalStorage for managing the current Tenant Context.
 * This solves context propagation without passing 'tenantId' down to every function.
 */
export const tenantContextStorage = new AsyncLocalStorage<string>();

export class TenantContext {
  /**
   * Set the active tenant ID for the current isolated async flow.
   */
  static run(tenantId: string, callback: () => void): void {
    tenantContextStorage.run(tenantId, callback);
  }

  /**
   * Get the current active tenant ID.
   * Useful for internal service logic, logging, and global Database ORM filters.
   */
  static getTenantId(): string | undefined {
    return tenantContextStorage.getStore();
  }
}
