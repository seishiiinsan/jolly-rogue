export interface CommandOptions {
  source: string | undefined;
  offline: boolean;
  refresh: boolean;
}

export interface CommandContext {
  databaseUrl: string;
  options: CommandOptions;
}
