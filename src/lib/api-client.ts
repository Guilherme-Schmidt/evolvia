// Cliente HTTP para substituir o Supabase
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

class ApiClient {
  private token: string | null = null;

  constructor() {
    // Carregar token do localStorage
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
  ): Promise<{ data: T | null; error: Error | null }> {
    try {
      const response = await fetch(`${API_URL}${endpoint}`, {
        ...options,
        headers: {
          ...this.getHeaders(),
          ...options.headers,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          data: null,
          error: new Error(data.error || 'Erro na requisição'),
        };
      }

      return { data: data.data || data, error: null };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error : new Error('Erro desconhecido'),
      };
    }
  }

  // Auth methods
  auth = {
    signUp: async (credentials: { email: string; password: string }) => {
      const result = await this.request<{ user: any; token: string }>(
        '/auth/register',
        {
          method: 'POST',
          body: JSON.stringify(credentials),
        }
      );

      if (result.data) {
        this.token = result.data.token;
        localStorage.setItem('auth_token', result.data.token);
      }

      return result;
    },

    signInWithPassword: async (credentials: { email: string; password: string }) => {
      const result = await this.request<{ user: any; token: string }>(
        '/auth/login',
        {
          method: 'POST',
          body: JSON.stringify(credentials),
        }
      );

      if (result.data) {
        this.token = result.data.token;
        localStorage.setItem('auth_token', result.data.token);
      }

      return result;
    },

    signOut: async () => {
      await this.request('/auth/logout', { method: 'POST' });
      this.token = null;
      localStorage.removeItem('auth_token');
      return { error: null };
    },

    getUser: async () => {
      return this.request<{ user: any }>('/auth/user');
    },

    onAuthStateChange: (callback: (event: string, session: any) => void) => {
      // Implementação simplificada - apenas verifica se há token
      const token = localStorage.getItem('auth_token');
      if (token) {
        this.token = token;
        callback('SIGNED_IN', { user: { token } });
      } else {
        callback('SIGNED_OUT', null);
      }

      // Retorna função de cleanup
      return {
        data: {
          subscription: {
            unsubscribe: () => {},
          },
        },
      };
    },
  };

  // Database methods - Query Builder
  from(table: string) {
    return new QueryBuilder(table, this);
  }

  // Functions methods
  functions = {
    invoke: async (functionName: string, options: { body: any }) => {
      return this.request(`/functions/${functionName}`, {
        method: 'POST',
        body: JSON.stringify(options.body),
      });
    },
  };
}

class QueryBuilder {
  private table: string;
  private client: ApiClient;
  private selectFields: string = '*';
  private filters: Array<{ field: string; operator: string; value: any }> = [];
  private orderField: string | null = null;
  private orderAscending: boolean = true;
  private limitValue: number | null = null;
  private offsetValue: number | null = null;

  constructor(table: string, client: ApiClient) {
    this.table = table;
    this.client = client;
  }

  select(fields: string = '*') {
    this.selectFields = fields;
    return this;
  }

  eq(field: string, value: any) {
    this.filters.push({ field, operator: 'eq', value });
    return this;
  }

  in(field: string, values: any[]) {
    this.filters.push({ field, operator: 'in', value: values });
    return this;
  }

  order(field: string, options?: { ascending?: boolean }) {
    this.orderField = field;
    this.orderAscending = options?.ascending ?? true;
    return this;
  }

  limit(count: number) {
    this.limitValue = count;
    return this;
  }

  offset(count: number) {
    this.offsetValue = count;
    return this;
  }

  private buildQueryParams(): string {
    const params = new URLSearchParams();

    this.filters.forEach((filter) => {
      if (filter.operator === 'eq') {
        params.append(filter.field, filter.value);
      } else if (filter.operator === 'in') {
        params.append(`${filter.field}_in`, filter.value.join(','));
      }
    });

    if (this.orderField) {
      params.append('order', this.orderField);
      params.append('ascending', this.orderAscending.toString());
    }

    if (this.limitValue) {
      params.append('limit', this.limitValue.toString());
    }

    if (this.offsetValue) {
      params.append('offset', this.offsetValue.toString());
    }

    return params.toString();
  }

  async then(resolve: any, reject: any) {
    try {
      const queryParams = this.buildQueryParams();
      const endpoint = `/${this.table}${queryParams ? `?${queryParams}` : ''}`;

      const result = await this.client['request'](endpoint);
      resolve(result);
    } catch (error) {
      reject(error);
    }
  }

  async insert(data: any) {
    const endpoint = `/${this.table}`;
    return this.client['request'](endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async update(data: any) {
    const endpoint = `/${this.table}`;

    // Se tem um filtro eq com id, usa PUT
    const idFilter = this.filters.find(f => f.field === 'id' && f.operator === 'eq');
    if (idFilter) {
      return this.client['request'](`${endpoint}/${idFilter.value}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
    }

    // Se tem filtro com ticker, usa endpoint específico
    const tickerFilter = this.filters.find(f => f.field === 'ticker' && f.operator === 'eq');
    if (tickerFilter && this.table === 'investments') {
      return this.client['request'](`${endpoint}/ticker/${tickerFilter.value}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      });
    }

    throw new Error('Update requires an id or ticker filter');
  }

  async delete() {
    const endpoint = `/${this.table}`;

    // Se tem filtro in com ids, usa delete múltiplo
    const inFilter = this.filters.find(f => f.field === 'id' && f.operator === 'in');
    if (inFilter) {
      return this.client['request'](`${endpoint}/delete-multiple`, {
        method: 'POST',
        body: JSON.stringify({ ids: inFilter.value }),
      });
    }

    // Se tem um filtro eq com id, usa DELETE
    const idFilter = this.filters.find(f => f.field === 'id' && f.operator === 'eq');
    if (idFilter) {
      return this.client['request'](`${endpoint}/${idFilter.value}`, {
        method: 'DELETE',
      });
    }

    throw new Error('Delete requires an id filter');
  }
}

export const apiClient = new ApiClient();
