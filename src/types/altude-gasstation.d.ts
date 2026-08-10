declare module '@altude/gasstation' {
  export interface AltudeGasStationOptions {
    apiKey: string;
    network: string;
    baseUrl?: string;
  }

  export class AltudeGasStation {
    constructor(options: AltudeGasStationOptions);
    getBlockhash(): Promise<unknown>;
    send(options: unknown): Promise<unknown>;
  }
}
