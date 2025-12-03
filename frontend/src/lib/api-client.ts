// Cliente HTTP para API REST externa (Java Spring ou qualquer outro backend)
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';

// Tipos
interface AuthResponse {
  user: {
    id: string;
    email: string;
    user_metadata?: Record<string, any>;
  } | null;
  session: {
    access_token: string;
  } | null;
}

interface FunctionsInvokeResult<T = any> {
  data: T | null;
  error: Error | null;
}

type QueryResult<T> = {
  data: T | null;
  error: Error | null;
  count?: number | null;
};

class ApiClient {
  private token: string | null = null;
  private authListeners: Array<(event: string, session: any) => void> = [];

  constructor() {
    this.token = localStorage.getItem('auth_token');
  }

  private getHeaders(): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }
    return headers;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<QueryResult<T>> {
    try {
      const response = await fetch(`${API_URL}${endpoint}`, {
        ...options,
        headers: {
          ...this.getHeaders(),
          ...options.headers,
        },
      });

      const text = await response.text();
      const data = text ? JSON.parse(text) : null;

      if (!response.ok) {
        return {
          data: null,
          error: new Error(data?.error || data?.message || 'Erro na requisição'),
        };
      }

      return { data: data?.data ?? data, error: null };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error : new Error('Erro desconhecido'),
      };
    }
  }

  private notifyAuthListeners(event: string, session: any) {
    this.authListeners.forEach(callback => callback(event, session));
  }

  // Auth methods
  auth = {
    signUp: async (credentials: { 
      email: string; 
      password: string;
      options?: {
        emailRedirectTo?: string;
        data?: Record<string, any>;
      };
    }): Promise<{ data: AuthResponse; error: Error | null }> => {
      const result = await this.request<{ user: any; token: string }>(
        '/auth/register',
        {
          method: 'POST',
          body: JSON.stringify({
            email: credentials.email,
            password: credentials.password,
            ...credentials.options?.data,
          }),
        }
      );

      if (result.data && result.data.token) {
        this.token = result.data.token;
        localStorage.setItem('auth_token', result.data.token);
        
        const session = { access_token: result.data.token };
        this.notifyAuthListeners('SIGNED_IN', { user: result.data.user, ...session });

        return {
          data: {
            user: result.data.user,
            session,
          },
          error: null,
        };
      }

      return {
        data: { user: null, session: null },
        error: result.error,
      };
    },

    signInWithPassword: async (credentials: { 
      email: string; 
      password: string 
    }): Promise<{ data: AuthResponse; error: Error | null }> => {
      const result = await this.request<{ user: any; token: string }>(
        '/auth/login',
        {
          method: 'POST',
          body: JSON.stringify(credentials),
        }
      );

      if (result.data && result.data.token) {
        this.token = result.data.token;
        localStorage.setItem('auth_token', result.data.token);
        
        const session = { access_token: result.data.token };
        this.notifyAuthListeners('SIGNED_IN', { user: result.data.user, ...session });

        return {
          data: {
            user: result.data.user,
            session,
          },
          error: null,
        };
      }

      return {
        data: { user: null, session: null },
        error: result.error,
      };
    },

    signOut: async (): Promise<{ error: Error | null }> => {
      await this.request('/auth/logout', { method: 'POST' });
      this.token = null;
      localStorage.removeItem('auth_token');
      this.notifyAuthListeners('SIGNED_OUT', null);
      return { error: null };
    },

    getUser: async (): Promise<{ data: { user: any }; error: Error | null }> => {
      if (!this.token) {
        return { data: { user: null }, error: null };
      }

      const result = await this.request<{ user: any }>('/auth/user');

      if (result.error) {
        return { data: { user: null }, error: result.error };
      }

      return { data: { user: result.data?.user || result.data || null }, error: null };
    },

    getSession: async (): Promise<{ data: { session: any }; error: Error | null }> => {
      if (!this.token) {
        return { data: { session: null }, error: null };
      }

      const userResult = await this.auth.getUser();
      if (userResult.data.user) {
        return { 
          data: { 
            session: { 
              user: userResult.data.user,
              access_token: this.token 
            } 
          }, 
          error: null 
        };
      }

      return { data: { session: null }, error: null };
    },

    onAuthStateChange: (callback: (event: string, session: any) => void) => {
      this.authListeners.push(callback);
      
      // Verifica estado atual
      if (this.token) {
        this.auth.getUser().then(({ data }) => {
          if (data.user) {
            callback('SIGNED_IN', { user: data.user, access_token: this.token });
          }
        });
      }

      return {
        data: {
          subscription: {
            unsubscribe: () => {
              const index = this.authListeners.indexOf(callback);
              if (index > -1) {
                this.authListeners.splice(index, 1);
              }
            },
          },
        },
      };
    },
  };

  // Database methods
  from<T = any>(table: string): QueryBuilder<T> {
    return new QueryBuilder<T>(table, this);
  }

  // Functions methods - tipagem genérica
  functions = {
    invoke: async <T = any>(
      functionName: string, 
      options?: { body?: any }
    ): Promise<FunctionsInvokeResult<T>> => {
      return this.request<T>(`/functions/${functionName}`, {
        method: 'POST',
        body: options?.body ? JSON.stringify(options.body) : undefined,
      });
    },
  };

  // Channel methods (stub para compatibilidade com realtime)
  channel(_name: string) {
    return new RealtimeChannel();
  }

  removeChannel(_channel: any) {
    return Promise.resolve();
  }

  // Método interno para requests
  _request<T>(endpoint: string, options?: RequestInit): Promise<QueryResult<T>> {
    return this.request<T>(endpoint, options);
  }
}

// Stub para Realtime Channel
class RealtimeChannel {
  on(_event: string, _config: any, _callback?: any) {
    return this;
  }
  
  subscribe(_callback?: any) {
    return this;
  }

  unsubscribe() {
    return Promise.resolve();
  }
}

class QueryBuilder<T = any> {
  private table: string;
  private client: ApiClient;
  private _select: string = '*';
  private filters: Array<{ type: string; field: string; value: any; operator?: string }> = [];
  private _order: { field: string; ascending: boolean } | null = null;
  private _limit: number | null = null;
  private _offset: number | null = null;
  private _single: boolean = false;
  private _range: { from: number; to: number } | null = null;
  private _pendingOperation: 'select' | 'insert' | 'update' | 'delete' | 'upsert' = 'select';
  private _pendingData: any = null;
  private _countOption: 'exact' | 'planned' | 'estimated' | null = null;
  private _headOnly: boolean = false;

  constructor(table: string, client: ApiClient) {
    this.table = table;
    this.client = client;
  }

  select(fields: string = '*', options?: { count?: 'exact' | 'planned' | 'estimated'; head?: boolean }): this {
    this._select = fields;
    this._pendingOperation = 'select';
    if (options?.count) {
      this._countOption = options.count;
    }
    if (options?.head) {
      this._headOnly = true;
    }
    return this;
  }

  insert(data: Partial<T> | Partial<T>[]): this {
    this._pendingOperation = 'insert';
    this._pendingData = data;
    return this;
  }

  update(data: Partial<T>): this {
    this._pendingOperation = 'update';
    this._pendingData = data;
    return this;
  }

  upsert(data: Partial<T> | Partial<T>[]): this {
    this._pendingOperation = 'upsert';
    this._pendingData = data;
    return this;
  }

  delete(): this {
    this._pendingOperation = 'delete';
    return this;
  }

  eq(field: string, value: any): this {
    this.filters.push({ type: 'eq', field, value });
    return this;
  }

  neq(field: string, value: any): this {
    this.filters.push({ type: 'neq', field, value });
    return this;
  }

  gt(field: string, value: any): this {
    this.filters.push({ type: 'gt', field, value });
    return this;
  }

  gte(field: string, value: any): this {
    this.filters.push({ type: 'gte', field, value });
    return this;
  }

  lt(field: string, value: any): this {
    this.filters.push({ type: 'lt', field, value });
    return this;
  }

  lte(field: string, value: any): this {
    this.filters.push({ type: 'lte', field, value });
    return this;
  }

  in(field: string, values: any[]): this {
    this.filters.push({ type: 'in', field, value: values });
    return this;
  }

  not(field: string, operator: string, value: any): this {
    this.filters.push({ type: 'not', field, value, operator });
    return this;
  }

  is(field: string, value: null | boolean): this {
    this.filters.push({ type: 'is', field, value });
    return this;
  }

  ilike(field: string, pattern: string): this {
    this.filters.push({ type: 'ilike', field, value: pattern });
    return this;
  }

  order(field: string, options?: { ascending?: boolean }): this {
    this._order = { field, ascending: options?.ascending ?? true };
    return this;
  }

  limit(count: number): this {
    this._limit = count;
    return this;
  }

  offset(count: number): this {
    this._offset = count;
    return this;
  }

  range(from: number, to: number): this {
    this._range = { from, to };
    this._limit = to - from + 1;
    this._offset = from;
    return this;
  }

  single(): this {
    this._single = true;
    return this;
  }

  maybeSingle(): this {
    this._single = true;
    return this;
  }

  private buildQueryParams(): string {
    const params = new URLSearchParams();

    if (this._select !== '*') {
      params.append('select', this._select);
    }

    this.filters.forEach((filter) => {
      switch (filter.type) {
        case 'eq':
          params.append(filter.field, String(filter.value));
          break;
        case 'neq':
          params.append(`${filter.field}.neq`, String(filter.value));
          break;
        case 'gt':
          params.append(`${filter.field}.gt`, String(filter.value));
          break;
        case 'gte':
          params.append(`${filter.field}.gte`, String(filter.value));
          break;
        case 'lt':
          params.append(`${filter.field}.lt`, String(filter.value));
          break;
        case 'lte':
          params.append(`${filter.field}.lte`, String(filter.value));
          break;
        case 'in':
          params.append(`${filter.field}.in`, filter.value.join(','));
          break;
        case 'not':
          params.append(`${filter.field}.not.${filter.operator}`, String(filter.value));
          break;
        case 'is':
          params.append(`${filter.field}.is`, filter.value === null ? 'null' : String(filter.value));
          break;
        case 'ilike':
          params.append(`${filter.field}.ilike`, filter.value);
          break;
      }
    });

    if (this._order) {
      params.append('order', `${this._order.field}.${this._order.ascending ? 'asc' : 'desc'}`);
    }

    if (this._limit !== null) {
      params.append('limit', String(this._limit));
    }

    if (this._offset !== null) {
      params.append('offset', String(this._offset));
    }

    if (this._single) {
      params.append('single', 'true');
    }

    if (this._countOption) {
      params.append('count', this._countOption);
    }

    return params.toString();
  }

  private async executeSelect(): Promise<QueryResult<T | T[] | null>> {
    const queryParams = this.buildQueryParams();
    const endpoint = `/${this.table}${queryParams ? `?${queryParams}` : ''}`;
    
    const result = await this.client._request<T[]>(endpoint);
    const count = Array.isArray(result.data) ? result.data.length : (result.data ? 1 : 0);

    // Se head=true, retorna apenas count sem dados
    if (this._headOnly) {
      return {
        data: null,
        error: result.error,
        count,
      };
    }

    if (this._single && result.data) {
      return {
        data: Array.isArray(result.data) 
          ? (result.data.length > 0 ? result.data[0] : null) 
          : result.data,
        error: result.error,
        count,
      };
    }

    return {
      ...result,
      count,
    };
  }

  private async executeInsert(): Promise<QueryResult<T | T[] | null>> {
    const result = await this.client._request<T>(`/${this.table}`, {
      method: 'POST',
      body: JSON.stringify(this._pendingData),
    });

    if (this._single && result.data) {
      return {
        data: Array.isArray(result.data) ? result.data[0] : result.data,
        error: result.error,
      };
    }

    return {
      data: result.data ? (Array.isArray(result.data) ? result.data : [result.data]) : null,
      error: result.error,
    };
  }

  private async executeUpdate(): Promise<QueryResult<T | T[] | null>> {
    const idFilter = this.filters.find(f => f.field === 'id' && f.type === 'eq');
    const tickerFilter = this.filters.find(f => f.field === 'ticker' && f.type === 'eq');

    let endpoint = `/${this.table}`;

    if (idFilter) {
      endpoint = `/${this.table}/${idFilter.value}`;
    } else if (tickerFilter && this.table === 'investments') {
      endpoint = `/${this.table}/ticker/${tickerFilter.value}`;
    } else {
      const queryParams = this.buildQueryParams();
      endpoint = `/${this.table}${queryParams ? `?${queryParams}` : ''}`;
    }

    const result = await this.client._request<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(this._pendingData),
    });

    if (this._single && result.data) {
      return {
        data: Array.isArray(result.data) ? result.data[0] : result.data,
        error: result.error,
      };
    }

    return {
      data: result.data ? (Array.isArray(result.data) ? result.data : [result.data]) : null,
      error: result.error,
    };
  }

  private async executeUpsert(): Promise<QueryResult<T | T[] | null>> {
    const result = await this.client._request<T>(`/${this.table}/upsert`, {
      method: 'POST',
      body: JSON.stringify(this._pendingData),
    });

    if (this._single && result.data) {
      return {
        data: Array.isArray(result.data) ? result.data[0] : result.data,
        error: result.error,
      };
    }

    return {
      data: result.data ? (Array.isArray(result.data) ? result.data : [result.data]) : null,
      error: result.error,
    };
  }

  private async executeDelete(): Promise<QueryResult<T | T[] | null>> {
    const inFilter = this.filters.find(f => f.field === 'id' && f.type === 'in');
    const idFilter = this.filters.find(f => f.field === 'id' && f.type === 'eq');

    let endpoint: string;
    let method: string = 'DELETE';
    let body: string | undefined;

    if (inFilter) {
      endpoint = `/${this.table}/delete-multiple`;
      method = 'POST';
      body = JSON.stringify({ ids: inFilter.value });
    } else if (idFilter) {
      endpoint = `/${this.table}/${idFilter.value}`;
    } else {
      const queryParams = this.buildQueryParams();
      endpoint = `/${this.table}${queryParams ? `?${queryParams}` : ''}`;
    }

    const result = await this.client._request<T>(endpoint, { method, body });

    return {
      data: result.data ? (Array.isArray(result.data) ? result.data : [result.data]) : null,
      error: result.error,
    };
  }

  // Executa a query quando awaited
  async then<TResult1 = QueryResult<T | T[] | null>, TResult2 = never>(
    onfulfilled?: ((value: QueryResult<T | T[] | null>) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null
  ): Promise<TResult1 | TResult2> {
    try {
      let result: QueryResult<T | T[] | null>;

      switch (this._pendingOperation) {
        case 'insert':
          result = await this.executeInsert();
          break;
        case 'update':
          result = await this.executeUpdate();
          break;
        case 'upsert':
          result = await this.executeUpsert();
          break;
        case 'delete':
          result = await this.executeDelete();
          break;
        default:
          result = await this.executeSelect();
      }

      if (onfulfilled) {
        return onfulfilled(result);
      }
      return result as any;
    } catch (error) {
      if (onrejected) {
        return onrejected(error);
      }
      throw error;
    }
  }
}

export const apiClient = new ApiClient();
