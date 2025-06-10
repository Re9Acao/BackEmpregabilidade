declare module 'opencage-api-client' {
  interface GeocodeOptions {
    q: string;
    key: string;
    // Adicione outras propriedades que você usa da documentação da opencage.geocode
    language?: string;
    limit?: number;
    proximity?: string; // Exemplo: "latitude,longitude"
    only_countrycodes?: string; // Exemplo: "br,us"
    // ... outras opções que você utiliza
  }

  interface GeocodeGeometry {
    lat: number;
    lng: number;
  }

  interface GeocodeComponents {
    [key: string]: string | string[] | undefined;
    // Exemplo de algumas propriedades comuns:
    city?: string;
    country?: string;
    country_code?: string;
    county?: string;
    postcode?: string;
    road?: string;
    state?: string;
    town?: string;
    // ... outras propriedades que você utiliza da resposta
  }

  interface GeocodeAnnotations {
    // Defina as propriedades das anotações se você as utiliza
    DMS?: {
      lat: string;
      lng: string;
    };
    // ... outras propriedades das anotações
  }

  interface GeocodeResult {
    annotations?: GeocodeAnnotations;
    components: GeocodeComponents;
    confidence: number;
    formatted: string;
    geometry: GeocodeGeometry;
    place_id: string;
    // Adicione outras propriedades do resultado que você usa
  }

  interface GeocodeResponse {
    results: GeocodeResult[];
    total_results: number;
    // Adicione outras propriedades da resposta que você usa
  }

  function geocode(options: GeocodeOptions): Promise<GeocodeResponse>;

  const defaultExport: {
    geocode: typeof geocode;
  };
  export default defaultExport;
  export { geocode, GeocodeOptions, GeocodeResponse, GeocodeResult, GeocodeGeometry, GeocodeComponents, GeocodeAnnotations };
}
