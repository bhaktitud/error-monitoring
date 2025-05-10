declare module 'imagekit' {
  export default class ImageKit {
    constructor(config: {
      publicKey: string;
      privateKey: string;
      urlEndpoint: string;
    });

    getAuthenticationParameters(token?: string, expire?: number): {
      token: string;
      expire: number;
      signature: string;
    };
    
    upload(options: {
      file: Buffer | string;
      fileName: string;
      useUniqueFileName?: boolean;
      tags?: string[];
      folder?: string;
      isPrivateFile?: boolean;
      customCoordinates?: string;
      responseFields?: string[];
    }): Promise<any>;

    listFiles(options: {
      path?: string;
      limit?: number;
      skip?: number;
      sort?: string;
    }): Promise<any>;

    getFileDetails(fileId: string): Promise<any>;

    deleteFile(fileId: string): Promise<any>;

    url(options: {
      path: string;
      transformation?: any[];
      transformationPosition?: 'path' | 'query';
      queryParameters?: Record<string, string>;
    }): string;
  }
} 