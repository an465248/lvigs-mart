declare module "@opensearch-project/opensearch" {
  export class Client {
    constructor(options: { node: string });
    search(params: any): Promise<any>;
    index(params: any): Promise<any>;
    delete(params: any): Promise<any>;
    bulk(params: any): Promise<any>;
    indices: {
      exists(params: any): Promise<any>;
      create(params: any): Promise<any>;
    };
    cluster: {
      health(): Promise<any>;
    };
  }
}
