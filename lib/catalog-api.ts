/**
 * Catalog API Client
 * Handles Glue Data Catalog operations
 */

import apiService from './axios';

export interface CatalogDatabase {
  database_name: string;
  status: string;
  created_at?: string;
  description?: string;
}

export interface CrawlerCreate {
  crawler_type: 'postgres' | 's3';
  connection_name?: string;
  jdbc_path?: string;
  s3_path?: string;
  table_prefix?: string;
}

export interface Crawler {
  crawler_name: string;
  status: string;
  database_name?: string;
  state?: string;
}

export interface CrawlerStatus {
  crawler_name: string;
  state: string;
  database_name: string;
  last_crawl?: {
    status: string;
    error_message?: string;
    log_group?: string;
    log_stream?: string;
    message_prefix?: string;
    start_time?: string;
  };
  created_at?: string;
  updated_at?: string;
}

export interface CatalogTable {
  name: string;
  database_name: string;
  created_at?: string;
  updated_at?: string;
  table_type: string;
  columns: Array<{
    name: string;
    type: string;
    comment?: string;
  }>;
  location: string;
  row_count: string;
}

export const catalogApi = {
  /**
   * Create a catalog database for the connector's organization
   */
  async createDatabase(connectorId: string, description?: string): Promise<CatalogDatabase> {
    const data = await apiService.post<CatalogDatabase, { description?: string }>(
      `/connectors/${connectorId}/catalog/database`,
      { description }
    );
    return data;
  },

  /**
   * Get catalog database details
   */
  async getDatabase(connectorId: string): Promise<CatalogDatabase> {
    const data = await apiService.get<CatalogDatabase>(
      `/connectors/${connectorId}/catalog/database`
    );
    return data;
  },

  /**
   * Create a crawler for the connector
   */
  async createCrawler(connectorId: string, config: CrawlerCreate): Promise<Crawler> {
    const data = await apiService.post<Crawler, CrawlerCreate>(
      `/connectors/${connectorId}/catalog/crawler`,
      config
    );
    return data;
  },

  /**
   * Start the crawler
   */
  async startCrawler(connectorId: string): Promise<Crawler> {
    const data = await apiService.post<Crawler, void>(
      `/connectors/${connectorId}/catalog/crawler/start`
    );
    return data;
  },

  /**
   * Get crawler status
   */
  async getCrawlerStatus(connectorId: string): Promise<CrawlerStatus> {
    const data = await apiService.get<CrawlerStatus>(
      `/connectors/${connectorId}/catalog/crawler/status`
    );
    return data;
  },

  /**
   * List cataloged tables
   */
  async listTables(connectorId: string): Promise<CatalogTable[]> {
    const data = await apiService.get<CatalogTable[]>(
      `/connectors/${connectorId}/catalog/tables`
    );
    return data;
  },
};

