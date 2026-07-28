interface Environment {
  DATABASE_URL?: string;
  JWT_ACCESS_SECRET?: string;
  ACCESS_TOKEN_TTL_SECONDS?: string | number;
  REFRESH_TOKEN_TTL_DAYS?: string | number;
  NODE_ENV?: string;
}

export function validateEnvironment(config: Environment): Environment {
  if (!config.DATABASE_URL?.startsWith('postgresql://'))
    throw new Error('DATABASE_URL must be a PostgreSQL connection URL');
  if (!config.JWT_ACCESS_SECRET || config.JWT_ACCESS_SECRET.length < 32)
    throw new Error('JWT_ACCESS_SECRET must contain at least 32 characters');
  const accessTtl = Number(config.ACCESS_TOKEN_TTL_SECONDS ?? 900);
  const refreshDays = Number(config.REFRESH_TOKEN_TTL_DAYS ?? 7);
  if (!Number.isInteger(accessTtl) || accessTtl < 60 || accessTtl > 3600)
    throw new Error('ACCESS_TOKEN_TTL_SECONDS must be an integer from 60 to 3600');
  if (!Number.isInteger(refreshDays) || refreshDays < 1 || refreshDays > 30)
    throw new Error('REFRESH_TOKEN_TTL_DAYS must be an integer from 1 to 30');
  return { ...config, ACCESS_TOKEN_TTL_SECONDS: accessTtl, REFRESH_TOKEN_TTL_DAYS: refreshDays };
}
