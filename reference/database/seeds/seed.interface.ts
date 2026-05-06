export interface ISeedService {
  run(): Promise<void>;
  down?(): Promise<void>;
}
